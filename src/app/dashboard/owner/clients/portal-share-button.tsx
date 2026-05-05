"use client";

import { useState } from "react";

type Props = {
  url: string;
};

export default function PortalShareButton({ url }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
      window.prompt("Copy portal link:", url);
    }
  };

  return (
    <button type="button" onClick={copy} className="rounded border px-2 py-1 text-xs">
      {copied ? "Copied" : "Share Portal"}
    </button>
  );
}

