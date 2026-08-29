"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Bot, Check, ClipboardList, ClipboardPaste, Copy, FileText, Inbox, Mail, MessageCircle, ScanText, Sheet, ShieldCheck } from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const exampleMessage = "Hola, necesitamos mover 8 plataformas de carga (palets) de bebidas desde Bogota hasta Medellin el 15 de septiembre. La recogida puede ser por la manana. Gracias.";
const englishText: Record<string, string> = {
  "OPERACIONES / CONTROL DE ENTRADA": "OPERATIONS / INTAKE CONTROL", "La IA extrae. Las reglas validan.": "AI extracts. Rules validate.", "La persona decide.": "People decide.", "QUE RESUELVE ESTA DEMO": "WHAT THIS DEMO SOLVES", "Convierte mensajes confusos en una solicitud de transporte lista para trabajar.": "Turns unclear messages into a transport request ready to work on.", "Cuando una empresa recibe un email o WhatsApp para mover mercancia, los datos importantes suelen llegar mezclados, incompletos o con ambiguedades. Freight Pilot lee ese mensaje, organiza la informacion y avisa de lo que una persona debe confirmar antes de pedir una cotizacion.": "When a company receives an email or WhatsApp message to move freight, important details often arrive mixed together, incomplete, or ambiguous. Freight Pilot organizes the information and flags what a person must confirm before requesting a quote.", "ASI FUNCIONA": "HOW IT WORKS", "Pega un mensaje": "Paste a message", " tal como lo enviaria un cliente.": " just as a customer would send it.", "La IA ordena los datos:": "AI organizes the details:", " origen, destino, fecha y carga.": " origin, destination, date, and freight.", "El sistema detecta huecos": "The system spots gaps", " para que nadie cotice con informacion insegura.": " so nobody quotes from unreliable information.", "NUEVA SOLICITUD": "NEW REQUEST", "Pega el mensaje tal como llego": "Paste the message as it arrived", "Puedes partir de este caso de uso, copiarlo o escribir el mensaje de un cliente.": "Start from this use case, copy it, or write a customer message.", "Ejemplo de caso de uso": "Use case example", "Copiar ejemplo": "Copy example", "Copiado": "Copied", "Extraer y validar": "Extract and validate", "Procesando...": "Processing...", "BANDEJA": "INBOX", "Solicitudes": "Requests", "Todas": "All", "Para revisar": "Needs review", "Listas": "Ready", "Cargando...": "Loading...", "No hay solicitudes con este filtro.": "There are no requests for this filter.", "Revisar": "Review", "Lista": "Ready", "Cliente sin identificar": "Unidentified customer", "Pendiente de identificar": "Pending identification", "Necesita revision": "Needs review", "Lista para cotizar": "Ready for quote", "Texto original": "Original text", "Control de calidad": "Quality control", "Sin incidencias bloqueantes.": "No blocking issues.", "IA con duda en:": "AI is uncertain about:", "DATOS ESTRUCTURADOS": "STRUCTURED DATA", "Revision del operador": "Operator review", "cambio(s) pendiente(s)": "pending change(s)", "Revalidando...": "Revalidating...", "Guardar y revalidar": "Save and revalidate", "Trazabilidad tecnica": "Technical traceability", "SIN SELECCION": "NO SELECTION", "Selecciona una solicitud": "Select a request", "La extraccion, las reglas aplicadas y las correcciones quedaran visibles aqui.": "The extraction, applied rules, and corrections will be visible here.", "POSIBLES FLUJOS A RESOLVER": "POSSIBLE FLOWS TO SOLVE", "De una solicitud dispersa a una accion en el sistema correcto.": "From a scattered request to an action in the right system.", "Freight Pilot puede ser la capa intermedia que recibe datos desde los canales que ya usa la operacion, los estructura y los entrega al proceso que sigue.": "Freight Pilot can be the middle layer that receives data from channels already used by operations, structures it, and hands it to the next process.", "Solicitud por WhatsApp, oportunidad en CRM": "WhatsApp request, CRM opportunity", "Correo de cotizaciones, solicitud en TMS": "Quotation email, TMS request", "Planilla comercial, orden preliminar en ERP": "Sales spreadsheet, preliminary ERP order", "ENTRADA": "INPUT", "EXTRAE Y VALIDA": "EXTRACTS AND VALIDATES", "DESTINO": "DESTINATION", "Mensaje de un cliente": "Customer message", "Ruta, carga y fecha": "Route, freight, and date", "Oportunidad asignada": "Assigned opportunity", "Buzon de cotizaciones": "Quotation inbox", "Datos verificables": "Verifiable details", "Solicitud para cotizar": "Request to quote", "Consolidado diario": "Daily consolidation", "Campos normalizados": "Normalized fields", "Orden preliminar": "Preliminary order", "Cliente": "Customer", "Origen": "Origin", "Destino": "Destination", "Fecha requerida": "Required date", "Mercancia": "Freight", "Vehiculo": "Vehicle", "Peso (kg)": "Weight (kg)", "Volumen (m3)": "Volume (m3)", "Plataformas de carga (palets)": "Pallets", "Observaciones": "Notes",
};

