import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, FileText, Search, ShieldAlert, XCircle } from "lucide-react";

import { ParallaxCard } from "@/components/ParallaxCard";
import { useSounds } from "@/sounds/useSounds";

const seedTramites = [
  { id: "TRM-001", ciudadano: "Luis Huaman", tipo: "Licencia", prioridad: "ALTA", estado: "Pendiente" },
  { id: "TRM-002", ciudadano: "Rosa Quispe", tipo: "Reclamo", prioridad: "MEDIA", estado: "Pendiente" },
  { id: "TRM-003", ciudadano: "Jorge Salas", tipo: "Constancia", prioridad: "BAJA", estado: "Pendiente" },
];

const priorityStyle = {
  ALTA: "text-priority-alta bg-priority-alta/10 border-priority-alta/40",
  MEDIA: "text-priority-media bg-priority-media/10 border-priority-media/40",
  BAJA: "text-priority-baja bg-priority-baja/10 border-priority-baja/40",
};

export function EmpleadoPage() {
  const [tramites, setTramites] = useState(seedTramites);
  const [query, setQuery] = useState("");
  const { playClick, playHover, playSuccess, playWarning, playError } = useSounds();

  const filtered = useMemo(
    () =>
      tramites.filter((t) => {
        const token = `${t.id} ${t.ciudadano} ${t.tipo} ${t.prioridad} ${t.estado}`.toLowerCase();
        return token.includes(query.toLowerCase());
      }),
    [tramites, query]
  );

  const updateStatus = (id, estado, sound) => {
    setTramites((prev) => prev.map((t) => (t.id === id ? { ...t, estado } : t)));
    sound();
  };

  return (
    <div className="relative z-10 flex min-h-screen">
      <aside className="hidden w-72 border-r border-border-thin bg-bg-card/75 p-6 backdrop-blur lg:block">
        <h2 className="text-lg font-semibold text-text-primary">Panel Empleado Municipal</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Supervisa, valida y toma decisiones sobre cada tramite con trazabilidad completa.
        </p>
      </aside>

      <main className="w-full p-6">
        <ParallaxCard className="glass-card mb-6 p-5" onHoverStart={playHover}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Bandeja inteligente</h1>
              <p className="text-sm text-text-secondary">Gestion de tramites clasificados por prioridad IA.</p>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-border-thin bg-bg-card px-3 py-2">
              <Search className="h-4 w-4 text-text-secondary" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar tramite..."
                className="bg-transparent text-sm outline-none placeholder:text-text-secondary"
              />
            </label>
          </div>
        </ParallaxCard>

        <div className="grid grid-cols-1 gap-4">
          {filtered.map((t) => (
            <ParallaxCard key={t.id} className="glass-card p-5" onHoverStart={playHover}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-ai-blue/10 px-2 py-1 font-mono text-xs text-ai-blue">{t.id}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityStyle[t.prioridad]}`}>
                      {t.prioridad}
                    </span>
                    <span className="rounded-full border border-border-thin px-2 py-0.5 text-xs text-text-secondary">
                      {t.estado}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-text-primary">{t.ciudadano}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    <FileText className="mr-1 inline h-4 w-4" />
                    Tipo: {t.tipo}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center rounded-lg border border-priority-baja/40 bg-priority-baja/10 px-3 py-2 text-sm font-semibold text-priority-baja"
                    onClick={() => {
                      playClick();
                      updateStatus(t.id, "Aceptado", playSuccess);
                    }}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Aceptar
                  </button>
                  <button
                    className="inline-flex items-center rounded-lg border border-priority-media/40 bg-priority-media/10 px-3 py-2 text-sm font-semibold text-priority-media"
                    onClick={() => {
                      playClick();
                      updateStatus(t.id, "Observado", playWarning);
                    }}
                  >
                    <ShieldAlert className="mr-1 h-4 w-4" />
                    Observar
                  </button>
                  <button
                    className="inline-flex items-center rounded-lg border border-priority-alta/40 bg-priority-alta/10 px-3 py-2 text-sm font-semibold text-priority-alta"
                    onClick={() => {
                      playClick();
                      updateStatus(t.id, "Rechazado", playError);
                    }}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Rechazar
                  </button>
                  <button
                    className="inline-flex items-center rounded-lg border border-border-thin bg-bg-card px-3 py-2 text-sm font-semibold text-text-secondary"
                    onClick={playClick}
                  >
                    <Clock3 className="mr-1 h-4 w-4" />
                    Posponer
                  </button>
                </div>
              </div>
            </ParallaxCard>
          ))}
        </div>
      </main>
    </div>
  );
}
