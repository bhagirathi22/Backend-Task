const studentSelect = document.querySelector('#studentSelect');
const resultContent = document.querySelector('#resultContent');
const summaryGrid = document.querySelector('#summaryGrid');
const errorBanner = document.querySelector('#errorBanner');
const gradeBadge = document.querySelector('#gradeBadge');
const selectedStudent = document.querySelector('#selectedStudent');
const connectionStatus = document.querySelector('#connectionStatus');
const refreshButton = document.querySelector('#refreshButton');

async function request(path) {
  const response = await fetch(path);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.hidden = false;
}

function clearError() { errorBanner.hidden = true; }
function number(value) { return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
function statusClass(status) { return status === 'PASS' ? 'status-pass' : 'status-fail'; }

function renderSummary(summary) {
  summaryGrid.innerHTML = `
    <article class="metric-card accent"><span class="metric-label">Total students</span><strong class="metric-value">${summary.totalStudents}</strong><span class="metric-detail">Registered in class</span></article>
    <article class="metric-card"><span class="metric-label">Passed</span><strong class="metric-value">${summary.passedStudents}</strong><span class="metric-detail">Students meeting every subject</span></article>
    <article class="metric-card"><span class="metric-label">Failed</span><strong class="metric-value">${summary.failedStudents}</strong><span class="metric-detail">Needs another look</span></article>
    <article class="metric-card"><span class="metric-label">Class average</span><strong class="metric-value">${number(summary.averageClassPercentage)}%</strong><span class="metric-detail">Top: ${summary.highestScorer.name}</span></article>`;
}

function renderResult(result) {
  const { student, subjects, overall } = result;
  gradeBadge.textContent = overall.grade;
  selectedStudent.textContent = `${student.rollNumber} / ${student.name}`;
  resultContent.className = 'result-content';
  resultContent.innerHTML = `
    <div class="result-overview">
      <div class="overview-item"><small>Total marks</small><strong>${number(overall.total)} / ${number(overall.maximum)}</strong></div>
      <div class="overview-item"><small>Average</small><strong>${number(overall.average)}</strong></div>
      <div class="overview-item"><small>Percentage</small><strong>${number(overall.percentage)}%</strong></div>
      <div class="overview-item"><small>Final status</small><strong class="${statusClass(overall.status)}">${overall.status}</strong></div>
    </div>
    <table class="result-table"><thead><tr><th>Subject</th><th>Marks</th><th>Percentage</th><th>Status</th></tr></thead><tbody>
      ${subjects.map(subject => `<tr><td>${subject.subject}</td><td>${number(subject.marks)} / ${number(subject.maxMarks)}</td><td>${number(subject.percentage)}%</td><td><span class="subject-status ${statusClass(subject.status)}">${subject.status}</span></td></tr>`).join('')}
    </tbody></table>`;
}

async function loadStudentResult(studentId) {
  if (!studentId) return;
  resultContent.className = 'result-content empty-state';
  resultContent.innerHTML = '<div class="empty-icon">...</div><p>Loading student result.</p>';
  try { renderResult(await request(`/api/students/${studentId}/result`)); }
  catch (error) { showError(error.message); resultContent.innerHTML = '<div class="empty-icon">!</div><p>Could not load this result.</p>'; }
}

async function loadDashboard() {
  clearError();
  refreshButton.disabled = true;
  try {
    const [studentsData, summary] = await Promise.all([request('/api/students'), request('/api/class-summary')]);
    renderSummary(summary);
    studentSelect.innerHTML = studentsData.students.map(student => `<option value="${student.id}">${student.rollNumber} — ${student.name}</option>`).join('');
    studentSelect.disabled = studentsData.students.length === 0;
    connectionStatus.innerHTML = '<span class="status-dot"></span> Database connected';
    if (studentsData.students.length) await loadStudentResult(studentsData.students[0].id);
  } catch (error) {
    connectionStatus.innerHTML = '<span class="status-dot offline"></span> Database unavailable';
    showError(`${error.message}. Check your MySQL connection and try refreshing.`);
  } finally { refreshButton.disabled = false; }
}

studentSelect.addEventListener('change', event => { clearError(); loadStudentResult(event.target.value); });
refreshButton.addEventListener('click', loadDashboard);
loadDashboard();
