# Student Result API

A Node.js and MySQL application that retrieves student marks and generates subject-wise results, overall results, and a class summary.

## Setup

1. Install Node.js 18+ and MySQL.
2. Install dependencies:

	```bash
	npm install
	```

3. Copy `.env.example` to `.env` and set the MySQL credentials.
4. Create the database and sample records:

	```bash
	mysql -u root -p < schema.sql
	mysql -u root -p < seed.sql
	```

5. Start the API:

	```bash
	npm start
	```

6. Open `http://localhost:3000/` to use the browser dashboard. It loads the student list and class summary from the API, and lets you inspect each student's complete result.

## Endpoints

- `GET /health` checks the API and database connection.
- `GET /api/students` lists selectable students.
- `GET /api/students/:studentId/result` returns subject-wise marks, total, average, percentage, grade, pass/fail status, and highest/lowest subjects.
- `GET /api/class-summary` returns total students, passed students, failed students, highest scorer, and average class percentage.

The dashboard is served from `public/` and requires the API server and MySQL database to be running.

### Database connection troubleshooting

If the dashboard shows `Database unavailable` or the server reports `ECONNREFUSED ... 3306`, MySQL is not running on the configured host and port. Start the MySQL service, then run the schema and seed commands again. On Windows, the service can usually be started from **Services** as `MySQL80`, or with an administrator PowerShell prompt:

```powershell
Start-Service MySQL80
```

If your MySQL service has a different name, find it with:

```powershell
Get-Service *mysql*
```

Invalid student IDs return `400`, missing students return `404`, and invalid or missing marks return `422`.

Run the calculator tests with:

```bash
npm test
```