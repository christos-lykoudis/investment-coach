"use client";

import React from "react";

export function Button({
  children,
  onClick,
  type,
  disabled
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className="w-auto cursor-pointer rounded-[10px] border border-[rgba(79,140,255,0.45)] bg-[linear-gradient(135deg,rgba(79,140,255,0.9),rgba(0,215,255,0.75))] px-3.5 py-2.5 font-bold text-[#06101f] shadow-[0_6px_18px_rgba(79,140,255,0.25)] transition-opacity disabled:cursor-not-allowed disabled:bg-[linear-gradient(135deg,rgba(79,140,255,0.2),rgba(0,215,255,0.15))] disabled:opacity-60 disabled:shadow-none"
    >
      {children}
    </button>
  );
}

