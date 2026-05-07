import AnswerShell from "@/components/dashboard/answer-shell";

export default function AnswerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: "#030f0e", minHeight: "100vh" }}>
      <AnswerShell>{children}</AnswerShell>
    </div>
  );
}
