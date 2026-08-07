"use client";

import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { CheckCircle2, Loader2, Plus, TrendingUp, X } from "lucide-react";
import { KanbanColumn } from "./KanbanColumn";
import { LeadFormDialog } from "./LeadFormDialog";
import {
  STATUS_COLUMNS,
  currencyFormatter,
  type LeadRecord,
  type LeadStatus,
} from "./types";

type ToastState = { type: "success" | "error"; message: string } | null;

const OPEN_STATUSES: LeadStatus[] = [
  "nuevo",
  "contactado",
  "propuesta_enviada",
];

export function LeadsBoardPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    void loadLeads();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function loadLeads() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leads", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { leads?: LeadRecord[] };
      setLeads(data.leads ?? []);
    } catch {
      setToast({
        type: "error",
        message: "No se pudo cargar la lista de leads.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const totalPipelineValue = useMemo(
    () =>
      leads
        .filter((lead) => OPEN_STATUSES.includes(lead.status))
        .reduce((sum, lead) => sum + (lead.budget_estimate ?? 0), 0),
    [leads],
  );

  function handleDragStartLead(
    event: DragEvent<HTMLDivElement>,
    leadId: string,
  ) {
    setDraggingId(leadId);
    event.dataTransfer.effectAllowed = "move";
  }

  async function handleDropStatus(status: LeadStatus) {
    const leadId = draggingId;
    setDraggingId(null);

    if (!leadId) return;

    const lead = leads.find((item) => item.id === leadId);
    if (!lead || lead.status === status) return;

    setLeads((current) =>
      current.map((item) => (item.id === leadId ? { ...item, status } : item)),
    );

    try {
      const response = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status }),
      });
      if (!response.ok) throw new Error();
      await loadLeads();
    } catch {
      setToast({
        type: "error",
        message: "No se pudo mover el lead. Reintentá.",
      });
      await loadLeads();
    }
  }

  function openCreateDialog() {
    setSelectedLead(null);
    setIsDialogOpen(true);
  }

  function openLeadDialog(lead: LeadRecord) {
    setSelectedLead(lead);
    setIsDialogOpen(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      {toast && (
        <div
          className={`fixed right-4 top-24 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-2xl backdrop-blur md:right-8 ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

      <header className="flex flex-col gap-4 border-b border-assets pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-medium uppercase leading-none tracking-tight text-foreground md:text-6xl">
            Leads & Pipeline
          </h1>

          <div className="mt-4 flex items-center gap-2 text-sm text-paragraph">
            <TrendingUp className="h-4 w-4 text-swiss-blue" />
            Valor total en negociación:
            <span className="font-medium text-swiss-blue">
              {currencyFormatter.format(totalPipelineValue)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-orange cursor-pointer px-4 text-sm font-medium text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar Lead
        </button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-assets bg-background py-16 text-sm text-paragraph">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando leads
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.status}
              status={column.status}
              label={column.label}
              leads={leads.filter((lead) => lead.status === column.status)}
              draggingId={draggingId}
              onDragStartLead={handleDragStartLead}
              onDragEnd={() => setDraggingId(null)}
              onDropStatus={(status) => void handleDropStatus(status)}
              onOpenLead={openLeadDialog}
            />
          ))}
        </div>
      )}

      <LeadFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        lead={selectedLead}
        onSaved={loadLeads}
        onDeleted={loadLeads}
      />
    </div>
  );
}
