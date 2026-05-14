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
2. Frontend React/Vite
3. Config CORS va ENV

URL public mau:
- Frontend: `http://<your-vps-ip>:8080`
- Backend: `http://<your-vps-ip>:8000/api/health`

## Lua chon B: Render

- Tao Web Service cho backend (Dockerfile o backend)
- Tao PostgreSQL service tren Render
- Tao Static Site cho frontend (hoac Web Service Docker frontend)
- Set ENV dung theo `.env.example`
- Frontend build ra React app qua Vite, sau do Nginx phuc vu `dist`

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

## Tự động hoá deploy (mẫu)

Dưới đây là hướng dẫn nhanh và mẫu `GitHub Actions` để tự động deploy lên các dịch vụ phổ biến. Luôn lưu secrets an toàn trong `Repository settings -> Secrets`.

1) Vercel (frontend static)
- Secrets cần: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Mẫu workflow (chỉ frontend):

```yaml
name: Deploy Frontend to Vercel
on:
   push:
      branches: [main]

jobs:
   deploy:
      runs-on: ubuntu-latest
      steps:
         - uses: actions/checkout@v4
         - name: Vercel Action
            uses: amondnet/vercel-action@v20
            with:
               vercel-token: ${{ secrets.VERCEL_TOKEN }}
               vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
               vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
               working-directory: ./frontend
```

2) Render (full stack or containers)
- Secrets cần: `RENDER_API_KEY`, `RENDER_SERVICE_ID` (nếu dùng manual deploy API)
- Mẫu: gọi API deploy của Render khi có push tới `main`:

```yaml
name: Deploy to Render
on:
   push:
      branches: [main]

jobs:
   render-deploy:
      runs-on: ubuntu-latest
      steps:
         - uses: actions/checkout@v4
         - name: Trigger Render deploy
            run: |
               curl -X POST \
                  -H "Content-Type: application/json" \
                  -H "Accept: application/json" \
                  -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
                  -d '{"serviceId":"'${{ secrets.RENDER_SERVICE_ID }}'"}' \
                  https://api.render.com/deploy
```

3) Docker VPS via SSH (WSL/VPS)
- Secrets cần: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`
- Mẫu workflow: build images in CI, push to server and restart docker-compose via SSH.

```yaml
name: Deploy to VPS
on:
   push:
      branches: [main]

jobs:
   deploy:
      runs-on: ubuntu-latest
      steps:
         - uses: actions/checkout@v4
         - name: Build and save images
            run: |
               docker compose -f docker-compose.yml build --parallel
               docker save backend | gzip > backend.tar.gz
         - name: Copy and restart via SSH
            uses: appleboy/ssh-action@v0.1.7
            with:
               host: ${{ secrets.SSH_HOST }}
               username: ${{ secrets.SSH_USER }}
               key: ${{ secrets.SSH_PRIVATE_KEY }}
               script: |
                  set -e
                  mkdir -p /tmp/deploy && cd /tmp/deploy
                  # copy uploaded tar and load, then restart compose
                  docker compose down && docker compose up -d --build
```

Ghi chú: các mẫu trên chỉ là ví dụ. Trước khi bật deploy tự động, kiểm tra kỹ CI (lint/test/build) và chỉ kích hoạt deploy cho `main` khi PR đã được review.
