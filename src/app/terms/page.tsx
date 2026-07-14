import type { Metadata } from "next";
import LegalLayout, { LegalSection } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service — ConfluxAI",
  description: "The terms governing your use of the ConfluxAI platform.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="These terms govern your access to and use of ConfluxAI and our chatbot platform. Please read them carefully."
      lastUpdated="July 1, 2026"
    >
      <LegalSection heading="1. Acceptance of Terms">
        <p>
          By accessing or using ConfluxAI (the &ldquo;Service&rdquo;), you agree
          to be bound by these Terms of Service and our Privacy Policy. If you
          are using the Service on behalf of an organization, you represent that
          you have authority to bind that organization to these terms.
        </p>
      </LegalSection>

      <LegalSection heading="2. Accounts">
        <p>
          You are responsible for safeguarding your account credentials and for
          all activity that occurs under your account. You agree to provide
          accurate information and to keep it up to date. Notify us immediately
          of any unauthorized use of your account.
        </p>
      </LegalSection>

      <LegalSection heading="3. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Use the Service to build unlawful, harmful, or deceptive chatbots.</li>
          <li>Infringe the intellectual property or privacy rights of others.</li>
          <li>Attempt to disrupt, reverse-engineer, or overload the platform.</li>
          <li>Transmit malware, spam, or content that violates applicable law.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Subscriptions & Billing">
        <p>
          Paid plans are billed in advance on a recurring basis. Fees are
          non-refundable except where required by law. We may change pricing
          with reasonable notice, and continued use after a change constitutes
          acceptance of the new pricing.
        </p>
      </LegalSection>

      <LegalSection heading="5. Intellectual Property">
        <p>
          We retain all rights to the Service, including software, branding, and
          documentation. You retain ownership of the content and data you upload,
          and grant us a limited license to process it solely to operate the
          Service for you.
        </p>
      </LegalSection>

      <LegalSection heading="6. Termination">
        <p>
          You may stop using the Service at any time. We may suspend or terminate
          access for material breach of these terms or for lawful reasons, with
          or without notice where permitted.
        </p>
      </LegalSection>

      <LegalSection heading="7. Changes to These Terms">
        <p>
          We may update these Terms from time to time. Material changes will be
          communicated through the Service or by email. Continued use after
          changes take effect constitutes acceptance.
        </p>
      </LegalSection>

      <LegalSection heading="8. Contact">
        <p>
          Questions about these Terms can be directed to{" "}
          <span className="text-slate-300">legal@confluxai.example</span>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
