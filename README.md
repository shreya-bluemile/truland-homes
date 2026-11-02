# Truland Homes – Contractor Quotations

Staff create quotation requests for a lot, email them to contractors in a trade category, and track responses. Contractors upload their quote through a secure link, without logging in.

| Folder | What it is |
|---|---|
| `backend/` | Laravel 12 REST API (PHP 8.3, MySQL, Sanctum token auth) |
| `frontend/` | React 19 app (Vite, Tailwind CSS, React Router, Axios) |

## Requirements

- PHP 8.3+ with the `pdo_mysql`, `mbstring`, `xml`, `zip`, `curl` and `fileinfo` extensions
- Composer 2
- MySQL 8 (or MariaDB 10.6+)
- Node.js 20+ and npm

## Local setup

### 1. Clone

```bash
git clone https://github.com/shreya-bluemile/truland-homes.git
cd truland-homes
```

### 2. Database

Create an empty database, for example in the MySQL shell:

```sql
CREATE DATABASE truland CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Backend

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

### 4. Frontend (in a second terminal)

```bash
cd frontend
npm install
cp .env.example .env            # Windows: copy .env.example .env
npm run dev                     # app at http://localhost:5173
```

Open http://localhost:5173 and sign in with the seeded account:

- Email: `admin@trulandhomes.com.au`
- Password: `password`

Change this password before the app is used anywhere other than your own machine.

## Running the tests

```bash
cd backend
php artisan test
```

Tests use an in-memory SQLite database, so they never touch your MySQL data.

## Email in development

`MAIL_MAILER=log` is the default, so emails are written to `backend/storage/logs/laravel.log` instead of being sent. Set real SMTP details in `backend/.env` to send them.
