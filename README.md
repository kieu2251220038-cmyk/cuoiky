# MoneyTracker - He thong quan ly chi tieu ca nhan

## 1) Kien truc
Frontend (HTML/CSS/JS) -> Backend API (Django REST) -> PostgreSQL

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
- Da co `.env` de chay local
- Da co `.env.example` de tham khao
- Tuyet doi khong hardcode API URL, DB connection, API key

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
- Trigger: push, pull_request
- Buoc: install dependency -> lint -> test -> build Docker images
- Pipeline se fail neu bat ky buoc nao loi

## 7) Logging + Debug
Xem [DEBUG_GUIDE.md](DEBUG_GUIDE.md)

## 8) Incident bat buoc
Xem [INCIDENTS.md](INCIDENTS.md)

## 9) Deploy production
Xem [DEPLOYMENT.md](DEPLOYMENT.md)
