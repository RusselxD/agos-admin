# Admin Frontend Architecture

## Overview

The admin frontend is a single-page React application for monitoring and managing the AGOS water management system. It provides real-time dashboards, responder management, historical data analysis, and system configuration.

## State Management

Context API only — no Redux or Zustand. Contexts are layered by scope:

### Global Contexts (always active)

| Context | Hook | Purpose |
|---------|------|---------|
| `AuthContext` | `useAuth()` | JWT state, login/logout, token refresh |
| `ToastContext` | `useToast()` | `toastSuccess()`, `toastError()` notifications |

### Domain Contexts (under protected routes)

Nested in this order inside `MainLayout`:
```
CoreProvider → WebSocketProvider → BlockageProvider → VideoProvider → WeatherProvider → WaterLevelProvider → FusionAnalysisProvider
```

| Context | Hook | Data source |
|---------|------|-------------|
| `CoreContext` | `useCoreHook()` | Location + device details (REST on mount) |
| `WebSocketContext` | `useWebSocket()`, `useWebSocketMessage()` | WS connection + pub/sub |
| `BlockageContext` | `useWaterwayContext()` | `blockage_detection_update` via WS |
| `VideoContext` | `useVideoContext()` | Latest live camera frame via `camera_update` WS messages |
| `WeatherContext` | `useWeather()` | `weather_update` via WS |
| `WaterLevelContext` | `useWaterLevel()` | `sensor_update` via WS |
| `FusionAnalysisContext` | `useFusionAnalysis()` | `fusion_analysis_update` via WS |

### Page-Level Contexts

| Context | Hook | Page |
|---------|------|------|
| `RespondersPageContext` | — | Responders (tabs, selected responder) |
| `AdminsPageContext` | — | Admins (user list, logs) |
| `ReadingLogsContext` | — | Reading Logs (date range, summaries) |

## Authentication

JWT-based with automatic token refresh:

1. Login → `POST /auth/login` → stores access + refresh tokens in `localStorage`
2. Axios request interceptor injects `Authorization: Bearer <token>`
3. On 401 response → interceptor calls `POST /auth/refresh` → retries original request
4. Refresh failure → redirect to `/auth/login`

`AuthContext` decodes the access token into in-memory user state, but token persistence is in `localStorage` so refresh survives page reloads. `force_password_change` redirects to `/auth/force-password-change`.

## API Layer (`src/lib/api/`)

Each domain has its own API file exporting a const object with async methods. All use the shared `apiClient` (axios instance).

| File | Object | Backend prefix |
|------|--------|---------------|
| `auth.ts` | `authAPI` | `/auth` |
| `core.ts` | `coreAPI` | `/core` |
| `sensor.ts` | `sensorAPI` | `/sensor-devices`, `/sensor-readings` |
| `weather.ts` | `weatherAPI` | `/weather` |
| `responder.ts` | `responderAPI` | `/responders` |
| `responderGroup.ts` | `responderGroupAPI` | `/responder-groups` |
| `notification.ts` | `notificationAPI` | `/push` |
| `notificationTemplate.ts` | `notificationTemplatesAPI` | `/notification-templates` |
| `notificationLog.ts` | `notificationLogAPI` | `/notification-logs` |
| `modelReadingLog.ts` | `modelReadingLogAPI` | `/model-reading-logs` |
| `readingLogs.ts` | `readingLogsAPI` | `/daily-summaries` |
| `adminUser.ts` | `adminUsersAPI` | `/admin-users`, `/admin-audit-logs` |
| `settings.ts` | `settingsAPI` | `/system-settings` |
| `upload.ts` | `uploadAPI` | Cloudinary upload |

**Field naming convention:** snake_case directly — no client-side transformation (unlike the responder PWA which auto-converts).

## Type Layer (`src/types/`)

One file per domain. Uses `interface` (not `type`) for objects. Fields are `snake_case` matching the backend schema exactly.

Key types:
- `NotificationType = "critical" | "warning" | "blockage" | "announcement"`
- `SensorReadingTrendResponse = { labels: string[], levels: number[] }`
- `FusionAnalysisData = { fusion_data, blockage_status?, water_level_status?, weather_status? }`

## Routing (`src/router.tsx`)

