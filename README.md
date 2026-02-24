# Weather.gov (but better)
Website to pull hourly weather data from weather.gov API, display in a mobile-friendly and modern UI.

## Overview
This repository is a POC monorepo for ingesting weather data and presenting it in a modern web experience.

## Repository Structure

```text
.
├── backend/                # FastAPI service, ingestion code, and backend deps
│   ├── src/app/            # Application package (API routes + core helpers)
│   ├── config.py           # Non-secret runtime config defaults
│   ├── pyproject.toml      # Backend Python project config + dependencies
│   └── uv.lock             # Backend locked dependency versions
├── frontend/               # Vite + React + TypeScript client app
├── docs/                   # Project docs
├── AGENTS.md               # Contributor guidance for Python/code style
├── Makefile                # Dev, lint, and format command entrypoints
└── README.md               # Monorepo overview
```

## Tech Stack
| Tool | Purpose | Install |
| --- | --- | --- |
| [Homebrew](https://brew.sh/) | Package manager | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
| [Python 3.13+](https://www.python.org/) | Runtime | `brew install python@3.13` |
| [Node.js 22+](https://nodejs.org/) | Frontend runtime + package ecosystem | `brew install node` |
| [uv](https://astral.sh/uv/) | Virtual env + package manager | `brew install uv` |
| [Git](https://git-scm.com/) | Version control | `brew install git` |
| [FastAPI](https://fastapi.tiangolo.com/) | Backend API framework | `n/a, managed by uv` |
| [Uvicorn](https://www.uvicorn.org/) | ASGI server for FastAPI | `n/a, managed by uv` |
| [dlt](https://dlthub.com/) | Data ingestion/loading framework | `n/a, managed by uv` |
| [DuckDB](https://duckdb.org/) | Local database engine | `brew install duckdb` |
| [Vite](https://vitejs.dev/) | Frontend build tool + dev server | `cd frontend && npm install vite` |
| [React](https://react.dev/) | Frontend UI framework | `cd frontend && npm install react react-dom` |
| [TypeScript](https://www.typescriptlang.org/) | Static typing for frontend code | `cd frontend && npm install -D typescript` |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling | `cd frontend && npm install -D tailwindcss postcss autoprefixer` |
| [shadcn/ui](https://ui.shadcn.com/) | Component primitives for React UI | `cd frontend && npx shadcn@latest init` |
| [TanStack Query](https://tanstack.com/query/latest) | Server-state fetching and caching | `cd frontend && npm install @tanstack/react-query` |
| [Docker](https://www.docker.com/) | Containerized local/dev runtime | `brew install --cask docker` |

## Setup Docs
Service-level setup instructions live in each subproject README.
