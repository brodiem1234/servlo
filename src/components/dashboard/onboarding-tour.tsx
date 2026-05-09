"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Compass, X, ArrowRight } from "lucide-react";
import {
  markOnboardingDismissed,
  markTourCompleted,
} from "@/app/dashboard/owner/actions";

const TOUR_STOPS = [
  {
    path: "/dashboard/owner",
    title: "Your command center",
    body: "See your revenue, outstanding invoices, upcoming jobs, and recent activity at a glance. Everything important in one place.",
  },
  {
    path: "/dashboard/owner/jobs",
    title: "Manage every job",
    body: "Create jobs, track progress from scheduled to complete, add photos, materials, notes and get client signatures — all in one place.",
  },
  {
    path: "/dashboard/owner/clients",
    title: "Your client database",
    body: "Every client, their full job history, communications, and a portal link they can use to view quotes and pay invoices.",
  },
  {
    path: "/dashboard/owner/finance",
    title: "Quotes, invoices and cash flow",
    body: "Send professional quotes, convert them to invoices in one click, and get paid faster with online payment links.",
  },
  {
    path: "/dashboard/owner/team",
    title: "Your crew",
    body: "Add employees and contractors, track timesheets, and assign them to jobs. Everyone knows where to be.",
  },
  {
    path: "/dashboard/owner/reports",
    title: "Know your numbers",
    body: "Revenue, jobs completed, client growth, and team performance — all the data you need to grow your business.",
  },
  {
    path: "/dashboard/owner/settings",
    title: "Make it yours",
    body: "Add your logo, connect Xero, set up online booking, manage your subscription, and customise SERVLO for your business.",
  },
] as const;

type Phase = "welcome" | "pill" | "touring" | "final" | "done";

export interface OnboardingTourProps {
  /** Whether the user has already dismissed the welcome modal (from DB). */
  initialDismissed: boolean;
  /** Whether the user has already completed the full tour (from DB). */
  initialTourCompleted: boolean;
}

