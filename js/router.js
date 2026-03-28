// RiversideClinic/js/router.js

function buildMenu(role) {
  const menu = document.getElementById("menu");
  if (!menu) return;

  const safeRole = (role || "").trim().toLowerCase();
  menu.innerHTML = "";

  if (safeRole === "admin" || safeRole === "administrator") {
    menu.innerHTML = `
      <button class="nav-btn" onclick="admin_home()">Dashboard</button>
      <button class="nav-btn" onclick="admin_users()">User Management</button>
      <button class="nav-btn" onclick="admin_appointments()">Appointments</button>
      <button class="nav-btn" onclick="admin_staff()">Staff</button>
      <button class="nav-btn" onclick="admin_reports()">Reports</button>
      <button class="nav-btn" onclick="admin_settings()">Settings</button>
      <button class="nav-btn logout" onclick="doLogout()">Logout</button>
    `;
    return;
  }

  if (safeRole === "doctor") {
    menu.innerHTML = `
      <button class="nav-btn" onclick="doc_home()">Dashboard</button>
      <button class="nav-btn" onclick="doc_schedule()">My Schedule</button>
      <button class="nav-btn" onclick="doc_patients()">Patients</button>
      <button class="nav-btn" onclick="doc_notes()">Visit Notes</button>
      <button class="nav-btn logout" onclick="doLogout()">Logout</button>
    `;
    return;
  }

  if (safeRole === "nurse") {
    menu.innerHTML = `
      <button class="nav-btn" onclick="nurse_home()">Dashboard</button>
      <button class="nav-btn" onclick="nurse_schedule()">Schedules</button>
      <button class="nav-btn" onclick="nurse_intake()">Patient Intake</button>
      <button class="nav-btn logout" onclick="doLogout()">Logout</button>
    `;
    return;
  }

 if (safeRole === "receptionist") {
  menu.innerHTML = `
    <button class="nav-btn" onclick="loadReceptionist()">Dashboard</button>
    <button class="nav-btn" onclick="loadReceptionistPatientCreate()">Register Patient</button>
    <button class="nav-btn" onclick="receptionistAppointments()">Appointments</button>
    <button class="nav-btn logout" onclick="doLogout()">Logout</button>
  `;
  return;
}

  menu.innerHTML = `
    <button class="nav-btn logout" onclick="doLogout()">Logout</button>
  `;
}