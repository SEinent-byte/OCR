import { UserRound, BadgeCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ParallaxCard } from "@/components/ParallaxCard";
import { Lens } from "@/components/magicui/lens";
import { useSounds } from "@/sounds/useSounds";

export function LoginPage() {
  const navigate = useNavigate();
  const { playClick, playHover } = useSounds();

  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6">
      <h1 className="mb-2 text-4xl font-bold text-text-primary">SAGT Municipalidad de Yau</h1>
      <p className="mb-10 text-text-secondary">Selecciona tu perfil para ingresar al sistema.</p>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ParallaxCard
          className="group rounded-2xl border border-border-thin bg-background-card p-1 shadow-2xl shadow-ai-blue/10 animate-borderGlow"
          onHoverStart={playHover}
          onClick={() => {
            playClick();
            navigate("/empleado");
          }}
        >
          <Lens>
            <div className="rounded-2xl bg-background-surface p-8 transition-colors group-hover:bg-background-hover">
              <div className="mb-4 inline-flex rounded-xl bg-ai-blue/10 p-3">
                <UserRound className="h-7 w-7 text-ai-blue" />
              </div>
              <h2 className="text-2xl font-semibold text-text-primary">Ciudadano</h2>
              <p className="mt-2 text-text-secondary">
                Sube documentos, analiza tramite y revisa prioridad automatica.
              </p>
            </div>
          </Lens>
        </ParallaxCard>

        <ParallaxCard
          className="group rounded-2xl border border-border-thin bg-background-card p-1 shadow-2xl shadow-ai-indigo/10 animate-borderGlow"
          onHoverStart={playHover}
          onClick={() => {
            playClick();
            navigate("/ciudadano");
          }}
        >
          <Lens>
            <div className="rounded-2xl bg-background-surface p-8 transition-colors group-hover:bg-background-hover">
              <div className="mb-4 inline-flex rounded-xl bg-ai-indigo/10 p-3">
                <BadgeCheck className="h-7 w-7 text-ai-indigo" />
              </div>
              <h2 className="text-2xl font-semibold text-text-primary">Empleado Municipal</h2>
              <p className="mt-2 text-text-secondary">
                Gestiona observaciones y valida trazabilidad de tramites.
              </p>
            </div>
          </Lens>
        </ParallaxCard>
      </section>
    </main>
  );
}
