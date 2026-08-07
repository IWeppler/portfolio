"use client";

import type { DragEvent } from "react";
import { Building2, Clock } from "lucide-react";
import { currencyFormatter, daysSince, type LeadRecord } from "./types";

type LeadCardProps = {
  lead: LeadRecord;
  onClick: () => void;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  isDragging: boolean;
};

export function LeadCard({ lead, onClick, onDragStart, onDragEnd, isDragging }: LeadCardProps) {
  const days = daysSince(lead.last_contact_at);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group cursor-grab rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-lg shadow-black/20 transition-all hover:border-emerald-500/50 active:cursor-grabbing ${
        isDragging ? "opacity-40" : "opacity-100"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-zinc-100">{lead.name}</h4>
        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          {lead.source}
        </span>
      </div>

      {lead.company && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-zinc-400">
          <Building2 className="h-3.5 w-3.5" />
          {lead.company}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
        <span className="text-base font-medium text-lime-400">
          {lead.budget_estimate ? currencyFormatter.format(lead.budget_estimate) : "A conversar"}
        </span>

        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <Clock className="h-3.5 w-3.5" />
          {days === 0 ? "Hoy" : `${days}d`}
        </span>
      </div>
    </div>
  );
}
