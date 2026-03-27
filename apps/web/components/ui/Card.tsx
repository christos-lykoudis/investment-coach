"use client";

import React from "react";

export function Card({
  title,
  children
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-(--border) bg-[linear-gradient(180deg,rgba(19,29,49,0.95),rgba(13,20,36,0.92))] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      {title ? (
        <div className="mb-2.5 font-bold tracking-[0.2px]">{title}</div>
      ) : null}
      {children}
    </section>
  );
}

