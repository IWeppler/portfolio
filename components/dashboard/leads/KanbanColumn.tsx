"use client";

import type { DragEvent } from "react";
import { useState } from "react";
import { LeadCard } from "./LeadCard";
import { currencyFormatter, type LeadRecord, type LeadStatus } from "./types";

type KanbanColumnProps = {
  status: LeadStatus;
  label: string;
  leads: LeadRecord[];
  draggingId: string | null;
  onDragStartLead: (event: DragEvent<HTMLDivElement>, leadId: string) => void;
  onDragEnd: () => void;
  onDropStatus: (status: LeadStatus) => void;
  onOpenLead: (lead: LeadRecord) => void;
};

export function KanbanColumn({
  status,
  label,
  leads,
  draggingId,
  onDragStartLead,
  onDragEnd,
  onDropStatus,
  onOpenLead,
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);
  const columnValue = leads.reduce((sum, lead) => sum + (lead.budget_estimate ?? 0), 0);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        onDropStatus(status);
      }}
      className={`flex w-72 shrink-0 flex-col gap-3 rounded-lg border p-3 transition-colors ${
        isOver ? "border-emerald-500/60 bg-emerald-500/[0.03]" : "border-assets bg-surface"
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-paragraph">{label}</h3>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-foreground">
          {leads.length}
        </span>
      </div>

      {columnValue > 0 && (
        <p className="px-1 text-xs text-swiss-blue">{currencyFormatter.format(columnValue)}</p>
      )}

      <div className="flex min-h-16 flex-col gap-3">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            isDragging={draggingId === lead.id}
            onDragStart={(event) => onDragStartLead(event, lead.id)}
            onDragEnd={onDragEnd}
            onClick={() => onOpenLead(lead)}
          />
        ))}

        {leads.length === 0 && (
          <div className="rounded-md border border-dashed border-assets py-6 text-center text-xs text-paragraph">
            Sin leads
          </div>
        )}
      </div>
    </div>
  );
}
