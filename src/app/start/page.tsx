import type { Metadata } from "next";
import { Flow } from "./flow";

export const metadata: Metadata = { title: "Build your resume" };

export default function StartPage() {
  return <Flow />;
}
