# CI/CD Configuration Guide

This document describes how to configure the CI/CD pipeline for UnPload.

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CI/CD Pipeline                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Push/PR ──► build.yml ──► test.yml ──► docker-build.yml       │
│                                              │                  │
│                                              ▼                  │
│                                         deploy.yml              │
│                                              │                  │
│                                              ▼                  │
│                                        Production               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `build.yml` | Push, PR | Lint, type-check, build all packages |
| `test.yml` | Push, PR | Run unit tests and E2E tests |
| `docker-build.yml` | Push to main, tags | Build and push Docker images |
| `deploy.yml` | After docker-build success | Deploy to production |

## Required Secrets

Configure these secrets in your Gitea repository settings:

**Settings → Actions → Secrets**

### Registry Authentication

| Secret | Description | Example |
|--------|-------------|---------|
| `REGISTRY_USERNAME` | Gitea username for registry | `your-username` |
| `REGISTRY_PASSWORD` | Gitea access token with `write:package` scope | `gta_xxxxx` |

### Deployment Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `DEPLOY_HOST` | Production server IP/hostname | `prod.example.com` |
| `DEPLOY_USER` | SSH username on the server | `deploy` |
| `DEPLOY_SSH_KEY` | Private SSH key (full content) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_PATH` | Path to unpload directory on server | `/opt/unpload` |
| `API_URL` | Public API URL | `https://api.unpload.com` |

### Optional Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `DISCORD_WEBHOOK` | Discord webhook for notifications | `https://discord.com/api/webhooks/...` |

## Setup Instructions

### 1. Create a Gitea Access Token

1. Go to **Settings → Applications → Access Tokens**
2. Create a new token with `write:package` permission
3. Copy the token as `REGISTRY_PASSWORD`

### 2. Setup SSH Deployment

```bash
# On your local machine, generate a deploy key
ssh-keygen -t ed25519 -C "deploy@unpload" -f deploy_key

# Copy the public key to your server
ssh-copy-id -i deploy_key.pub user@your-server

# The private key content goes in DEPLOY_SSH_KEY secret
cat deploy_key
```

### 3. Prepare the Production Server

```bash
# On the production server
mkdir -p /opt/unpload
cd /opt/unpload

# Clone the repository
git clone https://lab.unishadow.ovh/Unishadow/unpload.git .

# Create production .env file
cp .env.example .env
nano .env  # Configure your production values

# Login to the registry
docker login lab.unishadow.ovh
```

### 4. Add Secrets to Gitea

1. Go to your repository on Gitea
2. Navigate to **Settings → Actions → Secrets**
3. Add each secret from the tables above

## Manual Deployment

You can trigger a manual deployment from the **Actions** tab:

1. Go to **Actions → CD - Deploy to Production**
2. Click **Run workflow**
3. Select the environment (production/staging)
4. Click **Run workflow**

## Docker Image Tags

The pipeline creates the following image tags:

| Tag | Description |
|-----|-------------|
| `latest` | Latest build from main branch |
| `sha-<commit>` | Specific commit SHA |
| `v1.0.0` | Semantic version (from git tags) |
| `main` | Main branch builds |

## Troubleshooting

### Build Fails

1. Check the workflow logs in Gitea Actions
2. Ensure all npm dependencies are up to date
3. Run `npm run lint` and `npm run type-check` locally

### Docker Build Fails

1. Verify Dockerfile syntax
2. Check that all required files are in the Docker context
3. Ensure base images are accessible

### Deployment Fails

1. Verify SSH connection: `ssh deploy@your-server`
2. Check Docker is running on the server
3. Verify registry credentials
4. Check server disk space

### Health Check Fails

1. Verify the API is running: `curl http://localhost:4000/api/health`
2. Check container logs: `docker logs unpload-api`
3. Verify database connection

## Security Best Practices

- ✅ Use access tokens, never passwords
- ✅ Use dedicated deploy user with limited permissions
- ✅ Rotate secrets regularly
- ✅ Use ed25519 SSH keys
- ✅ Keep the production .env file secure
