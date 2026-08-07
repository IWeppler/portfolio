"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOURCE_PRESETS, STATUS_COLUMNS, type LeadRecord, type LeadStatus } from "./types";

type LeadFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadRecord | null;
  onSaved: () => void;
  onDeleted: () => void;
};

type FormState = {
  name: string;
  company: string;
  email: string;
  whatsapp: string;
  budgetEstimate: string;
  source: string;
  industry: string;
  status: LeadStatus;
  notes: string;
};

const emptyForm: FormState = {
  name: "",
  company: "",
  email: "",
  whatsapp: "",
  budgetEstimate: "",
  source: "Web Inbound",
  industry: "",
  status: "nuevo",
  notes: "",
};

export function LeadFormDialog({ open, onOpenChange, lead, onSaved, onDeleted }: LeadFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (lead) {
      setForm({
        name: lead.name,
        company: lead.company ?? "",
        email: lead.email ?? "",
        whatsapp: lead.whatsapp ?? "",
        budgetEstimate: lead.budget_estimate ? String(lead.budget_estimate) : "",
        source: lead.source,
        industry: lead.industry ?? "",
        status: lead.status,
        notes: lead.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }

    setError(null);
  }, [open, lead]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      company: form.company.trim() || undefined,
      email: form.email.trim() || undefined,
      whatsapp: form.whatsapp.trim() || undefined,
      budgetEstimate: form.budgetEstimate ? Number(form.budgetEstimate) : undefined,
      source: form.source.trim() || "Otro",
      industry: form.industry.trim() || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
    };

    try {
      const response = await fetch("/api/leads", {
        method: lead ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead ? { id: lead.id, ...payload } : payload),
      });

      if (!response.ok) throw new Error();

      onSaved();
      onOpenChange(false);
    } catch {
      setError("No se pudo guardar el lead. Revisa los campos e intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!lead) return;
    if (!window.confirm(`¿Eliminar el lead "${lead.name}"?`)) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/leads?id=${encodeURIComponent(lead.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      onDeleted();
      onOpenChange(false);
    } catch {
      setError("No se pudo eliminar el lead.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto border-assets bg-surface text-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium uppercase tracking-tight">
            {lead ? "Editar Lead" : "Nuevo Lead"}
          </DialogTitle>
          <DialogDescription className="text-paragraph">
            Datos de contacto, presupuesto estimado y estado dentro del pipeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="lead-name">Nombre del prospecto</Label>
            <Input
              id="lead-name"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Juan Pérez"
              className="border-assets bg-surface text-foreground"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="lead-company">Empresa / Proyecto</Label>
              <Input
                id="lead-company"
                value={form.company}
                onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                placeholder="Web Corporativa"
                className="border-assets bg-surface text-foreground"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lead-budget">Presupuesto estimado (USD)</Label>
              <Input
                id="lead-budget"
                type="number"
                min={0}
                value={form.budgetEstimate}
                onChange={(event) => setForm((current) => ({ ...current, budgetEstimate: event.target.value }))}
                placeholder="1500"
                className="border-assets bg-surface text-foreground"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="juan@empresa.com"
                className="border-assets bg-surface text-foreground"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lead-whatsapp">WhatsApp</Label>
              <Input
                id="lead-whatsapp"
                value={form.whatsapp}
                onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))}
                placeholder="+54 9 11 ..."
                className="border-assets bg-surface text-foreground"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lead-source">Origen</Label>
              <Input
                id="lead-source"
                list="lead-source-presets"
                value={form.source}
                onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
                placeholder="Web Inbound"
                className="border-assets bg-surface text-foreground"
              />
              <datalist id="lead-source-presets">
                {SOURCE_PRESETS.map((preset) => (
                  <option key={preset} value={preset} />
                ))}
              </datalist>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lead-industry">Rubro / Industria</Label>
              <Input
                id="lead-industry"
                value={form.industry}
                onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}
                placeholder="Inmobiliaria, Retail, SaaS..."
                className="border-assets bg-surface text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lead-status">Estado del pipeline</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm((current) => ({ ...current, status: value as LeadStatus }))}
            >
              <SelectTrigger id="lead-status" className="border-assets bg-surface text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-assets bg-surface text-foreground">
                {STATUS_COLUMNS.map((column) => (
                  <SelectItem key={column.status} value={column.status}>
                    {column.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lead-notes">Notas internas</Label>
            <Textarea
              id="lead-notes"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Contexto de la conversación, próximos pasos..."
              className="min-h-28 border-assets bg-surface text-foreground"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="flex-row items-center justify-between sm:justify-between">
            {lead ? (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Eliminar
              </button>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-orange px-5 text-sm font-medium text-foreground cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Guardando" : lead ? "Guardar cambios" : "Crear lead"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

