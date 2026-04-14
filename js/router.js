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
    <button class="nav-btn" onclick="admin_staff()">Staff Scheduling</button>
    <button class="nav-btn" onclick="admin_clinicHours()">Clinic Hours</button>
    <button class="nav-btn" onclick="doLogout()">Logout</button>
  `;
  return;
}

  if (safeRole === "doctor") {
    menu.innerHTML = `
      <button class="nav-btn" onclick="doc_home()">Dashboard</button>
      <button class="nav-btn" onclick="doc_appointments()">Appointments</button>
      <button class="nav-btn" onclick="doc_patientHistory()">Patient History</button>
      <button class="nav-btn" onclick="doLogout()">Logout</button>
    `;
    return;
  }

  if (safeRole === "nurse") {
    menu.innerHTML = `
      <button class="nav-btn" onclick="nurse_home()">Dashboard</button>
      <button class="nav-btn" onclick="nurseAppointments()">Appointments</button>
      <button class="nav-btn" onclick="nurse_schedule()">Schedules</button>
      <button class="nav-btn" onclick="doLogout()">Logout</button>
    `;
    return;
  }

    if (safeRole === "receptionist") {
    menu.innerHTML = `
      <button class="nav-btn" onclick="rx_home()">Dashboard</button>
      <button class="nav-btn" onclick="rx_appointments()">Appointments</button>
      <button class="nav-btn" onclick="rx_patientInfo()">Search Patient Info</button>
      <button class="nav-btn" onclick="rx_patients()">Register Patient</button>
      <button class="nav-btn" onclick="doLogout()">Logout</button>
    `;
    return;
  }

  menu.innerHTML = `
    <button class="nav-btn" onclick="doLogout()">Logout</button>
  `;
}