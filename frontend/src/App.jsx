import { useEffect, useMemo, useRef, useState } from "react";
import creatorPhoto from "./img/a.png";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

const ENTITY_LABELS = {
  personas: "Personas",
  lugares: "Lugares",
  organizaciones: "Organizaciones",
  otros: "Otros",
};

function getPriorityClass(priority) {
  if (priority === "ALTA") return "badge alta";
  if (priority === "MEDIA") return "badge media";
  if (priority === "NULA") return "badge nula";
  return "badge baja";
}

function getStatusLabel(status) {
  if (status === "ACEPTADA") return "ACEPTADA";
  if (status === "OBSERVADA") return "OBSERVADA";
  if (status === "RECHAZADA") return "RECHAZADA";
  return "PENDIENTE";
}

export default function App() {
  const [role, setRole] = useState(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [pwaStatus, setPwaStatus] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("Listo para analizar.");
  const [solicitudes, setSolicitudes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [observation, setObservation] = useState("");
  const [bandejaPage, setBandejaPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const BANDEJA_PAGE_SIZE = 5;
  const solicitanteFormRef = useRef(null);
  const misSolicitudesRef = useRef(null);
  const reviewerBandejaRef = useRef(null);
  const reviewerDecisionRef = useRef(null);

  const selectedSolicitud = solicitudes.find((item) => item.id === selectedId) ?? null;
  const isCooldownActive = cooldownUntil > Date.now();
  const isSubmitLocked = isSubmitting || isCooldownActive;
  const bandejaTotalPages = Math.max(1, Math.ceil(solicitudes.length / BANDEJA_PAGE_SIZE));
  const bandejaStart = (bandejaPage - 1) * BANDEJA_PAGE_SIZE;
  const bandejaItems = solicitudes.slice(bandejaStart, bandejaStart + BANDEJA_PAGE_SIZE);
  const reviewedSolicitudes = solicitudes.filter((s) => s.estado !== "PENDIENTE");
  const latestFeedback = reviewedSolicitudes[0] ?? null;
  const currentRoleLabel = role === "solicitante" ? "Solicitante" : "Revisor Municipal";
  const pendientesRevisionCount = solicitudes.filter((s) => s.estado === "PENDIENTE").length;
  const decisionPendienteCount = selectedSolicitud ? 1 : 0;
  const stats = useMemo(() => {
    const total = solicitudes.length;
    const pendientes = solicitudes.filter((s) => s.estado === "PENDIENTE").length;
    const aceptadas = solicitudes.filter((s) => s.estado === "ACEPTADA").length;
    const requierenCorreccion = solicitudes.filter(
      (s) => s.estado === "OBSERVADA" || s.estado === "RECHAZADA"
    ).length;
    return { total, pendientes, aceptadas, requierenCorreccion };
  }, [solicitudes]);

  useEffect(() => {
    if (!isCooldownActive) {
      setCooldownLeft(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownLeft(left);
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [cooldownUntil, isCooldownActive]);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setPwaStatus("Instalación disponible");
    };
    const onInstalled = () => {
      setPwaStatus("App instalada");
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitLocked) {
      if (isSubmitting) setStatus("Procesando solicitud, espera a que termine.");
      else setStatus(`Espera ${cooldownLeft || 1}s antes de enviar otra solicitud.`);
      return;
    }
    if (!file) {
      setStatus("Selecciona un documento.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("Subiendo documento...");
      const formData = new FormData();
      formData.append("file", file);
      const uploadResp = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
      if (!uploadResp.ok) throw new Error("No se pudo extraer texto.");
      const uploadData = await uploadResp.json();

      setStatus("Clasificando tramite...");
      const predictResp = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: uploadData.texto_extraido ?? "" }),
      });
      if (!predictResp.ok) throw new Error("No se pudo clasificar el documento.");
      const predictData = await predictResp.json();

      const nuevaSolicitud = {
        id: `SOL-${Date.now()}`,
        archivo: file?.name ?? "Documento",
        fecha: new Date().toLocaleString(),
        estado: "PENDIENTE",
        observation: "",
        uploadData,
        predictData,
      };
      setSolicitudes((prev) => [nuevaSolicitud, ...prev]);
      setSelectedId(nuevaSolicitud.id);
      setBandejaPage(1);
      setStatus("Documento analizado y enviado al revisor. Recibirás confirmación en breve.");
      setCooldownUntil(Date.now() + 4000);
      setObservation("");
      setFile(null);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewSolicitud = (newState) => {
    if (!selectedSolicitud) return;
    const updated = {
      ...selectedSolicitud,
      estado: newState,
      observation: observation.trim() || "Sin observación",
      fechaRevision: new Date().toLocaleString(),
    };
    setSolicitudes((prev) => prev.map((s) => (s.id === selectedSolicitud.id ? updated : s)));
    setObservation("");
  };

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setRoleMenuOpen(false);
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToSolicitantePanel = () => {
    setRole("solicitante");
    setTimeout(() => scrollToSection(solicitanteFormRef), 0);
  };

  const goToSolicitanteSolicitudes = () => {
    setRole("solicitante");
    setTimeout(() => scrollToSection(misSolicitudesRef), 0);
  };

  const goToRevisorBandeja = () => {
    setRole("revisor");
    if (!selectedId && solicitudes.length) {
      setSelectedId(solicitudes[0].id);
    }
    setTimeout(() => scrollToSection(reviewerBandejaRef), 0);
  };

  const goToRevisorDecision = () => {
    setRole("revisor");
    if (!selectedId && solicitudes.length) {
      setSelectedId(solicitudes[0].id);
    }
    setTimeout(() => scrollToSection(reviewerDecisionRef), 0);
  };

  const installPwa = async () => {
    if (!deferredPrompt) {
      setPwaStatus("Instalación no disponible en este dispositivo");
      return;
    }
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setPwaStatus("Instalando app...");
    } else {
      setPwaStatus("Instalación cancelada");
    }
    setDeferredPrompt(null);
  };

  const shareByWhatsApp = () => {
    const appUrl = window.location.href;
    const message =
      "Prueba la app web OCR municipal.\n" +
      "Creador: A.\n" +
      "Contacto: 970999796.\n" +
      `Enlace: ${appUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="container">
      <header className="hero">
        <div className="hero-brand">
          <span className="hero-dot" />
          <h1>SAGT - Dashboard de Tramites</h1>
        </div>
        <p className="sub">Flujo por rol: solicitante carga, revisor evalúa y decide.</p>
        <div className="hero-contact-row">
          <article className="creator-card">
            <img
              src={creatorPhoto}
              alt="Creador A"
              className="creator-avatar"
            />
            <div className="creator-copy">
              <strong>Creador: A</strong>
              <span>Contacto: 970999796</span>
            </div>
          </article>
          <button type="button" className="share-whatsapp-btn" onClick={shareByWhatsApp}>
            Compartir por WhatsApp
          </button>
        </div>
      </header>

      {!role ? (
        <section className="role-selector grid">
          <article className="card role-card" onClick={() => setRole("solicitante")}>
            <h2>Solicitante</h2>
            <p className="sub">Sube tu documento y recibe la confirmación del resultado de revisión.</p>
          </article>
          <article className="card role-card" onClick={() => setRole("revisor")}>
            <h2>Revisor Municipal</h2>
            <p className="sub">Atiende solicitudes pendientes y decide su aprobación.</p>
          </article>
        </section>
      ) : (
        <>
          <div className="role-topbar">
            <div className="role-topbar-info">
              <span className="role-chip">{currentRoleLabel}</span>
              <p className="status-text">{status}</p>
            </div>
            <div className="role-menu">
              <button
                type="button"
                className="menu-toggle"
                onClick={() => setRoleMenuOpen((prev) => !prev)}
                aria-label="Abrir menú de rol"
                aria-expanded={roleMenuOpen}
              >
                ☰
              </button>
              {roleMenuOpen && (
                <div className="menu-dropdown">
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => handleRoleChange("solicitante")}
                  >
                    Ver como Solicitante
                  </button>
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => handleRoleChange("revisor")}
                  >
                    Ver como Revisor
                  </button>
                  <button
                    type="button"
                    className="menu-item menu-item-danger"
                    onClick={() => handleRoleChange(null)}
                  >
                    Salir al selector de rol
                  </button>
                </div>
              )}
            </div>
          </div>

          {role === "solicitante" && (
            <section className="workspace">
              <div className="module-content">
                <article className="card module-title">
                  <h2>Enviar solicitud</h2>
                  <p className="sub">Carga tu documento para que el revisor municipal lo atienda.</p>
                </article>

                <section className="grid solicitante-grid">
                  <form onSubmit={onSubmit} className="card" ref={solicitanteFormRef}>
                    <label className="field-label" htmlFor="fileInput">Documento (PDF o imagen)</label>
                    <input
                      id="fileInput"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      disabled={isSubmitLocked}
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    {file && <p className="file-name">Archivo seleccionado: {file.name}</p>}
                    <button type="submit" className={isSubmitting ? "is-processing" : isCooldownActive ? "is-cooldown" : ""} disabled={isSubmitLocked}>
                      {isSubmitting ? "Procesando..." : isCooldownActive ? `Espera ${cooldownLeft}s` : "Enviar solicitud"}
                    </button>
                  </form>

                  <article className="card widget-panel">
                    <h2>Resumen de seguimiento</h2>
                    <p className="sub">Vista rápida del estado de tus trámites.</p>
                    <div className="widget-grid">
                      <div className="widget-item">
                        <span>Solicitudes registradas</span>
                        <strong>{stats.total}</strong>
                      </div>
                      <div className="widget-item">
                        <span>En revisión</span>
                        <strong>{stats.pendientes}</strong>
                      </div>
                      <div className="widget-item">
                        <span>Conformidad emitida</span>
                        <strong>{stats.aceptadas}</strong>
                      </div>
                      <div className="widget-item">
                        <span>Requieren corrección</span>
                        <strong>{stats.requierenCorreccion}</strong>
                      </div>
                    </div>
                  </article>
                </section>

                {latestFeedback && (
                  <article className="card">
                    <h2>Última respuesta del revisor</h2>
                    <p className="review-state">
                      Trámite <strong>{latestFeedback.id}</strong> · Estado{" "}
                      <strong>{getStatusLabel(latestFeedback.estado)}</strong>
                    </p>
                    <p className="review-state">
                      Comentario:{" "}
                      <strong>{latestFeedback.observation || "Sin observación"}</strong>
                    </p>
                    <p className="sub">
                      Fecha de revisión: {latestFeedback.fechaRevision || "Pendiente"}
                    </p>
                  </article>
                )}

                <article className="card" ref={misSolicitudesRef}>
                  <h2>Mis solicitudes</h2>
                  {solicitudes.length === 0 ? (
                    <p className="empty">Aún no enviaste solicitudes.</p>
                  ) : (
                    <ul className="history-list">
                      {solicitudes.map((item) => (
                        <li key={item.id}>
                          <strong>{item.archivo}</strong>
                          <span>{item.id}</span>
                          <span>Estado: {getStatusLabel(item.estado)}</span>
                          <small>Observación: {item.observation || "Pendiente de revisión"}</small>
                          <em>{item.fechaRevision || item.fecha}</em>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </div>
            </section>
          )}

          {role === "revisor" && (
            <section className="workspace">
              <div className="module-content">
                <article className="card module-title">
                  <h2>Solicitudes por atender</h2>
                  <p className="sub">Selecciona una solicitud para revisar y emitir decisión.</p>
                </article>

                <section className="grid reviewer-grid">
                  <article className="card" ref={reviewerBandejaRef}>
                    <h2>Bandeja</h2>
                    {solicitudes.length === 0 ? (
                      <p className="empty">No hay solicitudes procesadas aún.</p>
                    ) : (
                      <>
                        <div className="request-list">
                        {bandejaItems.map((solicitud) => (
                          <button
                            key={solicitud.id}
                            type="button"
                            className={selectedId === solicitud.id ? "request-item active" : "request-item"}
                            onClick={() => setSelectedId(solicitud.id)}
                          >
                            <strong>{solicitud.archivo}</strong>
                            <span>{solicitud.id}</span>
                            <span>{solicitud.fecha}</span>
                            <em>{solicitud.estado}</em>
                          </button>
                        ))}
                        </div>
                        <div className="pager">
                          <button
                            type="button"
                            className="pager-btn"
                            onClick={() => setBandejaPage((prev) => Math.max(1, prev - 1))}
                            disabled={bandejaPage === 1}
                          >
                            {"<"}
                          </button>
                          <span className="pager-info">
                            Página {bandejaPage} de {bandejaTotalPages}
                          </span>
                          <button
                            type="button"
                            className="pager-btn"
                            onClick={() => setBandejaPage((prev) => Math.min(bandejaTotalPages, prev + 1))}
                            disabled={bandejaPage === bandejaTotalPages}
                          >
                            {">"}
                          </button>
                        </div>
                      </>
                    )}
                  </article>

                  <article className="card" ref={reviewerDecisionRef}>
                    <h2>Detalle y decisión</h2>
                    {selectedSolicitud ? (
                      <>
                        <p className="review-state">Tipo: <strong>{selectedSolicitud.predictData.clasificacion?.tipo ?? "N/A"}</strong></p>
                        <p className="review-state">
                          Prioridad:{" "}
                          <strong className={getPriorityClass(selectedSolicitud.predictData.clasificacion?.prioridad)}>
                            {selectedSolicitud.predictData.clasificacion?.prioridad ?? "N/A"}
                          </strong>
                        </p>

                        <section className="entity-block">
                          <h3>Contenido del documento</h3>
                          <pre className="text-preview">{selectedSolicitud.uploadData?.texto_extraido ?? "Sin texto."}</pre>
                        </section>

                        <textarea
                          className="observation"
                          placeholder="Observación para el solicitante"
                          value={observation}
                          onChange={(e) => setObservation(e.target.value)}
                        />

                        <div className="action-row">
                          <button type="button" className="btn-action aprobar" onClick={() => reviewSolicitud("ACEPTADA")}>Aceptar</button>
                          <button type="button" className="btn-action observar" onClick={() => reviewSolicitud("OBSERVADA")}>Observar</button>
                          <button type="button" className="btn-action rechazar" onClick={() => reviewSolicitud("RECHAZADA")}>Rechazar</button>
                        </div>
                      </>
                    ) : (
                      <p className="empty">Selecciona una solicitud para revisar.</p>
                    )}
                  </article>
                </section>
              </div>
            </section>
          )}
        </>
      )}
      <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
        <button type="button" className="mobile-nav-item" onClick={goToSolicitantePanel}>
          <span className="mobile-nav-icon">⌂</span>
          <span>Panel</span>
        </button>
        <button type="button" className="mobile-nav-item" onClick={goToSolicitanteSolicitudes}>
          <span className="mobile-nav-icon">☰</span>
          <span>Mis</span>
        </button>
        <button type="button" className="mobile-nav-item mobile-nav-item-plus" onClick={installPwa}>
          <span className="mobile-nav-icon">＋</span>
          <span>Instalar</span>
        </button>
        <button type="button" className="mobile-nav-item" onClick={goToRevisorBandeja}>
          <span className="mobile-nav-icon">🗂</span>
          <span>Revisor</span>
          {pendientesRevisionCount > 0 && (
            <span className="mobile-nav-count">{pendientesRevisionCount}</span>
          )}
        </button>
        <button type="button" className="mobile-nav-item" onClick={goToRevisorDecision}>
          <span className="mobile-nav-icon">✔</span>
          <span>Decidir</span>
          {decisionPendienteCount > 0 && (
            <span className="mobile-nav-count">{decisionPendienteCount}</span>
          )}
        </button>
      </nav>
      {pwaStatus && <p className="mobile-install-status">{pwaStatus}</p>}
    </main>
  );
}
