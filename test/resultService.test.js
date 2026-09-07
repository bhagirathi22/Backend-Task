const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ValidationError,
  calculateStudentResult,
  gradeFor
} = require('../src/resultService');

const student = { id: 1, roll_number: 'STU001', name: 'Aarav Sharma' };
const rows = [
  { subject_id: 1, subject_name: 'Mathematics', marks: 90, max_marks: 100 },
  { subject_id: 2, subject_name: 'Science', marks: 80, max_marks: 100 },
  { subject_id: 3, subject_name: 'English', marks: 70, max_marks: 100 }
];

test('calculates subject and overall results', () => {
  const result = calculateStudentResult(student, rows);
  assert.equal(result.overall.total, 240);
  assert.equal(result.overall.average, 80);
  assert.equal(result.overall.percentage, 80);
  assert.equal(result.overall.grade, 'A');
  assert.equal(result.overall.status, 'PASS');
  assert.deepEqual(result.overall.highestSubject, { subject: 'Mathematics', marks: 90 });
  assert.deepEqual(result.overall.lowestSubject, { subject: 'English', marks: 70 });
});

test('fails a student when any subject is below the pass mark', () => {
  const result = calculateStudentResult(student, [
    ...rows.slice(0, 2),
    { subject_id: 3, subject_name: 'English', marks: 39, max_marks: 100 }
  ]);
  assert.equal(result.overall.status, 'FAIL');
  assert.equal(result.subjects[2].status, 'FAIL');
});

test('rejects invalid marks and assigns conditional grades', () => {
  assert.throws(
    () => calculateStudentResult(student, [{ subject_id: 1, subject_name: 'Math', marks: 101, max_marks: 100 }]),
    ValidationError
  );
  assert.equal(gradeFor(95), 'A+');
  assert.equal(gradeFor(65), 'C');
  assert.equal(gradeFor(20), 'F');
});
