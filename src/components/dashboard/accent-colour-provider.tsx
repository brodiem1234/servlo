"use client";

import { useAccentColour } from "@/hooks/use-accent-colour";

export function AccentColourProvider({
  userId,
  serverAccentHex
}: {
  userId: string | null;
  serverAccentHex: string;
}) {
  useAccentColour(userId, serverAccentHex);
  return null;
}
