import type { Metadata } from "next";
import LegalLayout, { LegalSection } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — ConfluxAI",
  description: "How ConfluxAI collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="This policy explains what information we collect, how we use it, and the choices you have when using ConfluxAI."
      lastUpdated="July 1, 2026"
    >
      <LegalSection heading="1. Information We Collect">
        <p>We collect the following categories of information:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="text-slate-300">Account data</span> — email, name,
            and credentials you provide at sign-up.
          </li>
          <li>
            <span className="text-slate-300">Content data</span> — documents,
            knowledge bases, and conversation logs you upload or generate.
          </li>
          <li>
            <span className="text-slate-300">Usage data</span> — interactions,
            performance metrics, and device/browser information.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="2. How We Use Information">
        <p>We use your information to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Provide, operate, and improve the Service.</li>
          <li>Train and serve your chatbot models within your account scope.</li>
          <li>Secure the platform and prevent abuse or fraud.</li>
          <li>Communicate with you about your account and updates.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Sharing of Information">
        <p>
          We do not sell your personal data. We share information only with
          vetted service providers (such as hosting and analytics) under
          confidentiality obligations, or when required by law.
        </p>
      </LegalSection>

      <LegalSection heading="4. Cookies & Tracking">
        <p>
          We use essential cookies for authentication and session management,
          and optional analytics cookies to understand usage. You can manage
          non-essential cookies through your browser settings.
        </p>
      </LegalSection>

      <LegalSection heading="5. Data Security">
        <p>
          We apply industry-standard measures — encryption in transit and at
          rest, access controls, and audit logging — to protect your
          information. No method of transmission or storage is completely
          secure.
        </p>
      </LegalSection>

      <LegalSection heading="6. Your Rights">
        <p>
          Depending on your jurisdiction, you may have the right to access,
          correct, export, or delete your personal data, and to object to
          certain processing. Contact us to exercise these rights.
        </p>
      </LegalSection>

      <LegalSection heading="7. Data Retention">
        <p>
          We retain your account and content data for as long as your account is
          active, and for a limited period afterward as needed to comply with
          legal obligations and resolve disputes.
        </p>
      </LegalSection>

      <LegalSection heading="8. Contact">
        <p>
          For privacy requests or questions, reach us at{" "}
          <span className="text-slate-300">privacy@confluxai.example</span>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
