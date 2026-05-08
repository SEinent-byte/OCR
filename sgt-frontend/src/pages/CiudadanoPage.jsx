import { useMemo, useState } from "react";
import { FileUp, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";

import { ParallaxCard } from "@/components/ParallaxCard";
import { useSounds } from "@/sounds/useSounds";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function priorityClass(priority) {
  if (priority === "ALTA") return "text-priority-alta border-priority-alta/40 bg-priority-alta/10";
  if (priority === "MEDIA") return "text-priority-media border-priority-media/40 bg-priority-media/10";
  return "text-priority-baja border-priority-baja/40 bg-priority-baja/10";
}

export function CiudadanoPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const { playClick, playHover, playSuccess, playWarning, playError } = useSounds();

  const isImage = useMemo(() => file?.type?.startsWith("image/"), [file]);

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setError("");
    setResult(null);
    if (selectedFile.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl("");
    }
  };

  const analyzeDocument = async () => {
    if (!file) {
      setError("Debes seleccionar un archivo.");
      playError();
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    playClick();
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: formData });
      if (!uploadResponse.ok) {
        const body = await uploadResponse.json().catch(() => ({}));
        throw new Error(body.detail || "No se pudo extraer texto.");
      }
      const uploadData = await uploadResponse.json();

      const predictResponse = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: uploadData.texto_extraido ?? "" }),
      });
      if (!predictResponse.ok) {
        const body = await predictResponse.json().catch(() => ({}));
        throw new Error(body.detail || "No se pudo clasificar el documento.");
      }
      const predictData = await predictResponse.json();
      setResult({ upload: uploadData, predict: predictData });
      if ((predictData?.clasificacion?.prioridad ?? "").toUpperCase() === "ALTA") {
        playWarning();
      } else {
        playSuccess();
      }
    } catch (err) {
      setError(err.message || "Error inesperado.");
      playError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen">
      <aside className="hidden w-72 border-r border-border-thin bg-background-card/80 p-6 backdrop-blur md:block">
        <h2 className="text-lg font-semibold text-text-primary">Portal Ciudadano</h2>
        <p className="mt-2 text-sm text-text-secondary">Gestion inteligente de tramites con IA.</p>
      </aside>

      <main className="w-full p-6 md:p-8">
        <ParallaxCard
          className="mb-6 rounded-2xl border border-border-thin bg-background-card p-6 shadow-xl shadow-ai-blue/10 animate-borderGlow"
          onHoverStart={playHover}
        >
          <h1 className="mb-2 text-2xl font-bold text-text-primary">Subir documento</h1>
          <p className="mb-5 text-text-secondary">Carga PDF o imagen para extraer texto y clasificar prioridad.</p>

          <label
            htmlFor="doc"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ai-blue/40 bg-background-surface p-8 text-center transition hover:border-ai-blue hover:bg-background-hover"
          >
            <FileUp className="mb-3 h-8 w-8 text-ai-blue" />
            <span className="font-medium text-text-primary">Arrastra o selecciona un archivo</span>
            <span className="mt-1 text-sm text-text-secondary">Formatos: PDF, PNG, JPG, JPEG</span>
          </label>
          <input
            id="doc"
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />

          {file && (
            <div className="mt-4 rounded-lg border border-border-thin bg-background-surface p-4">
              <p className="text-sm text-text-secondary">Archivo: {file.name}</p>
              {isImage && previewUrl && (
                <img src={previewUrl} alt="Vista previa" className="mt-3 max-h-60 rounded-lg border border-border-thin" />
              )}
            </div>
          )}

          <button
            type="button"
            onClick={analyzeDocument}
            disabled={loading}
            className="mt-5 inline-flex items-center rounded-lg bg-ai-blue px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-ai-glow disabled:opacity-60"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {loading ? "Analizando..." : "Analizar documento"}
          </button>

          {error && (
            <div className="mt-4 flex items-center rounded-lg border border-priority-alta/40 bg-priority-alta/10 px-4 py-3 text-priority-alta">
              <AlertTriangle className="mr-2 h-4 w-4" />
              {error}
            </div>
          )}
        </ParallaxCard>

        {result && (
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ParallaxCard
              className="rounded-2xl border border-border-thin bg-background-card p-5 animate-borderGlow"
              onHoverStart={playHover}
            >
              <h3 className="mb-3 text-lg font-semibold text-text-primary">Entidades encontradas</h3>
              {["personas", "lugares", "organizaciones", "otros"].map((key) => (
                <p className="mb-2 text-sm text-text-secondary" key={key}>
                  <span className="font-semibold capitalize text-text-primary">{key}:</span>{" "}
                  {(result.predict.entidades?.[key] ?? []).join(", ") || "Sin datos"}
                </p>
              ))}
            </ParallaxCard>

            <ParallaxCard
              className="rounded-2xl border border-border-thin bg-background-card p-5 animate-borderGlow"
              onHoverStart={playHover}
            >
              <h3 className="mb-3 text-lg font-semibold text-text-primary">Clasificacion de tramite</h3>
              <div className="mb-2 text-sm text-text-secondary">
                Tipo: <span className="font-mono text-text-mono">{result.predict.clasificacion?.tipo}</span>
              </div>
              <div className="mb-3 text-sm text-text-secondary">
                Confianza: {(result.predict.clasificacion?.confianza ?? 0).toFixed(4)}
              </div>
              <div
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${priorityClass(
                  result.predict.clasificacion?.prioridad
                )}`}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Prioridad: {result.predict.clasificacion?.prioridad}
              </div>
            </ParallaxCard>
          </section>
        )}
      </main>
    </div>
  );
}
