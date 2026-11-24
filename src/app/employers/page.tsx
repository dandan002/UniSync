import type { Metadata } from "next";
import { Pitch } from "@/components/pitch";

export const metadata: Metadata = { title: "For employers" };

export default function Employers() {
  return (
    <Pitch
      title={
        <>
          Hire interns
          <br />
          <span style={{ color: "var(--accent)" }}>their schools vouch for.</span>
        </>
      }
      lead="Post an internship, and Sync ranks applicants by skills, location and dates. Every student is linked to their school."
      cta={{ href: "/sign-in?as=employer", label: "Post an internship" }}
      points={[
        { t: "A board, not an inbox", d: "Move applicants from new to offer. Invite to interviews and send offers from one place." },
        { t: "Fair by design", d: "Sync never looks at age, gender or photos. You make the final decision." },
        { t: "Hours and MOAs", d: "Approve intern time logs each week and sign school MOAs without paper." },
      ]}
    />
  );
}
