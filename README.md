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

To start the app later, double-click `start.bat` (or the "Truland Homes" Desktop shortcut). If the database ever gets out of step with the code — for example after switching between versions — double-click `reset-database.bat`: it rebuilds the local database and reloads the sample data (all local data on that computer is replaced).

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
