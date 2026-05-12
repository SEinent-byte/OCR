import { useEffect, useMemo, useRef, useState } from "react";
import creatorPhoto from "./img/a.png";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

const ENTITY_LABELS = {
  personas: "Personas",
  lugares: "Lugares",
  organizaciones: "Organizaciones",
  otros: "Otros",
};

const SHARED_APP_URL = "https://ocr-zeta-eight.vercel.app";

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

function getStatusToneClass(status) {
  if (status === "ACEPTADA") return "status-pill status-pill-ok";
  if (status === "OBSERVADA") return "status-pill status-pill-warn";
  if (status === "RECHAZADA") return "status-pill status-pill-bad";
  return "status-pill status-pill-pending";
}

function getObservationToneClass(status) {
  if (status === "ACEPTADA") return "observation-pill observation-pill-ok";
  if (status === "OBSERVADA") return "observation-pill observation-pill-warn";
  if (status === "RECHAZADA") return "observation-pill observation-pill-bad";
  return "observation-pill observation-pill-pending";
}

function formatDocumentType(type) {
  const raw = String(type || "").trim();
  if (!raw) return "No definido";
  const dictionary = {
    TRAMITE_GENERAL: "Trámite general",
    LICENCIA_CONSTRUCCION: "Licencia de construcción",
    LICENCIA_FUNCIONAMIENTO: "Licencia de funcionamiento",
    RECLAMO: "Reclamo",
    DENUNCIA: "Denuncia",
    CONSTANCIA: "Constancia",
  };
  if (dictionary[raw]) return dictionary[raw];
  return raw
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSolicitudTitle(item) {
  if (item?.titulo) return item.titulo;
  const fallback = String(item?.id || "").replace(/\D/g, "").slice(-4) || "0000";
  return `Solicitud #${fallback}`;
}

export default function App() {
  const [role, setRole] = useState(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [pwaStatus, setPwaStatus] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("Listo para analizar.");
  const [solicitudes, setSolicitudes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [observation, setObservation] = useState("");
  const [bandejaPage, setBandejaPage] = useState(1);
  const [activeDesktopTab, setActiveDesktopTab] = useState("inicio");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const BANDEJA_PAGE_SIZE = 5;
  const HISTORY_PAGE_SIZE = 5;
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
  const historyFiltered = useMemo(() => {
    const needle = historySearch.trim().toLowerCase();
    if (!needle) return solicitudes;
    return solicitudes.filter((item) => {
      const fields = [
        item.archivo,
        item.id,
        getStatusLabel(item.estado),
        item.observation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(needle);
    });
  }, [historySearch, solicitudes]);
  const historyTotalPages = Math.max(1, Math.ceil(historyFiltered.length / HISTORY_PAGE_SIZE));
  const historyStart = (historyPage - 1) * HISTORY_PAGE_SIZE;
  const historyItems = historyFiltered.slice(historyStart, historyStart + HISTORY_PAGE_SIZE);
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
    setHistoryPage(1);
  }, [historySearch]);

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
        titulo: `Solicitud #${String(Date.now()).slice(-4)}`,
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
    setReviewModalOpen(false);
  };

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setRoleMenuOpen(false);
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToSolicitantePanel = () => {
    setActiveDesktopTab("inicio");
    setRole("solicitante");
    setTimeout(() => scrollToSection(solicitanteFormRef), 0);
  };

  const goToInicio = () => {
    setActiveDesktopTab("inicio");
    setRole(null);
    setRoleMenuOpen(false);
  };

  const goToSolicitanteSolicitudes = () => {
    setActiveDesktopTab("solicitudes");
    setRole("solicitante");
    setTimeout(() => scrollToSection(misSolicitudesRef), 0);
  };

  const goToRevisorBandeja = () => {
    setActiveDesktopTab("bandeja");
    setRole("revisor");
    if (!selectedId && solicitudes.length) {
      setSelectedId(solicitudes[0].id);
    }
    setTimeout(() => scrollToSection(reviewerBandejaRef), 0);
  };

  const goToRevisorDecision = () => {
    setActiveDesktopTab("decisiones");
    setRole("revisor");
    if (!selectedId && solicitudes.length) {
      setSelectedId(solicitudes[0].id);
    }
    setTimeout(() => scrollToSection(reviewerDecisionRef), 0);
  };

  const installPwa = async () => {
    if (!deferredPrompt) {
      setPwaStatus("Si no aparece el instalador, usa 'Agregar a pantalla de inicio' del navegador");
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
    const message =
      "Prueba la app web OCR municipal.\n" +
      "Creador: A.\n" +
      "Contacto: 970999796.\n" +
      `Enlace: ${SHARED_APP_URL}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="app-shell">
      <aside className="desktop-sidebar">
        <div className="sidebar-head">
          <span className="sidebar-brand-dot" />
          <strong>Trámites Municipales</strong>
        </div>
        <p className="sidebar-user">Usuario activo</p>
        <nav className="sidebar-nav">
          <button
            type="button"
            className={activeDesktopTab === "inicio" ? "sidebar-link active" : "sidebar-link"}
            onClick={goToInicio}
          >
            Inicio
          </button>
          <button
            type="button"
            className={activeDesktopTab === "solicitudes" ? "sidebar-link active" : "sidebar-link"}
            onClick={goToSolicitanteSolicitudes}
          >
            Mis solicitudes
          </button>
          <button
            type="button"
            className={activeDesktopTab === "bandeja" ? "sidebar-link active" : "sidebar-link"}
            onClick={goToRevisorBandeja}
          >
            Bandeja revisor
          </button>
          <button
            type="button"
            className={activeDesktopTab === "decisiones" ? "sidebar-link active" : "sidebar-link"}
            onClick={goToRevisorDecision}
          >
            Mis decisiones
          </button>
        </nav>
        <button type="button" className="sidebar-share" onClick={shareByWhatsApp}>
          Compartir app
        </button>
      </aside>

      <div className="container">
      <header className="hero">
        {!role && (
          <>
            <div className="hero-brand">
              <span className="hero-dot" />
              <h1>Trámites Municipales</h1>
            </div>
            <div className="hero-contact-row">
              <article
                className={creatorOpen ? "creator-card open" : "creator-card"}
                onClick={() => setCreatorOpen((prev) => !prev)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setCreatorOpen((prev) => !prev);
                  }
                }}
                aria-expanded={creatorOpen}
              >
                <img
                  src={creatorPhoto}
                  alt="Creador A"
                  className="creator-avatar"
                />
                {creatorOpen && (
                  <div className="creator-copy">
                    <strong>Creador: A</strong>
                    <span>Contacto: 970999796</span>
                  </div>
                )}
              </article>
              <button type="button" className="share-whatsapp-btn" onClick={shareByWhatsApp}>
                Compartir por WhatsApp
              </button>
            </div>
          </>
        )}
      </header>

      {!role ? (
        <section className="role-selector grid">
          <article className="card role-card role-card-solicitante" onClick={() => setRole("solicitante")}>
            <h2>Solicitante</h2>
            <p className="sub">Sube tu documento y recibe la confirmación del resultado de revisión.</p>
          </article>
          <article className="card role-card role-card-revisor" onClick={() => setRole("revisor")}>
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
                      <div className="widget-item widget-registradas">
                        <span className="widget-icon">▣</span>
                        <span>Solicitudes registradas</span>
                        <strong>{stats.total}</strong>
                      </div>
                      <div className="widget-item widget-revision">
                        <span className="widget-icon">◔</span>
                        <span>En revisión</span>
                        <strong>{stats.pendientes}</strong>
                      </div>
                      <div className="widget-item widget-ok">
                        <span className="widget-icon">✓</span>
                        <span>Conformidad emitida</span>
                        <strong>{stats.aceptadas}</strong>
                      </div>
                      <div className="widget-item widget-fix">
                        <span className="widget-icon">!</span>
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
                      <strong className={getStatusToneClass(latestFeedback.estado)}>
                        {getStatusLabel(latestFeedback.estado)}
                      </strong>
                    </p>
                    <p className="review-state">
                      Comentario:{" "}
                      <strong className={getObservationToneClass(latestFeedback.estado)}>
                        {latestFeedback.observation || "Sin observación"}
                      </strong>
                    </p>
                    <p className="sub">
                      Fecha de revisión: {latestFeedback.fechaRevision || "Pendiente"}
                    </p>
                  </article>
                )}

                <article className="card" ref={misSolicitudesRef}>
                  <button
                    type="button"
                    className="history-toggle"
                    onClick={() => setHistoryOpen((prev) => !prev)}
                  >
                    <span>Mis solicitudes</span>
                    <span>{historyOpen ? "▲" : "▼"}</span>
                  </button>
                  {historyOpen && (
                    <>
                      <div className="history-toolbar">
                        <span className="history-search-icon">⌕</span>
                        <input
                          type="text"
                          className="history-search"
                          placeholder="Buscar por código, estado o comentario"
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                        />
                      </div>
                      {historyFiltered.length === 0 ? (
                        <p className="empty">No hay resultados para tu búsqueda.</p>
                      ) : (
                        <>
                          <ul className="history-list">
                            {historyItems.map((item) => (
                              <li key={item.id} className="history-item">
                                <div className="history-item-top">
                                  <strong>{getSolicitudTitle(item)}</strong>
                                  <span className={getStatusToneClass(item.estado)}>
                                    {getStatusLabel(item.estado)}
                                  </span>
                                </div>
                                <span className="history-id">{item.id}</span>
                                <small className={getObservationToneClass(item.estado)}>
                                  {item.observation || "Pendiente de revisión"}
                                </small>
                                <em>{item.fechaRevision || item.fecha}</em>
                              </li>
                            ))}
                          </ul>
                          {historyTotalPages > 1 && (
                            <div className="pager">
                              <button
                                type="button"
                                className="pager-btn"
                                onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                                disabled={historyPage === 1}
                              >
                                {"<"}
                              </button>
                              <span className="pager-info">
                                Página {historyPage} de {historyTotalPages}
                              </span>
                              <button
                                type="button"
                                className="pager-btn"
                                onClick={() => setHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))}
                                disabled={historyPage === historyTotalPages}
                              >
                                {">"}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </article>
              </div>
            </section>
          )}

          {role === "revisor" && (
            <section className="workspace">
              <div className="module-content">
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
                            onClick={() => {
                              setSelectedId(solicitud.id);
                              setReviewModalOpen(true);
                            }}
                          >
                            <strong>{getSolicitudTitle(solicitud)}</strong>
                            <span>{solicitud.id}</span>
                            <span>{solicitud.fecha}</span>
                            <em className={getStatusToneClass(solicitud.estado)}>
                              {getStatusLabel(solicitud.estado)}
                            </em>
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
          <span className="mobile-nav-icon mobile-nav-download" aria-hidden="true">↓</span>
          <span className="sr-only">Instalar app</span>
        </button>
        <button type="button" className="mobile-nav-item" onClick={goToRevisorBandeja}>
          <span className="mobile-nav-icon">◫</span>
          <span>Revisor</span>
          {pendientesRevisionCount > 0 && (
            <span className="mobile-nav-count">{pendientesRevisionCount}</span>
          )}
        </button>
        <button type="button" className="mobile-nav-item" onClick={goToRevisorDecision}>
          <span className="mobile-nav-icon">✓</span>
          <span>Decidir</span>
          {decisionPendienteCount > 0 && (
            <span className="mobile-nav-count">{decisionPendienteCount}</span>
          )}
        </button>
      </nav>
      {pwaStatus && <p className="mobile-install-status">{pwaStatus}</p>}

      {reviewModalOpen && selectedSolicitud && (
        <div className="review-modal-backdrop" onClick={() => setReviewModalOpen(false)}>
          <article
            className="review-modal"
            ref={reviewerDecisionRef}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="review-modal-head">
              <h2>Revisión de solicitud</h2>
              <button type="button" className="review-modal-close" onClick={() => setReviewModalOpen(false)}>
                ✕
              </button>
            </div>

            <p className="review-state">
              Tipo:{" "}
              <strong>{formatDocumentType(selectedSolicitud.predictData.clasificacion?.tipo)}</strong>
            </p>
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
          </article>
        </div>
      )}
      </div>
    </main>
  );
}
