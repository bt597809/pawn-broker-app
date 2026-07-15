"use client";

import { useState, ReactNode } from "react";

export default function CollapsibleFilters({
  title = "Search filters",
  defaultOpen = false,
  children,
}: {
  title?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="filter-panel">
      <button
        type="button"
        className="filter-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>
      {open ? <div className="filter-body">{children}</div> : null}
    </div>
  );
}