```
/
├── /auth
│   ├── /login                    → Login
│   └── /force-password-change    → ForcePasswordChange
└── ProtectedRoute + Providers + MainLayout
    ├── /dashboard                → Dashboard (default)
    ├── /weather                  → Weather
    ├── /sensor                   → Sensor
    ├── /responders               → Responders
    ├── /reading-logs             → ReadingLogs
    ├── /notification-logs        → NotificationLogs
    ├── /detection-logs           → DetectionLogs
    ├── /evacuation               → Evacuation control and centers
    ├── /admins                   → Admins (with AdminsPageProvider)
    └── /settings                 → Settings
```

`/` enters the protected application and redirects authenticated admins to `/dashboard`. Unauthenticated visitors are redirected to `/auth/login`.

## Page Architecture

Each page follows the same structure:
```
src/pages/PageName/
├── PageName.tsx           # Main component
├── index.ts               # Barrel export
├── components/            # Page-specific components
└── context/               # Page-level context (optional)
```

### Dashboard
- **FusionAnalysisCard** — Risk score with tier indicator and triggered conditions
- **BlockageStatusCard** — Clear/partial/blocked with percentage bar
- **WaterLevelCard** — Current level, trend, alert distances
- **WeatherCard** — Conditions, precipitation, temperature
- **VideoContainer** — latest base64 JPEG frame from `camera_update`

### Sensor
- **SensorStatus** — Device connection state, signal strength
- **SensorReadings** — Paginated table with export to Excel
- **WaterLevelTrend** — Chart.js line chart (1h/6h/12h/24h/7d)

### Responders (4 tabs)
- **ResponderList** — All responders with status badges, detail drawer
- **ResponderGroups** — Group CRUD with member management
- **NotificationTemplates** — Template CRUD (one per type for warning/critical/blockage)
- **Announce** — Send push notifications to selected responders/groups

### Reading Logs
- **Charts** — Daily summary visualizations
- **DataTable** — Tabular summary data
- **DayDetailPanel** — Detailed view for selected day
- **AnalyzePanel** — AI streaming analysis via SSE (`useAnalysisStream` hook)

### Detection Logs
- **ReadingListItem** — Paginated blockage detection list with status filter chips
- **ReadingDetailDrawer** — Side drawer showing captured image + metadata

### Notification Logs
- **Summary cards** — Per-responder delivery statistics
- **Delivery list** — Paginated notification history with type filter
- **Detail drawer** — Full delivery details + acknowledgement status

## Hooks

### `useAnalysisStream`
SSE streaming hook for AI analysis:
- States: `idle` → `loading` → `streaming` → `done` / `error`
- POST to `/api/v1/analysis/daily-summaries`
- Streams text chunks from Groq LLM
- AbortController for cancellation
- Returns `{ text, status, analyze(payload), reset() }`

## Component Patterns

- **Side drawer**: Width transition pattern for detail views (0 → fixed width)
- **Skeleton loading**: `<div className="skeleton w-full h-14 rounded-md" />`
- **Section headers**: `pl-2 border-l-4 font-semibold text-gray-600 border-primary`
- **Pagination**: `{ items, has_more }` — no total count, load more pattern

## Sidebar (`src/components/Sidebar.tsx`)

9 navigation tabs with Lucide icons:

| # | Label | Icon | Route |
|---|-------|------|-------|
| 1 | Dashboard | MonitorDot | `/dashboard` |
| 2 | Weather | CloudSunRain | `/weather` |
| 3 | Sensor | Waves | `/sensor` |
| 4 | Responders | Users | `/responders` |
| 5 | Reading Logs | FileCheck | `/reading-logs` |
| 6 | Notif Logs | BellRing | `/notification-logs` |
| 7 | Detection Logs | ScanEye | `/detection-logs` |
| 8 | Evacuation | Siren | `/evacuation` |
| 9 | Admins | UserStar | `/admins` |
| 10 | Settings | Settings | `/settings` |

Collapsible: 20px collapsed / 56px expanded. Active tab indicated by left border highlight.

## Styling

- **Tailwind CSS** with custom theme
- Primary: `#0A3D62`, Accent: `#1ABC9C`
- Font: Poppins
- Notification colors: critical=red, warning=amber, blockage=orange, announcement=blue
- Custom classes: `custom-shadow`, `btn-custom`
