# MoneyTracker - He thong quan ly chi tieu ca nhan

## 1) Kien truc
Frontend (React/Vite) -> Backend API (Django REST) -> PostgreSQL

## 1.1) Kien truc bat buoc
- Moi do an phai co day du 3 thanh phan:
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

### 5.1 Repository
- Quan ly source code bang GitHub.
- Repo co the public hoac private tuy yeu cau du an.

### 5.2 Branching
- Bat buoc co cac branch chinh:
  - `main`
  - `dev`
  - `feature/*`
- `main`: production
- `dev`: integration
- `feature/*`: tinh nang

Quy trinh de xuat:
1. Tao branch feature tu dev
2. Lam viec + commit ro rang
3. Tao PR ve dev
4. Sau khi test xong merge dev -> main

### 5.3 Commit
- Khong duoc chi commit 1 lan cuoi cung.
- Lich su commit phai the hien qua trinh phat trien ro rang, tung buoc co y nghia.
- Uu tien commit nho, mo ta dung noi dung thay doi.
- Xem chi tiet quy trinh branch/commit tai [BRANCHING.md](BRANCHING.md).

## 6) CI/CD
Workflow tai `.github/workflows/ci.yml`
- Dung GitHub Actions.
- Trigger: `push` vao `main`, `dev`, `feature/**` va `pull_request` ve `main`, `dev`.
- Backend checks: setup Python, install dependency, `flake8`, `python manage.py test`.
- Frontend build: setup Node, `npm ci`, `npm run lint`, `npm run build`.
- Build step: `docker compose build` de kiem tra image build.
- Pipeline phai fail neu co loi, khong duoc bypass.

## 7) Deploy
Yeu cau bat buoc:
- Deploy len mot trong cac moi truong: VPS/WSL (Ubuntu), Docker VPS, Vercel/Render.
- Khong duoc demo bang cach chay local.
- Thu tu deploy: Backend -> Frontend -> Config (CORS, ENV, API URL).
- Frontend phai goi dung backend public URL.
- Backend phai cau hinh CORS phu hop voi frontend domain.
- ENV production phai du va khong hardcode.

## 8) Logging + Debug
Xem [DEBUG_GUIDE.md](DEBUG_GUIDE.md)

## 9) Incident bat buoc
Xem [INCIDENTS.md](INCIDENTS.md)

## 10) Deploy production
Xem [DEPLOYMENT.md](DEPLOYMENT.md)