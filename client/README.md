# IoT Smart Farm - Client

## Prerequisites

- Node.js v18+
- Docker (required to run MongoDB and RabbitMQ for the server)
- The **server** must be running before starting the client — see [`server/README.md`](../server/README.md)

## Setup

```bash
npm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server at `http://localhost:5173` |
| `npm run build` | Build for production (output in `dist/`) |
| `npm run preview` | Preview the production build locally |

## Usage

### 1. Pair a device
Enter the MAC address of your ESP32 board in the input field (format: `AA:BB:CC:DD:EE:FF`) and click **Pair**.

A success message will appear once the device is found.

### 2. View sensor data
After pairing, the dashboard displays live readings pushed from the device:

| Card | Sensor |
|------|--------|
| Temperature | Ambient temperature (°C) |
| Light intensity | Light level (lux) |
| Soil moisture | Soil moisture (%) |
| Humidity | Air humidity (%) |

### 3. Trigger watering
Click the **Watering** button to manually activate the pump. The button is disabled until a device is paired.