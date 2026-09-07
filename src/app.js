const express = require('express');
const path = require('path');
const db = require('./db');
const { getStudentResult, getClassSummary } = require('./resultService');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function isDatabaseConnectionError(error) {
  return error?.code === 'ECONNREFUSED'
    || error?.errors?.some((nestedError) => nestedError.code === 'ECONNREFUSED');
}

app.get('/health', async (req, res, next) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/students', async (req, res, next) => {
  try {
    const [students] = await db.query(
      'SELECT id, roll_number AS rollNumber, name FROM students ORDER BY id'
    );
    res.json({ students });
  } catch (error) {
    next(error);
  }
});

app.get('/api/students/:studentId/result', async (req, res, next) => {
  const studentId = Number(req.params.studentId);
  if (!Number.isInteger(studentId) || studentId < 1) {
    return res.status(400).json({ error: 'studentId must be a positive integer' });
  }

  try {
    res.json(await getStudentResult(db, studentId));
  } catch (error) {
    next(error);
  }
});

app.get('/api/class-summary', async (req, res, next) => {
  try {
    res.json(await getClassSummary(db));
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  if (isDatabaseConnectionError(error)) {
    return res.status(503).json({
      error: 'Database unavailable. Start MySQL and verify DB_HOST, DB_PORT, and credentials in .env.'
    });
  }
  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
