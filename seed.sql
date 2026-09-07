USE student_results;

INSERT INTO students (roll_number, name) VALUES
  ('STU001', 'Aarav Sharma'),
  ('STU002', 'Maya Patel'),
  ('STU003', 'Noah Williams')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO subjects (name) VALUES
  ('Mathematics'),
  ('Science'),
  ('English'),
  ('Computer Science')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO marks (student_id, subject_id, marks)
SELECT s.id, sub.id,
  CASE CONCAT(s.roll_number, ':', sub.name)
    WHEN 'STU001:Mathematics' THEN 92
    WHEN 'STU001:Science' THEN 86
    WHEN 'STU001:English' THEN 88
    WHEN 'STU001:Computer Science' THEN 95
    WHEN 'STU002:Mathematics' THEN 71
    WHEN 'STU002:Science' THEN 68
    WHEN 'STU002:English' THEN 76
    WHEN 'STU002:Computer Science' THEN 81
    WHEN 'STU003:Mathematics' THEN 32
    WHEN 'STU003:Science' THEN 55
    WHEN 'STU003:English' THEN 48
    WHEN 'STU003:Computer Science' THEN 39
  END
FROM students s
CROSS JOIN subjects sub
WHERE s.roll_number IN ('STU001', 'STU002', 'STU003')
  AND sub.name IN ('Mathematics', 'Science', 'English', 'Computer Science')
ON DUPLICATE KEY UPDATE marks = VALUES(marks);
