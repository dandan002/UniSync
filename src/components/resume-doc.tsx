import { sectionsOf } from "@/lib/resume";
import type { ResumeData, Template } from "@/lib/types";

const FONTS: Record<Template, string> = {
  classic: "var(--font-serif4), Georgia, serif",
  modern: "var(--font-instrument), system-ui, sans-serif",
  compact: "var(--font-instrument), system-ui, sans-serif",
};

// The printable resume. Always light, like paper.
export function ResumeDoc({ data, template = "classic", className = "" }: { data: ResumeData; template?: Template; className?: string }) {
  const compact = template === "compact";
  const contact = [data.email, data.phone, data.city].filter(Boolean).join(" · ");
  const subtitle = [data.course, data.school].filter(Boolean).join(" · ");
  return (
    <article
      aria-label="Resume preview"
      className={`resume-paper flex flex-col ${className}`}
      style={{
        padding: compact ? "32px 36px" : "52px 56px",
        gap: compact ? 16 : 26,
        fontFamily: FONTS[template],
        transition: "padding .4s, gap .4s",
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-2" style={{ borderBottom: "2px solid #1E2140", paddingBottom: 12 }}>
        <div className="flex flex-col gap-1">
          <span style={{ fontSize: 32, fontWeight: 400, letterSpacing: "-0.03em" }}>{data.name || "Your name"}</span>
          {subtitle ? <span style={{ fontSize: 15, color: "#3F4262" }}>{subtitle}</span> : null}
        </div>
        {contact ? <span style={{ fontSize: 14, color: "#3F4262" }}>{contact}</span> : null}
      </div>
      {sectionsOf(data).map((sec) => (
        <div key={sec.heading} className="flex flex-col" style={{ gap: compact ? 6 : 10 }}>
          <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", color: "#5E6280" }}>{sec.heading}</span>
          {sec.items.map((it, i) => (
            <div key={`${it.title}-${i}`} className="flex flex-col gap-1">
              <div className="flex justify-between gap-3">
                <span style={{ fontWeight: 500, fontSize: 16 }}>{it.title}</span>
                {it.when ? <span style={{ fontSize: 14, color: "#5E6280", whiteSpace: "nowrap" }}>{it.when}</span> : null}
              </div>
              {it.line ? <span style={{ fontSize: 15, lineHeight: 1.55 }}>{it.line}</span> : null}
            </div>
          ))}
        </div>
      ))}
      {data.skills.length ? (
        <div className="flex flex-col gap-1">
          <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", color: "#5E6280" }}>Skills</span>
          <span style={{ fontSize: 15, lineHeight: 1.55 }}>{data.skills.join(", ")}</span>
        </div>
      ) : null}
    </article>
  );
}
