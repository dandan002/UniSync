// Numbers on a resume have to come from the student. Sync's edits are
// checked against every number the student has said, so a made-up "35%"
// or "1,500 users" goes back to Sync as an error instead of onto the resume.

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  isa: 1, isang: 1, dalawa: 2, dalawang: 2, tatlo: 3, tatlong: 3, apat: 4, lima: 5, limang: 5, anim: 6,
  pito: 7, pitong: 7, walo: 8, walong: 8, siyam: 9, sampu: 10, sampung: 10,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  dalawampu: 20, dalawampung: 20, tatlumpu: 30, tatlumpung: 30, apatnapu: 40, apatnapung: 40, limampu: 50, limampung: 50,
  animnapu: 60, animnapung: 60, pitumpu: 70, pitumpung: 70, walumpu: 80, walumpung: 80, siyamnapu: 90, siyamnapung: 90,
};
const SCALES: Record<string, number> = { hundred: 100, daan: 100, raan: 100, thousand: 1000, libo: 1000, dozen: 12 };
const WHOLE: Record<string, number> = { sandaan: 100, isandaan: 100, sanlibo: 1000, isanlibo: 1000 };
// Words that join number words without ending the number ("apat na raan").
const LINKERS = new Set(["a", "and", "at", "na", "ng", "t"]);

function numerals(text: string): number[] {
  return Array.from(text.matchAll(/\d[\d,]*(?:\.\d+)?/g), (m) => Number(m[0].replace(/,/g, ""))).filter(Number.isFinite);
}

// Every number a text mentions, as digits ("120", "1,500", "5k") or as words
// in English or Filipino ("four", "apat na raan", "dalawang daan").
export function numbersIn(text: string): Set<number> {
  const found = new Set<number>(numerals(text));
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*k\b/gi)) found.add(Number(m[1]) * 1000);
  let cur: number | null = null;
  for (const word of text.toLowerCase().split(/[^a-z]+/)) {
    if (!word) continue;
    if (word in WHOLE) cur = WHOLE[word]!;
    else if (word in UNITS || word in TENS) cur = (cur ?? 0) + (UNITS[word] ?? TENS[word]!);
    else if (word in SCALES) cur = (cur ?? 1) * SCALES[word]!;
    else if (LINKERS.has(word)) continue;
    else {
      cur = null;
      continue;
    }
    found.add(cur);
  }
  return found;
}

// Numerals in Sync's text that aren't among the known numbers. Years pass,
// since Sync may turn "last year" or "2024 to 2026" into one.
export function ungrounded(texts: Array<string | undefined>, known: Set<number>): number[] {
  const bad = texts.flatMap((t) => (t ? numerals(t) : [])).filter((n) => !known.has(n) && !(Number.isInteger(n) && n >= 1990 && n <= 2099));
  return [...new Set(bad)];
}

export function ungroundedError(bad: number[]): string {
  const list = bad.map((n) => n.toLocaleString("en-US")).join(", ");
  return `The student never gave ${bad.length === 1 ? "this number" : "these numbers"}: ${list}. Don't estimate or round up. Ask the student for the real figure, or leave the number out, and send it again.`;
}
