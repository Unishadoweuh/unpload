# UnPload Deployment Guide

Complete guide for deploying UnPload in production environments.

---

## Quick Start (Docker Compose)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Domain name (optional, for HTTPS)

### 1. Clone Repository
```bash
git clone https://lab.unishadow.ovh/Unishadow/unpload.git
cd unpload
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
nano .env
```

**Required variables:**
```env
# Database
DATABASE_URL=postgresql://user:password@db:5432/unpload

# Security
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=another-secret-key-min-32-chars

# URLs
APP_URL=https://your-domain.com
API_URL=https://your-domain.com/api
```

### 3. Deploy
```bash
cd docker
docker compose up -d
```

### 4. Access
- **Frontend**: http://localhost:3000 (or your domain)
- **API**: http://localhost:4000
- **Swagger**: http://localhost:4000/api/docs

---

## Production Configuration

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | - | Secret for access tokens (32+ chars) |
| `JWT_REFRESH_SECRET` | ✅ | - | Secret for refresh tokens |
| `APP_URL` | ✅ | - | Public frontend URL |
| `API_URL` | - | `APP_URL` | Public API URL |
| `API_PORT` | - | `4000` | API server port |
| `STORAGE_TYPE` | - | `local` | `local` or `s3` |
| `STORAGE_PATH` | - | `/data/uploads` | Local storage path |
| `S3_ENDPOINT` | - | - | S3-compatible endpoint |
| `S3_BUCKET` | - | - | S3 bucket name |
| `S3_ACCESS_KEY` | - | - | S3 access key |
| `S3_SECRET_KEY` | - | - | S3 secret key |
| `S3_REGION` | - | `us-east-1` | S3 region |
| `DISCORD_CLIENT_ID` | - | - | Discord OAuth client ID |
| `DISCORD_CLIENT_SECRET` | - | - | Discord OAuth secret |

---

## Deployment Options

### Option A: Docker Compose (Recommended)

Best for single-server deployments.

```yaml
# docker/docker-compose.yml
services:
  api:
    image: unpload-api:latest
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - unpload_data:/data/uploads
    
  web:
    image: unpload-web:latest
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000
    
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Option B: Kubernetes

For scalable, multi-node deployments.

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: unpload-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: unpload-api:latest
        envFrom:
        - secretRef:
            name: unpload-secrets
```

### Option C: Manual (Node.js)

Direct installation without Docker.

```bash
# Build
npm install
npm run build

# Database
npx prisma migrate deploy

# Run
NODE_ENV=production npm start
```

---

## Reverse Proxy Setup

### Caddy (Included)

Already configured in `docker/Caddyfile`:

```caddy
your-domain.com {
    reverse_proxy /api/* api:4000
    reverse_proxy web:3000
}
```

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        client_max_body_size 100M;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

### Traefik

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.unpload.rule=Host(`your-domain.com`)"
  - "traefik.http.routers.unpload.tls.certresolver=letsencrypt"
```

---

## Database Setup

### PostgreSQL Production Settings

```sql
-- Recommended for production
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '768MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
```

### Migrations

```bash
# Apply migrations
npx prisma migrate deploy

# Generate client
npx prisma generate

# Reset database (⚠️ destroys data)
npx prisma migrate reset
```

### Backup

```bash
# Backup
pg_dump -h localhost -U postgres unpload > backup.sql

# Restore
psql -h localhost -U postgres unpload < backup.sql
```

---

## S3 Storage Configuration

### MinIO (Self-hosted)

```yaml
minio:
  image: minio/minio
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: unpload
    MINIO_ROOT_PASSWORD: your-password
  volumes:
    - minio_data:/data
```

```env
STORAGE_TYPE=s3
S3_ENDPOINT=http://minio:9000
S3_BUCKET=unpload
S3_ACCESS_KEY=unpload
S3_SECRET_KEY=your-password
```

### AWS S3

```env
STORAGE_TYPE=s3
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=...
S3_REGION=eu-west-1
```

---

## Security Checklist

- [ ] Change default JWT secrets
- [ ] Enable HTTPS (via Caddy or nginx)
- [ ] Set secure database password
- [ ] Configure firewall (only expose 80/443)
- [ ] Set `NODE_ENV=production`
- [ ] Disable debug logs
- [ ] Configure rate limiting
- [ ] Regular backups scheduled
- [ ] Update dependencies regularly

---

## Monitoring

### Health Check

```bash
# API health
curl http://localhost:4000/api/health

# Response
{"status":"ok","timestamp":"..."}
```

### Logs

```bash
# All containers
docker compose logs -f

# API only
docker compose logs -f api

# Last 100 lines
docker compose logs --tail 100 api
```

---

## Troubleshooting

### Database Connection Failed

```bash
# Check if database is running
docker compose ps db

# Check database logs
docker compose logs db

# Test connection
docker compose exec db psql -U postgres -c "SELECT 1"
```

### File Upload Fails

1. Check volume permissions
2. Verify `STORAGE_PATH` exists
3. Check disk space: `df -h`
4. Check logs: `docker compose logs api`

### CORS Errors

Ensure `APP_URL` in `.env` matches your actual domain.

---

## Updates

```bash
# Pull latest
git pull origin main

# Rebuild
docker compose build

# Restart with zero downtime
docker compose up -d --no-deps api
docker compose up -d --no-deps web

# Apply migrations
docker compose exec api npx prisma migrate deploy
```

---

*For support, open an issue on the repository.*
