// RiversideClinic/js/app.js

// -----------------------------
// Tab/session marker for forced logout on close
// -----------------------------
const TAB_AUTH_KEY = "rc_tab_authenticated";

// -----------------------------
// API helper (fetch + JSON)
// -----------------------------
async function api(url, method = "GET", body = null) {
  const opts = {
    method,
    headers: {},
    credentials: "same-origin"
  };

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
    const hasTabMarker = sessionStorage.getItem(TAB_AUTH_KEY) === "1";

    // If server session still exists but this browser tab/window marker is gone,
    // treat it as a closed-session reopen and force logout.
    if (!hasTabMarker) {
      try {
        await api("api/auth/logout.php", "POST", {});
      } catch (logoutErr) {
        console.error("Forced logout failed:", logoutErr);
      }

      showLogin();
      return;
    }

    document.querySelector(".app")?.classList.remove("logged-out");
    setSidebarUser(user);

    // Force password change before any dashboard/menu access
    if (user.mustChangePassword) {
      const menu = document.getElementById("menu");
      if (menu) menu.innerHTML = "";

      const welcome = document.getElementById("welcome");
      if (welcome) welcome.innerText = "";

      const content = document.getElementById("content");
      if (content) {
        content.innerHTML = `
          <div class="password-lock-screen">
            <div class="password-lock-card">
              <h2>Password Change Required</h2>
              <p>You must change your temporary password before continuing.</p>
            </div>
          </div>
        `;
      }

      showFirstLoginPasswordModal();
      return;
    }

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
  hideLogoutModal();

  document.getElementById("content").innerHTML = `
    <div class="login-screen">
      <div class="login-left">
        <div class="login-logo-wrap">
          <img src="assets/images/Desert 1 Circle.png" class="login-logo">
          <img src="assets/images/Desert Riverside Text.png" class="login-logo-text">
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="login-card-inner">
            <p class="login-eyebrow">Riverside Family Clinic</p>
            <h1>Welcome Back</h1>
            <p>Sign in to access the clinic portal.</p>

            <form id="loginForm" class="login-form">
              <label for="u">Username</label>
              <input id="u" type="text" autocomplete="username" />

              <label for="p">Password</label>
              <input id="p" type="password" autocomplete="current-password" />

              <button type="submit">Login</button>
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
  const loginBtn = document.querySelector("#loginForm button[type='submit']");

  const username = usernameInput ? usernameInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value : "";

  if (!username || !password) {
    alert("Please enter your username and password.");
    return;
  }

  if (loginBtn) loginBtn.disabled = true;

  try {
    await api("api/auth/login.php", "POST", {
      username,
      password,
      _ts: Date.now()
    });

    sessionStorage.setItem(TAB_AUTH_KEY, "1");
    location.reload();
  } catch (err) {
    console.error("Login error:", err);

    let message = "Invalid login";

    if (typeof err === "string" && err.trim()) {
      message = err;
    } else if (err && typeof err.error === "string" && err.error.trim()) {
      message = err.error;
    } else if (err instanceof Error && err.message && err.message.trim()) {
      message = err.message;
    }

    alert(message);
  } finally {
    if (loginBtn) loginBtn.disabled = false;
  }
}

// -----------------------------
// First-login modal
// -----------------------------
function isStrongPassword(password) {
  return /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

function showFirstLoginPasswordModal() {
  const existing = document.getElementById("first-login-password-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "first-login-password-overlay";
  overlay.innerHTML = `
    <div class="first-login-password-modal">
      <h2>Change Temporary Password</h2>
      <p>This is your first login. You must create a new password before continuing.</p>

      <label for="firstLoginNewPassword">New Password</label>
      <input id="firstLoginNewPassword" type="password" />

      <label for="firstLoginConfirmPassword">Confirm New Password</label>
      <input id="firstLoginConfirmPassword" type="password" />

      <div id="firstLoginPasswordMsg"></div>

      <p>
        Password must be at least 8 characters and include:
        1 uppercase letter, 1 lowercase letter, and 1 special character.
      </p>

      <button type="button" onclick="submitFirstLoginPasswordChange()">Save New Password</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const newPasswordInput = document.getElementById("firstLoginNewPassword");
  const confirmPasswordInput = document.getElementById("firstLoginConfirmPassword");

  [newPasswordInput, confirmPasswordInput].forEach((input) => {
    input?.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        submitFirstLoginPasswordChange();
      }
    });
  });
}

