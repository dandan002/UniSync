import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, LegalPage, type LegalSection } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for students, schools and companies using Unisync.",
};

const sections: LegalSection[] = [
  {
    id: "agreement",
    heading: "These terms",
    body: (
      <p>
        These terms are an agreement between you and {LEGAL.operator} (&quot;we&quot;) about your use of Unisync. By creating an account or using Unisync, you agree to them. If you use Unisync for a school
        or company, you confirm you&apos;re allowed to accept these terms for it. Our <Link href="/privacy">Privacy Policy</Link> explains how we handle personal information.
      </p>
    ),
  },
  {
    id: "who",
    heading: "Who can use Unisync",
    body: (
      <ul>
        <li>
          <strong>Students</strong> enrolled in a college or university in the Philippines who are looking for an internship or on-the-job training (OJT). If you&apos;re under 18, use Unisync only with
          your parent or guardian&apos;s consent.
        </li>
        <li>
          <strong>School staff</strong> whom their school has authorized to manage its internship program.
        </li>
        <li>
          <strong>Company representatives</strong> authorized to hire interns for a business registered with the Securities and Exchange Commission (SEC) or the Department of Trade and Industry (DTI).
        </li>
      </ul>
    ),
  },
  {
    id: "account",
    heading: "Your account",
    body: (
      <ul>
        <li>You sign in with a one-time code sent to your email or phone. Keep access to them secure, and don&apos;t share codes.</li>
        <li>Give accurate information, and keep it current. One person per account.</li>
        <li>You&apos;re responsible for what happens in your account. Tell us right away if you think someone else has used it.</li>
        <li>You can delete your account at any time from the account menu.</li>
      </ul>
    ),
  },
  {
    id: "students",
    heading: "For students",
    body: (
      <ul>
        <li>
          <strong>Your resume must be true.</strong> You&apos;re responsible for everything on it, including lines Sync writes for you. Read every line, and fix or remove anything that isn&apos;t
          accurate, before you apply.
        </li>
        <li>Upload only real documents that belong to you.</li>
        <li>When you apply to a job, you agree that the company can see your resume and contact details.</li>
        <li>
          Unisync helps you find and apply to internships. It doesn&apos;t guarantee interviews, offers, an allowance or school credit. Your school sets your internship requirements and decides whether
          they&apos;re met.
        </li>
        <li>Unisync is free for students.</li>
      </ul>
    ),
  },
  {
    id: "sync",
    heading: "Sync, our AI assistant",
    body: (
      <ul>
        <li>Sync suggests and writes resume entries from what you tell it. Its suggestions can be wrong or incomplete, so always check them.</li>
        <li>Use Sync only for your own resume and internship search. Don&apos;t try to make it ignore its rules, reveal its instructions or produce anything else.</li>
        <li>We limit how many messages you can send so Sync stays available for everyone.</li>
      </ul>
    ),
  },
  {
    id: "schools",
    heading: "For schools",
    body: (
      <ul>
        <li>Give access only to staff who need it to run your internship program, and remove access when they leave.</li>
        <li>Use student information only to administer internships, as the law and CHED&apos;s rules for student internships allow.</li>
        <li>
          You decide whether to verify a company and whether to enter into an agreement with it. Your school remains responsible for its own obligations under the Data Privacy Act and CHED&apos;s rules.
        </li>
      </ul>
    ),
  },
  {
    id: "companies",
    heading: "For companies",
    body: (
      <ul>
        <li>Your company must be real and registered, and the details you submit for verification must be true. Jobs go live only after your company is verified.</li>
        <li>Job posts must be accurate, including the allowance, location, schedule, hours and duties.</li>
        <li>
          <strong>Never ask students for money,</strong> deposits, fees or anything else of value. Unisync blocks these messages, and we may remove companies that send them.
        </li>
        <li>Don&apos;t discriminate based on age, gender, religion, disability or other protected characteristics, and treat interns as Philippine labor and internship rules require.</li>
        <li>Use applicants&apos; information only to evaluate and manage interns. Keep it confidential, and don&apos;t copy it out of Unisync for other purposes.</li>
      </ul>
    ),
  },
  {
    id: "conduct",
    heading: "What you can't do",
    body: (
      <ul>
        <li>Post false or misleading information, or pretend to be someone else.</li>
        <li>Harass, threaten, scam or discriminate against anyone.</li>
        <li>Access accounts or data that aren&apos;t yours, or try to get around security or usage limits.</li>
        <li>Scrape, copy or resell Unisync&apos;s data, or use bots to access it.</li>
        <li>Upload malware, or interfere with how Unisync works.</li>
        <li>Use Unisync for anything unlawful.</li>
      </ul>
    ),
  },
  {
    id: "content",
    heading: "Your content",
    body: (
      <p>
        You own what you put on Unisync, such as your resume, forms, job posts and messages. You give us permission to store, process and show it as needed to run Unisync, including sharing it with your
        school and with companies as described in the Privacy Policy. This permission ends when you delete the content or your account, except for copies we must keep by law or that remain for a short time
        in backups. Unisync&apos;s software, design and brand belong to us.
      </p>
    ),
  },
  {
    id: "ending",
    heading: "Suspension and ending",
    body: (
      <p>
        You can stop using Unisync and delete your account at any time. We may suspend or remove accounts, jobs or content that break these terms or put students at risk, and we&apos;ll tell you why unless
        the law or safety prevents it. We may also change or stop parts of Unisync, and we&apos;ll give notice of major changes when we can.
      </p>
    ),
  },
  {
    id: "disclaimers",
    heading: "Disclaimers",
    body: (
      <>
        <p>
          Unisync is a platform that connects students, schools and companies. We don&apos;t employ interns, and we&apos;re not a party to agreements between them, such as memoranda of agreement or
          training plans.
        </p>
        <p>
          We check each company&apos;s SEC or DTI record, work email and phone before its jobs go live, but we can&apos;t guarantee everything a company or user says. Unisync is provided as is, without
          promises that it will always be available or error-free, to the extent the law allows.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    heading: "Limits on our liability",
    body: (
      <p>
        To the extent Philippine law allows, we aren&apos;t liable for indirect or consequential losses, such as lost opportunities or income, arising from your use of Unisync. Nothing in these terms limits
        liability for fraud, gross negligence, willful misconduct, or anything else the law doesn&apos;t allow us to limit.
      </p>
    ),
  },
  {
    id: "law",
    heading: "Governing law",
    body: <p>These terms are governed by the laws of the Republic of the Philippines. Disputes go to the proper courts of the Philippines, unless the law gives you the right to another forum.</p>,
  },
  {
    id: "changes",
    heading: "Changes to these terms",
    body: (
      <p>
        If we change these terms, we&apos;ll update the effective date above. For significant changes, we&apos;ll tell you in the app or by email before they take effect. If you keep using Unisync after
        that, you accept the new terms.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        Questions about these terms? Email <ContactEmail />.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={
        <p>
          Unisync helps college students in the Philippines build a resume and land an internship, helps schools track internship requirements, and helps companies hire interns. These terms set the rules
          for everyone who uses it.
        </p>
      }
      sections={sections}
    />
  );
}
