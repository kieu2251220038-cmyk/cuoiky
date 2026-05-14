# Tổ chức nhóm và phân vai

Mỗi nhóm gồm 5 sinh viên. Mỗi sinh viên chỉ đảm nhiệm 1 vai trò chính (không trùng lặp).

## Vai trò và nhiệm vụ bắt buộc

1) Backend Engineer
- Nhiệm vụ:
  - Xây dựng API (REST)
  - Kết nối database (PostgreSQL)
  - Đảm bảo API chạy độc lập
- Yêu cầu bắt buộc:
  - Có endpoint `/api/health` trả về trạng thái
  - API có thể test bằng Postman / curl
  - Có logging rõ ràng khi lỗi xảy ra

2) Frontend Engineer
- Nhiệm vụ:
  - Xây dựng UI (React)
  - Gọi API backend để thực hiện chức năng
- Yêu cầu bắt buộc:
  - Không có lỗi console khi chạy
  - Không hardcode URL (dùng `VITE_*` hoặc `window.__APP_CONFIG__` runtime)
  - Thực thi biến môi trường đúng chuẩn (ví dụ `VITE_API_BASE_URL`)

3) DevOps Engineer (CI/CD Owner)
- Nhiệm vụ:
  - Thiết lập pipeline CI/CD
- Yêu cầu bắt buộc:
  - GitHub Actions phải thực hiện: `lint`, `test`, `build`
  - Pipeline chạy khi `push` và `pull_request`
  - Pipeline phải fail nếu có lỗi

4) Infrastructure Engineer (Deploy Owner)
- Nhiệm vụ:
  - Deploy hệ thống lên môi trường công khai
- Yêu cầu bắt buộc:
  - Deploy lên VPS/WSL (Ubuntu) hoặc Docker VPS hoặc Vercel/Render
  - Không demo bằng chạy local

5) QA / SRE Engineer
- Nhiệm vụ:
  - Test hệ thống end-to-end
  - Debug và xử lý sự cố
- Yêu cầu bắt buộc:
  - Tạo ít nhất 3 incident mẫu (documented)
  - Với mỗi incident phải có: hiện tượng, nguyên nhân gốc, cách fix và cách verify

## Quy tắc làm việc nhóm
- Mỗi người tạo branch `feature/<name>` từ `dev` để làm việc.
- Commit phải nhỏ, có message rõ ràng (ví dụ `feat(api): add login endpoint`).
- Không được commit file chứa secret hoặc `.env` (đã có `.gitignore`).
- Trước khi merge phải tạo PR và chạy CI.

## Checklist nhanh cho nộp bài
- Backend: `/api/health` hoạt động, có endpoint CRUD cơ bản và tests.
- Frontend: React sử dụng `VITE_API_BASE_URL` hoặc runtime config, không có lỗi console.
- CI: GitHub Actions có lint/test/build và fail khi có lỗi.
- Deploy: Có hướng dẫn deploy trong `DEPLOYMENT.md` và app chạy trên môi trường public.
- QA: Có ít nhất 3 incident mẫu trong `INCIDENTS.md`.
