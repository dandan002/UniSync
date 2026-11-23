"use client";

import dynamic from "next/dynamic";

// The flow reads its draft from localStorage, so it renders only in the browser.
export const FlowClient = dynamic(() => import("./flow").then((m) => m.Flow), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-paper" />,
});
