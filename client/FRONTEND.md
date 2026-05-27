# IoT Smart Farm — Frontend Documentation

## Stack

| Tool | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool and dev server |
| React Router DOM | 7 | Client-side routing |
| @stomp/stompjs | 7 | WebSocket (RabbitMQ STOMP) client |
| Chart.js + react-chartjs-2 | 4 / 5 | Data visualization |

---

## Directory Structure

```
client/src/
├── api/
│   └── farm.js                  # All HTTP calls to the backend
├── assets/                      # Sensor icons (PNG)
├── components/
│   ├── DisplayCard.jsx           # Live sensor reading cards
│   ├── Navbar.jsx                # Top navigation bar
│   └── SensorChart.jsx           # Live line chart (WebSocket data)
├── context/
│   └── DeviceContext.jsx         # Global device state (deviceId, readings, history)
├── hooks/
│   └── useFarmDevice.js          # Core logic: pairing, WebSocket, pump trigger
├── pages/
│   ├── Dashboard.jsx             # Live monitoring + device pairing
│   ├── Analytics.jsx             # Historical charts and tables
│   ├── Alerts.jsx                # Alert log viewer
│   └── Settings.jsx              # Sensor thresholds + pump config
├── App.jsx                       # Root: layout + routes
├── App.css                       # All component styles
└── index.css                     # CSS variables and global resets
```

---

## Architecture

### State Management

There is no Redux or Zustand. Device state is managed by a single custom hook (`useFarmDevice`) and shared globally through a React Context (`DeviceContext`).

```
main.jsx
  └── BrowserRouter
        └── App
              └── DeviceProvider          ← wraps the entire app
                    ├── Navbar            ← reads deviceId for status indicator
                    └── <Routes>
                          ├── Dashboard   ← pair + water + live charts
                          ├── Analytics   ← historical data
                          ├── Alerts      ← alert log
                          └── Settings    ← sensor + pump config
```

Because `DeviceProvider` sits at the top, pairing a device on the Dashboard automatically makes `deviceId` available on every other page without prop drilling or re-fetching.

---

## Core Hook — `useFarmDevice`

**File:** [src/hooks/useFarmDevice.js](src/hooks/useFarmDevice.js)

Manages all device-level state and side effects:

| State | Type | Description |
|---|---|---|
| `deviceId` | `string \| null` | MongoDB ObjectId of the paired device |
| `readings` | `object \| null` | Latest sensor readings `{ temp, light, soil, humid }` |
| `history` | `array` | Rolling buffer of up to 60 live readings (used by live charts) |
| `pairError` | `string \| null` | Error message from a failed pairing attempt |
| `isWatering` | `boolean` | True while the pump trigger request is in flight |

| Function | Description |
|---|---|
| `pair(macAddress)` | Calls `POST /device/lookup`, sets `deviceId` on success |
| `water()` | Calls `POST /irrigation/:id/pump`, guarded by `isWatering` flag |

**WebSocket:** When `deviceId` is set, the hook opens a STOMP connection to RabbitMQ at `ws://localhost:15674/ws` and subscribes to `/exchange/telemetry/device.{deviceId}`. Each incoming message appends to `history` and updates `readings`. The connection is torn down on unmount or when `deviceId` changes.

---

## DeviceContext

**File:** [src/context/DeviceContext.jsx](src/context/DeviceContext.jsx)

A thin wrapper that calls `useFarmDevice()` once at the top of the tree and provides the result to all consumers via `useDevice()`.

```js
// Any component or page can access device state:
const { deviceId, readings, history, pair, water, isWatering } = useDevice();
```

---

## API Service

**File:** [src/api/farm.js](src/api/farm.js)

All backend communication. Base URL: `http://localhost:3000`.

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `lookupDevice(macAddress)` | POST | `/device/lookup` | Find device by MAC, returns device document |
| `triggerPump(deviceId)` | POST | `/irrigation/:id/pump` | Manually trigger the water pump |
| `getLatestTelemetry(deviceId)` | GET | `/analytic/telemetry/latest` | Most recent sensor reading from DB |
| `getTelemetryTrend({ deviceId, startDate, endDate, resolution })` | GET | `/analytic/telemetry/trend` | Aggregated averages grouped by hour/day/week |
| `getTelemetryHistory({ deviceId, startDate, endDate, page })` | GET | `/analytic/telemetry/history` | Paginated raw sensor log |
| `getIrrigationUsage({ deviceId, startDate, endDate })` | GET | `/analytic/irrigation/usage` | Total activations and total duration |
| `getIrrigationHistory({ deviceId, startDate, endDate, page })` | GET | `/analytic/irrigation-history` | Paginated pump event log |
| `getAlerts({ deviceId, startDate, endDate, page })` | GET | `/monitor/alerts` | Paginated alert log |
| `updateSensorConfig(deviceId, sensorType, { minThreshold, maxThreshold })` | POST | `/device/:id/sensor-config/:sensorType` | Set alert thresholds for a sensor |
| `updatePumpConfig(deviceId, config)` | POST | `/device/:id/pump-config` | Set pump automation rules |
| `seedFakeData(deviceId)` | POST | `/analytic/seed-fake-data/:id` | Insert fake historical data (dev only) |

---

## Pages

### Dashboard — `/`

**File:** [src/pages/Dashboard.jsx](src/pages/Dashboard.jsx)

The entry point for operating the farm device.

**Features:**
- MAC address input field to pair a device. Pressing Enter or clicking "Pair Device" calls `pair()` from `useDevice()`.
- Four color-coded sensor cards showing live readings: Temperature, Light, Soil Moisture, Humidity. Values update in real time via WebSocket.
- Four live line charts (one per sensor) that plot the last 60 WebSocket messages. Charts only appear after a device is paired.
- "Water Now" button that calls `triggerPump` on the server. The button shows "Watering…" and is disabled while the request is in flight.

