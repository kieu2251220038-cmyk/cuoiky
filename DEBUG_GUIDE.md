# Debug Guide

## 1) Backend logs
- Docker:
  - `docker logs -f moneytracker_backend`
- Kiem tra API:
  - `curl http://localhost:8000/api/health`

## 2) Container logs
- Xem tat ca service:
  - `docker compose logs -f`
- Theo tung layer:
  - Frontend: `docker logs -f moneytracker_frontend`
  - Backend: `docker logs -f moneytracker_backend`
  - Database: `docker logs -f moneytracker_db`

## 3) Debug theo layer
### Frontend
- Mo DevTools browser -> Console + Network
- Kiem tra request den API co dung URL khong
- Kiem tra token Authorization trong request

### Backend
- Kiem tra traceback trong log backend
- Chay test:
  - `cd backend && python manage.py test`
- Kiem tra migration:
  - `python manage.py showmigrations`

### Database
- Kiem tra ket noi DB tu backend
- Vao psql:
  - `docker exec -it moneytracker_db psql -U moneytracker -d moneytracker`
- Kiem tra bang:
  - `\dt`

### Infrastructure
- Kiem tra status:
  - `docker compose ps`
- Kiem tra health DB
- Kiem tra ENV map dung trong compose
