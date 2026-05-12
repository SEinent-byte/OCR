# Front OCR para GitHub + Vercel

Este directorio es una copia lista del front Vite/React que debe vivir en la **raíz** del repositorio GitHub `SEinent-byte/OCR` (no dentro de `Users/...`).

## Qué pasó

1. En Vercel quedó un **Root Directory** con una ruta absoluta de tu PC; en el clon de GitHub esa carpeta no existe.
2. En GitHub el repo `OCR` solo tenía la carpeta **`Users/TAYSON-nyasuu/...`** (ruta local subida por error), sin `package.json` en la raíz, por eso el build en Vercel no generaba `dist`.

## Paso A — Arreglar Vercel (sin tocar código)

1. Entra en [vercel.com](https://vercel.com) → equipo **seinent-bytes-projects** → proyecto **ocr**.
2. **Settings** (engranaje) → **General**.
3. Busca **Root Directory**:
   - Pulsa **Edit**.
   - **Bórralo todo** y déjalo vacío, o escribe solo un punto: `.`  
   - No uses rutas tipo `C:\...` ni `Users/TAYSON-nyasuu/...`.
4. **Save**.
5. Pestaña **Settings** → **Environment Variables**:
   - Añade `VITE_API_URL` = la URL HTTPS de tu API en Railway (ej. `https://ocr-production-xxxx.up.railway.app`), sin barra al final.
   - Márcala para **Production** y **Preview** (y Development si quieres).

## Paso B — Arreglar el repo GitHub `SEinent-byte/OCR`

Haz esto en una carpeta temporal (o clona el repo en otro directorio).

### Opción 1: GitHub web (rápido si son pocas carpetas)

1. Abre `https://github.com/SEinent-byte/OCR/tree/master`.
2. Entra en la carpeta **`Users`** y bórrala por completo desde la UI (o borra archivo por archivo hasta vaciar el repo).  
   Si la UI no deja borrar carpetas grandes, usa la opción 2.

### Opción 2: Git en tu PC (recomendado)

```powershell
cd $env:USERPROFILE\Videos\entregable
git clone https://github.com/SEinent-byte/OCR.git OCR-repo-fix
cd OCR-repo-fix
git checkout master
```

Elimina el contenido incorrecto y copia el front (ajusta la ruta si tu monorepo está en otro sitio):

```powershell
Remove-Item -Recurse -Force Users
Copy-Item -Path "..\municipalidad-yau\ocr-vercel-site\*" -Destination . -Recurse -Force
git add -A
git status
git commit -m "fix: front Vite en la raiz del repo para Vercel"
git push origin master
```

Si `Remove-Item Users` falla por permisos, usa `git rm -r --cached Users` y borra físicamente la carpeta, luego `git add -A`.

### Comprobar antes de subir

```powershell
cd OCR-repo-fix
npm ci
npm run build
```

Debe crearse la carpeta **`dist`** con `index.html` dentro.

## Paso C — Redeploy en Vercel

Tras el `git push`:

- Vercel suele desplegar solo. Si no: **Deployments** → **⋯** en el último → **Redeploy**.

## Paso D — Rollback (solo si hace falta)

Si un deploy nuevo falla y antes tenías uno que al menos compilaba:

- **Deployments** → elige un deploy antiguo con estado **Ready** → **⋯** → **Promote to Production** (o **Rollback** según la UI).

El primer deploy “Ready” que tenías seguía dando **404 en `/`** porque no había archivos en `dist`; el rollback solo sirve mientras corriges el repo; la solución definitiva es el **Paso B** + Root Directory vacío.

## Resumen

| Dónde | Qué hacer |
|-------|-----------|
| Vercel → Root Directory | Vacío o `.` |
| Vercel → Variables | `VITE_API_URL` = URL Railway |
| GitHub `OCR` | Raíz = este proyecto (sin carpeta `Users`) |
| Local | `npm ci` + `npm run build` debe generar `dist/` |
