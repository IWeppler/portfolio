export const LEAD_STATUSES = [
  "nuevo",
  "contactado",
  "propuesta_enviada",
  "ganado",
  "perdido",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LeadRecord = {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  budget_estimate?: number | null;
  source: string;
  industry?: string | null;
  status: LeadStatus;
  notes?: string | null;
  last_contact_at: string;
  created_at: string;
};

export const STATUS_COLUMNS: { status: LeadStatus; label: string }[] = [
  { status: "nuevo", label: "Nuevos" },
  { status: "contactado", label: "Contactados" },
  { status: "propuesta_enviada", label: "Propuesta Enviada" },
  { status: "ganado", label: "Ganados" },
  { status: "perdido", label: "Perdidos" },
];

export const SOURCE_PRESETS = [
  "Web Inbound",
  "LinkedIn",
  "Upwork",
  "Referido",
  "Otro",
];

export const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function daysSince(dateIso: string) {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}
