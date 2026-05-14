# Deployment Guide

## Bat buoc truoc khi deploy
- Co san `.env` cho moi truong dang chay
- Khong commit `.env`, chi commit `.env.example`
- Khong hardcode API URL, DB connection, API key
- Phai deploy, khong demo bang local

## Lua chon A: VPS / WSL Ubuntu (Docker Compose)

1. Cai Docker + Docker Compose tren VPS/WSL Ubuntu
2. Clone repo
3. Tao `.env` tu `.env.example` va cap nhat bien production
4. Chay:
   - `docker compose up -d --build`
5. Mo firewall cho port 80/443 (va reverse proxy Nginx neu can)

Thu tu khai bao va kiem tra:
1. Backend
2. Frontend
3. Config CORS va ENV

URL public mau:
- Frontend: `http://<your-vps-ip>:8080`
- Backend: `http://<your-vps-ip>:8000/api/health`

## Lua chon B: Render

- Tao Web Service cho backend (Dockerfile o backend)
- Tao PostgreSQL service tren Render
- Tao Static Site cho frontend (hoac Web Service Docker frontend)
- Set ENV dung theo `.env.example`

Thu tu can chuan bi:
1. Backend deploy truoc de co API public URL
2. Frontend sau do tro den API public URL
3. CORS va ENV phai dung voi domain production

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

## Luu y quan trong
- Neu ENV sai, production co the loi ngay khi khoi dong hoac khi goi API
- Uu tien kiem tra `SECRET_KEY`, `DB_*`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_API_BASE_URL`
