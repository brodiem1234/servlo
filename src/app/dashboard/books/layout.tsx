import BooksShell from "@/components/dashboard/books-shell";

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#031209", minHeight: "100vh" }}>
      <BooksShell>{children}</BooksShell>
    </div>
  );
}
