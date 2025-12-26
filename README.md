# UnPload

<div align="center">

**Self-hosted file sharing with advanced features**

[![CI Build](https://lab.unishadow.ovh/Unishadow/unpload/actions/workflows/build.yml/badge.svg)](https://lab.unishadow.ovh/Unishadow/unpload/actions/workflows/build.yml)
[![Tests](https://lab.unishadow.ovh/Unishadow/unpload/actions/workflows/test.yml/badge.svg)](https://lab.unishadow.ovh/Unishadow/unpload/actions/workflows/test.yml)
[![Deploy](https://lab.unishadow.ovh/Unishadow/unpload/actions/workflows/deploy.yml/badge.svg)](https://lab.unishadow.ovh/Unishadow/unpload/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](docker/)

</div>


## ✨ Features

- 📁 **File Management** - Upload files and folders, preview, rename, organize
- 🔗 **Smart Sharing** - Password protection, expiry dates, download limits
- 👥 **Multi-User** - Quotas, roles, and OAuth authentication (Discord)
- 🎨 **Modern UI** - Clean interface with dark mode support
- 🐳 **Docker Ready** - One-command deployment with Docker Compose
- ⚙️ **Setup Wizard** - Configure everything on first launch
- 🔧 **In-App Config** - Change settings without restarting

## 🚀 Quick Start

### Using Docker Compose (Recommended)


```bash
# Clone the repository
git clone https://github.com/Unishadoweuh/unpload.git
cd unpload

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# Start the application
cd docker
docker compose up -d
```

Access UnPload at `http://localhost:3000`

### Development Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL (optional, use Docker)
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=unpload \
  -e POSTGRES_PASSWORD=securepassword \
  -e POSTGRES_DB=unpload \
  postgres:16-alpine

# Setup database
npm run db:push

# Start development servers
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:4000
- API Docs: http://localhost:4000/api/docs

## 🏗️ Architecture

```
unpload/
├── apps/
│   ├── web/             # Next.js 15 frontend
│   └── api/             # NestJS backend
├── packages/
│   └── shared/          # Shared types & constants
├── docker/              # Docker configuration
└── .gitea/workflows/    # CI/CD pipelines
```

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend | NestJS, Prisma ORM |
| Database | PostgreSQL |
| Storage | Local FS or S3-compatible |
| Auth | JWT, Passport.js, Discord OAuth |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret for JWT signing | - |
| `STORAGE_TYPE` | `local` or `s3` | `local` |
| `STORAGE_PATH` | Path for local storage | `/data/uploads` |
| `DISCORD_CLIENT_ID` | Discord OAuth client ID | - |
| `DISCORD_CLIENT_SECRET` | Discord OAuth secret | - |

See `.env.example` for all options.

## 📖 API Documentation

Interactive API docs available at `/api/docs` when the server is running.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines first.

## 📄 License

MIT © UnPload
