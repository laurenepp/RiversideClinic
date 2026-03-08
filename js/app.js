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

  // Read response as text first, then parse JSON if possible
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = { raw: text };
  }

  if (!res.ok) {
    // throw best available error message
    throw (data && data.error) ? data.error : (data && data.raw ? data.raw : "Request failed");
  }

  return data;
}

// -----------------------------
// Role normalization
// (DB returns: Admin/Doctor/Nurse/Receptionist)
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
// Boot: check session
// -----------------------------
async function start() {
  try {
    const user = await api("api/auth/me.php");

    // Bring app back from login layout
    document.querySelector(".app")?.classList.remove("logged-out");

    // Welcome text
    const welcome = document.getElementById("welcome");
    if (welcome) {
      welcome.innerText = `${user.name} (${user.role})`;
    }

    // Normalize DB role value
    const role = normalizeRole(user.role);

    // Load the correct dashboard for the role
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

            <div class="login-form">
              <label for="u">Username</label>
              <input id="u" placeholder="Enter username">

              <label for="p">Password</label>
              <input id="p" type="password" placeholder="Enter password">

              <button class="login-btn" onclick="doLogin()">Login</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -----------------------------
// Login action
// -----------------------------
async function doLogin() {
  const username = document.getElementById("u").value.trim();
  const password = document.getElementById("p").value;

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
  // Basic shell: nav + main view
  // (We will later swap this markup to match your mockups exactly.)
  document.getElementById("content").innerHTML = `
    <div class="dashboard">
      <div class="dash-nav" id="dash_nav"></div>
      <div class="dash-main">
        <div id="dash_view"></div>
      </div>
    </div>
  `;

  const nav = document.getElementById("dash_nav");

    if (role === "admin") {
    nav.innerHTML = `
      <div class="admin-side-nav-group">
        <button class="navbtn" onclick="admin_home()">Admin Home</button>
        <button class="navbtn" onclick="admin_users()">Manage Users</button>
        <button class="navbtn" onclick="admin_reports()">Reporting</button>
      </div>

      <div class="admin-side-nav-footer">
        <button class="navbtn" onclick="doLogout()">Logout</button>
      </div>
    `;
    admin_users();
    return;
  }

  if (role === "doctor") {
    nav.innerHTML = `
      <button class="navbtn" onclick="doc_home()">Doctor Home</button>
      <button class="navbtn" onclick="doc_schedule()">My Schedule</button>
      <button class="navbtn" onclick="doc_notes()">Visit Notes</button>
      <button class="navbtn" onclick="doLogout()">Logout</button>
    `;
    doc_home();
    return;
  }

  if (role === "nurse") {
    nav.innerHTML = `
      <button class="navbtn" onclick="nurse_home()">Nurse Home</button>
      <button class="navbtn" onclick="nurse_schedule()">Schedules</button>
      <button class="navbtn" onclick="nurse_intake()">Intake</button>
      <button class="navbtn" onclick="doLogout()">Logout</button>
    `;
    nurse_home();
    return;
  }

  if (role === "receptionist") {
    nav.innerHTML = `
      <button class="navbtn" onclick="rx_home()">Reception Home</button>
      <button class="navbtn" onclick="rx_registerPatient()">Register Patient</button>
      <button class="navbtn" onclick="rx_appointments()">Appointments</button>
      <button class="navbtn" onclick="doLogout()">Logout</button>
    `;
    rx_home();
    return;
  }

  // Unknown role fallback
  nav.innerHTML = `
    <div style="padding:10px;">
      <b>Unknown role:</b> ${role}<br><br>
      <button class="navbtn" onclick="doLogout()">Logout</button>
    </div>
  `;
  setView(`<h2>No dashboard for this role yet.</h2>`);
}

function setView(html) {
  const view = document.getElementById("dash_view");
  if (view) view.innerHTML = html;
}

// -----------------------------
// Logout (optional endpoint)
// -----------------------------
async function doLogout() {
  // If you don't have logout.php yet, it will still reload cleanly.
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
  loadAdmin();
}

function admin_users() {
  loadAdmin();
  admin_showUsers();
}

function admin_reports() {
  loadAdmin();
  admin_showReports();
}

// -----------------------------
// Doctor Views (placeholders)
// -----------------------------
function doc_home() {
  setView(`
    <h2>Doctor Dashboard</h2>
    <p>TODO: Today’s schedule + quick visit note entry.</p>
  `);
}
function doc_schedule() {
  setView(`
    <h2>My Schedule</h2>
    <p>TODO: Pull appointments for this provider.</p>
  `);
}
function doc_notes() {
  setView(`
    <h2>Visit Notes</h2>
    <p>TODO: Create/view visit notes.</p>
  `);
}

// -----------------------------
// Nurse Views (placeholders)
// -----------------------------
function nurse_home() {
  setView(`
    <h2>Nurse Dashboard</h2>
    <p>TODO: Patient queue + intake shortcuts.</p>
  `);
}
function nurse_schedule() {
  setView(`
    <h2>Schedules</h2>
    <p>TODO: Nurse schedule view.</p>
  `);
}
function nurse_intake() {
  setView(`
    <h2>Intake</h2>
    <p>TODO: Initial visit documentation form.</p>
  `);
}

// -----------------------------
// Receptionist Views (placeholders)
// -----------------------------
function rx_home() {
  setView(`
    <h2>Reception Dashboard</h2>
    <p>TODO: Register patients + schedule appointments.</p>
  `);
}
function rx_registerPatient() {
  setView(`
    <h2>Register Patient</h2>
    <p>TODO: Patient registration form.</p>
  `);
}
function rx_appointments() {
  setView(`
    <h2>Appointments</h2>
    <p>TODO: Schedule/cancel/check-in appointments.</p>
  `);
}

// Start the app
start();