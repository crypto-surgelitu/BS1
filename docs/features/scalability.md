# Scalability Features

The SwahiliPot Hub Room Booking System is designed to withstand high traffic loads through several scalability mechanisms implemented in the backend.

## 1. Node.js Clustering
The application utilizes Node.js's native `cluster` module to scale across multiple CPU cores.

- **Mechanism:** The master process forks a worker process for each available CPU core.
- **Benefit:** Allows the single-threaded Node.js application to utilize multi-core systems, handling significantly more concurrent connections.
- **Resilience:** If a worker process dies, the master process automatically forks a replacement.

## 2. Database Connection Pooling
MySQL connections are managed via a connection pool rather than opening/closing connections for each request.

- **Configurable Limit:** The pool size is configurable via `DB_CONNECTION_LIMIT` environment variable (default: 10).
- **Behavior:** `waitForConnections: true` ensures that when the pool is full, requests queue up instead of failing immediately.

## 3. Stateless Authentication
The system uses JWT (JSON Web Tokens) for authentication.

- **Benefit:** No session state is stored in the application memory, allowing any worker process to handle any request.
- **Scaling:** This architecture allows easy horizontal scaling (adding more servers behind a load balancer) without sticky sessions.

## 4. Graceful Shutdown
The server handles `SIGTERM` and `SIGINT` signals to shut down gracefully.

- **Process:** Stops accepting new connections, waits for existing requests to complete, and closes the database pool before exiting.
- **Benefit:** Prevents data corruption and dropped requests during deployments or autoscaling events.

## Configuration
To optimize for high load, adjust the following `.env` variables:

```env
# Database Pool Size (Recommend: 50-100 for high traffic)
DB_CONNECTION_LIMIT=50

# Rate Limiting (Adjust based on expected traffic)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```
