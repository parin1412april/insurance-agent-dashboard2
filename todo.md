# Project TODO

- [x] Database schema: agent_profiles table (ชื่อ, นามสกุล, ชื่อเล่น, รหัสตัวแทน, เบอร์โทร, สถานะ)
- [x] Database schema: kanban_cards table (เลขกรมธรรม์, รายละเอียด, สถานะ column, owner)
- [x] Database schema: whitelist_emails table for login access control
- [x] Backend API: Agent profile CRUD
- [x] Backend API: Kanban cards CRUD (create, read, update status/column, delete)
- [x] Backend API: Admin endpoints (view all cards, manage admin roles)
- [x] Backend API: Whitelist email management
- [x] Frontend: Login page with sign-in flow
- [x] Frontend: Profile setup/edit page (ข้อมูลส่วนตัว)
- [x] Frontend: Kanban board with 5 columns (รอ memo, กำลังแก้ memo, ส่ง memo แล้ว, รอการพิจารณา, อนุมัติ)
- [x] Frontend: Drag-and-drop card movement between columns
- [x] Frontend: Card creation and deletion
- [x] Frontend: Admin dashboard - view all team cards
- [x] Frontend: Admin - manage admin roles (add/remove admin by email)
- [x] Seed whitelist emails from CSV
- [x] Write vitest tests
