// URL configurable para desarrollo o produccion.
const API_BASE_URL = window.SAGT_API_BASE_URL || "http://localhost:8000";

const uploadForm = document.getElementById("uploadForm");
const fileInput = document.getElementById("documentFile");
const statusBox = document.getElementById("statusBox");
const entitiesResult = document.getElementById("entitiesResult");
const classificationResult = document.getElementById("classificationResult");
const textResult = document.getElementById("textResult");

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.style.color = isError ? "#b91c1c" : "#065f46";
}

function formatEntities(entidades) {
  const keys = [
    ["personas", "Personas"],
    ["lugares", "Lugares"],
    ["organizaciones", "Organizaciones"],
    ["otros", "Otros"],
  ];

  const chunks = keys.map(([key, label]) => {
    const values = entidades?.[key] || [];
    return `<p><strong>${label}:</strong> ${
      values.length ? values.join(", ") : "Sin datos"
    }</p>`;
  });

  return chunks.join("");
}

function getPriorityClass(prioridad) {
  if (prioridad === "ALTA") return "priority-alta";
  if (prioridad === "MEDIA") return "priority-media";
  return "priority-baja";
}

function formatClassification(clasificacion) {
  const prioridad = clasificacion?.prioridad || "BAJA";
  const tipo = clasificacion?.tipo || "SIN_CATEGORIA";
  const confianza = Number(clasificacion?.confianza || 0).toFixed(4);
  const priorityClass = getPriorityClass(prioridad);

  return `
    <p><strong>Tipo:</strong> ${tipo}</p>
    <p><strong>Confianza:</strong> ${confianza}</p>
    <p><strong>Prioridad:</strong> <span class="pill ${priorityClass}">${prioridad}</span></p>
  `;
}

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = fileInput.files?.[0];
  if (!file) {
    setStatus("Selecciona un archivo antes de continuar.", true);
    return;
  }

  setStatus("Subiendo y procesando documento...");
  entitiesResult.innerHTML = "Procesando...";
  classificationResult.innerHTML = "Procesando...";
  textResult.textContent = "Procesando...";

  try {
    const formData = new FormData();
    formData.append("file", file);

    const uploadResp = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!uploadResp.ok) {
      const errBody = await uploadResp.json().catch(() => ({}));
      throw new Error(errBody.detail || "No se pudo extraer texto del documento.");
    }

    const uploadData = await uploadResp.json();
    const texto = uploadData.texto_extraido || "";

    const predictResp = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });

    if (!predictResp.ok) {
      const errBody = await predictResp.json().catch(() => ({}));
      throw new Error(errBody.detail || "No se pudo clasificar el documento.");
    }

    const predictData = await predictResp.json();
    entitiesResult.innerHTML = formatEntities(predictData.entidades);
    classificationResult.innerHTML = formatClassification(predictData.clasificacion);
    textResult.textContent = texto || "No se encontro texto en el archivo.";

    setStatus("Analisis completado correctamente.");
  } catch (error) {
    setStatus(`Error: ${error.message}`, true);
    entitiesResult.innerHTML = "Sin resultados por error.";
    classificationResult.innerHTML = "Sin resultados por error.";
    textResult.textContent = "Sin resultados por error.";
  }
});
