# plants-sockets-server

Real-time communication server for an IoT plant monitoring and care system, developed as the final project (PIA) for the *Sistemas Telefónicos* course of an engineering degree.

The system monitors a plant's environment through sensors connected to an ESP32 and lets the user check its status and act on it from a web application. This server is the core of that communication: it receives the sensor readings from the device, distributes them to the web clients in real time and delivers the user's commands back to the microcontroller.

## Project architecture

The solution is split into three repositories, one for each layer of the system:

| Repository | Layer | Description |
| --- | --- | --- |
| [plants-monitoring-esp32](https://github.com/Alejandro095/plants-monitoring-esp32) | Device | ESP32 firmware. Reads the sensors and controls the actuators. |
| [plants-sockets-server](https://github.com/Alejandro095/plants-sockets-server) | Server | WebSocket server (this repository). Connects the device with the web clients. |
| [plants-monitoring-app](https://github.com/Alejandro095/plants-monitoring-app) | Client | Web application. Displays live readings and sends actions to the device. |

```
┌──────────────┐   sensor data (every 2 s)   ┌────────────────┐   live updates   ┌──────────────┐
│    ESP32     │ ──────────────────────────▶ │ Socket server  │ ───────────────▶ │   Web app    │
│  + sensors   │                             │  (Node.js/ws)  │                  │  (Next.js)   │
│  + actuators │ ◀────────────────────────── │                │ ◀─────────────── │              │
└──────────────┘          actions            └────────────────┘   user actions   └──────────────┘
```

All three components communicate over WebSockets on a secure connection (WSS). The server is deployed on [Railway](https://railway.app).

## Features

**Environmental monitoring.** Every 2 seconds the ESP32 reports four variables, which the web app shows on its dashboard:

| Variable | Sensor | Unit |
| --- | --- | --- |
| Light | LDR (photoresistor) in a voltage divider | % |
| Soil moisture | Soil moisture probe | % |
| Air temperature | DHT11 | °C |
| Air humidity | DHT11 | % |

**Remote control.** From the web app the user can trigger four actions on the plant's environment:

| Action | Behavior on the device |
| --- | --- |
| Water (`regar`) | Turns on the water pump for 4 seconds |
| Fertilize (`abono`) | Toggles the fertilizer output on/off |
| Ventilate (`ventilar`) | Toggles the ventilation output on/off |
| Doors (`puertas`) | Opens/closes the enclosure doors |

**State on connect.** The server keeps the latest reading in memory, so any client that connects immediately receives the current values without waiting for the next sample.

**Broadcast.** Every new reading is sent to all connected clients at the same time, which allows several users to watch the plant simultaneously.

## Message protocol

The system uses its own lightweight plain-text protocol instead of JSON. This keeps message construction and parsing simple on the microcontroller, where memory and processing are limited.

```
origin~action~data
```

- Fields are separated by `~`.
- Multiple values inside `data` are separated by `|`.
- The `origin` prefix indicates who the message is addressed to (`microcontroller` or `client-web`), so each client processes only the messages meant for it.

### Sensor readings (ESP32 → server → web)

The ESP32 sends the values in this order: light, soil moisture, air temperature, air humidity.

```
microcontroller~set-data~78.00|45.00|24.50|60.0
```

The server stores them and broadcasts:

```
client-web~set-data~78.00|45.00|24.50|60.0
```

### Actions (web → server → ESP32)

The web app sends the selected action:

```
client-web~set-action~regar
```

The server forwards it to the device:

```
microcontroller~set-action~regar
```

## Tech stack

**Server (this repository)**
- Node.js
- [ws](https://github.com/websockets/ws) – WebSocket server
- nodemon – automatic reload during development
- Railway – deployment

**Device**
- ESP32 programmed with the Arduino framework
- WebSockets_Generic – WebSocket client with SSL, auto-reconnect and heartbeat
- DHTesp – DHT11 sensor reading

**Web application**
- Next.js 13 + React 18
- TypeScript
- Tailwind CSS
- react-icons

## Getting started

Requirements: Node.js.

```bash
git clone https://github.com/Alejandro095/plants-sockets-server.git
cd plants-sockets-server
npm install
npm run dev
```

The server listens on port `1234` by default. A different port can be set through the `PORT` environment variable:

```bash
PORT=8080 npm start
```

### Testing without hardware

The device can be simulated with [wscat](https://github.com/websockets/wscat). Open one terminal acting as the ESP32 and send a reading:

```bash
npx wscat -c ws://localhost:1234
> microcontroller~set-data~78.00|45.00|24.50|60.0
```

Any other connected client (for example, the web app pointing to `ws://localhost:1234`) will receive the update instantly.

## Team

- Javier Alejandro Monsivais Tovar
- Christian Martínez Sáenz
- Andrés Michel Salazar Ruiz
