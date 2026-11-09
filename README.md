# EMS — Employee Management System

A complete, frontend-only Employee Management System (HRMS) proof of concept built with **React.js (JSX)**, **Vite**, **React Router**, **Recharts**, **Bootstrap 5** utilities and **day.js**. All data is persisted in the browser's **LocalStorage**; no backend or database is required.

## Demo credentials

| Role | Email | Password | Access |
| --- | --- | --- | --- |
| Admin | `admin@ems.com` | `Admin@123` | Full application access, including settings |
| HR | `hr@ems.com` | `Hr@123` | Employees, departments, designations, attendance, leave, reports |
| Employee | `employee@ems.com` | `Emp@123` | Own profile, own attendance, apply for leave, leave history |

Use the demo cards on the login screen to auto-fill credentials. "Remember me" stores the session in LocalStorage; otherwise it is kept in sessionStorage.

## Getting started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (default `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

## Modules

- **Authentication** — demo login, remember-me, show/hide password, role-based protected routes, logout.
- **Dashboard** — dynamic summary cards, department pie, monthly joining bar, gender donut, attendance line chart, recent joinings, upcoming birthdays, employees on leave, recent activity and quick actions. Employees get a self-service dashboard.
- **Employees** — directory with search, combined filters, sortable columns, pagination, CSV export; full add/edit form with validation, auto employee IDs (`EMP001`…), duplicate email prevention, profile view with six tabs.
- **Departments** — CRUD with employee counts, department head, search/filter and protected deletion when employees or designations are assigned.
- **Designations** — CRUD mapped to departments, employee counts and protected deletion.
- **Attendance** — mark/edit/delete attendance, duplicate prevention, working-hours calculation, date/month/department/status filters, summaries and CSV export. Employees only see their own records.
- **Leave Management** — apply, approve, reject, cancel and view leave requests; leave statistics, pending review banner and filters.
- **Reports** — six reports (directory, department-wise, attendance, leave, monthly joining, employee status) with date range, department and status filters, charts, summaries and CSV export.
- **Settings** — company profile, logo, working days/hours, leave types, light/dark theme; persisted in LocalStorage.
- **Notifications** — seeded plus live notifications for employee/attendance/leave events, unread count, mark as read, clear all.

## Sample data

The app seeds itself on first load (only when LocalStorage is empty):

- 25 employees, 6 departments, 12 designations
- 30 attendance records, 15 leave applications, 10 notifications
- Indian names, cities, phone numbers and INR salaries
- Consistent relationships between employees, departments, designations, attendance and leave records

## Project structure

```
src/
├── assets/
├── components/
│   ├── charts/          # Recharts wrappers and palette
│   ├── common/          # Button, fields, modal, data table, pagination, badges…
│   ├── forms/           # Employee, department, designation, attendance, leave forms
│   ├── layout/          # Sidebar, header and navigation config
│   └── tables/          # (table primitives live in common/DataTable)
├── context/             # Auth, toast and settings providers
├── data/
│   └── seed.js          # Realistic demo data
├── hooks/               # useCollection, useTableControls, useClickOutside…
├── layouts/
│   └── AppLayout.jsx
├── pages/
│   ├── auth/            # Login
│   ├── dashboard/       # Admin/HR + employee dashboards
│   ├── departments/
│   ├── designations/
│   ├── employees/       # Directory + profile
│   ├── attendance/
│   ├── leaves/
│   ├── reports/
│   └── settings/
├── routes/              # Route config and guards
├── services/            # LocalStorage-backed data services
├── styles/
│   └── index.css        # Design system, responsive and dark theme
├── utils/               # Storage, formatting, CSV, dates, validation
├── App.jsx
└── main.jsx
```

## Data & persistence

- All records are stored under namespaced LocalStorage keys (`ems:employees`, `ems:attendance`, etc.).
- Components subscribe to a small reactive data layer (`src/services/db.js`) and update immediately after writes.
- Business logic lives in service files (`employeeService`, `departmentService`, `designationService`, `attendanceService`, `leaveService`, `notificationService`, `settingsService`, `authService`).
- To reset the demo: open DevTools → Application → Local Storage, remove the `ems:*` keys, and refresh. The seed data will be recreated.

## Notes

- This is a proof of concept: authentication is demo-only and all data is local to the browser.
- No external backend, API keys or database are required.
