// ===============================
// Sidebar Menu Builder
// ===============================

function buildMenu(role) {

  const menu = document.getElementById("menu");
  if (!menu) return;

  menu.innerHTML = "";

  role = (role || "").trim().toLowerCase();

  // ===============================
  // ADMIN MENU
  // ===============================
  if (role === "admin" || role === "administrator") {
  menu.innerHTML = `
    <button class="nav-btn" onclick="admin_home()">Dashboard</button>
    <button class="nav-btn" onclick="admin_users()">User Management</button>
    <button class="nav-btn" onclick="admin_appointments()">Appointments</button>
    <button class="nav-btn" onclick="admin_staff()">Staff</button>
    <button class="nav-btn" onclick="admin_reports()">Reports</button>
    <button class="nav-btn" onclick="admin_settings()">Settings</button>
    <<button class="nav-btn logout" onclick="logout()">Logout</button>
  `;
  return;
}


  // ===============================
  // DOCTOR MENU
  // ===============================
  if (role === "doctor") {

    menu.innerHTML = `
      <button class="nav-btn" onclick="doc_home()">Dashboard</button>
      <button class="nav-btn" onclick="doc_schedule()">My Schedule</button>
      <button class="nav-btn" onclick="doc_patients()">Patients</button>
      <button class="nav-btn logout" onclick="logout()">Logout</button>
    `;

    return;
  }

  // ===============================
  // NURSE MENU
  // ===============================
  if (role === "nurse") {

    menu.innerHTML = `
      <button class="nav-btn" onclick="nurse_home()">Dashboard</button>
      <button class="nav-btn" onclick="nurse_schedule()">Schedules</button>
      <button class="nav-btn" onclick="nurse_intake()">Patient Intake</button>
      <button class="nav-btn logout" onclick="logout()">Logout</button>
    `;

    return;
  }

  // ===============================
  // RECEPTIONIST MENU
  // ===============================
  if (role === "receptionist") {

    menu.innerHTML = `
      <button class="nav-btn" onclick="rx_home()">Dashboard</button>
      <button class="nav-btn" onclick="rx_registerPatient()">Register Patient</button>
      <button class="nav-btn" onclick="rx_appointments()">Appointments</button>
      <button class="nav-btn logout" onclick="logout()">Logout</button>
    `;

    return;
  }

}