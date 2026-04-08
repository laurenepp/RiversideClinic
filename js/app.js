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
    setSidebarUser(user);

    const role = normalizeRole(user.role);
    renderDashboardShell(role);

    if (user.mustChangePassword) {
      setTimeout(() => {
        showFirstLoginPasswordModal();
      }, 150);
    }
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

  setSidebarUser(null);
  hideLogoutModal();

  document.getElementById("content").innerHTML = `
    <div class="login-screen">
      <div class="login-left">
        <div class="login-logo-wrap">
          <img src="assets/images/Desert 1 Circle.png" class="login-logo" alt="Riverside Family Clinic Logo">
          <img src="assets/images/Desert Riverside Text.png" class="login-logo-text" alt="Riverside Family Clinic">
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
              <input id="u" type="text" autocomplete="username">

              <label for="p">Password</label>
              <input id="p" type="password" autocomplete="current-password">

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

  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.right = "0";
  overlay.style.bottom = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0, 0, 0, 0.55)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "999999";
  overlay.style.padding = "20px";
  overlay.style.boxSizing = "border-box";

  overlay.innerHTML = `
    <div id="first-login-password-modal-box" style="
      background: #ffffff;
      color: #111827;
      width: 100%;
      max-width: 480px;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      font-family: Arial, sans-serif;
    ">
      <h2 style="margin-top:0; margin-bottom:10px;">Change Temporary Password</h2>
      <p style="margin-top:0; margin-bottom:16px;">
        This is your first login. You must create a new password before continuing.
      </p>

      <label for="firstLoginNewPassword" style="display:block; margin-top:12px; font-weight:600;">New Password</label>
      <input id="firstLoginNewPassword" type="password" style="
        width:100%;
        margin-top:6px;
        margin-bottom:12px;
        padding:10px;
        box-sizing:border-box;
        border:1px solid #cbd5e1;
        border-radius:8px;
      ">

      <label for="firstLoginConfirmPassword" style="display:block; font-weight:600;">Confirm New Password</label>
      <input id="firstLoginConfirmPassword" type="password" style="
        width:100%;
        margin-top:6px;
        margin-bottom:12px;
        padding:10px;
        box-sizing:border-box;
        border:1px solid #cbd5e1;
        border-radius:8px;
      ">

      <div id="firstLoginPasswordMsg" style="margin-bottom:12px; color:#b91c1c; min-height:20px;"></div>

      <p style="font-size:14px; margin-bottom:16px; line-height:1.4;">
        Password must be at least 8 characters and include:
        1 uppercase letter, 1 lowercase letter, and 1 special character.
      </p>

      <button onclick="submitFirstLoginPasswordChange()" style="
        width:100%;
        padding:12px;
        cursor:pointer;
        border:none;
        border-radius:8px;
      ">
        Save New Password
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  const newPasswordInput = document.getElementById("firstLoginNewPassword");
  const confirmPasswordInput = document.getElementById("firstLoginConfirmPassword");

  [newPasswordInput, confirmPasswordInput].forEach(input => {
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
    await api("api/auth/change_password.php", "POST", {
      newPassword,
      confirmPassword
    });

    if (msg) {
      msg.style.color = "#166534";
      msg.innerHTML = "Password updated";
    }

    setTimeout(() => {
      document.getElementById("first-login-password-overlay")?.remove();
      location.reload();
    }, 500);
  } catch (err) {
    if (msg) {
      msg.style.color = "#b91c1c";
      msg.innerHTML = err?.error || err || "Unable to update password";
    }
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
    nurse_home();
    return;
  }

  if (role === "receptionist") {
    rx_home();
    return;
  }

  setView(`
    <div class="card">
      <h2>Unknown role: ${role}</h2>
      <button onclick="doLogout()">Logout</button>
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
    <div class="card">
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
    <div class="card">
      <h2>User Management</h2>
      <p>User management page coming soon.</p>
    </div>
  `);
}

function admin_reports() {
  if (typeof admin_showReports === "function") {
    admin_showReports();
    return;
  }

  setView(`
    <div class="card">
      <h2>Reports</h2>
      <p>Review clinic activity and reporting summaries.</p>
      <p>Reports page coming soon.</p>
    </div>
  `);
}

function admin_settings() {
  setView(`
    <div class="card">
      <h2>Settings</h2>
      <p>Adjust clinic system preferences and admin settings.</p>
      <p>Settings page coming soon.</p>
    </div>
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
    <div class="card">
      <h2>Doctor Dashboard</h2>
      <p>Doctor dashboard is loading.</p>
    </div>
  `);
}

function doc_appointments() {
  if (typeof loadDoctorAppointments === "function") {
    loadDoctorAppointments();
    return;
  }

  setView(`
    <div class="card">
      <h2>Appointments</h2>
      <p>Doctor appointments will appear here.</p>
    </div>
  `);
}

function doc_patientHistory() {
  if (typeof loadDoctorPatientHistory === "function") {
    loadDoctorPatientHistory();
    return;
  }

  setView(`
    <div class="card">
      <h2>Patient History</h2>
      <p>Doctor patient history view will appear here.</p>
    </div>
  `);
}

// -----------------------------
// Nurse Views
// -----------------------------
function nurse_patients() {
  setView(`
    <div class="card">
      <h2>Assigned Patients</h2>
      <p>TODO: Nurse patient list.</p>
    </div>
  `);
}

function nurse_vitals() {
  setView(`
    <div class="card">
      <h2>Vitals</h2>
      <p>TODO: Record patient vitals.</p>
    </div>
  `);
}

function nurse_tasks() {
  setView(`
    <div class="card">
      <h2>Tasks</h2>
      <p>TODO: Nurse task queue.</p>
    </div>
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
    <div class="card">
      <h2>Receptionist Dashboard</h2>
      <p>TODO: Check-in, appointments, patient search.</p>
    </div>
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
    <div class="card">
      <h2>Patients</h2>
      <p>Patient registration is not available right now.</p>
    </div>
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
    <div class="card">
      <h2>Appointments</h2>
      <p>Appointments are not available right now.</p>
    </div>
  `);
}

function rx_checkin() {
  if (typeof loadReceptionist === "function") {
    loadReceptionist();
    return;
  }

  setView(`
    <div class="card">
      <h2>Check-In</h2>
      <p>Front desk check-in workflow is not available right now.</p>
    </div>
  `);
}

// -----------------------------
// Start app
// -----------------------------
start();