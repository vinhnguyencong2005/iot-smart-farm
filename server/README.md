# IoT Smart Farm Backend

This repository contains the backend server for the IoT Smart Farm project. It is built with NestJS and provides:

- MQTT integration for incoming sensor telemetry and outgoing pump commands
- MongoDB persistence for devices and global state
- RabbitMQ event publishing for the monitoring UI
- REST API and Swagger documentation

## Prerequisites

Before you start, make sure your machine has:

- Node.js 18+ and npm
- Docker and Docker Compose (recommended for MongoDB and RabbitMQ)
- Optional: an Adafruit IO account if you want MQTT connectivity to ESP32 devices

## Local setup

1. Open a terminal and navigate to the project folder

2. Install Node.js dependencies:

~~~bash
npm install
~~~

3. Start required services with Docker Compose:

~~~bash
docker compose up -d
~~~

This starts:

- mongodb on localhost:27017
- rabbitmq on localhost:5672

The backend publishes realtime telemetry through the RabbitMQ topic exchange named `telemetry`.
Frontend listeners should subscribe to routing keys like `device.<deviceId>` on the `telemetry` exchange.

Example frontend subscription path:

~~~bash
/exchange/telemetry/device.<deviceId>
~~~

Small JavaScript example:

~~~js
const destination = '/exchange/telemetry/device.12345';
client.subscribe(destination, (message) => {
  const data = JSON.parse(message.body);
  console.log('Realtime telemetry:', data);
});
~~~

4. Create a .env file in the project root with the required values.

Example .env:

~~~ini
# MongoDB connection
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_USERNAME=root
MONGODB_PASSWORD=password
MONGODB_DB_NAME=iot_smart_farm_db
MONGODB_AUTH_SOURCE=admin

# RabbitMQ connection
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASS=password

# Adafruit IO MQTT connection (optional for hardware integration)
ADAFRUIT_AIO_USERNAME=your-adafruit-username
ADAFRUIT_AIO_KEY=your-adafruit-key

# HTTP server port
PORT=3000
~~~

If you do not provide Adafruit IO credentials, the backend will still start, but MQTT publishing/subscribing will remain offline.

## Run the application

### Development mode

~~~bash
npm run start:dev
~~~

This runs the NestJS server with file watching enabled.

### Production build

~~~bash
npm run build
npm run start:prod
~~~

### Standard start

~~~bash
npm run start
~~~

## Access the API

Once the server is running, open:

- http://localhost:3000 for the backend
- http://localhost:3000/api-docs for Swagger API documentation

## Run tests

### Unit tests

~~~bash
npm run test
~~~

### End-to-end tests

~~~bash
npm run test:e2e
~~~

### Coverage report

~~~bash
npm run test:cov
~~~

## Useful commands

- npm run lint — run ESLint and automatically fix issues
- npm run format — format source files with Prettier
- npm run test:watch — run Jest in watch mode

## Notes

- The server uses MongoDB for device and state data.
- RabbitMQ is used by the monitoring module for real-time event publishing.
- The MQTT client connects to Adafruit IO using ADAFRUIT_AIO_USERNAME and ADAFRUIT_AIO_KEY.
- The backend listens on the port defined by PORT, defaulting to 3000 if unset.

## Cleanup

To stop and remove Docker services:

~~~bash
docker compose down
~~~

## Getting help

If you need help with NestJS, visit https://docs.nestjs.com
