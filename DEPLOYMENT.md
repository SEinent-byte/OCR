# SAGT - Despliegue a Produccion

Guia rapida para publicar el monorepo en Railway (backend) y Vercel (frontend + landing).

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

## 2) Deploy backend en Railway

1. Crear proyecto nuevo en Railway.
2. Conectar repositorio de GitHub.
3. Configurar:
   - **Root Directory**: `backend`
4. Verificar que Railway detecte:
   - `Procfile` y/o `railway.toml`
5. Variables de entorno en Railway:
   - `HF_TOKEN` (obligatoria)
   - `TESSERACT_CMD` (solo si usas OCR de imagen y lo necesitas)
6. Confirmar que el servicio quede con healthcheck:
   - `/health`
7. Guardar la URL publica del backend:
   - Ejemplo: `https://sagt-backend.up.railway.app`

## 3) Deploy frontend en Vercel

1. Crear proyecto en Vercel conectado al mismo repo.
2. Configurar:
   - **Root Directory**: `frontend`
3. `vercel.json` ya apunta a build Vite y SPA rewrite.
4. Variables de entorno en Vercel (Production):
   - `VITE_API_URL=https://TU-BACKEND-RAILWAY`
5. Deploy y validar:
   - Carga de UI
   - Flujo de subida y estado de solicitud

## 4) Deploy landing en Vercel

1. Crear segundo proyecto en Vercel con el mismo repo.
2. Configurar:
   - **Root Directory**: `landing`
3. Deploy y validar que renderice correctamente.

## 5) Checklist de salida a produccion

- [ ] `.env` no esta en Git
- [ ] `HF_TOKEN` solo en Railway
- [ ] `VITE_API_URL` solo en Vercel
- [ ] `backend/health` responde ok
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