Object.assign(englishText, {
  "Idioma": "Language", "Hola, necesitamos mover 8 plataformas de carga (palets) de bebidas desde Bogota hasta Medellin el 15 de septiembre. La recogida puede ser por la manana. Gracias.": "Hello, we need to move 8 pallets of beverages from Bogota to Medellin on September 15. Collection can be in the morning. Thank you.", "Ej. Necesitamos recoger 8 plataformas de carga en Bogota...": "E.g. We need to collect 8 pallets in Bogota...", "Copiar mensaje de ejemplo": "Copy example message", "Filtrar solicitudes": "Filter requests",
  "Una empresa distribuidora recibe por WhatsApp una solicitud de recogida en Funza para Barranquilla. El mensaje se convierte en una oportunidad completa para que ventas cotice y haga seguimiento.": "A distribution company receives a WhatsApp collection request from Funza to Barranquilla. The message becomes a complete opportunity for sales to quote and follow up on.", "Un cliente corporativo envia varios requerimientos al correo compartido. Cada email se clasifica y solo los que tienen información suficiente llegan al equipo de tráfico como una solicitud lista.": "A corporate customer sends several requirements to a shared inbox. Each email is classified, and only those with enough information reach the traffic team as ready requests.", "El área comercial consolida pedidos en una hoja de cálculo. El flujo revisa cada nueva fila, marca los datos faltantes y entrega al equipo operativo las órdenes que ya pueden continuar.": "The sales team consolidates orders in a spreadsheet. The flow reviews each new row, flags missing details, and hands operations the orders that can move forward.",
});

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
  { key: "pallet_count", label: "Plataformas de carga (palets)", type: "number" }, { key: "notes", label: "Observaciones" },
];

function labelFor(field: string) {
  return fields.find((item) => item.key === field)?.label ?? field;
}

function formatDate(value: string, locale: "es" | "en" = "es") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-ES", { dateStyle: "medium" }).format(new Date(value));
}