**Data flow:**
```
User types MAC → pair() → POST /device/lookup → deviceId set
                                                     ↓
                              STOMP connects to /exchange/telemetry/device.{id}
                                                     ↓
                              Incoming messages → readings + history updated
                                                     ↓
                              DisplayCard and SensorChart re-render
```

---

### Analytics — `/analytics`

**File:** [src/pages/Analytics.jsx](src/pages/Analytics.jsx)

Historical data explorer. Requires a paired device (redirects with a prompt if none).

**Features:**
- Date range picker (start date / end date) and resolution selector (Hour / Day / Week).
- "Fetch" button fires four API calls in parallel:
  - **Telemetry Trend** — multi-line chart showing average Temperature, Humidity, Soil Moisture, and Light over the selected period. Light is hidden by default (toggle in chart legend).
  - **Irrigation Usage** — two stat cards: total pump activations and total pump run time in seconds.
  - **Telemetry History** — paginated table of raw sensor readings with timestamp.
  - **Irrigation History** — paginated table of pump events showing duration and trigger source (manual vs auto).
- "Seed Fake Data" button calls `POST /analytic/seed-fake-data/:id` to populate test data for the paired device (development helper).
- All tables have next/prev pagination controls.

---

### Alerts — `/alerts`

**File:** [src/pages/Alerts.jsx](src/pages/Alerts.jsx)

Log viewer for sensor threshold violations.

**Features:**
- Date range filter. If a device is paired, alerts are filtered to that device. If no device is paired, all alerts across all devices are shown.
- Each alert card is color-coded: blue (▼ LOW) or red (▲ HIGH).
- Each card shows: sensor type, status, timestamp, human-readable message, and the recorded sensor value at the time of the alert.
- Paginated (15 per page).

**Alert data fields used:**
- `sensor_type` — which sensor triggered the alert (`temp`, `soil`, `humid`, `light`)
- `status` — `low` or `high`
- `message` — human-readable description
- `value` — the raw sensor reading that caused the alert
- `timestamp` — when the alert was recorded

---

### Settings — `/settings`

**File:** [src/pages/Settings.jsx](src/pages/Settings.jsx)

Configuration panel for the paired device. Requires a paired device.

**Sensor Thresholds section:**

Four cards (Temperature, Light, Soil Moisture, Humidity), each with:
- Min threshold input
- Max threshold input
- Save button → `POST /device/:id/sensor-config/:sensorType` with `{ minThreshold, maxThreshold }`
- Per-card success/error feedback

When a reading falls outside these bounds, the server emits an alert that appears on the Alerts page.

**Pump Configuration section:**

- **Auto Irrigation toggle** — enables or disables automatic pump triggering
- **Trigger sensor** — which sensor drives the automation (Soil Moisture, Temperature, Humidity, or Light)
- **Condition** — `LESS_THAN`, `GREATER_THAN`, or `EQUAL`
- **Threshold value** — numeric value for the condition
- **Cooldown (ms)** — minimum time between automatic pump activations
- **Run duration (ms)** — how long the pump runs per activation
- Save button → `POST /device/:id/pump-config`

---

## Components

### DisplayCard

**File:** [src/components/DisplayCard.jsx](src/components/DisplayCard.jsx)

Renders a 2×2 grid of sensor reading cards. Each card has an icon, a title, and the current value with unit. Shows `--` when no data is available yet.

**Props:**
```js
data: Array<{
  properties: { title: string, icon: string, unit: string },
  value: number | null
}>
```

### SensorChart

**File:** [src/components/SensorChart.jsx](src/components/SensorChart.jsx)

A Chart.js line chart that plots live WebSocket readings over time.

**Props:**
```js
history: Array<{ time: Date, readings: { temp, light, soil, humid } }>
sensorKey: 'temp' | 'light' | 'soil' | 'humid'
```

Each sensor key maps to a label, unit, and color:

| Key | Label | Unit | Color |
|---|---|---|---|
| `temp` | Temperature | °C | Red `#e84040` |
| `light` | Light intensity | lux | Amber `#e6a800` |
| `soil` | Soil moisture | % | Blue `#4169e1` |
| `humid` | Humidity | % | Cyan `#0096c7` |

The chart has `animation: false` for smooth real-time updates.

### Navbar

**File:** [src/components/Navbar.jsx](src/components/Navbar.jsx)

Sticky top navigation bar with four links (Dashboard, Analytics, Alerts, Settings). Active link is highlighted using the app's accent color. A device status indicator on the right shows a green dot when a device is paired, grey when not.

---

## Styling

All styles are in [src/App.css](src/App.css) using plain CSS with the variables defined in [src/index.css](src/index.css).

**Key CSS variables:**
```css
--accent:        #aa3bff   /* purple — buttons, active states */
--accent-bg:     rgba(170, 59, 255, 0.1)
--border:        #e5e4e7
--text-h:        #08060d
--bg:            #fff
--sans:          system-ui, 'Segoe UI', Roboto, sans-serif
```

**Sensor card colors:**
```css
.card:nth-child(1) { background: #FF8D8D; }  /* Temperature — red */
.card:nth-child(2) { background: #FFEC7D; }  /* Light — yellow */
.card:nth-child(3) { background: #A1BEFF; }  /* Soil — blue */
.card:nth-child(4) { background: #81D9FF; }  /* Humidity — cyan */
```

---

## Running the Client

```bash
cd client
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build to dist/
```

**Prerequisites:**
- Backend server running at `http://localhost:3000`
- RabbitMQ STOMP WebSocket at `ws://localhost:15674/ws` (credentials: `admin` / `password`)
