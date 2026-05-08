import { useRef } from "react";
import { motion } from "framer-motion";
import {
  BellRing,
  BrainCircuit,
  DatabaseZap,
  FileSearch,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { BlurFade } from "@/components/magicui/blur-fade";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Lens } from "@/components/magicui/lens";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { ShineBorder } from "@/components/magicui/shine-border";
import { WordRotate } from "@/components/magicui/word-rotate";
import { useSounds } from "@/hooks/useSounds";

const navLinks = ["Caracteristicas", "Demo", "Tecnologia", "Contacto"];

const stats = [
  { value: 95, label: "reduccion de errores", icon: ShieldCheck },
  { value: 3, label: "x mas rapido", icon: Workflow },
  { value: 100, label: "trazabilidad", icon: DatabaseZap },
  { value: 24, label: "7 disponible", icon: Sparkles },
];

const features = [
  {
    title: "OCR Inteligente",
    description:
      "Extrae automaticamente nombre, DNI, fechas y tipo de tramite de cualquier PDF o imagen escaneada.",
    icon: FileSearch,
    colorFrom: "#0ea5e9",
    colorTo: "#22d3ee",
  },
  {
    title: "Priorizacion con IA",
    description:
      "Algoritmo XGBoost asigna score de urgencia ALTA, MEDIA o BAJA segun impacto y plazo legal.",
    icon: BrainCircuit,
    colorFrom: "#6366f1",
    colorTo: "#8b5cf6",
  },
  {
    title: "Alertas en tiempo real",
    description: "El ciudadano recibe SMS, email o WhatsApp en cada cambio de estado de su tramite.",
    icon: BellRing,
    colorFrom: "#22d3ee",
    colorTo: "#0ea5e9",
  },
  {
    title: "Bandeja inteligente",
    description: "Agrupa automaticamente casos urgentes y ordena por prioridad operativa del municipio.",
    icon: LayoutDashboard,
    colorFrom: "#0ea5e9",
    colorTo: "#6366f1",
  },
  {
    title: "Auditoria completa",
    description: "Cada accion queda registrada para control interno, transparencia y rendicion de cuentas.",
    icon: ShieldCheck,
    colorFrom: "#8b5cf6",
    colorTo: "#6366f1",
  },
  {
    title: "Integracion municipal",
    description: "Conecta catastro, mesa de partes y notificaciones con un flujo digital unificado.",
    icon: Workflow,
    colorFrom: "#22d3ee",
    colorTo: "#8b5cf6",
  },
];

