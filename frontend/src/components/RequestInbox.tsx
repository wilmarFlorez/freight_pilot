import { Inbox } from "lucide-react";
import { Status, TransportRequest } from "../features/requests/types";

type Props = { filter: "all" | Status; loading: boolean; requests: TransportRequest[]; selectedId?: number; onFilterChange: (filter: "all" | Status) => void; onSelect: (request: TransportRequest) => void };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
}

export function RequestInbox({ filter, loading, requests, selectedId, onFilterChange, onSelect }: Props) {
  return <aside className="inbox panel"><div className="section-title"><h2 className="title-with-icon"><Inbox aria-hidden="true" />Solicitudes</h2><select aria-label="Filtrar solicitudes" value={filter} onChange={(event) => onFilterChange(event.target.value as "all" | Status)}><option value="all">Todas</option><option value="needs_review">Para revisar</option><option value="ready_for_quote">Listas</option></select></div><div className="request-list">{loading ? <p className="muted">Cargando...</p> : requests.length ? requests.map((item) => <button className={`request-row ${selectedId === item.id ? "active" : ""}`} onClick={() => onSelect(item)} key={item.id}><span className={`status ${item.status}`}>{item.status === "needs_review" ? "Revisar" : "Lista"}</span><strong>{item.customer_name ?? "Cliente sin identificar"}</strong><span>{item.origin ?? "?"} <b>→</b> {item.destination ?? "?"}</span><small>{formatDate(item.created_at)}</small></button>) : <p className="muted">No hay solicitudes con este filtro.</p>}</div></aside>;
}
