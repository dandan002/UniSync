import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, LegalPage, type LegalSection } from "@/components/legal-page";
import { LEGAL, PROCESSORS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Unisync collects, why, who sees it and how to delete it.",
};

const sections: LegalSection[] = [
  {
    id: "collect",
    heading: "What we collect",
    body: (
      <>
        <p>
          <strong>From students:</strong>
        </p>
        <ul>
          <li>Your answers to the first questions: course, name, preferred language, capstone project, activities, where you can intern and your minimum allowance.</li>
          <li>Your resume: projects, experience, skills, summary, city, when you can start, your school, and the email or mobile number you add.</li>
          <li>The email address or mobile number you sign in with.</li>
          <li>What you tell Sync in chat.</li>
          <li>School forms you upload, such as parent consent, a medical certificate, orientation and your training plan. A medical certificate can include health information, which the Data Privacy Act treats as sensitive personal information.</li>
          <li>Applications, saved jobs, interviews, offers, messages with companies, and the hours you log with their notes.</li>
        </ul>
        <p>
          <strong>From school staff:</strong> your name, work email, role and school, plus a record of actions you take in the school console.
        </p>
        <p>
          <strong>From company representatives:</strong> your name, work email and phone; your company&apos;s name, city, description and SEC or DTI registration number; the jobs you post; messages to
          students; hours you approve; and agreements you sign in the app.
        </p>
        <p>
          <strong>Automatically:</strong> sign-in cookies that keep you logged in; your IP address and browser details in our hosting provider&apos;s server logs and in short-lived rate-limit counters; and a
          count of your Sync messages, kept for two days to enforce limits.
        </p>
        <p>
          <strong>On your device:</strong> before you sign in, your answers and draft resume are stored only in your browser. Your Sync chat history is also kept in your browser, and we clear it when you sign
          out. If you use voice notes, your browser&apos;s own speech service turns your voice into text; we only receive the text.
        </p>
        <p>We don&apos;t ask for your age, gender, religion, marital status, photo or government ID numbers, and Sync is told to leave them off your resume.</p>
      </>
    ),
  },
  {
    id: "use",
    heading: "How we use it",
    body: (
      <ul>
        <li>To build your resume and show it to you as you go.</li>
        <li>To match you with internships, using your course, skills, city and allowance. Matching never uses age, gender or photos.</li>
        <li>To let you apply, and to let companies review applicants, schedule interviews, make offers and approve hours.</li>
        <li>To let your school track internship requirements, forms, hours and placements, and prepare reports for the Commission on Higher Education (CHED).</li>
        <li>To verify companies before their jobs go live.</li>
        <li>To send emails about your account, applications, interviews, offers, reminders and messages.</li>
        <li>To keep Unisync safe: preventing abuse, limiting automated use, and blocking messages that ask students for money.</li>
        <li>To meet legal obligations.</li>
      </ul>
    ),
  },
  {
    id: "basis",
    heading: "Our legal basis",
    body: (
      <>
        <p>We process personal information under the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules:</p>
        <ul>
          <li>
            <strong>Consent,</strong> which you give when you create your resume, chat with Sync and upload forms. For sensitive personal information, such as a medical certificate, we rely on your consent.
            You can withdraw it at any time by deleting the information or your account.
          </li>
          <li>
            <strong>Our agreement with you,</strong> to provide the service you signed up for.
          </li>
          <li>
            <strong>Legitimate interests,</strong> such as keeping accounts secure and preventing fraud, when those interests don&apos;t override your rights.
          </li>
          <li>
            <strong>Legal obligations,</strong> when the law requires us to keep or disclose information.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "share",
    heading: "Who can see your information",
    body: (
      <>
        <ul>
          <li>
            <strong>Your school.</strong> If your school uses Unisync, its internship coordinators and admins can see your profile, resume, forms, hours, applications and placement status.
          </li>
          <li>
            <strong>Companies you apply to.</strong> When you apply, the company sees your resume, including the contact details on it, your school, and a short note from Sync on why you match. Your host
            company also sees the hours you log so it can approve them.
          </li>
          <li>
            <strong>Students who apply to your company,</strong> if you&apos;re a company representative: they see your company&apos;s name, city, description and jobs, and the messages you send them.
          </li>
          <li>
            <strong>Service providers</strong> who run parts of Unisync for us and may use the data only for that work:
            <ul>
              {PROCESSORS.map((p) => (
                <li key={p.name}>
                  {p.name}: {p.use}.
                </li>
              ))}
            </ul>
          </li>
          <li>
            <strong>Authorities,</strong> when the law, a court order or the National Privacy Commission requires it.
          </li>
        </ul>
        <p>We don&apos;t sell your personal information, and we don&apos;t use it for advertising.</p>
        <p>
          Schools and companies decide for themselves how they use what they see, under their own privacy notices and the law. Some of our service providers store or process data outside the Philippines,
          mainly in the United States. When they do, we rely on their contractual commitments to protect it.
        </p>
      </>
    ),
  },
  {
    id: "sync",
    heading: "Sync and AI",
    body: (
      <>
        <p>
          Sync, the resume assistant, uses Claude models from Anthropic. When you answer a question or chat with Sync, we send your answer, your resume and the recent conversation to Anthropic so Sync can
          reply and update your resume. Under Anthropic&apos;s commercial terms, this data isn&apos;t used to train its models.
        </p>
        <p>
          Sync is instructed to write only what you tell it, and Unisync checks its edits before they&apos;re saved. It can still make mistakes, so read every line before you apply. Don&apos;t share
          passwords, ID numbers or bank details with Sync. If Sync is unavailable, a simpler, rule-based version runs on our own servers instead.
        </p>
      </>
    ),
  },
  {
    id: "keep",
    heading: "How long we keep it",
    body: (
      <ul>
        <li>We keep your account information for as long as your account exists.</li>
        <li>
          You can delete your resume from your resume page at any time. You can delete your whole account from the account menu. That removes your profile, resume, applications, uploaded forms, hours,
          saved jobs and notifications, and your sign-in account.
        </li>
        <li>
          After you delete your account, we keep a record that your login was deleted for one day so it can&apos;t be used to recreate your profile. Two notes with your name stay behind: an entry in
          your school&apos;s activity log saying you deleted your account, and a notification to any company still reviewing your application.
        </li>
        <li>Copies in our providers&apos; backups are overwritten on their regular schedule.</li>
        <li>Your draft and chat history on your device stay there until you save, start over, sign out or clear your browser data.</li>
      </ul>
    ),
  },
  {
    id: "security",
    heading: "How we protect it",
    body: (
      <>
        <p>
          Data travels over encrypted connections. Database rules make sure each person sees only what their role allows, and school forms sit in private storage. Sign-in uses one-time codes instead of
          passwords. We verify companies before their jobs go live, and we block messages that ask students for money.
        </p>
        <p>No system is perfectly secure. If a breach affects your personal information, we&apos;ll notify you and the National Privacy Commission as the law requires.</p>
      </>
    ),
  },
  {
    id: "rights",
    heading: "Your rights",
    body: (
      <>
        <p>Under the Data Privacy Act, you have the right to:</p>
        <ul>
          <li>be informed about how your personal information is used;</li>
          <li>access it and get a copy;</li>
          <li>object to processing, and withdraw consent;</li>
          <li>have it corrected;</li>
          <li>have it deleted or blocked;</li>
          <li>get it in a format you can take elsewhere;</li>
          <li>claim damages for harm caused by misuse; and</li>
          <li>file a complaint with the National Privacy Commission.</li>
        </ul>
        <p>
          You can correct and delete most of your information yourself in the app. For anything else, email us at <ContactEmail />. We&apos;ll answer within the time the law allows. To file a complaint, visit
          the National Privacy Commission at{" "}
          <a href="https://privacy.gov.ph" target="_blank" rel="noreferrer">
            privacy.gov.ph
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "minors",
    heading: "Students under 18",
    body: <p>Unisync is for college students, school staff and company representatives. If you&apos;re under 18, use Unisync only with your parent or guardian&apos;s consent.</p>,
  },
  {
    id: "cookies",
    heading: "Cookies and browser storage",
    body: (
      <p>
        We use only the cookies needed to keep you signed in, which Clerk sets. We use your browser&apos;s storage for your draft resume and Sync chat history. We don&apos;t use advertising or tracking
        cookies.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: <p>If we change this policy, we&apos;ll update the effective date above. For significant changes, we&apos;ll also tell you in the app or by email before they take effect.</p>,
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        For privacy questions or requests, including for our data protection officer, email <ContactEmail />. See also our <Link href="/terms">Terms of Service</Link>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          {LEGAL.operator} helps college students in the Philippines build a resume and find internships, helps schools track internship requirements, and helps companies hire interns. This policy explains
          what we collect, why, who can see it and how you can control it.
        </p>
      }
      sections={sections}
    />
  );
}
