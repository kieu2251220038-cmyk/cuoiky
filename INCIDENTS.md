# Incident Report (Thuc te)

## 1) API 500 Internal Server Error
Hien tuong:
- Goi API tao expense tra ve 500.

Layer loi:
- L3 Backend

Nguyen nhan:
- DB schema chua migrate, hoac field du lieu gui len sai kieu.

Cach fix:
1. Xem log backend: `docker logs -f moneytracker_backend`
2. Chay migrate: `docker compose exec backend python manage.py migrate`
3. Validate payload frontend (amount > 0, date hop le)

Cach phong tranh:
- Bat buoc chay migration trong entrypoint.
- Them test API create expense trong CI.

## 2) CORS Error
Hien tuong:
- Browser bao CORS blocked khi frontend goi backend.

Layer loi:
- L4 Frontend
- L3 Backend

Nguyen nhan:
- `CORS_ALLOWED_ORIGINS` khong chua domain frontend.

Cach fix:
1. Sua `.env`: `CORS_ALLOWED_ORIGINS=http://localhost:8080`
2. Restart backend: `docker compose up -d --build backend`

Cach phong tranh:
- Tach CORS theo environment (dev/staging/prod).
- Checklist deploy bat buoc verify CORS.

## 3) Sai ENV
Hien tuong:
- App khoi dong duoc nhung login/API fail khong ro ly do.

Layer loi:
- L1 Infrastructure
- L3 Backend
- L4 Frontend

Nguyen nhan:
- Sai `FRONTEND_API_BASE_URL` hoac sai `DB_HOST`, `DB_PORT`.

Cach fix:
1. So sanh `.env` voi `.env.example`
2. Kiem tra container env: `docker compose config`
3. Build lai frontend/backend

Cach phong tranh:
- Luu mau bien moi truong trong `.env.example`
- Khong hardcode URL trong JS/Python

## 4) Database Fail
Hien tuong:
- Backend khong ket noi duoc DB, log bao connection refused.

Layer loi:
- L2 External (DB)

Nguyen nhan:
- DB chua healthy, sai password, hoac volume DB loi.

Cach fix:
1. Kiem tra DB log: `docker logs -f moneytracker_db`
2. Kiem tra healthcheck: `docker compose ps`
3. Verify bien `DB_*`
4. Neu can: `docker compose down -v` roi `docker compose up -d --build`

Cach phong tranh:
- Dung healthcheck + depends_on condition: service_healthy
- Backup DB dinh ky va monitor tai nguyen may chu

## 5) Frontend Undefined Error
Hien tuong:
- UI bao loi `undefined` hoac khong render du lieu sau khi call API.

Layer loi:
- L4 Frontend

Nguyen nhan:
- Frontend truy cap sai field response, hoac khong guard du lieu null/undefined.

Cach fix:
1. Kiem tra response API va mapping field.
2. Bo sung null check / optional chaining cho component.
3. Them default state truoc khi render.

Cach phong tranh:
- Dinh nghia schema response ro rang.
- Viet test cho component va API adapter.