function ParallaxFeatureCard({ feature, onHover }) {
  const rotateX = useRef(0);
  const rotateY = useRef(0);
  const Icon = feature.icon;

  return (
    <motion.article
      className="glass-card relative overflow-hidden p-5"
      onMouseEnter={onHover}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        rotateX.current = (y - 0.5) * 20;
        rotateY.current = (x - 0.5) * -20;
        e.currentTarget.style.transform = `perspective(800px) rotateX(${rotateX.current}deg) rotateY(${rotateY.current}deg)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
      }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
    >
      <BorderBeam size={70} duration={6} colorFrom={feature.colorFrom} colorTo={feature.colorTo} />
      <div className="mb-3 inline-flex rounded-xl bg-ai-blue/10 p-2.5">
        <Icon className="h-5 w-5 text-ai-blue" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-text-primary">{feature.title}</h3>
      <p className="text-sm leading-relaxed text-text-secondary">{feature.description}</p>
    </motion.article>
  );
}

export function LandingPage() {
  const { playHover, playClick, playReveal } = useSounds();
  const ctaContainerRef = useRef(null);
  const ctaARef = useRef(null);
  const ctaBRef = useRef(null);

  return (
    <div className="relative z-10 min-h-screen bg-bg-deep text-text-primary">
      <header className="sticky top-0 z-30 mx-auto mt-4 flex w-[95%] max-w-6xl items-center justify-between glass-card px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-ai-blue" />
          <span className="text-lg font-bold">SAGT</span>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-sm text-text-secondary transition hover:text-ai-blue"
              onMouseEnter={playHover}
            >
              {link}
            </a>
          ))}
        </nav>
        <Link to="/login" className="relative rounded-xl px-4 py-2 text-sm font-semibold" onMouseEnter={playHover}>
          <ShineBorder shineColor={["#0ea5e9", "#6366f1"]} />
          Iniciar sesion
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 text-center" id="demo">
        <BlurFade delay={0} inView onAnimationStart={playReveal}>
          <div className="mb-6 inline-flex items-center rounded-full border border-ai-blue/30 bg-ai-blue/10 px-4 py-1 text-sm">
            <AnimatedGradientText colorFrom="#0ea5e9" colorTo="#8b5cf6">
              ✦ Sistema Municipal con IA · Municipalidad de Yau
            </AnimatedGradientText>
          </div>
        </BlurFade>

        <BlurFade delay={0.05} inView>
          <h1 className="mx-auto max-w-4xl text-5xl font-bold md:text-7xl">
            Tramites municipales
            <br />
            <span className="bg-[linear-gradient(135deg,#0ea5e9,#6366f1,#8b5cf6)] bg-clip-text text-transparent">
              potenciados por IA
            </span>
          </h1>
        </BlurFade>

        <BlurFade delay={0.1} inView>
          <p className="mx-auto mt-6 max-w-xl text-base text-text-secondary">
            El sistema que automatiza, clasifica y prioriza los tramites de tu municipio en tiempo real.
          </p>
          <WordRotate
            words={[
              "OCR Inteligente",
              "Priorizacion Automatica",
              "Alertas en Tiempo Real",
              "Transparencia Total",
            ]}
            className="mt-3 text-xl font-semibold text-ai-blue"
          />
        </BlurFade>

        <BlurFade delay={0.15} inView>
          <div ref={ctaContainerRef} className="relative mx-auto mt-10 flex max-w-xl items-center justify-center gap-5">
            <button
              ref={ctaARef}
              className="relative rounded-xl px-6 py-3 font-semibold"
              onMouseEnter={playClick}
            >
              <ShineBorder shineColor={["#0ea5e9", "#6366f1"]} />
              Ver demo en vivo
            </button>
            <button
              ref={ctaBRef}
              className="rounded-xl border border-ai-indigo/40 px-6 py-3 font-semibold text-text-secondary transition hover:border-ai-indigo hover:text-text-primary"
              onMouseEnter={playHover}
            >
              Conocer mas ↓
            </button>

            <AnimatedBeam
              containerRef={ctaContainerRef}
              fromRef={ctaARef}
              toRef={ctaBRef}
              curvature={30}
              duration={3}
              gradientStartColor="#0ea5e9"
              gradientStopColor="#6366f1"
            />
          </div>
        </BlurFade>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20" id="tecnologia">
        <BlurFade delay={0.2} inView>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.label}
                  className="glass-card relative overflow-hidden p-5"
                  whileHover={{ scale: 1.02 }}
                  onMouseEnter={playHover}
                >
                  <BorderBeam size={60} duration={5 + index} colorFrom="#0ea5e9" colorTo="#6366f1" />
                  <motion.div
                    initial={{ rotate: 0 }}
                    whileInView={{ rotate: 360 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-4 inline-flex rounded-xl bg-ai-indigo/10 p-2"
                  >
                    <Icon className="h-5 w-5 text-ai-indigo" />
                  </motion.div>
                  <div className="text-3xl font-bold">
                    <NumberTicker value={item.value} className="text-text-primary" />
                    {item.value === 3 ? "x" : "%"}
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{item.label}</p>
                </motion.article>
              );
            })}
          </div>
        </BlurFade>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24" id="caracteristicas">
        <BlurFade delay={0.3} inView>
          <h2 className="mb-8 text-center text-3xl font-bold">Como funciona SAGT</h2>
        </BlurFade>
        <BlurFade delay={0.35} inView>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <Lens key={feature.title}>
                <ParallaxFeatureCard feature={feature} onHover={playHover} />
              </Lens>
            ))}
          </div>
        </BlurFade>
      </section>
    </div>
  );
}
