# AGOS Admin Frontend

Admin dashboard for AGOS — a real-time water management and flood monitoring platform.

## Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite 7
- **Styling**: Tailwind CSS (primary: #0A3D62, accent: #1ABC9C, font: Poppins)
- **Routing**: React Router 7
- **HTTP**: Axios (JWT auto-refresh interceptor)
- **Charts**: Chart.js + react-chartjs-2
- **Export**: ExcelJS, PapaParse
- **Icons**: Lucide React
- **State**: Context API (no Redux/Zustand)
- **Real-time**: WebSocket

## Prerequisites

- Node.js 18+
- Running AGOS backend

## Setup

```bash
# Install dependencies
npm install

# Create .env file
echo 'VITE_API_BASE_URL=http://localhost:8000' > .env
echo 'VITE_API_WS_URL=ws://localhost:8000' >> .env

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL (e.g., `http://localhost:8000`) |
| `VITE_API_WS_URL` | Backend WebSocket origin (e.g., `ws://localhost:8000`; app appends `/ws`) |
| `VITE_CARTO_BASEMAP_API_KEY` | CARTO basemap key used by the evacuation-center location picker. Add it to Vercel for production deployments. |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Public Dashboard | Read-only live status cards for unauthenticated visitors; authenticated admins redirect to `/admin` |
| `/admin/dashboard` | Dashboard | Fusion risk score, water level, weather, blockage status, live camera frames |
| `/admin/weather` | Weather | Weather conditions from OpenMeteo |
| `/admin/sensor` | Sensor | Sensor config, readings table, water level trend chart, data export |
| `/admin/responders` | Responders | Responder list, groups, notification templates, announcements |
| `/admin/reading-logs` | Reading Logs | Daily summaries, charts, AI analysis (SSE streaming) |
| `/admin/notification-logs` | Notification Logs | Per-responder delivery history, analytics cards, Excel export |
| `/admin/detection-logs` | Detection Logs | AI blockage detection image history |
| `/admin/admins` | Admins | Admin user management (create, deactivate/reactivate), audit logs |
| `/admin/settings` | Settings | Data retention, sensor configuration |

## Project Structure

```
src/
├── components/          # Shared components (Sidebar, MainLayout, ErrorBoundary, etc.)
├── context/             # Global context providers
│   ├── AuthContext       # JWT auth state + auto-refresh
│   ├── CoreContext        # Location and device data
│   ├── WebSocketContext   # WS connection + message subscription
│   ├── BlockageContext    # Blockage detection state
│   ├── WeatherContext     # Weather data state
│   ├── WaterLevelContext  # Sensor data state
│   ├── FusionAnalysisContext  # Fusion risk score state
│   ├── VideoContext       # Latest live camera frame from WebSocket
│   └── ToastContext       # Toast notifications
├── hooks/               # Custom hooks (useAnalysisStream)
├── lib/api/             # API client modules (one per domain)
├── pages/               # Page components (folder per page)
└── types/               # TypeScript interfaces (one per domain)
```

## Auth

JWT-based with access + refresh tokens. The axios interceptor automatically refreshes expired tokens. Admin login at `/auth/login`.
