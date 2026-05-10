"use client";

import { useState, useTransition } from "react";
import type { ComplianceTemplate, FormField } from "@/lib/compliance-templates";

type FormRow = {
  id: string;
  title: string;
  description: string | null;
  fields: FormField[];
  is_active: boolean;
  created_at: string;
};

type Props = {
  initialForms: FormRow[];
  templates: ComplianceTemplate[];
  createFromTemplateAction: (fd: FormData) => Promise<void>;
  createBlankFormAction: (fd: FormData) => Promise<void>;
  updateFormAction: (fd: FormData) => Promise<void>;
  deleteFormAction: (fd: FormData) => Promise<void>;
};

const FIELD_TYPES = ["checkbox", "text", "textarea", "select", "signature", "photo"] as const;
type FieldType = typeof FIELD_TYPES[number];

const inputCls = "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]";

function FieldTypeLabel({ type }: { type: FieldType }) {
  const map: Record<FieldType, string> = {
    checkbox: "Checkbox",
    text: "Short text",
    textarea: "Long text",
    select: "Dropdown",
    signature: "Signature",
    photo: "Photo upload",
  };
  return <span>{map[type] ?? type}</span>;
}

export function FormsClient({ initialForms, templates, createFromTemplateAction, createBlankFormAction, updateFormAction, deleteFormAction }: Props) {
  const [forms, setForms] = useState<FormRow[]>(initialForms);
  const [view, setView] = useState<"list" | "templates" | "edit">("list");
  const [editingForm, setEditingForm] = useState<FormRow | null>(null);
  const [editFields, setEditFields] = useState<FormField[]>([]);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openEdit(form: FormRow) {
    setEditingForm(form);
    setEditTitle(form.title);
    setEditDesc(form.description ?? "");
    setEditFields(Array.isArray(form.fields) ? form.fields : []);
    setView("edit");
  }

  function addField() {
    setEditFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: "checkbox", label: "", required: false },
    ]);
  }

  function removeField(id: string) {
    setEditFields((prev) => prev.filter((f) => f.id !== id));
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setEditFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function moveField(idx: number, dir: -1 | 1) {
    const next = [...editFields];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setEditFields(next);
  }

  function saveForm() {
    if (!editingForm) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", editingForm.id);
      fd.set("title", editTitle);
      fd.set("description", editDesc);
      fd.set("fields", JSON.stringify(editFields));
      await updateFormAction(fd);
      setForms((prev) =>
        prev.map((f) =>
          f.id === editingForm.id
            ? { ...f, title: editTitle, description: editDesc || null, fields: editFields }
            : f
        )
      );
      setView("list");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteFormAction(fd);
      setForms((prev) => prev.filter((f) => f.id !== id));
      setConfirmDelete(null);
    });
  }

  function handleAddTemplate(idx: number) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("template_index", String(idx));
      await createFromTemplateAction(fd);
      // Reload to get server-assigned IDs
      window.location.reload();
    });
  }

  // ── Edit view ──────────────────────────────────────────────────────────────
  if (view === "edit" && editingForm) {
    return (
      <section className="space-y-5 max-w-3xl">
        <div>
          <button
            onClick={() => setView("list")}
            className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <span>←</span> Back to forms
          </button>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Edit form</h1>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Form title</label>
            <input className={inputCls} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Description</label>
            <input className={inputCls} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Fields ({editFields.length})</h2>
            <button
              onClick={addField}
              className="rounded bg-[var(--accent-color)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              + Add field
            </button>
          </div>

          {editFields.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">No fields yet — click Add field to start building.</p>
          ) : (
            <div className="space-y-3">
              {editFields.map((field, idx) => (
                <div key={field.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={() => moveField(idx, -1)} disabled={idx === 0} className="text-[var(--text-muted)] text-xs leading-none hover:text-[var(--text-primary)] disabled:opacity-30">▲</button>
                      <button type="button" onClick={() => moveField(idx, 1)} disabled={idx === editFields.length - 1} className="text-[var(--text-muted)] text-xs leading-none hover:text-[var(--text-primary)] disabled:opacity-30">▼</button>
                    </div>
                    <span className="text-xs font-mono text-[var(--text-muted)] w-5">{idx + 1}.</span>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                      className="h-8 rounded border border-[var(--border)] bg-[var(--bg-card)] px-2 text-xs text-[var(--text-primary)]"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t} value={t}><FieldTypeLabel type={t} /></option>
                      ))}
                    </select>
                    <input
                      className="h-8 min-w-0 flex-1 rounded border border-[var(--border)] bg-[var(--bg-card)] px-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                      placeholder="Field label"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                    />
                    <label className="flex items-center gap-1 text-xs text-[var(--text-muted)] whitespace-nowrap">
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} className="h-3.5 w-3.5" />
                      Required
                    </label>
                    <button onClick={() => removeField(field.id)} className="text-red-500 text-lg leading-none hover:text-red-700">&times;</button>
                  </div>
                  {field.type === "select" ? (
                    <div className="ml-12">
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Options (one per line)</label>
                      <textarea
                        className="w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1.5 text-xs text-[var(--text-primary)] font-mono"
                        rows={3}
                        value={(field.options ?? []).join("\n")}
                        onChange={(e) => updateField(field.id, { options: e.target.value.split("\n").filter(Boolean) })}
                        placeholder={"Option 1\nOption 2\nOption 3"}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={() => setView("list")} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
            Cancel
          </button>
          <button onClick={saveForm} disabled={isPending} className="rounded-lg bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {isPending ? "Saving…" : "Save form"}
          </button>
        </div>
      </section>
    );
  }

  // ── Templates view ─────────────────────────────────────────────────────────
  if (view === "templates") {
    return (
      <section className="space-y-5">
        <div>
          <button onClick={() => setView("list")} className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <span>←</span> Back to forms
          </button>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Starter Templates</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Pick a template to add to your workspace. You can customise it after adding.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((t, idx) => (
            <div key={idx} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 flex flex-col gap-2">
              <p className="font-semibold text-[var(--text-primary)]">{t.title}</p>
              <p className="text-sm text-[var(--text-secondary)] flex-1">{t.description}</p>
              <p className="text-xs text-[var(--text-muted)]">{t.fields.length} fields</p>
              <button
                onClick={() => handleAddTemplate(idx)}
                disabled={isPending}
                className="mt-auto rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                Use this template
              </button>
            </div>
          ))}
        </div>

        {/* Community Templates */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mt-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Community Templates</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Coming soon — submit your template and we&apos;ll add it for the community.
          </p>
          <a
            href="mailto:hello@servlo.com.au?subject=Template Submission"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Submit a template
          </a>
        </div>
      </section>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Compliance Forms</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Build safety checklists, sign-off sheets, and job forms. Attach them to jobs for field completion.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setView("templates")}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          >
            Browse templates
          </button>
          <button
            onClick={() => {
              startTransition(async () => {
                const fd = new FormData();
                fd.set("title", "New Form");
                await createBlankFormAction(fd);
                window.location.reload();
              });
            }}
            disabled={isPending}
            className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            + Blank form
          </button>
        </div>
      </div>

      {forms.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
          <p className="text-base font-semibold text-[var(--text-primary)]">No forms yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Start from a template or create a blank form.</p>
          <button onClick={() => setView("templates")} className="mt-4 rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Browse 20 starter templates
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <div key={form.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-[var(--text-primary)] leading-tight">{form.title}</p>
                <span className={`shrink-0 inline-block h-2 w-2 rounded-full mt-1.5 ${form.is_active ? "bg-green-500" : "bg-gray-400"}`} />
              </div>
              {form.description ? <p className="text-xs text-[var(--text-muted)]">{form.description}</p> : null}
              <p className="text-xs text-[var(--text-muted)]">{(form.fields as FormField[]).length} field{(form.fields as FormField[]).length !== 1 ? "s" : ""}</p>
              <div className="flex justify-between items-center mt-auto pt-2 border-t border-[var(--border)]">
                <button
                  onClick={() => openEdit(form)}
                  className="text-xs font-medium text-[var(--accent-color)] hover:underline"
                >
                  Edit
                </button>
                {confirmDelete === form.id ? (
                  <span className="flex items-center gap-1 text-xs">
                    <button onClick={() => handleDelete(form.id)} className="text-red-600 font-semibold hover:underline">Confirm delete</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-[var(--text-muted)] hover:underline">Cancel</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDelete(form.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
