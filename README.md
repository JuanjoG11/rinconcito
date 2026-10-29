# 🐚 Rincóncito de la Costeña — Sistema de Pedidos

Sistema de gestión de pedidos en tiempo real para restaurante de mariscos.

---

## 🚀 Uso local (red LAN del restaurante)

**Opción fácil:** Doble clic en `INICIAR.bat`

**Manual:**
```bash
# Terminal 1 — Backend
cd backend
npm install
node server.js

# Terminal 2 — Frontend
cd frontend
npm install
npx vite
```

El backend imprime las URLs exactas al arrancar:
```
📋 Mesero      →  http://192.168.x.x:5173/pedidos
👨‍🍳 Cocina      →  http://192.168.x.x:5173/cocina
📊 Dashboard   →  http://192.168.x.x:5173/dashboard
⚙️  Admin       →  http://192.168.x.x:5173/admin
```

---

## ☁️ Deploy en producción

### Backend → Railway (soporta WebSockets / Socket.IO)

1. Ve a [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Selecciona este repo → **Root Directory: `backend`**
3. Agrega las variables de entorno:
   ```
   SUPABASE_URL=https://hpuwockpgsluhavsuywo.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<tu service_role key>
   PORT=3001
   ```
4. Railway genera una URL pública tipo `https://rinconcito-backend.railway.app`

### Frontend → Vercel

1. Ve a [vercel.com](https://vercel.com) → Import desde GitHub
2. Selecciona este repo → **Root Directory: `frontend`**
3. Framework: **Vite** (lo detecta automáticamente)
4. Agrega la variable de entorno:
   ```
   VITE_BACKEND_URL=https://rinconcito-backend.railway.app
   ```
5. Deploy → Vercel genera `https://rinconcito.vercel.app`

---

## 📱 Pantallas (PWA instalable por dispositivo)

| Ruta | Dispositivo | App instalable |
|------|-------------|----------------|
| `/pedidos` | Tablet del mesero | **Mesero 🐚** |
| `/cocina` | TV / tablet cocina | **Cocina 🔥** |
| `/dashboard` + `/historial` | PC admin | **Admin 📊** |
| `/admin` | PC admin | Gestión del menú |

---

## 🛠️ Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite + PWA |
| Backend | Node.js + Express + Socket.IO |
| Base de datos | Supabase (PostgreSQL) |
| Tiempo real | Socket.IO (WebSockets) |
| Deploy frontend | Vercel |
| Deploy backend | Railway |

---

## ⚙️ Variables de entorno

### `backend/.env`
```env
SUPABASE_URL=https://hpuwockpgsluhavsuywo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key de Supabase>
PORT=3001
```

### `frontend/.env` (solo para producción)
```env
VITE_BACKEND_URL=https://tu-backend.railway.app
```
