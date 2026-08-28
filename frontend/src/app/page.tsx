"use client";

import { FormEvent, useEffect, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

type Status = "needs_review" | "ready_for_quote";
type Issue = { code: string; field: string; message: string; severity: "error" | "warning" };
type Request = {
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

type EditableField = "customer_name" | "origin" | "destination" | "cargo_type" | "weight_kg" | "volume_m3" | "pallet_count" | "vehicle_type" | "required_date" | "notes";
const fields: { key: EditableField; label: string; type?: string }[] = [
  { key: "customer_name", label: "Cliente" }, { key: "origin", label: "Origen" },
  { key: "destination", label: "Destino" }, { key: "required_date", label: "Fecha requerida", type: "date" },
  { key: "cargo_type", label: "Mercancia" }, { key: "vehicle_type", label: "Vehiculo" },
  { key: "weight_kg", label: "Peso (kg)", type: "number" }, { key: "volume_m3", label: "Volumen (m3)", type: "number" },
  { key: "pallet_count", label: "Palets", type: "number" }, { key: "notes", label: "Observaciones" },
];

function labelFor(field: string) {
  return fields.find((item) => item.key === field)?.label ?? field;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
}

export default function Home() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selected, setSelected] = useState<Request | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Record<EditableField, string>>({} as Record<EditableField, string>);
  const [changedFields, setChangedFields] = useState<EditableField[]>([]);

  async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${apiUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.detail ?? "No se pudo completar la operacion.");
    }
    return response.json();
  }

  async function loadRequests() {
    setLoading(true);
    try {
      const suffix = filter === "all" ? "" : `?status=${filter}`;
      setRequests(await requestJson<Request[]>(`/requests${suffix}`));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar la bandeja.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadFilteredRequests() {
      try {
        const suffix = filter === "all" ? "" : `?status=${filter}`;
        const response = await fetch(`${apiUrl}/requests${suffix}`);
        if (!response.ok) throw new Error("No se pudo cargar la bandeja.");
        const items = await response.json() as Request[];
        if (!cancelled) setRequests(items);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "No se pudo cargar la bandeja.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFilteredRequests();
    return () => { cancelled = true; };
  }, [filter]);

  function selectRequest(item: Request) {
    setSelected(item);
    setError("");
    setChangedFields([]);
    setDraft(Object.fromEntries(fields.map(({ key }) => [key, item[key] == null ? "" : String(item[key])])) as Record<EditableField, string>);
  }

  async function processText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sourceText.trim()) return;
    setProcessing(true); setError("");
    try {
      const created = await requestJson<Request>("/requests/process", { method: "POST", body: JSON.stringify({ source_text: sourceText }) });
      setSourceText(""); selectRequest(created); await loadRequests();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo procesar la solicitud.");
    } finally { setProcessing(false); }
  }

  async function saveCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !changedFields.length) return;
    setSaving(true); setError("");
    const payload = Object.fromEntries(changedFields.map((field) => {
      const value = draft[field].trim();
      return [field, value === "" ? null : fields.find((item) => item.key === field)?.type === "number" ? Number(value) : value];
    }));
    try {
      const updated = await requestJson<Request>(`/requests/${selected.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      selectRequest(updated); await loadRequests();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudieron guardar las correcciones.");
    } finally { setSaving(false); }
  }

  return (
    <main className="shell">
      <header className="masthead"><div><p className="eyebrow">OPERACIONES / CONTROL DE ENTRADA</p><h1>Freight Pilot</h1></div><p>La IA extrae. Las reglas validan.<br />La persona decide.</p></header>
      {error && <p className="notice error" role="alert">{error}</p>}
      <section className="intake panel"><div><p className="eyebrow">NUEVA SOLICITUD</p><h2>Pega el mensaje tal como llego</h2></div><form onSubmit={processText}><textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Ej. Necesitamos recoger 8 palets en Madrid..." rows={5} /><button disabled={processing}>{processing ? "Procesando..." : "Extraer y validar"}</button></form></section>
      <section className="workspace">
        <aside className="inbox panel"><div className="section-title"><div><p className="eyebrow">BANDEJA</p><h2>Solicitudes</h2></div><select aria-label="Filtrar solicitudes" value={filter} onChange={(event) => setFilter(event.target.value as "all" | Status)}><option value="all">Todas</option><option value="needs_review">Para revisar</option><option value="ready_for_quote">Listas</option></select></div>
          <div className="request-list">{loading ? <p className="muted">Cargando...</p> : requests.length ? requests.map((item) => <button className={`request-row ${selected?.id === item.id ? "active" : ""}`} onClick={() => selectRequest(item)} key={item.id}><span className={`status ${item.status}`}>{item.status === "needs_review" ? "Revisar" : "Lista"}</span><strong>{item.customer_name ?? "Cliente sin identificar"}</strong><span>{item.origin ?? "?"} <b>→</b> {item.destination ?? "?"}</span><small>{formatDate(item.created_at)}</small></button>) : <p className="muted">No hay solicitudes con este filtro.</p>}</div>
        </aside>
        <section className="detail panel">{selected ? <><div className="detail-head"><div><p className="eyebrow">SOLICITUD #{selected.id}</p><h2>{selected.customer_name ?? "Pendiente de identificar"}</h2></div><span className={`status large ${selected.status}`}>{selected.status === "needs_review" ? "Necesita revision" : "Lista para cotizar"}</span></div>
          <div className="trace"><article><h3>Texto original</h3><p>{selected.source_text}</p></article><article><h3>Control de calidad</h3>{selected.validation_issues.length ? <ul>{selected.validation_issues.map((issue) => <li key={`${issue.code}-${issue.field}`}><strong>{labelFor(issue.field)}:</strong> {issue.message}</li>)}</ul> : <p className="clear">Sin incidencias bloqueantes.</p>}{selected.uncertain_fields.length > 0 && <p className="uncertain">IA con duda en: {selected.uncertain_fields.map(labelFor).join(", ")}</p>}</article></div>
          <form className="correction-form" onSubmit={saveCorrection}><div className="section-title"><div><p className="eyebrow">DATOS ESTRUCTURADOS</p><h3>Revision del operador</h3></div>{changedFields.length > 0 && <span className="muted">{changedFields.length} cambio(s) pendiente(s)</span>}</div><div className="field-grid">{fields.map(({ key, label, type }) => <label className={selected.uncertain_fields.includes(key) ? "uncertain-field" : ""} key={key}>{label}<input type={type ?? "text"} step={type === "number" ? "any" : undefined} value={draft[key] ?? ""} onChange={(event) => { setDraft({ ...draft, [key]: event.target.value }); setChangedFields((current) => current.includes(key) ? current : [...current, key]); }} /></label>)}</div><button disabled={saving || !changedFields.length}>{saving ? "Revalidando..." : "Guardar y revalidar"}</button></form>
          <details><summary>Trazabilidad tecnica</summary><pre>{JSON.stringify({ extraction: selected.extraction_snapshot, corrections: selected.corrections_snapshot }, null, 2)}</pre></details>
        </> : <div className="empty-detail"><p className="eyebrow">SIN SELECCION</p><h2>Selecciona una solicitud</h2><p>La extraccion, las reglas aplicadas y las correcciones quedaran visibles aqui.</p></div>}</section>
      </section>
    </main>
  );
}
