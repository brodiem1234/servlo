"use client";

import { useState } from "react";
import { LandingPricing } from "@/components/landing-pricing";
import { EnterpriseModal } from "@/components/marketing/enterprise-modal";

export function PricingWithEnterprise() {
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);

  return (
    <>
      <LandingPricing onEnterpriseContact={() => setEnterpriseOpen(true)} />
      <EnterpriseModal isOpen={enterpriseOpen} onClose={() => setEnterpriseOpen(false)} />
    </>
  );
}
