# Multi-stage build for SoundWave music streaming app
# Stage 1: Node.js builder
FROM node:18-alpine AS node-builder
WORKDIR /app/node-service
COPY backend/node-service/package*.json ./
RUN npm ci --only=production

# Stage 2: Python builder
FROM python:3.11-slim AS python-builder
WORKDIR /app/python-service
COPY backend/python-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Final runtime image
FROM python:3.11-slim
WORKDIR /app

# Install Node.js runtime and curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs npm curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=python-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy Node.js dependencies from builder
COPY --from=node-builder /app/node-service/node_modules ./backend/node-service/node_modules

# Copy application code
COPY backend/python-service ./backend/python-service
COPY backend/node-service ./backend/node-service

# Expose ports
EXPOSE 8000 3000

# Set working directory for Python service
WORKDIR /app/backend/python-service

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health && curl -f http://localhost:3000/health || exit 1

# Start both services
CMD ["sh", "-c", "python main.py & cd ../node-service && npm start & wait"]
