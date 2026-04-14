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
      <button class="nav-btn logout" onclick="doLogout()">Logout</button>
    `;
    return;
  }

  if (safeRole === "doctor") {
    menu.innerHTML = `
      <button class="nav-btn" onclick="doctor_home()">Dashboard</button>
      <button class="nav-btn" onclick="doctor_appointments()">Appointments</button>
      <button class="nav-btn" onclick="doctor_patientHistory()">Patient History</button>
      <button class="nav-btn logout" onclick="doLogout()">Logout</button>
    `;
    return;
  }

  if (safeRole === "nurse") {
    menu.innerHTML = `
      <button class="nav-btn" onclick="nurse_home()">Dashboard</button>
      <button class="nav-btn" onclick="nurse_appointments()">Appointments</button>
      <button class="nav-btn" onclick="nurse_schedules()">Schedules</button>
      <button class="nav-btn logout" onclick="doLogout()">Logout</button>
    `;
    return;
  }

    if (safeRole === "receptionist") {
    menu.innerHTML = `
      <button class="nav-btn" onclick="loadReceptionist()">Dashboard</button>
      <button class="nav-btn" onclick="receptionistAppointments()">Appointments</button>
      <button class="nav-btn" onclick="rx_showPatientSearchInfo()">Search Patient Info</button>
      <button class="nav-btn" onclick="loadReceptionistPatientCreate()">Register Patient</button>
      <button class="nav-btn logout" onclick="doLogout()">Logout</button>
    `;
    return;
  }

  menu.innerHTML = `
    <button class="nav-btn logout" onclick="doLogout()">Logout</button>
  `;
}