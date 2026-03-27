// RiversideClinic/js/app.js

// -----------------------------
// API helper (fetch + JSON)
// -----------------------------
async function api(url, method = "GET", body = null) {
  const opts = { method, headers: {} };

  if (body !== null) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);
  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = { raw: text };
  }

  if (!res.ok) {
    throw (data && data.error)
      ? data.error
      : (data && data.raw ? data.raw : "Request failed");
  }

  return data;
}

// -----------------------------
// Role normalization
// -----------------------------
function normalizeRole(role) {
  role = (role || "").trim().toLowerCase();

  if (role === "administrator") return "admin";
  if (role === "admin") return "admin";
  if (role === "doctor") return "doctor";
  if (role === "nurse") return "nurse";
  if (role === "receptionist") return "receptionist";

  return role;
}

// -----------------------------
// Sidebar user display
// -----------------------------
function setSidebarUser(user) {
  const sidebarUser = document.getElementById("sidebarUser");
  if (!sidebarUser) return;

  if (!user || !user.name) {
    sidebarUser.innerText = "";
    return;
  }

  sidebarUser.innerText = `${user.name} (${user.role})`;
}

// -----------------------------
// Boot: check session
// -----------------------------
async function start() {
  try {
    const user = await api("api/auth/me.php");

    document.querySelector(".app")?.classList.remove("logged-out");

    const welcome = document.getElementById("welcome");
    if (welcome) {
      welcome.innerText = `${user.name} (${user.role})`;
    }

    setSidebarUser(user);

    const role = normalizeRole(user.role);
    renderDashboardShell(role);
  } catch (err) {
    showLogin();
  }
}

