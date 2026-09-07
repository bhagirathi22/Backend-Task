const PASS_MARK = 40;

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 422;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function gradeFor(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

function calculateStudentResult(student, rows) {
  if (!rows.length) {
    throw new ValidationError(`No subject marks found for student ${student.id}`);
  }

  let totalMarks = 0;
  let maximumMarks = 0;
  let highestSubject = null;
  let lowestSubject = null;
  let passed = true;
  const subjects = [];

  for (const row of rows) {
    const marks = Number(row.marks);
    const maxMarks = Number(row.max_marks || 100);

    if (!Number.isFinite(marks) || !Number.isFinite(maxMarks) || marks < 0 || marks > maxMarks) {
      throw new ValidationError(`Invalid marks for ${row.subject_name}`);
    }

    const subjectResult = {
      subjectId: row.subject_id,
      subject: row.subject_name,
      marks: round(marks),
      maxMarks: round(maxMarks),
      percentage: round((marks / maxMarks) * 100),
      status: marks >= PASS_MARK ? 'PASS' : 'FAIL'
    };

    totalMarks += marks;
    maximumMarks += maxMarks;
    passed = passed && marks >= PASS_MARK;
    subjects.push(subjectResult);

    if (!highestSubject || marks > highestSubject.marks) {
      highestSubject = { subject: row.subject_name, marks: round(marks) };
    }
    if (!lowestSubject || marks < lowestSubject.marks) {
      lowestSubject = { subject: row.subject_name, marks: round(marks) };
    }
  }

  const percentage = (totalMarks / maximumMarks) * 100;
  return {
    student: {
      id: student.id,
      rollNumber: student.roll_number,
      name: student.name
    },
    subjects,
    overall: {
      total: round(totalMarks),
      maximum: round(maximumMarks),
      average: round(totalMarks / subjects.length),
      percentage: round(percentage),
      grade: gradeFor(percentage),
      status: passed ? 'PASS' : 'FAIL',
      highestSubject,
      lowestSubject
    }
  };
}

function groupRows(rows) {
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.student_id)) {
      grouped.set(row.student_id, {
        id: row.student_id,
        roll_number: row.roll_number,
        name: row.student_name,
        rows: []
      });
    }
    if (row.subject_id !== null) grouped.get(row.student_id).rows.push(row);
  }
  return [...grouped.values()];
}

async function getStudentResult(db, studentId) {
  const [rows] = await db.query(
    `SELECT s.id AS student_id, s.roll_number, s.name AS student_name,
            sub.id AS subject_id, sub.name AS subject_name, sub.max_marks, m.marks
       FROM students s
       LEFT JOIN marks m ON m.student_id = s.id
       LEFT JOIN subjects sub ON sub.id = m.subject_id
      WHERE s.id = ?
      ORDER BY sub.id`,
    [studentId]
  );

  if (!rows.length) throw new NotFoundError(`Student ${studentId} was not found`);
  const grouped = groupRows(rows)[0];
  return calculateStudentResult(grouped, grouped.rows);
}

async function getClassSummary(db) {
  const [rows] = await db.query(
    `SELECT s.id AS student_id, s.roll_number, s.name AS student_name,
            sub.id AS subject_id, sub.name AS subject_name, sub.max_marks, m.marks
       FROM students s
       LEFT JOIN marks m ON m.student_id = s.id
       LEFT JOIN subjects sub ON sub.id = m.subject_id
      ORDER BY s.id, sub.id`
  );

  const students = groupRows(rows);
  if (!students.length) throw new NotFoundError('No students found');

  const results = students.map((student) => calculateStudentResult(student, student.rows));
  let highestScorer = results[0];
  let percentageTotal = 0;
  let passedStudents = 0;

  for (const result of results) {
    percentageTotal += result.overall.percentage;
    if (result.overall.status === 'PASS') passedStudents += 1;
    if (result.overall.percentage > highestScorer.overall.percentage) highestScorer = result;
  }

  return {
    totalStudents: results.length,
    passedStudents,
    failedStudents: results.length - passedStudents,
    highestScorer: {
      rollNumber: highestScorer.student.rollNumber,
      name: highestScorer.student.name,
      percentage: highestScorer.overall.percentage
    },
    averageClassPercentage: round(percentageTotal / results.length)
  };
}

module.exports = {
  PASS_MARK,
  ValidationError,
  NotFoundError,
  calculateStudentResult,
  getStudentResult,
  getClassSummary,
  gradeFor
};
