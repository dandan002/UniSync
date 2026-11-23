import type { Metadata } from "next";
import { FlowClient } from "./client";

export const metadata: Metadata = { title: "Build your resume" };

export default function StartPage() {
  return <FlowClient />;
}
