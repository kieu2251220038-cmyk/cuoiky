# Git Branching

## Nhanh can co
- main
- dev
- feature/*

## Kien truc he thong bat buoc
- Frontend (React hoac tuong duong)
- Backend API
- Database

## Khong chap nhan
- Chi frontend
- Chi CRUD local
- Khong co backend API hoac database

## Lenh tao nhanh
```bash
git checkout -b dev
git checkout -b feature/auth-flow
```

## Quy tac commit
- Commit nho, ro nghia
- Vi du:
  - feat(api): add expense CRUD and stats endpoint
  - feat(frontend): add login register and expense dashboard
  - chore(devops): add docker compose and ci workflow
- Khong duoc chi co 1 commit cuoi cung
- Lich su commit phai the hien tung buoc phat trien ro rang

## Luu y bao mat
- Khong commit `.env`
- Khong commit secret vao git history
