const STORAGE_KEY = "studenthub-week4-students";

const starterStudents = [
  { id: "STU-1001", name: "Ananya Reddy", email: "ananya.reddy@example.com", course: "Web Development", status: "Active" },
  { id: "STU-1002", name: "Rahul Kumar", email: "rahul.kumar@example.com", course: "Python Programming", status: "Active" },
  { id: "STU-1003", name: "Priya Sharma", email: "priya.sharma@example.com", course: "UI/UX Design", status: "Inactive" },
  { id: "STU-1004", name: "Arjun Rao", email: "arjun.rao@example.com", course: "Data Science", status: "Active" },
  { id: "STU-1005", name: "Sneha Patel", email: "sneha.patel@example.com", course: "Java Programming", status: "Active" }
];

const $ = (id) => document.getElementById(id);
const dialog = $("studentDialog");
const form = $("studentForm");
let students = loadStudents();
let toastTimer;

function loadStudents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? [...starterStudents] : JSON.parse(saved);
  } catch (error) {
    console.warn("Could not load saved students:", error);
    return [...starterStudents];
  }
}

function saveStudents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch (error) {
    showToast("Could not save data. Check your browser storage.");
  }
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function renderStudents() {
  const query = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const course = $("courseFilter").value;
  const filtered = students.filter(student => {
    const matchesQuery = [student.name, student.email, student.course, student.id]
      .some(value => value.toLowerCase().includes(query));
    return matchesQuery && (status === "all" || student.status === status) &&
      (course === "all" || student.course === course);
  });

  $("studentTableBody").innerHTML = filtered.map(student => `
    <tr>
      <td><div class="student-cell"><div class="avatar">${escapeHTML(initials(student.name))}</div>
        <div><div class="student-name">${escapeHTML(student.name)}</div><div class="student-id">${escapeHTML(student.id)}</div></div></div></td>
      <td><span class="course-label">${escapeHTML(student.course)}</span></td>
      <td>${escapeHTML(student.email)}</td>
      <td><span class="badge ${student.status.toLowerCase()}">${escapeHTML(student.status)}</span></td>
      <td><div class="actions"><button class="icon-btn" data-action="edit" data-id="${escapeHTML(student.id)}" aria-label="Edit ${escapeHTML(student.name)}">✎ Edit</button>
      <button class="icon-btn delete" data-action="delete" data-id="${escapeHTML(student.id)}" aria-label="Delete ${escapeHTML(student.name)}">× Delete</button></div></td>
    </tr>`).join("");

  $("emptyState").classList.toggle("visible", filtered.length === 0);
  $("recordCount").textContent = `${filtered.length} ${filtered.length === 1 ? "record" : "records"}`;
  $("footerCount").textContent = `Showing ${filtered.length} of ${students.length} students`;
  $("totalStudents").textContent = students.length;
  $("activeStudents").textContent = students.filter(s => s.status === "Active").length;
  $("courseCount").textContent = new Set(students.map(s => s.course)).size;
  updateCourseFilter();
}

function updateCourseFilter() {
  const select = $("courseFilter");
  const current = select.value;
  const courses = [...new Set(students.map(s => s.course))].sort();
  select.innerHTML = '<option value="all">All courses</option>' +
    courses.map(course => `<option value="${escapeHTML(course)}">${escapeHTML(course)}</option>`).join("");
  select.value = courses.includes(current) ? current : "all";
}

function openAddDialog() {
  form.reset();
  $("studentId").value = "";
  $("dialogTitle").textContent = "Add Student";
  $("saveStudent").textContent = "Save Student";
  $("formError").textContent = "";
  dialog.showModal();
  $("studentName").focus();
}

function openEditDialog(id) {
  const student = students.find(item => item.id === id);
  if (!student) return;
  $("studentId").value = student.id;
  $("studentName").value = student.name;
  $("studentEmail").value = student.email;
  $("studentCourse").value = student.course;
  $("studentStatus").value = student.status;
  $("dialogTitle").textContent = "Edit Student";
  $("saveStudent").textContent = "Update Student";
  $("formError").textContent = "";
  dialog.showModal();
  $("studentName").focus();
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function createId() {
  let next = 1001;
  const numbers = students.map(s => Number(s.id.replace("STU-", ""))).filter(Number.isFinite);
  if (numbers.length) next = Math.max(...numbers) + 1;
  return `STU-${next}`;
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const id = $("studentId").value;
  const name = $("studentName").value.trim();
  const email = $("studentEmail").value.trim();
  const course = $("studentCourse").value;
  const status = $("studentStatus").value;

  if (!name || !email || !course) {
    $("formError").textContent = "Please complete all required fields.";
    return;
  }
  const duplicate = students.some(s => s.email.toLowerCase() === email.toLowerCase() && s.id !== id);
  if (duplicate) {
    $("formError").textContent = "A student with this email already exists.";
    return;
  }

  if (id) {
    students = students.map(s => s.id === id ? { ...s, name, email, course, status } : s);
    showToast("Student details updated successfully.");
  } else {
    students.unshift({ id: createId(), name, email, course, status });
    showToast("Student added successfully.");
  }
  saveStudents();
  dialog.close();
  renderStudents();
});

$("studentTableBody").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === "edit") openEditDialog(id);
  if (action === "delete") {
    const student = students.find(s => s.id === id);
    if (student && confirm(`Delete ${student.name}'s record? This cannot be undone.`)) {
      students = students.filter(s => s.id !== id);
      saveStudents();
      renderStudents();
      showToast("Student record deleted.");
    }
  }
});

$("addStudentTop").addEventListener("click", openAddDialog);
$("emptyAddBtn").addEventListener("click", openAddDialog);
$("closeDialog").addEventListener("click", () => dialog.close());
$("cancelDialog").addEventListener("click", () => dialog.close());
$("searchInput").addEventListener("input", renderStudents);
$("statusFilter").addEventListener("change", renderStudents);
$("courseFilter").addEventListener("change", renderStudents);

$("resetDemo").addEventListener("click", () => {
  if (confirm("Reset all records to the original demo students? Your current changes will be lost.")) {
    students = [...starterStudents];
    saveStudents();
    $("searchInput").value = "";
    $("statusFilter").value = "all";
    $("courseFilter").value = "all";
    renderStudents();
    showToast("Demo data restored.");
  }
});

dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

renderStudents();