export default function Home() {
  const [locale, setLocale] = useState<"es" | "en">(() => typeof window !== "undefined" && window.localStorage.getItem("freight-pilot-locale") === "en" ? "en" : "es");
  const [requests, setRequests] = useState<Request[]>([]);
  const [selected, setSelected] = useState<Request | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Record<EditableField, string>>({} as Record<EditableField, string>);
  const [changedFields, setChangedFields] = useState<EditableField[]>([]);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("freight-pilot-locale", locale);
    const translatedText = locale === "en" ? englishText : Object.fromEntries(Object.entries(englishText).map(([source, target]) => [target, source]));

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    nodes.forEach((node) => { if (translatedText[node.nodeValue ?? ""]) node.nodeValue = translatedText[node.nodeValue ?? ""]; });
    document.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title]").forEach((element) => {
      ["placeholder", "aria-label", "title"].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (value && translatedText[value]) element.setAttribute(attribute, translatedText[value]);
      });
    });
  });

  useEffect(() => {
    if (!copiedExample) return;

    const timeoutId = window.setTimeout(() => setCopiedExample(false), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [copiedExample]);

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

  async function copyExample() {
    try {
      await navigator.clipboard.writeText(exampleMessage);
      setCopiedExample(true);
    } catch {
      setError("No se pudo copiar el ejemplo.");
    }
  }

  const copyExampleLabel = copiedExample
    ? locale === "en" ? "Copied" : "Copiado"
    : locale === "en" ? "Copy example" : "Copiar ejemplo";

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
      <header className="masthead"><div><p className="eyebrow">OPERACIONES / CONTROL DE ENTRADA</p><h1>Freight Pilot</h1></div><div className="masthead-tools"><p>La IA extrae. Las reglas validan.<br />La persona decide.</p><label className="language-switch"><span>Language</span><select value={locale} onChange={(event) => setLocale(event.target.value as "es" | "en")} aria-label="Language"><option value="es">ES</option><option value="en">EN</option></select></label></div></header>
      {error && <p className="notice error" role="alert">{error}</p>}
      <section className="intro panel" aria-labelledby="intro-title">
        <div className="intro-copy"><p className="eyebrow">QUE RESUELVE ESTA DEMO</p><h2 id="intro-title">Convierte mensajes confusos en una solicitud de transporte lista para trabajar.</h2><p>Cuando una empresa recibe un email o WhatsApp para mover mercancia, los datos importantes suelen llegar mezclados, incompletos o con ambiguedades. Freight Pilot lee ese mensaje, organiza la informacion y avisa de lo que una persona debe confirmar antes de pedir una cotizacion.</p></div>
        <div className="how-it-works"><p className="eyebrow">ASI FUNCIONA</p><ol><li><span>01</span><p><ClipboardPaste aria-hidden="true" /><strong>Pega un mensaje</strong> tal como lo enviaria un cliente.</p></li><li><span>02</span><p><ScanText aria-hidden="true" /><strong>La IA ordena los datos:</strong> origen, destino, fecha y carga.</p></li><li><span>03</span><p><ShieldCheck aria-hidden="true" /><strong>El sistema detecta huecos</strong> para que nadie cotice con informacion insegura.</p></li></ol></div>
      </section>
      <section className="intake panel" id="intake"><div className="intake-copy"><p className="eyebrow">NUEVA SOLICITUD</p><h2>Pega el mensaje tal como llego</h2><p className="intake-help">Puedes partir de este caso de uso, copiarlo o escribir el mensaje de un cliente.</p></div><blockquote className="example-message"><p><strong>Ejemplo de caso de uso</strong></p><p><em>{exampleMessage}</em></p><button className={copiedExample ? "copied" : ""} type="button" onClick={() => void copyExample()} aria-label={copyExampleLabel} title={copyExampleLabel}><span className="copy-icon" aria-hidden="true">{copiedExample ? <Check /> : <Copy />}</span><span className="copy-label">{copyExampleLabel}</span></button><span className="sr-only" role="status" aria-live="polite">{copiedExample ? copyExampleLabel : ""}</span></blockquote><form onSubmit={processText}><textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Ej. Necesitamos recoger 8 plataformas de carga en Bogota..." rows={5} /><button disabled={processing}>{processing ? "Procesando..." : "Extraer y validar"}</button></form></section>
      <section className="workspace">
        <aside className="inbox panel"><div className="section-title"><div><p className="eyebrow">BANDEJA</p><h2 className="title-with-icon"><Inbox aria-hidden="true" />Solicitudes</h2></div><select aria-label="Filtrar solicitudes" value={filter} onChange={(event) => setFilter(event.target.value as "all" | Status)}><option value="all">Todas</option><option value="needs_review">Para revisar</option><option value="ready_for_quote">Listas</option></select></div>
          <div className="request-list">{loading ? <p className="muted">Cargando...</p> : requests.length ? requests.map((item) => <button className={`request-row ${selected?.id === item.id ? "active" : ""}`} onClick={() => selectRequest(item)} key={item.id}><span className={`status ${item.status}`}>{item.status === "needs_review" ? "Revisar" : "Lista"}</span><strong>{item.customer_name ?? "Cliente sin identificar"}</strong><span>{item.origin ?? "?"} <b>→</b> {item.destination ?? "?"}</span><small>{formatDate(item.created_at)}</small></button>) : <p className="muted">No hay solicitudes con este filtro.</p>}</div>
        </aside>
        <section className="detail panel">{selected ? <><div className="detail-head"><div><p className="eyebrow">SOLICITUD #{selected.id}</p><h2>{selected.customer_name ?? "Pendiente de identificar"}</h2></div><span className={`status large ${selected.status}`}>{selected.status === "needs_review" ? "Necesita revision" : "Lista para cotizar"}</span></div>
          <div className="trace"><article><h3 className="title-with-icon"><FileText aria-hidden="true" />Texto original</h3><p>{selected.source_text}</p></article><article><h3 className="title-with-icon"><ShieldCheck aria-hidden="true" />Control de calidad</h3>{selected.validation_issues.length ? <ul>{selected.validation_issues.map((issue) => <li key={`${issue.code}-${issue.field}`}><strong>{labelFor(issue.field)}:</strong> {issue.message}</li>)}</ul> : <p className="clear">Sin incidencias bloqueantes.</p>}{selected.uncertain_fields.length > 0 && <p className="uncertain">IA con duda en: {selected.uncertain_fields.map(labelFor).join(", ")}</p>}</article></div>
          <form className="correction-form" onSubmit={saveCorrection}><div className="section-title"><div><p className="eyebrow">DATOS ESTRUCTURADOS</p><h3>Revision del operador</h3></div>{changedFields.length > 0 && <span className="muted">{changedFields.length} cambio(s) pendiente(s)</span>}</div><div className="field-grid">{fields.map(({ key, label, type }) => <label className={selected.uncertain_fields.includes(key) ? "uncertain-field" : ""} key={key}>{label}<input type={type ?? "text"} step={type === "number" ? "any" : undefined} value={draft[key] ?? ""} onChange={(event) => { setDraft({ ...draft, [key]: event.target.value }); setChangedFields((current) => current.includes(key) ? current : [...current, key]); }} /></label>)}</div><button disabled={saving || !changedFields.length}>{saving ? "Revalidando..." : "Guardar y revalidar"}</button></form>
          <details><summary>Trazabilidad tecnica</summary><pre>{JSON.stringify({ extraction: selected.extraction_snapshot, corrections: selected.corrections_snapshot }, null, 2)}</pre></details>
        </> : <div className="empty-detail"><ClipboardList aria-hidden="true" /><p className="eyebrow">SIN SELECCION</p><h2>Selecciona una solicitud</h2><p>La extraccion, las reglas aplicadas y las correcciones quedaran visibles aqui.</p></div>}</section>
      </section>
      <section className="integrations panel" aria-labelledby="integrations-title">
        <div className="integrations-heading"><p className="eyebrow">POSIBLES FLUJOS A RESOLVER</p><h2 id="integrations-title">De una solicitud dispersa a una accion en el sistema correcto.</h2><p>Freight Pilot puede ser la capa intermedia que recibe datos desde los canales que ya usa la operacion, los estructura y los entrega al proceso que sigue.</p></div>
        <ol className="integration-list">
          <li><span className="integration-number">01</span><div><h3>Solicitud por WhatsApp, oportunidad en CRM</h3><div className="flow" aria-label="WhatsApp Business pasa por Freight Pilot y crea una oportunidad en HubSpot"><div className="flow-node source"><MessageCircle aria-hidden="true" /><small>ENTRADA</small><strong>WhatsApp Business</strong><span>Mensaje de un cliente</span></div><span className="flow-arrow" aria-hidden="true"><ArrowRight /></span><div className="flow-node engine"><Bot aria-hidden="true" /><small>EXTRAE Y VALIDA</small><strong>Freight Pilot</strong><span>Ruta, carga y fecha</span></div><span className="flow-arrow" aria-hidden="true"><ArrowRight /></span><div className="flow-node destination"><ClipboardList aria-hidden="true" /><small>DESTINO</small><strong>HubSpot CRM</strong><span>Oportunidad asignada</span></div></div><p>Una empresa distribuidora recibe por WhatsApp una solicitud de recogida en Funza para Barranquilla. El mensaje se convierte en una oportunidad completa para que ventas cotice y haga seguimiento.</p></div></li>
          <li><span className="integration-number">02</span><div><h3>Correo de cotizaciones, solicitud en TMS</h3><div className="flow" aria-label="Gmail o Microsoft 365 pasa por Freight Pilot y crea una solicitud de cotizacion en un TMS"><div className="flow-node source"><Mail aria-hidden="true" /><small>ENTRADA</small><strong>Gmail / Outlook</strong><span>Buzon de cotizaciones</span></div><span className="flow-arrow" aria-hidden="true"><ArrowRight /></span><div className="flow-node engine"><Bot aria-hidden="true" /><small>EXTRAE Y VALIDA</small><strong>Freight Pilot</strong><span>Datos verificables</span></div><span className="flow-arrow" aria-hidden="true"><ArrowRight /></span><div className="flow-node destination"><ClipboardList aria-hidden="true" /><small>DESTINO</small><strong>TMS</strong><span>Solicitud para cotizar</span></div></div><p>Un cliente corporativo envia varios requerimientos al correo compartido. Cada email se clasifica y solo los que tienen información suficiente llegan al equipo de tráfico como una solicitud lista.</p></div></li>
          <li><span className="integration-number">03</span><div><h3>Planilla comercial, orden preliminar en ERP</h3><div className="flow" aria-label="Excel o Google Sheets pasa por Freight Pilot y crea una orden preliminar en un ERP"><div className="flow-node source"><Sheet aria-hidden="true" /><small>ENTRADA</small><strong>Excel / Sheets</strong><span>Consolidado diario</span></div><span className="flow-arrow" aria-hidden="true"><ArrowRight /></span><div className="flow-node engine"><Bot aria-hidden="true" /><small>EXTRAE Y VALIDA</small><strong>Freight Pilot</strong><span>Campos normalizados</span></div><span className="flow-arrow" aria-hidden="true"><ArrowRight /></span><div className="flow-node destination"><ClipboardList aria-hidden="true" /><small>DESTINO</small><strong>ERP / Operaciones</strong><span>Orden preliminar</span></div></div><p>El área comercial consolida pedidos en una hoja de cálculo. El flujo revisa cada nueva fila, marca los datos faltantes y entrega al equipo operativo las órdenes que ya pueden continuar.</p></div></li>
        </ol>
      </section>
    </main>
  );
}
