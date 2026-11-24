import type { Metadata } from "next";
import { Pitch } from "@/components/pitch";

export const metadata: Metadata = { title: "For schools" };

export default function Schools() {
  return (
    <Pitch
      title={
        <>
          Track every OJT form
          <br />
          <span style={{ color: "var(--accent)" }}>without the spreadsheet.</span>
        </>
      }
      lead="See who signed up, who applied and who is interning. Unisync keeps CHED forms, hours and MOAs in one place."
      cta={{ href: "/sign-in?as=school", label: "Open the school console" }}
      points={[
        { t: "Needs attention", d: "Inactive students, missing MOAs and unapproved time logs surface first, with one-click reminders." },
        { t: "CHED report in one click", d: "Export placements, hours and form status for the term as a spreadsheet." },
        { t: "Verified companies only", d: "Admins approve companies after checking SEC or DTI records, a work email and a phone number." },
      ]}
    />
  );
}
