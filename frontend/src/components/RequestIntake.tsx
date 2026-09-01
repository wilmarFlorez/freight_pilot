import { Check, Copy } from "lucide-react";
import { FormEvent } from "react";

const exampleMessage = "Hola, necesitamos mover 8 plataformas de carga (palets) de bebidas desde Bogota hasta Medellin el 15 de septiembre. La recogida puede ser por la manana. Gracias.";

type Props = { sourceText: string; processing: boolean; copied: boolean; onSourceTextChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCopy: () => void };

export function RequestIntake({ sourceText, processing, copied, onSourceTextChange, onSubmit, onCopy }: Props) {
  const copyLabel = copied ? "Copiado" : "Copiar ejemplo";
  return <section className="intake panel" id="intake"><div className="intake-copy"><p className="eyebrow">NUEVA SOLICITUD</p><h2>Pega el mensaje tal como llegó</h2><p className="intake-help">Puedes partir de este caso de uso, copiarlo o escribir el mensaje de un cliente.</p></div><blockquote className="example-message"><p><strong>Ejemplo de caso de uso</strong></p><p><em>{exampleMessage}</em></p><button className={copied ? "copied" : ""} type="button" onClick={onCopy} aria-label={copyLabel} title={copyLabel}><span className="copy-icon" aria-hidden="true">{copied ? <Check /> : <Copy />}</span><span className="copy-label">{copyLabel}</span></button><span className="sr-only" role="status" aria-live="polite">{copied ? copyLabel : ""}</span></blockquote><form onSubmit={onSubmit}><textarea value={sourceText} onChange={(event) => onSourceTextChange(event.target.value)} placeholder="Ej. Necesitamos recoger 8 plataformas de carga en Bogota..." rows={5} /><button disabled={processing}>{processing ? "Procesando..." : "Extraer y validar"}</button></form></section>;
}

export { exampleMessage };
