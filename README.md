# 🐚 Rincóncito de la Costeña — Sistema de Pedidos

Sistema de gestión de pedidos en tiempo real para restaurante de mariscos.

## 🚀 Cómo iniciar

**Opción fácil:** Doble clic en `INICIAR.bat`

**Manual:**
```bash
# Terminal 1 — Backend
cd backend
node server.js

# Terminal 2 — Frontend
cd frontend
npx vite
```

Luego abre: **http://localhost:5173**

---

## 📱 Pantallas

| Ruta | Descripción |
|------|-------------|
| `/` | Inicio — acceso rápido a todas las vistas |
| `/pedidos` | 📋 Tomar pedido por mesa |
| `/cocina` | 👨‍🍳 Pantalla de cocina (tiempo real) |
| `/historial` | 📜 Trazabilidad de todos los pedidos |
| `/dashboard` | 📊 Dashboard del día para el administrador |
| `/admin` | ⚙️ Gestión del menú |

---

## ⚡ Flujo del pedido

```
Mesero toma pedido → PENDIENTE → EN PREPARACIÓN → LISTO → ENTREGADO
```

- La cocina recibe el pedido **en tiempo real** vía WebSocket
- Cada cambio de estado se propaga a todas las pantallas abiertas
- El historial guarda la trazabilidad completa

---

## 🍽️ Menú incluido (25 platos)

- **Entradas:** Ceviches, Cóctel de Camarones, Patacones
- **Sopas:** Sancocho de Pescado, Sopa de Mariscos
- **Platos Fuertes:** Bandeja de Mariscos, Mojarra, Camarones, Langostinos, etc.
- **Bebidas:** Limonadas, Jugos, Cerveza, Gaseosa
- **Postres:** Arroz con Leche, Tres Leches, Cocada

---

## 🛠️ Tecnología

- **Backend:** Node.js + Express + Socket.IO + SQLite (better-sqlite3)
- **Frontend:** React + Vite + React Router + Socket.IO client
- **Base de datos:** SQLite (archivo local `backend/rinconcito.db`)
