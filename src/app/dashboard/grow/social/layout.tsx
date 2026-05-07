import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SERVLO Grow — Social Content",
};

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
