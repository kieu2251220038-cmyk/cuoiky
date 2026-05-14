# MoneyTracker - He thong quan ly chi tieu ca nhan

## 1) Kien truc
Frontend (React/Vite) -> Backend API (Django REST) -> PostgreSQL

## 1.1) Kien truc bat buoc
- Frontend: React hoac tuong duong
- Backend: API phuc vu du lieu va nghiep vu
- Database: luu tru du lieu tap trung

Pham vi khong chap nhan:
- Chi co frontend, khong co backend API
- Chi CRUD local, khong co database that
- Du an khong co lop backend/database ro rang

## 2) Chuc nang
- Dang ky / dang nhap
- Them, sua, xoa khoan chi tieu
- Xem danh sach chi tieu
- Tim kiem va loc theo category, khoang ngay
- Thong ke theo ngay/thang
- Health check: GET /api/health -> {"ok": true}

## 3) Chay bang Docker
Yeu cau: Docker Desktop + Docker Compose

```bash
docker compose up -d --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api
- Health check: http://localhost:8000/api/health

Dung he thong:
1. Dang ky tai khoan
2. Dang nhap
3. CRUD chi tieu + loc + thong ke

## 4) ENV
- Bat buoc co `.env` de chay local, nhung khong duoc commit
- Bat buoc co `.env.example` de tham khao va commit
- Frontend React co the dung `frontend/.env.example` cho `VITE_API_BASE_URL` khi dev
- Tuyet doi khong hardcode API URL, DB connection, API key
- Sai ENV la nguyen nhan pho bien gay loi production

## 4.1) Nguyen tac ENV
- Backend doc gia tri tu `.env`
- Frontend doc runtime config tu bien moi truong build/deploy
- Moi mo truong phai cap nhat rieng `SECRET_KEY`, `DB_*`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_API_BASE_URL`

## 5) Branching
- `main`: production
- `dev`: integration
- `feature/*`: tinh nang

Quy trinh de xuat:
1. Tao branch feature tu dev
2. Lam viec + commit ro rang
3. Tao PR ve dev
4. Sau khi test xong merge dev -> main

## 6) CI/CD
Workflow tai `.github/workflows/ci.yml`
- Dung GitHub Actions
- Trigger: `push`, `pull_request`
- Buoc bat buoc: install dependency -> lint -> test -> build
- Pipeline phai fail neu co loi, khong duoc bypass

## 7) Deploy
Khong demo bang chay local.
Bat buoc deploy len mot trong cac moi truong sau:
- VPS hoac WSL (Ubuntu)
- Docker VPS
- Vercel / Render

Thu tu deploy phai dung:
1. Backend
2. Frontend
3. Config: CORS, ENV, API URL

Yeu cau bat buoc sau deploy:
- Frontend goi dung backend public URL
- Backend da cau hinh CORS phu hop voi frontend domain
- ENV production duoc khai bao day du va khong hardcode

## 8) Logging + Debug
Xem [DEBUG_GUIDE.md](DEBUG_GUIDE.md)

## 9) Incident bat buoc
Xem [INCIDENTS.md](INCIDENTS.md)

## 10) Deploy production
Xem [DEPLOYMENT.md](DEPLOYMENT.md)
