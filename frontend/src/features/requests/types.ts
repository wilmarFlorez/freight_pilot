export type Status = "needs_review" | "ready_for_quote";

export type Issue = {
  code: string;
  field: string;
  message: string;
  severity: "error" | "warning";
};

export type TransportRequest = {
  id: number;
  source_text: string;
  status: Status;
  customer_name: string | null;
  origin: string | null;
  destination: string | null;
  cargo_type: string | null;
  weight_kg: number | null;
  volume_m3: number | null;
  pallet_count: number | null;
  vehicle_type: string | null;
  required_date: string | null;
  notes: string | null;
  uncertain_fields: string[];
  validation_issues: Issue[];
  extraction_snapshot: unknown;
  corrections_snapshot: unknown;
  created_at: string;
};

export type EditableField = "customer_name" | "origin" | "destination" | "cargo_type" | "weight_kg" | "volume_m3" | "pallet_count" | "vehicle_type" | "required_date" | "notes";

export const requestFields: { key: EditableField; label: string; type?: "date" | "number" }[] = [
  { key: "customer_name", label: "Cliente" },
  { key: "origin", label: "Origen" },
  { key: "destination", label: "Destino" },
  { key: "required_date", label: "Fecha requerida", type: "date" },
  { key: "cargo_type", label: "Mercancia" },
  { key: "vehicle_type", label: "Vehiculo" },
  { key: "weight_kg", label: "Peso (kg)", type: "number" },
  { key: "volume_m3", label: "Volumen (m3)", type: "number" },
  { key: "pallet_count", label: "Plataformas de carga (palets)", type: "number" },
  { key: "notes", label: "Observaciones" },
];

export function fieldLabel(field: string) {
  return requestFields.find((item) => item.key === field)?.label ?? field;
}
