import Image from "next/image";
import Link from "next/link";
import { LandingHeader } from "@/components/landing-header";

export const metadata = {
  title: "Privacy Policy | SERVLO",
  description: "SERVLO Privacy Policy. How we collect, use, and protect your information under Australian law.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-[#1e3a5f] [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif] dark:bg-[#0f172a] dark:text-white">
      <LandingHeader />

      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-extrabold text-[#1e3a5f] dark:text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#64748b] dark:text-slate-400">Last updated: May 2026</p>
        <p className="mt-4 text-base leading-relaxed text-[#334155] dark:text-slate-300">
          SERVLO (ABN 88 688 301 684) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information in accordance with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).
        </p>

        <div className="mt-10 space-y-10 text-[#334155] dark:text-slate-300">

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">1. Information We Collect</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>We collect information that is necessary to provide you with the Service. This includes:</p>
              <ul className="ml-5 list-disc space-y-3">
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Account information</strong>:your name, email address, phone number, business name, ABN, and address provided during signup and onboarding.
                </li>
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Business data</strong>:information you enter into the platform in the course of running your business, including client details, job records, invoices, quotes, timesheets, and purchase orders. This may include personal information about your own clients, employees, and contractors.
                </li>
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Usage data</strong>:information about how you interact with the platform, including pages visited, features used, browser type, device type, IP address, and timestamps. This data is collected automatically and used in aggregate to improve the Service.
                </li>
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Payment information</strong>:billing details such as your card type and last four digits are handled directly by Stripe, our payment processor. SERVLO does not store full card numbers or sensitive financial data on our own servers.
                </li>
              </ul>
              <p>
                We collect personal information only by lawful and fair means and, where reasonably practicable, directly from you.
              </p>
            </div>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">2. How We Use Your Information</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>We use the information we collect to:</p>
              <ul className="ml-5 list-disc space-y-2">
                <li>Provide, operate, and maintain the SERVLO platform and its features.</li>
                <li>Process subscription payments and manage your billing relationship with us.</li>
                <li>Send transactional emails, including account verification, password resets, invoice delivery, and subscription receipts, via our email service provider Resend.</li>
                <li>Send service-related communications such as product updates, maintenance notices, and changes to these policies.</li>
                <li>Improve and personalise the platform, including developing new features and analysing usage patterns.</li>
                <li>Provide customer support and respond to your enquiries.</li>
                <li>Meet our legal and regulatory obligations under Australian law.</li>
                <li>Detect, investigate, and prevent fraudulent or unlawful activity.</li>
              </ul>
              <p>
                We will not use your personal information for direct marketing without your consent, and you may opt out of any marketing communications at any time.
              </p>
            </div>
          </section>

          {/* 3. Data Storage */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">3. Data Storage</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                Your data is stored using Supabase, which provides a managed PostgreSQL database and authentication service. Our infrastructure is configured as follows:
              </p>
              <ul className="ml-5 list-disc space-y-2">
                <li><strong className="text-[#1e3a5f] dark:text-white">Primary servers</strong>:US-East region (Virginia, United States).</li>
                <li><strong className="text-[#1e3a5f] dark:text-white">Backup servers</strong>:AU-East region (Sydney, Australia).</li>
                <li><strong className="text-[#1e3a5f] dark:text-white">Encryption</strong>:all data is encrypted at rest and in transit. Connections to the platform are secured using TLS.</li>
              </ul>
              <p>
                By using SERVLO, you acknowledge that some of your data may be stored and processed in the United States. We take reasonable steps to ensure that any overseas transfer of personal information is handled in accordance with the APPs, including ensuring that recipients are subject to comparable privacy protections.
              </p>
            </div>
          </section>

          {/* 4. Third Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">4. Third-Party Services</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                We engage the following third-party service providers in the operation of the platform. Each provider processes certain personal information on our behalf and is subject to their own privacy policies:
              </p>
              <ul className="ml-5 list-disc space-y-3">
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Stripe</strong>:payment processing. Stripe handles all credit card and billing data. Stripe is PCI DSS compliant. See{" "}
                  <a href="https://stripe.com/au/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-color)] underline hover:opacity-80 dark:text-cyan-400">
                    stripe.com/au/privacy
                  </a>.
                </li>
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Resend</strong>:transactional email delivery. Resend processes email addresses and message content for the purpose of delivering emails on our behalf.
                </li>
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Supabase</strong>:database hosting and authentication. Supabase stores and manages your account data and business records.
                </li>
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Anthropic</strong>:AI features. Where AI-powered features are used within the platform, your prompts and relevant context may be processed by Anthropic&rsquo;s AI models. We do not share identifiable personal data with Anthropic beyond what is necessary to fulfil the specific AI feature you are using.
                </li>
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Twilio</strong>:SMS notifications, when configured. If you enable SMS features, Twilio processes phone numbers and message content for delivery purposes.
                </li>
              </ul>
              <p>
                We do not sell, rent, or trade your personal information to any third parties for their own marketing purposes.
              </p>
            </div>
          </section>

          {/* 5. Your Rights under the Australian Privacy Act */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">5. Your Rights under the Australian Privacy Act 1988</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                Under the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles, you have the following rights in relation to your personal information:
              </p>
              <ul className="ml-5 list-disc space-y-3">
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Right of access</strong>:you may request access to the personal information we hold about you. We will respond to access requests within a reasonable time and provide the information in a format that is accessible to you.
                </li>
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Right to correction</strong>:if you believe that personal information we hold about you is inaccurate, out of date, incomplete, or misleading, you may request that we correct it. You can update most information directly within your account settings.
                </li>
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Right to deletion</strong>:you may request that we delete your personal information. Subject to our legal obligations and the data retention requirements described below, we will take reasonable steps to comply with deletion requests.
                </li>
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Right to opt out of marketing</strong>:you may opt out of receiving direct marketing communications from us at any time by clicking the unsubscribe link in any marketing email or by contacting us directly.
                </li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at hello@servlo.com.au. We will respond within 5 business days. In some cases, we may need to verify your identity before processing a request.
              </p>
              <p>
                If you are not satisfied with how we have handled your personal information, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-color)] underline hover:opacity-80 dark:text-cyan-400">oaic.gov.au</a>.
              </p>
            </div>
          </section>

          {/* 6. Australian Privacy Principles */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">6. Australian Privacy Principles</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                SERVLO is committed to complying with the thirteen Australian Privacy Principles (APPs) contained in the <em>Privacy Act 1988</em> (Cth). These principles govern how we collect, hold, use, correct, and disclose personal information.
              </p>
              <p>
                In particular, we commit to:
              </p>
              <ul className="ml-5 list-disc space-y-2">
                <li>Being transparent about how we manage personal information (APP 1).</li>
                <li>Collecting personal information only by lawful and fair means (APP 3).</li>
                <li>Keeping personal information secure (APP 11).</li>
                <li>Only using or disclosing personal information for the primary purpose for which it was collected, or for secondary purposes where permitted by law (APP 6).</li>
                <li>Giving you access to and the ability to correct your personal information (APPs 12 and 13).</li>
              </ul>
            </div>
          </section>

          {/* 7. Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">7. Data Retention</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                We retain your personal information and business data for as long as your account remains active or as needed to provide the Service.
              </p>
              <p>
                If you cancel your subscription or close your account, your data will be retained for a period of up to 90 days to allow for account recovery or data export. After this period, your data will be permanently deleted from our systems, subject to any legal obligations that require us to retain certain records for longer (for example, financial and tax records may be required to be kept for a minimum period under Australian law).
              </p>
              <p>
                You may request deletion of your data at any time by contacting us at hello@servlo.com.au. We will action deletion requests within 30 days, subject to any applicable legal obligations.
              </p>
            </div>
          </section>

          {/* 8. Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">8. Cookies</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                SERVLO uses cookies and similar tracking technologies to operate the platform and understand how it is used. We use the following types of cookies:
              </p>
              <ul className="ml-5 list-disc space-y-3">
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Essential session cookies</strong>:these are required for authentication and to keep you securely logged in. They are set by our authentication provider (Supabase) and cannot be disabled without preventing you from accessing your account.
                </li>
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">Analytics cookies</strong>:these are used to collect aggregated information about how visitors use the platform, such as which pages are visited most frequently and how users navigate the application. This helps us improve the Service.
                </li>
              </ul>
              <p>
                You can disable non-essential cookies through your browser settings. Please note that disabling certain cookies may affect the functionality of the platform. Your browser documentation will provide instructions for managing cookie preferences.
              </p>
            </div>
          </section>

          {/* 9. Contact */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">9. Contact</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                If you have any questions, concerns, or complaints about this Privacy Policy or about how we handle your personal information, please contact our Privacy Officer:
              </p>
              <address className="not-italic space-y-1">
                <p><strong className="text-[#1e3a5f] dark:text-white">SERVLO Privacy Officer</strong></p>
                <p>Adelaide SA, Australia</p>
                <p>
                  Email:{" "}
                  <a href="mailto:hello@servlo.com.au" className="text-[var(--accent-color)] underline hover:opacity-80 dark:text-cyan-400">
                    hello@servlo.com.au
                  </a>
                </p>
              </address>
              <p className="mt-4 text-sm text-[#64748b] dark:text-slate-400">
                We will respond to all privacy enquiries within 5 business days.
              </p>
              <p className="text-sm text-[#64748b] dark:text-slate-400">
                If you are not satisfied with our response, you may contact the Office of the Australian Information Commissioner (OAIC) at{" "}
                <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-color)] underline hover:opacity-80 dark:text-cyan-400">
                  oaic.gov.au
                </a>{" "}
                or by phone on 1300 363 992.
              </p>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-[#0b1220]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-2 md:px-6">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/servlo-master-dark.svg" alt="SERVLO" width={28} height={28} unoptimized className="dark:hidden drop-shadow-[0_0_32px_rgba(0,0,0,0.35)]" />
              <Image src="/servlo-master-white.svg" alt="SERVLO" width={28} height={28} unoptimized className="hidden dark:block drop-shadow-[0_0_28px_rgba(255,255,255,0.2)]" />
              <p className="font-bold text-[#1e3a5f] dark:text-white">SERVLO</p>
            </div>
            <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">
              The operating system for Australian service businesses
            </p>
            <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">
              Questions? We&apos;re based in Adelaide, South Australia. Email us at hello@servlo.com.au
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#475569] md:justify-end dark:text-slate-300">
            <Link href="/privacy" className="hover:text-[var(--accent-color)] dark:hover:text-cyan-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--accent-color)] dark:hover:text-cyan-300">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-[var(--accent-color)] dark:hover:text-cyan-300">
              Contact
            </Link>
          </div>
        </div>
        <p className="pb-8 text-center text-xs text-[#64748b] dark:text-slate-400">
          © 2026 SERVLO. All rights reserved. ABN: 88 688 301 684
        </p>
      </footer>
    </main>
  );
}
