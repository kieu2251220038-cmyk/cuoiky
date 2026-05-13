# Git Branching

## Nhanh can co
- main
- dev
- feature/*

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

## Luu y bao mat
- Khong commit `.env`
- Khong commit secret vao git history
