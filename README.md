# Truland Homes – Contractor Quotations

Staff create quotation requests for a lot, email them to contractors in a trade category, and track responses. Contractors upload their quote through a secure link, without logging in.

| Folder | What it is |
|---|---|
| `backend/` | Laravel 12 REST API (PHP 8.3, MySQL, Sanctum token auth) |
| `frontend/` | React 19 app (Vite, Tailwind CSS, React Router, Axios) |

## Windows: automatic setup

Open **PowerShell** (Start menu → type "PowerShell") and paste:

```powershell
irm https://raw.githubusercontent.com/shreya-bluemile/truland-homes/main/scripts/windows/setup.ps1 | iex
```

This creates a `truland-homes` folder on your Desktop and downloads private copies of PHP 8.3, Composer, Node.js 22 and MariaDB into its hidden `.tools` folder. Nothing is installed system-wide, except the Microsoft Visual C++ runtime if PHP needs it. It then installs all dependencies, creates and seeds the database (on port 3307, so it can't clash with an existing MySQL), writes the `.env` files and opens the app in your browser. It takes about 5–10 minutes. If it stops, fix the reported problem and run it again; finished steps are skipped.

After that, **double-click `start.bat`** in the project folder to start the app. It runs in three windows (database, API, frontend), and closing them stops it.

## Manual setup

### Requirements

- PHP 8.3+ with the `pdo_mysql`, `mbstring`, `xml`, `zip`, `curl` and `fileinfo` extensions
- Composer 2
- MySQL 8 (or MariaDB 10.6+)
- Node.js 20+ and npm

#### 1. Clone

```bash
git clone https://github.com/shreya-bluemile/truland-homes.git
cd truland-homes
```

#### 2. Database

Create an empty database, for example in the MySQL shell:

```sql
CREATE DATABASE truland CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 3. Backend

```bash
cd backend
composer install
cp .env.example .env            # Windows: copy .env.example .env
php artisan key:generate
```

Open `backend/.env` and set your database login:

```
DB_DATABASE=truland
DB_USERNAME=root
DB_PASSWORD=your-mysql-password
```

Then:

```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve               # API at http://localhost:8000
```

#### 4. Frontend (in a second terminal)

```bash
cd frontend
npm install
cp .env.example .env            # Windows: copy .env.example .env
npm run dev                     # app at http://localhost:5173
```

Open http://localhost:5173. There is no login screen: the app opens straight into Contractor Quotations and acts as the seeded **Admin** user (the name shown on quotations, notes and the activity log).

Because there is no login, anyone who can reach the app's address can use it. Keep it on your own machine or an internal network; if it is ever hosted online, put it behind a VPN, an IP allow-list or password-protected hosting.

## Running the tests

```bash
cd backend
php artisan test
```

Tests use an in-memory SQLite database, so they never touch your MySQL data.

## Email in development

`MAIL_MAILER=log` is the default, so emails are written to `backend/storage/logs/laravel.log` instead of being sent. Set real SMTP details in `backend/.env` to send them.

The upload link in each quotation email points at `FRONTEND_URL` (`/quote/<token>`), so set that to the address contractors can reach.

## Contractor Quotations

- **Seed data:** `php artisan migrate --seed` adds sample lots, trades, contractors and quotations Q-0145 to Q-0148, matching the Figma screens. It is safe to run again.
- **Reminders:** when a quotation's Reminder is set to "Automatically remind…", contractors who haven't responded get one reminder email that many days before the due date. This runs from Laravel's scheduler, so keep `php artisan schedule:work` running (or add `php artisan schedule:run` to cron / Task Scheduler every minute). With "Don't remind automatically", a **Send reminder** button shows in the Contractors tab instead.
- **Statuses:** a quotation is *Awaiting* until every contractor has responded, *Overdue* if the due date passes first, then *Received* (at least one quote) or *Not Quoting*. Uploaded files are stored in `backend/storage/app/private`.