// -----------------------------
// Login UI
// -----------------------------
function showLogin() {
  document.querySelector(".app")?.classList.add("logged-out");

  const menu = document.getElementById("menu");
  if (menu) menu.innerHTML = "";

  const welcome = document.getElementById("welcome");
  if (welcome) welcome.innerText = "";

  setSidebarUser(null);

  document.getElementById("content").innerHTML = `
    <div class="login-screen">
      <div class="login-left">
        <div class="login-logo-wrap">
          <img
            src="assets/images/Desert 1 Circle.png"
            alt="Riverside Clinic Logo"
            class="login-logo"
          >
          <img
            src="assets/images/Desert Riverside Text.png"
            alt="Riverside Clinic"
            class="login-logo-text"
          >
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="login-card-inner">
            <p class="login-eyebrow">Riverside Family Clinic</p>
            <h1>Welcome Back</h1>
            <p class="login-subtext">Sign in to access the clinic portal.</p>

            <form id="loginForm" class="login-form">
              <label for="u">Username</label>
              <input
                id="u"
                name="username"
                type="text"
                placeholder="Enter username"
                autocomplete="username"
              >

              <label for="p">Password</label>
              <input
                id="p"
                name="password"
                type="password"
                placeholder="Enter password"
                autocomplete="current-password"
              >

              <button type="submit" class="login-btn">Login</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      await doLogin();
    });
  }
}

// -----------------------------
// Login action
// -----------------------------
async function doLogin() {
  const usernameInput = document.getElementById("u");
  const passwordInput = document.getElementById("p");

  const username = usernameInput ? usernameInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value : "";

  if (!username || !password) {
    alert("Please enter your username and password.");
    return;
  }

  try {
    await api("api/auth/login.php", "POST", { username, password });
    location.reload();
  } catch (err) {
    alert("Invalid username or password");
    console.error("Login error:", err);
  }
}

// -----------------------------
// Dashboard Shell + Menu Routing
// -----------------------------
function renderDashboardShell(role) {
  document.getElementById("content").innerHTML = `
    <div class="dashboard">
      <div class="dash-main">
        <div id="dash_view"></div>
      </div>
    </div>
  `;

  if (typeof buildMenu === "function") {
    buildMenu(role);
  }

  if (role === "admin") {
    admin_home();
    return;
  }

  if (role === "doctor") {
    doc_home();
    return;
  }

  if (role === "nurse") {
    nurse_home();
    return;
  }

  if (role === "receptionist") {
    rx_home();
    return;
  }

  setView(`
    <div style="padding:10px;">
      <b>Unknown role:</b> ${role}<br><br>
      <button class="nav-btn logout" onclick="doLogout()">Logout</button>
    </div>
  `);
}

// -----------------------------
// View helper
// -----------------------------
function setView(html) {
  const view = document.getElementById("dash_view");
  if (view) view.innerHTML = html;
}

// -----------------------------
// Logout
// -----------------------------
async function doLogout() {
  try {
    await api("api/auth/logout.php", "POST", {});
  } catch (e) {
    // ignore
  }

  location.reload();
}

// -----------------------------
// Admin Views
// -----------------------------
function admin_home() {
  if (typeof loadAdmin === "function") {
    loadAdmin();
    return;
  }

  setView(`
    <div class="page-header">
      <h2>Administrator Dashboard</h2>
      <p>Admin dashboard is loading.</p>
    </div>
  `);
}

function admin_users() {
  if (typeof admin_showUsers === "function") {
    admin_showUsers();
    return;
  }

  setView(`
    <div class="page-header">
      <h2>User Management</h2>
      <p>User management page coming soon.</p>
    </div>
  `);
}

function admin_appointments() {
  setView(`
    <div class="page-header">
      <h2>Appointments</h2>
      <p>View and manage clinic scheduling.</p>
    </div>
    <div class="admin-panel-box">
      <p>Appointments page coming soon.</p>
    </div>
  `);
}

function admin_staff() {
  setView(`
    <div class="page-header">
      <h2>Staff</h2>
      <p>Manage clinic staff and role assignments.</p>
    </div>
    <div class="admin-panel-box">
      <p>Staff management page coming soon.</p>
    </div>
  `);
}

function admin_reports() {
  if (typeof admin_showReports === "function") {
    admin_showReports();
    return;
  }

  setView(`
    <div class="page-header">
      <h2>Reports</h2>
      <p>Review clinic activity and reporting summaries.</p>
    </div>
    <div class="admin-panel-box">
      <p>Reports page coming soon.</p>
    </div>
  `);
}

function admin_settings() {
  setView(`
    <div class="page-header">
      <h2>Settings</h2>
      <p>Adjust clinic system preferences and admin settings.</p>
    </div>
    <div class="admin-panel-box">
      <p>Settings page coming soon.</p>
    </div>
  `);
}

// -----------------------------
// Doctor Views
// -----------------------------

/* NOTE:
   This keeps the doctor landing page using the full doctor dashboard
   from js/roles/doctor.js
*/
function doc_home() {
  if (typeof doc_showDashboard === "function") {
    doc_showDashboard();
    return;
  }

  if (typeof loadDoctor === "function") {
    loadDoctor();
    return;
  }

  setView(`
    <h2>Doctor Dashboard</h2>
    <p>Doctor dashboard is loading.</p>
  `);
}

/* NOTE:
   This now sends the My Schedule tab to the doctor.js schedule page
   instead of the old placeholder text
*/
function doc_schedule() {
  if (typeof doc_showSchedule === "function") {
    doc_showSchedule();
    return;
  }

  setView(`
    <h2>My Schedule</h2>
    <p>Schedule page is loading.</p>
  `);
}

/* NOTE:
   This now sends the Visit Notes tab to the doctor.js visit notes page
   instead of the old placeholder text
*/
function doc_notes() {
  if (typeof doc_showVisitNotes === "function") {
    doc_showVisitNotes();
    return;
  }

  setView(`
    <h2>Visit Notes</h2>
    <p>Visit notes page is loading.</p>
  `);
}

/* NOTE:
   This now sends the Patients tab to the doctor.js patients page
   instead of the old placeholder text
*/
function doc_patients() {
  if (typeof doc_showPatients === "function") {
    doc_showPatients();
    return;
  }

  setView(`
    <h2>Patients</h2>
    <p>Patients page is loading.</p>
  `);
}

// -----------------------------
// Nurse Views
// -----------------------------
function nurse_home() {
  if (typeof loadNurse === "function") {
    loadNurse();
    return;
  }

  setView(`
    <h2>Nurse Dashboard</h2>
    <p>TODO: Vitals + rooming workflow.</p>
  `);
}

function nurse_patients() {
  setView(`
    <h2>Assigned Patients</h2>
    <p>TODO: Nurse patient list.</p>
  `);
}

function nurse_vitals() {
  setView(`
    <h2>Vitals</h2>
    <p>TODO: Record patient vitals.</p>
  `);
}

function nurse_tasks() {
  setView(`
    <h2>Tasks</h2>
    <p>TODO: Nurse task queue.</p>
  `);
}

// -----------------------------
// Receptionist Views
// -----------------------------
function rx_home() {
  if (typeof loadReceptionist === "function") {
    loadReceptionist();
    return;
  }

  setView(`
    <h2>Receptionist Dashboard</h2>
    <p>TODO: Check-in, appointments, patient search.</p>
  `);
}

function rx_patients() {
  if (typeof loadReceptionist === "function") {
    loadReceptionist();
    setTimeout(() => {
      if (typeof rx_showPatientCreate === "function") {
        rx_showPatientCreate();
      }
    }, 0);
    return;
  }

  setView(`
    <h2>Patients</h2>
    <p>Patient registration is not available right now.</p>
  `);
}

function rx_appointments() {
  if (typeof loadReceptionist === "function") {
    loadReceptionist();
    setTimeout(() => {
      if (typeof rx_showAppointmentBoard === "function") {
        rx_showAppointmentBoard();
      }
    }, 0);
    return;
  }

  setView(`
    <h2>Appointments</h2>
    <p>Appointments are not available right now.</p>
  `);
}

function rx_checkin() {
  if (typeof loadReceptionist === "function") {
    loadReceptionist();
    return;
  }

  setView(`
    <h2>Check-In</h2>
    <p>Front desk check-in workflow is not available right now.</p>
  `);
}
// -----------------------------
// Start app
// -----------------------------
start();