type Props = { locale: "es" | "en"; onLocaleChange: (locale: "es" | "en") => void };

export function AppHeader({ locale, onLocaleChange }: Props) {
  return <header className="masthead"><div><p className="eyebrow">OPERACIONES / CONTROL DE ENTRADA</p><h1>Freight Pilot</h1></div><div className="masthead-tools"><p>La IA extrae. Las reglas validan.<br />La persona decide.</p><label className="language-switch"><span>Idioma</span><select value={locale} onChange={(event) => onLocaleChange(event.target.value as "es" | "en")} aria-label="Idioma"><option value="es">ES</option><option value="en">EN</option></select></label></div></header>;
}
