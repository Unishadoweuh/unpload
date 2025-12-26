# CI/CD Configuration Guide

This document describes how to configure the CI/CD pipeline for UnPload.

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CI/CD Pipeline                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Push/PR ──► build.yml ──► test.yml                            │
│                                                                 │
│  Push to main ──► deploy.yml ──► Build on Server ──► Deploy    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `build.yml` | Push, PR | Lint, type-check, build all packages |
| `test.yml` | Push, PR | Run unit tests and E2E tests |
| `deploy.yml` | Push to main, tags | Build images locally & deploy |

## Architecture: Local Build

This pipeline builds Docker images **directly on the production server** instead of using a registry. This approach:

- ✅ No registry setup required
- ✅ Simpler configuration
- ✅ Full control over build process
- ✅ No network transfer of large images

## Required Secrets

Configure these secrets in your Gitea repository settings:

**Settings → Actions → Secrets**

### Deployment Secrets

| Secret | Required | Description | Example |
|--------|----------|-------------|---------|
| `DEPLOY_HOST` | ✅ | Production server IP/hostname | `192.168.1.100` |
| `DEPLOY_USER` | ✅ | SSH username on the server | `deploy` |
| `DEPLOY_SSH_KEY` | ✅ | Private SSH key (full content) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_PATH` | ❌ | Path to unpload directory | `/opt/unpload` (default) |
| `API_URL` | ❌ | Public API URL | `https://api.unpload.com` |

### Optional Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `DISCORD_WEBHOOK` | Discord webhook for notifications | `https://discord.com/api/webhooks/...` |

## Setup Instructions

### 1. Setup SSH Deployment

```bash
# On your local machine, generate a deploy key
ssh-keygen -t ed25519 -C "deploy@unpload" -f deploy_key

# Copy the public key to your server
ssh-copy-id -i deploy_key.pub user@your-server

# The private key content goes in DEPLOY_SSH_KEY secret
cat deploy_key
```

### 2. Prepare the Production Server

```bash
# On the production server
sudo mkdir -p /opt/unpload
sudo chown $USER:$USER /opt/unpload
cd /opt/unpload

# Clone the repository
git clone https://lab.unishadow.ovh/Unishadow/unpload.git .

# Create production .env file
cp .env.example .env
nano .env  # Configure your production values

# Verify Docker is installed
docker --version
docker compose version
```

### 3. Add Secrets to Gitea

1. Go to your repository on Gitea
2. Navigate to **Settings → Actions → Secrets**
3. Add each secret from the tables above

## How Deployment Works

1. **Push to main** triggers the deploy workflow
2. **Validate job** runs lint, type-check, and build
3. **SSH to server** connects to production
4. **Git pull** gets latest code
5. **Docker build** builds images locally
6. **Prisma migrate** applies database migrations
7. **Docker up** starts the new containers
8. **Health check** verifies API is responding
9. **Rollback** reverts if health check fails

## Manual Deployment

You can trigger a manual deployment from the **Actions** tab:

1. Go to **Actions → CD - Deploy to Production**
2. Click **Run workflow**
3. Select the environment (production/staging)
4. Click **Run workflow**

## Troubleshooting

### Build Fails on Server

1. SSH to the server: `ssh deploy@your-server`
2. Navigate to project: `cd /opt/unpload`
3. Try building manually: `docker compose -f docker/docker-compose.prod.yml build`
4. Check disk space: `df -h`

### Deployment Fails

1. Verify SSH connection: `ssh deploy@your-server`
2. Check Docker is running: `docker ps`
3. Check container logs: `docker logs unpload-api`

### Health Check Fails

1. Verify the API is running: `curl http://localhost:4000/api/health`
2. Check container logs: `docker logs unpload-api`
3. Verify database connection

### Git Pull Fails

1. Ensure the deploy user has git access
2. Check for uncommitted changes on server: `git status`
3. Reset if needed: `git reset --hard origin/main`

## Security Best Practices

- ✅ Use dedicated deploy user with limited permissions
- ✅ Use ed25519 SSH keys
- ✅ Rotate secrets regularly
- ✅ Keep the production .env file secure
- ✅ Firewall: only expose ports 80/443
