# Git Branching

## Nhanh can co
- main
- dev
- feature/*

## Repository
- Quan ly source code bang GitHub.
- Repo co the public hoac private tuy yeu cau du an.

## Kien truc he thong bat buoc
- Moi do an phai co du:
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

## Quy trinh de xuat
1. Tao branch `dev` neu chua co.
2. Moi tinh nang tao 1 branch `feature/*` tu `dev`.
3. Lam viec theo tung buoc nho va commit ngay khi hoan thanh 1 muc do ro rang.
4. Dat ten commit co nghia, uu tien theo cu phap:
   - `feat(...)`: them tinh nang
   - `fix(...)`: sua loi
   - `chore(...)`: cong viec phu tro
5. Push branch len GitHub va tao Pull Request ve `dev`.
6. Sau khi kiem tra va test xong, merge `dev` vao `main` khi san sang phat hanh.

## Vi du luong commit
```bash
git checkout dev
git checkout -b feature/login-ui
git add .
git commit -m "feat(auth): add login form layout"
git commit -m "feat(auth): connect login API"
git commit -m "fix(auth): handle invalid credentials"
git push origin feature/login-ui
```

Yeu cau cuoi cung:
- Khong duoc gom tat ca thay doi vao mot commit cuoi cung.
- Lich su commit phai cho thay qua trinh phat trien ro rang, co logic va co the review duoc.

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