export function OnboardingTour({
  initialDismissed,
  initialTourCompleted,
}: OnboardingTourProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("done"); // safe default before mount
  const [tourStep, setTourStep] = useState(0);
  const [hidePill, setHidePill] = useState(false);
  const [removePillChecked, setRemovePillChecked] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ── Initialise from localStorage + server props ──────────────────────────
  useEffect(() => {
    const seen = localStorage.getItem("servlo_onboarding_seen") === "true";
    const completed =
      localStorage.getItem("servlo_tour_completed") === "true";
    const tourActive =
      localStorage.getItem("servlo_touring_active") === "true";
    const savedStep = parseInt(
      localStorage.getItem("servlo_tour_step") ?? "0",
      10
    );

    if (initialTourCompleted || completed) {
      setPhase("done");
    } else if (tourActive && !isNaN(savedStep) && savedStep >= 0 && savedStep < TOUR_STOPS.length) {
      // Restore in-progress tour. Don't re-navigate — user is already on the
      // right page because router.push() was called before the last remount.
      setTourStep(savedStep);
      setPhase("touring");
    } else if (initialDismissed || seen) {
      setPhase("pill");
    } else {
      setPhase("welcome");
    }

    setMounted(true);
  }, []); // intentionally empty — only on first mount

  // ── Keyboard: Escape dismisses tour popup or welcome modal ───────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (phase === "touring" || phase === "final") {
        doSkipTour();
      } else if (phase === "welcome") {
        doSkipWelcome();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase]); // re-bind when phase changes so closure is fresh

  // ── Helpers ───────────────────────────────────────────────────────────────

  function doSkipWelcome() {
    localStorage.setItem("servlo_onboarding_seen", "true");
    setPhase("pill");
    markOnboardingDismissed().catch(() => {});
  }

  function doStartTour() {
    localStorage.setItem("servlo_onboarding_seen", "true");
    localStorage.setItem("servlo_touring_active", "true");
    localStorage.setItem("servlo_tour_step", "0");
    setTourStep(0);
    setPhase("touring");
    router.push(TOUR_STOPS[0].path);
    markOnboardingDismissed().catch(() => {});
  }

  function doNext() {
    const nextStep = tourStep + 1;
    if (nextStep < TOUR_STOPS.length) {
      localStorage.setItem("servlo_tour_step", String(nextStep));
      setTourStep(nextStep);
      router.push(TOUR_STOPS[nextStep].path);
    } else {
      // Past last stop → show final screen
      localStorage.setItem("servlo_touring_active", "false");
      setPhase("final");
    }
  }

  function doSkipTour() {
    localStorage.setItem("servlo_touring_active", "false");
    setPhase("pill");
  }

  function doCompleteTour() {
    localStorage.setItem("servlo_tour_completed", "true");
    localStorage.setItem("servlo_touring_active", "false");
    if (removePillChecked) setHidePill(true);
    setPhase("done");
    router.push("/dashboard/owner");
    markTourCompleted().catch(() => {});
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!mounted) return null;
  if (phase === "done") return null;

  // ── Welcome modal ─────────────────────────────────────────────────────────
  if (phase === "welcome") {
    return (
      <>
        {/* Backdrop — does NOT dismiss on click (per spec) */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            background: "rgba(0,0,0,0.8)",
          }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            zIndex: 9999,
            width: "min(440px, 90vw)",
            background: "#111927",
            borderRadius: 16,
            padding: 40,
            boxShadow: "0 25px 60px rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <h2
            id="onboarding-title"
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#fff",
              margin: 0,
              marginBottom: 8,
            }}
          >
            Welcome to SERVLO
          </h2>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 15,
              margin: 0,
              marginBottom: 32,
              lineHeight: 1.5,
            }}
          >
            Want a quick tour to see what&apos;s where?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={doStartTour}
              style={{
                background: "var(--accent-color, #3B82F6)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "13px 20px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Compass size={16} />
              Take the tour
            </button>
            <button
              onClick={doSkipWelcome}
              style={{
                background: "transparent",
                color: "#64748b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: "13px 20px",
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── "Take a tour" pill ────────────────────────────────────────────────────
  if (phase === "pill" && !hidePill) {
    return (
      <button
        onClick={doStartTour}
        aria-label="Take the SERVLO product tour"
        style={{
          position: "fixed",
          top: 62,
          right: 16,
          zIndex: 9000,
          background: "#1e293b",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 999,
          padding: "7px 14px",
          fontSize: 13,
          fontWeight: 600,
          color: "#cbd5e1",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
        }}
      >
        <Compass
          size={14}
          style={{ color: "var(--accent-color, #3B82F6)", flexShrink: 0 }}
        />
        Take a tour
      </button>
    );
  }

  // ── Tour popup ────────────────────────────────────────────────────────────
  if (phase === "touring" && tourStep < TOUR_STOPS.length) {
    const stop = TOUR_STOPS[tourStep];
    return (
      <div
        role="dialog"
        aria-modal="false"
        aria-label={`Tour step ${tourStep + 1} of ${TOUR_STOPS.length}: ${stop.title}`}
        // Clicking outside does NOT dismiss (no backdrop click handler)
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9000,
          width: "min(360px, calc(100vw - 48px))",
          background: "#111927",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span
            style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: "0.03em" }}
          >
            {tourStep + 1} of {TOUR_STOPS.length}
          </span>
          <button
            onClick={doSkipTour}
            aria-label="Close tour"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#475569",
              padding: 2,
              lineHeight: 1,
              display: "flex",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Progress bar */}
        <div
          style={{
            background: "rgba(255,255,255,0.07)",
            borderRadius: 4,
            height: 3,
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 4,
              background: "var(--accent-color, #3B82F6)",
              width: `${((tourStep + 1) / TOUR_STOPS.length) * 100}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Content */}
        <h3
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#f1f5f9",
            margin: 0,
            marginBottom: 8,
          }}
        >
          {stop.title}
        </h3>
        <p
          style={{
            fontSize: 14,
            color: "#94a3b8",
            margin: 0,
            marginBottom: 22,
            lineHeight: 1.65,
          }}
        >
          {stop.body}
        </p>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={doSkipTour}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#475569",
              fontSize: 13,
              padding: 0,
            }}
          >
            Skip tour
          </button>
          <button
            onClick={doNext}
            style={{
              background: "var(--accent-color, #3B82F6)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 18px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Next <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ── Final screen ──────────────────────────────────────────────────────────
  if (phase === "final") {
    return (
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Tour complete"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9000,
          width: "min(360px, calc(100vw - 48px))",
          background: "#111927",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        }}
      >
        <h3
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#f1f5f9",
            margin: 0,
            marginBottom: 8,
          }}
        >
          You&apos;re all set! 🎉
        </h3>
        <p
          style={{
            fontSize: 14,
            color: "#94a3b8",
            margin: 0,
            marginBottom: 20,
            lineHeight: 1.65,
          }}
        >
          That&apos;s SERVLO. Start by adding your first client, or load demo
          data to explore.
        </p>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={removePillChecked}
            onChange={(e) => setRemovePillChecked(e.target.checked)}
            style={{
              width: 15,
              height: 15,
              accentColor: "var(--accent-color, #3B82F6)",
              cursor: "pointer",
            }}
          />
          <span style={{ fontSize: 13, color: "#64748b" }}>
            Don&apos;t show tour button anymore
          </span>
        </label>
        <button
          onClick={doCompleteTour}
          style={{
            width: "100%",
            background: "var(--accent-color, #3B82F6)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px 20px",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Let&apos;s go
        </button>
      </div>
    );
  }

  return null;
}
