import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Terms of Service | SERVLO",
  description: "SERVLO Terms of Service for Australian service businesses.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#1e3a5f] [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Helvetica,Arial,sans-serif] dark:bg-[#0A0A0A] dark:text-white">
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-extrabold text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-neutral-400">Last updated: May 2026</p>

        {/* ── TL;DR — skim-friendly summary ─────────────────────────────── */}
        <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.04] p-6 sm:p-7">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
            The short version
          </p>
          <ul className="space-y-3 text-base leading-relaxed text-white">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
              <span><strong>SERVLO is a subscription.</strong> You pay monthly or annually. Plans start at $29/mo. Cancel anytime from your billing settings.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
              <span><strong>30-day money-back guarantee.</strong> If it&apos;s not for you in the first month, email us and we&apos;ll refund.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
              <span><strong>You own your data.</strong> Export it anytime. After cancellation we keep it 30 days, then delete.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
              <span><strong>Don&apos;t do anything illegal or abusive</strong> with the platform — no spam, no malware, no scraping, no reselling without our okay.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
              <span><strong>We aim for 99.9% uptime</strong> but can&apos;t guarantee it. Status updates at <Link href="/status" className="font-bold underline">/status</Link>.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
              <span><strong>Australian Consumer Law always applies.</strong> Your statutory rights aren&apos;t cut by anything below.</span>
            </li>
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-neutral-400">
            This summary is here so you can skim. It is <em>not</em> legally binding — the full terms below are. But the short version is the spirit of what you&apos;re agreeing to.
          </p>
        </div>

        <div className="mt-10 space-y-10 text-white">

          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">1. Acceptance of Terms</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                By accessing or using SERVLO (&ldquo;the Service&rdquo;, &ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you must not use the Service.
              </p>
              <p>
                These Terms form a legally binding agreement between you (the business or individual accessing the Service) and SERVLO (ABN 88 688 301 684), a business operating from Adelaide, South Australia, Australia.
              </p>
              <p>
                We may update these Terms from time to time. We will notify you of material changes by email or by posting a notice within the platform. Continued use of the Service after such notice constitutes acceptance of the updated Terms.
              </p>
            </div>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">2. Description of Service</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                SERVLO is a business management software-as-a-service (SaaS) platform designed for Australian service businesses, including but not limited to trades, cleaning, events, marketing, health, and field service businesses.
              </p>
              <p>The platform is offered as three distinct products:</p>
              <ul className="ml-5 list-disc space-y-2">
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">SERVLO Core</strong>:the operational foundation of the platform, covering jobs and scheduling, client management, invoices and quotes, team timesheets, and purchase orders.
                </li>
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">SERVLO Grow</strong>:AI-powered marketing tools including ad creation, social content generation, review automation, and referral tracking (launching soon).
                </li>
                <li>
                  <strong className="text-[#1e3a5f] dark:text-white">SERVLO Leads</strong>:a marketplace for purchasing qualified leads matched to your industry and location (launching soon).
                </li>
              </ul>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice. We will not be liable to you or any third party for any such modification, suspension, or discontinuation.
              </p>
            </div>
          </section>

          {/* 3. User Accounts */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">3. User Accounts</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                To access the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to keep your account information up to date.
              </p>
              <p>
                You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You must notify us immediately at hello@servlo.com.au if you suspect any unauthorised access to your account.
              </p>
              <p>
                Each subscription covers one business entity. You may not use a single account to manage multiple legally separate businesses without a separate subscription for each. You may invite team members and employees under your subscription in accordance with your plan limits.
              </p>
              <p>
                You must be at least 18 years of age and have the legal authority to bind the business entity you represent to these Terms.
              </p>
            </div>
          </section>

          {/* 4. Payment and Billing */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">4. Payment and Billing</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                <strong className="text-white">Subscription &amp; money-back.</strong> SERVLO is a paid subscription from day one. You provide a credit card at signup and are charged immediately for your first billing period. You have 30 days from your initial payment to request a full refund if SERVLO is not a fit (see the <Link href="/refund" className="font-bold underline hover:text-neutral-300">Refund Policy</Link> for details). After 30 days, standard refund terms apply.
              </p>
              <p>
                <strong className="text-[#1e3a5f] dark:text-white">Subscription Billing.</strong> Paid plans are billed on a monthly or annual basis, as selected at the time of purchase. All prices are displayed in Australian dollars (AUD) and are inclusive of GST where applicable. Billing is processed securely through Stripe.
              </p>
              <p>
                <strong className="text-[#1e3a5f] dark:text-white">Cancellation.</strong> You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of your current billing period. You will continue to have access to the Service until the end of the period you have already paid for.
              </p>
              <p>
                <strong className="text-[#1e3a5f] dark:text-white">Refunds.</strong> We do not offer refunds for partial months or partial billing periods. If you cancel mid-cycle, your access will continue until the end of that cycle with no refund for the unused portion.
              </p>
              <p>
                <strong className="text-[#1e3a5f] dark:text-white">Price Changes.</strong> We may change our pricing at any time. We will provide at least 30 days&rsquo; notice before any price increase takes effect for existing subscribers.
              </p>
              <p>
                <strong className="text-[#1e3a5f] dark:text-white">Failed Payments.</strong> If a payment fails, we will attempt to notify you by email. Continued failure to settle outstanding amounts may result in suspension or termination of your account.
              </p>
            </div>
          </section>

          {/* 5. Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">5. Acceptable Use</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You must not:</p>
              <ul className="ml-5 list-disc space-y-2">
                <li>Use the Service for any illegal purpose or in violation of any applicable Australian or international law or regulation.</li>
                <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of any part of the platform.</li>
                <li>Share your account credentials with unauthorised parties or allow others outside your business to access the platform under your subscription.</li>
                <li>Upload, transmit, or store content that is defamatory, harassing, obscene, fraudulent, or otherwise objectionable.</li>
                <li>Use the Service to send unsolicited commercial communications (spam).</li>
                <li>Attempt to gain unauthorised access to any part of the Service, other user accounts, or SERVLO&rsquo;s systems or networks.</li>
                <li>Use automated tools, bots, or scrapers to access or extract data from the platform without our written consent.</li>
                <li>Interfere with or disrupt the integrity or performance of the Service or any third-party services connected to it.</li>
              </ul>
              <p>
                We reserve the right to investigate suspected violations and, where appropriate, suspend or terminate accounts without notice.
              </p>
            </div>
          </section>

          {/* 6. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">6. Intellectual Property</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                <strong className="text-[#1e3a5f] dark:text-white">Our Platform.</strong> SERVLO owns all intellectual property rights in the platform, including its software, design, user interface, trademarks, logos, and documentation. Nothing in these Terms transfers any of these rights to you. You are granted a limited, non-exclusive, non-transferable licence to use the Service for your business purposes during the term of your subscription.
              </p>
              <p>
                <strong className="text-[#1e3a5f] dark:text-white">Your Data.</strong> You own all data you enter into the platform, including client information, job records, invoices, and other business data (&ldquo;Your Content&rdquo;). You grant SERVLO a limited licence to store, process, and display Your Content solely for the purpose of providing the Service to you.
              </p>
              <p>
                <strong className="text-[#1e3a5f] dark:text-white">Feedback.</strong> If you provide feedback or suggestions about the Service, you grant us an irrevocable, perpetual, royalty-free licence to use that feedback to improve the platform. We will not identify you as the source of any feedback without your permission.
              </p>
              <p>
                <strong className="text-[#1e3a5f] dark:text-white">Data Export.</strong> You may export your data at any time while your account is active. We will provide a reasonable data export mechanism within your account settings.
              </p>
            </div>
          </section>

          {/* 7. Data and Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">7. Data and Privacy</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                Your use of the Service is also governed by our{" "}
                <Link href="/privacy" className="text-[var(--accent-color)] underline hover:opacity-80 dark:text-cyan-400">
                  Privacy Policy
                </Link>
                , which is incorporated into these Terms by reference. Please read the Privacy Policy carefully. It describes how we collect, use, store, and share your personal information.
              </p>
              <p>
                We are committed to handling your personal information in accordance with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).
              </p>
              <p>
                Where you input personal information about your clients, employees, or contractors into the platform, you warrant that you have obtained all necessary consents and authorisations to share that information with us for the purposes of providing the Service.
              </p>
            </div>
          </section>

          {/* 8. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">8. Limitation of Liability</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                To the maximum extent permitted by applicable Australian law, SERVLO and its directors, employees, and contractors will not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of, or inability to use, the Service.
              </p>
              <p>
                Our total liability to you for any claim arising out of or relating to these Terms or the Service will not exceed the total amount you have paid to us in the twelve (12) months immediately preceding the event giving rise to the claim.
              </p>
              <p>
                Nothing in these Terms excludes, restricts, or modifies any right or remedy, or any guarantee, warranty, or other term or condition, implied or imposed by legislation that cannot lawfully be excluded or limited, including any guarantee under the <em>Australian Consumer Law</em> (Schedule 2 of the <em>Competition and Consumer Act 2010</em> (Cth)).
              </p>
              <p>
                We make no warranty that the Service will be uninterrupted, error-free, or entirely secure. We will use reasonable commercial efforts to maintain availability but do not guarantee any specific uptime.
              </p>
            </div>
          </section>

          {/* 9. Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">9. Governing Law</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>
                These Terms are governed by and construed in accordance with the laws of South Australia, Australia, without regard to its conflict of law provisions.
              </p>
              <p>
                Any dispute arising out of or in connection with these Terms or the Service will be subject to the exclusive jurisdiction of the courts of South Australia, Australia. You irrevocably submit to the personal jurisdiction of those courts for such purposes.
              </p>
              <p>
                Before commencing formal dispute resolution, both parties agree to attempt to resolve any dispute in good faith through direct negotiation. If a dispute cannot be resolved through negotiation within 30 days, either party may refer the matter to formal dispute resolution.
              </p>
            </div>
          </section>

          {/* 10. Contact */}
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-white">10. Contact</h2>
            <div className="mt-4 space-y-3 text-base leading-relaxed">
              <p>If you have any questions about these Terms of Service, please contact us:</p>
              <address className="not-italic space-y-1">
                <p><strong className="text-[#1e3a5f] dark:text-white">SERVLO</strong></p>
                <p>ABN: 88 688 301 684</p>
                <p>Adelaide SA, Australia</p>
                <p>
                  Email:{" "}
                  <a href="mailto:hello@servlo.com.au" className="text-[var(--accent-color)] underline hover:opacity-80 dark:text-cyan-400">
                    hello@servlo.com.au
                  </a>
                </p>
              </address>
              <p className="mt-4 text-sm text-[#64748b] dark:text-slate-400">
                We aim to respond to all legal enquiries within 5 business days.
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
              <Image src="/servlo-master-white.svg" alt="SERVLO" width={28} height={28} unoptimized className="dark:hidden drop-shadow-[0_0_32px_rgba(0,0,0,0.35)]" />
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