async function submitFirstLoginPasswordChange() {
  const newPassword = document.getElementById("firstLoginNewPassword")?.value || "";
  const confirmPassword = document.getElementById("firstLoginConfirmPassword")?.value || "";
  const msg = document.getElementById("firstLoginPasswordMsg");

  if (msg) msg.innerHTML = "";

  if (!newPassword || !confirmPassword) {
    if (msg) msg.innerHTML = "Required fields";
    return;
  }

  if (newPassword !== confirmPassword) {
    if (msg) msg.innerHTML = "Passwords do not match";
    return;
  }

  if (!isStrongPassword(newPassword)) {
    if (msg) msg.innerHTML = "Password must meet requirements";
    return;
  }

  try {
    await api("api/auth/change_password.php", "POST", { newPassword, confirmPassword });

    if (msg) msg.innerHTML = "Password updated";

    setTimeout(() => {
      document.getElementById("first-login-password-overlay")?.remove();
      location.reload();
    }, 500);
  } catch (err) {
    if (msg) msg.innerHTML = err?.error || err || "Unable to update password";
  }
}

// -----------------------------
// Dashboard Shell + Menu Routing
// -----------------------------
function renderDashboardShell(role) {
  document.getElementById("content").innerHTML = `
    <div id="dash_view"></div>
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
    if (typeof nurse_home === "function") {
      nurse_home();
      return;
    }

    setView(`
      <h2>Nurse Dashboard</h2>
      <p>Nurse dashboard is loading.</p>
    `);
    return;
  }

  if (role === "receptionist") {
    rx_home();
    return;
  }

  setView(`
    <h2>Unknown role: ${role}</h2>
    <button onclick="doLogout()">Logout</button>
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
// Logout modal helpers
// -----------------------------
function showLogoutModal() {
  const modal = document.getElementById("logoutModal");
  if (modal) {
    modal.classList.add("show");
  }
}

function hideLogoutModal() {
  const modal = document.getElementById("logoutModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

// -----------------------------
// Logout
// -----------------------------
function doLogout() {
  showLogoutModal();
}

async function confirmLogout() {
  sessionStorage.removeItem(TAB_AUTH_KEY);

  try {
    await api("api/auth/logout.php", "POST", {});
  } catch (e) {
    console.error("Logout failed:", e);
  }

  hideLogoutModal();
  showLogin();
}

function cancelLogout() {
  hideLogoutModal();
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
    <h2>Administrator Dashboard</h2>
    <p>Admin dashboard is loading.</p>
  `);
}

function admin_users() {
  if (typeof admin_showUsers === "function") {
    admin_showUsers();
    return;
  }

  setView(`
    <h2>User Management</h2>
    <p>User management page coming soon.</p>
  `);
}

function admin_reports() {
  if (typeof loadAdmin === "function" && typeof admin_showReports === "function") {
    loadAdmin();
    setTimeout(() => {
      admin_showReports();
    }, 0);
    return;
  }

  setView(`
    <h2>Reports</h2>
    <p>Review clinic activity and reporting summaries.</p>
    <p>Reports page coming soon.</p>
  `);
}

function admin_settings() {
  setView(`
    <h2>Settings</h2>
    <p>Adjust clinic system preferences and admin settings.</p>
    <p>Settings page coming soon.</p>
  `);
}

// -----------------------------
// Doctor Views
// -----------------------------
function doc_home() {
  if (typeof loadDoctor === "function") {
    loadDoctor();
    return;
  }

  setView(`
    <h2>Doctor Dashboard</h2>
    <p>Doctor dashboard is loading.</p>
  `);
}

function doc_appointments() {
  if (typeof loadDoctorAppointments === "function") {
    loadDoctorAppointments();
    return;
  }

  setView(`
    <h2>Appointments</h2>
    <p>Doctor appointments will appear here.</p>
  `);
}

function doc_patientHistory() {
  if (typeof loadDoctorPatientHistory === "function") {
    loadDoctorPatientHistory();
    return;
  }

  setView(`
    <h2>Patient History</h2>
    <p>Doctor patient history view will appear here.</p>
  `);
}

// -----------------------------
// Nurse Views
// -----------------------------
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

function rx_patientInfo() {
  if (typeof loadReceptionist === "function") {
    loadReceptionist();
    setTimeout(() => {
      if (typeof rx_showPatientSearchInfo === "function") {
        rx_showPatientSearchInfo();
      }
    }, 0);
    return;
  }

  setView(`
    <h2>Search Patient Info</h2>
    <p>Patient lookup is not available right now.</p>
  `);
}

function rx_appointments() {
  if (typeof receptionistAppointments === "function") {
    receptionistAppointments();
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
