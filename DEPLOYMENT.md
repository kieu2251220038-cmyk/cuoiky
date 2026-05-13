# Deployment Guide

## Lua chon A: VPS / WSL Ubuntu (Docker Compose)

1. Cai Docker + Docker Compose tren VPS/WSL Ubuntu
2. Clone repo
3. Tao `.env` tu `.env.example` va cap nhat bien production
4. Chay:
   - `docker compose up -d --build`
5. Mo firewall cho port 80/443 (va reverse proxy Nginx neu can)

URL public mau:
- Frontend: `http://<your-vps-ip>:8080`
- Backend: `http://<your-vps-ip>:8000/api/health`

## Lua chon B: Render

- Tao Web Service cho backend (Dockerfile o backend)
- Tao PostgreSQL service tren Render
- Tao Static Site cho frontend (hoac Web Service Docker frontend)
- Set ENV dung theo `.env.example`

Can dat cac bien:
- `SECRET_KEY`
- `DEBUG=False`
- `ALLOWED_HOSTS=<your-domain>`
- `DB_*`
- `CORS_ALLOWED_ORIGINS=https://<frontend-domain>`
- `FRONTEND_API_BASE_URL=https://<backend-domain>/api`

## Kiem tra sau deploy
1. Health check: GET /api/health -> {"ok": true}
2. Dang ky, dang nhap
3. CRUD chi tieu
4. Loc + thong ke
5. Kiem tra logs backend va DB
