"use client";

import React from "react";

export function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-(--border) bg-[rgba(79,140,255,0.12)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#cfe2ff]">
        <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" />
        {label}
      </div>
      {children}
    </label>
  );
}

