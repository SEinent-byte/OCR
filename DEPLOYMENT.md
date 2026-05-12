# SAGT - Despliegue a Produccion

Guia rapida para publicar **un solo repo (monorepo)** en Railway (solo API) y Vercel (solo front).

**Regla:** en Railway debe correr **Python + uvicorn** (`backend/`). En Vercel debe correr **Vite** (`frontend/` o raiz con `package.json` de la raiz). Si en Railway sirves el `dist` del front, `POST /upload` devolvera **405** y el navegador mostrara errores de CORS.

## 1) Verificaciones locales antes de subir

### Backend
1. Ir a `backend/`
2. Instalar dependencias:
   - `pip install -r requirements.txt`
3. Configurar variables locales en `.env` (no subir este archivo):
   - `HF_TOKEN=...`
   - `TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe` (solo si aplica)
4. Ejecutar API:
   - `uvicorn main:app --reload --port 8000`
5. Probar:
   - `http://localhost:8000/health` debe responder `{"status":"ok"}`

### Frontend
1. Ir a `frontend/`
2. Instalar dependencias:
   - `npm install`
3. Asegurar variable local:
   - `.env.development` con `VITE_API_URL=http://localhost:8000`
4. Ejecutar:
   - `npm run dev`
5. Build de validacion:
   - `npm run build`

### Landing
1. Ir a `landing/`
2. Instalar dependencias:
   - `npm install`
3. Build de validacion:
   - `npm run build`

## 2) Monorepo — Backend en Railway (solo API)

Usa **el mismo repositorio** que el front. Este servicio **no** debe construir ni servir Vite.

### Crear o corregir el servicio

1. En Railway: **New Project** → **Deploy from GitHub** → elige el repo del monorepo.
2. En el servicio: **Settings** → **Source** (o **Build**):
   - **Root Directory**: escribe exactamente **`backend`** (sin barra inicial).
3. **Settings** → **Deploy** (o revisa el repo):
   - **Start command** debe ser equivalente a:  
     `uvicorn main:app --host 0.0.0.0 --port $PORT`  
     (ya viene en `backend/railway.toml` y `backend/Procfile`.)
4. Archivos que Railway debe ver **dentro de** `backend/`:
   - `main.py`, `requirements.txt`, `railway.toml`, `Procfile`, `nixpacks.toml` (Tesseract para imagenes).

### Variables de entorno (Railway)

- `HF_TOKEN` — obligatoria para clasificacion/NER con Hugging Face.
- No hace falta `TESSERACT_CMD` en Linux; `nixpacks.toml` instala Tesseract por apt.

### Comprobacion obligatoria antes de pegar la URL en Vercel

Abre en el navegador o con curl la URL publica del servicio:

- `GET https://TU-SERVICIO.up.railway.app/health`

**Correcto:** cuerpo JSON, por ejemplo `{"status":"ok"}`.  
**Incorrecto:** HTML (pagina con `<title>OCR` o similar) — entonces el servicio esta sirviendo el **front** o el root equivocado; vuelve al paso **Root Directory = `backend`** y redeploy.

Opcional: `GET https://TU-SERVICIO.up.railway.app/docs` debe mostrar la documentacion Swagger de FastAPI.

### Si ya tenias un servicio mal configurado

- Edita **Root Directory** a `backend`, guarda y **Redeploy**; o crea **otro servicio** en el mismo proyecto Railway solo para la API y deja el otro apagado o borralo para no confundir URLs.

## 3) Monorepo — Frontend en Vercel (mismo repo)

1. En Vercel: **Add New** → **Project** → importa el **mismo** repo de GitHub.
2. **Root Directory** (elige una opcion):
   - **Opcion A (recomendada con este repo):** deja **vacío** o **`.`** — en la raiz hay `package.json` que ejecuta el build de `frontend/` y `vercel.json` con `outputDirectory: frontend/dist`.
   - **Opcion B:** `frontend` — entonces el build usa el `package.json` de esa carpeta; puedes alinear `vercel.json` dentro de `frontend/` si lo prefieres.
3. Variables de entorno en Vercel (**Production** y **Preview**):
   - `VITE_API_URL` = la URL **HTTPS** del servicio Railway del paso 2 (la que devuelve JSON en `/health`).
4. Deploy y validar:
   - La UI carga.
   - Subir imagen/PDF no devuelve 405 ni CORS falso (si falla, revisa de nuevo `/health` en Railway).

## 4) Deploy landing en Vercel

1. Crear segundo proyecto en Vercel con el mismo repo.
2. Configurar:
   - **Root Directory**: `landing`
3. Deploy y validar que renderice correctamente.

## 5) Checklist de salida a produccion

- [ ] `.env` no esta en Git
- [ ] `HF_TOKEN` solo en Railway
- [ ] `VITE_API_URL` solo en Vercel
- [ ] `GET .../health` en Railway devuelve JSON `{"status":"ok"}` (no HTML)
- [ ] Frontend en Vercel consume la URL real de Railway
- [ ] Flujo solicitante -> revisor probado en entorno productivo
- [ ] Logs revisados despues del primer despliegue

## 6) Comandos utiles de verificacion

### Backend
- `GET /health`
- `POST /upload` con PDF/imagen de prueba
- `POST /predict` con texto de prueba

### Frontend
- `npm run build`
- Revisar en browser:
  - estado del boton de envio
  - cooldown de 4 segundos
  - bandeja y paginacion de revisor
