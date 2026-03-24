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
// Boot: check session
// -----------------------------
/*async function start() {
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
} */

async function start() {
  try {
    const user = await api("api/auth/me.php");

    document.querySelector(".app")?.classList.remove("logged-out");

    const welcome = document.getElementById("welcome");
    if (welcome) {
      welcome.innerText = `${user.name} (${user.role})`;
    }

    const role = normalizeRole(user.role);

    buildMenu(role);

    if (role === "admin") {
      admin_home();
      return;
    }

    if (role === "doctor") {
      loadDoctor();
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
/*function renderDashboardShell(role) {
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
}*/

function setView(html) {
  const view = document.getElementById("content");
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
/*function doc_home() {
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
*/

function doc_home() {
  setView(`
    <div class="card">
      <h2>Doctor Dashboard</h2>
      <p>Doctor home page placeholder.</p>
    </div>
  `);
}

function doc_schedule() {
  setView(`
    <div class="card">
      <div class="section-title">
        <h2>My Schedule</h2>
      </div>

      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Patient</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>8:30 AM</td>
            <td>Maria Lopez</td>
            <td>Follow-up</td>
            <td><span class="badge teal">Checked In</span></td>
            <td><button class="small primary" onclick="doc_patients()">Open Chart</button></td>
          </tr>
          <tr>
            <td>9:15 AM</td>
            <td>James Carter</td>
            <td>Blood Pressure Review</td>
            <td><span class="badge">Scheduled</span></td>
            <td><button class="small" onclick="doc_patients()">Open Chart</button></td>
          </tr>
          <tr>
            <td>10:00 AM</td>
            <td>Sophia Nguyen</td>
            <td>Medication Check</td>
            <td><span class="badge gold">Waiting</span></td>
            <td><button class="small" onclick="doc_patients()">Open Chart</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  `);
}

function doc_patients() {
  setView(`
    <div class="card">
      <div class="section-title">
        <h2>Patient Chart</h2>
        <div class="tools">
          <button class="ghost">Print Summary</button>
          <button class="secondary">Send Prescription</button>
          <button class="primary">Save Note</button>
        </div>
      </div>

      <div class="row compact" style="margin-top:14px;">
        <div class="field" style="flex:2;">
          <label>Search Patient</label>
          <input type="text" placeholder="Search by patient name or ID">
        </div>
        <div style="align-self:end;">
          <button class="primary">Search</button>
        </div>
      </div>

      <div class="tiles" style="margin-top:16px;">
        <div class="tile teal">
          <div class="content">
            <div class="label">Last Visit</div>
            <div class="value">03/20/2026</div>
            <div class="sub">Routine follow-up</div>
          </div>
        </div>

        <div class="tile gold">
          <div class="content">
            <div class="label">Blood Pressure</div>
            <div class="value">128/82</div>
            <div class="sub">Most recent reading</div>
          </div>
        </div>

        <div class="tile sage">
          <div class="content">
            <div class="label">Allergies</div>
            <div class="value">2</div>
            <div class="sub">Penicillin, Latex</div>
          </div>
        </div>

        <div class="tile dark">
          <div class="content">
            <div class="label">Active Meds</div>
            <div class="value">4</div>
            <div class="sub">Current medication list</div>
          </div>
        </div>
      </div>

      <div class="form-grid" style="margin-top:18px;">
        <div class="field">
          <label>Patient Name</label>
          <input value="Maria Lopez" disabled>
        </div>
        <div class="field">
          <label>Date of Birth</label>
          <input value="08/14/1986" disabled>
        </div>
        <div class="field">
          <label>Patient ID</label>
          <input value="10245" disabled>
        </div>
        <div class="field">
          <label>Phone</label>
          <input value="580-555-0134" disabled>
        </div>
      </div>

      <div class="section" style="margin-top:18px;">
        <div class="section-title">
          <h3>Vitals</h3>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Height</label>
            <input value="5 ft 6 in" disabled>
          </div>
          <div class="field">
            <label>Weight</label>
            <input value="164 lb" disabled>
          </div>
          <div class="field">
            <label>Temperature</label>
            <input value="98.4 F" disabled>
          </div>
          <div class="field">
            <label>Pulse</label>
            <input value="76 bpm" disabled>
          </div>
        </div>
      </div>

      <div class="section" style="margin-top:18px;">
        <div class="section-title">
          <h3>Allergies</h3>
        </div>
        <div class="badge gold">Penicillin</div>
        <div class="badge" style="margin-left:8px;">Latex</div>
      </div>

      <div class="section" style="margin-top:18px;">
        <div class="section-title">
          <h3>Current Medications</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Medication</th>
              <th>Dosage</th>
              <th>Frequency</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Lisinopril</td>
              <td>10 mg</td>
              <td>Once daily</td>
            </tr>
            <tr>
              <td>Metformin</td>
              <td>500 mg</td>
              <td>Twice daily</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section" style="margin-top:18px;">
        <div class="section-title">
          <h3>Assessment and Plan</h3>
        </div>

        <div class="field">
          <label>Chief Complaint</label>
          <input value="Follow-up for blood pressure and medication review">
        </div>

        <div class="field" style="margin-top:12px;">
          <label>Assessment</label>
          <textarea rows="4">Blood pressure improved since last visit. Patient tolerating medication well. No acute complaints today.</textarea>
        </div>

        <div class="field" style="margin-top:12px;">
          <label>Plan</label>
          <textarea rows="5">Continue current medication regimen. Encourage home blood pressure monitoring. Return in 3 months for follow-up.</textarea>
        </div>
      </div>

      <div class="section" style="margin-top:18px;">
        <div class="section-title">
          <h3>Recent Visit Notes</h3>
        </div>

        <div style="border:1px solid var(--border); padding:12px; border-radius:14px; margin-top:10px;">
          <div style="font-weight:800;">03/20/2026</div>
          <div style="margin-top:6px;">Routine follow-up. Reviewed medications and blood pressure log. Patient stable.</div>
        </div>

        <div style="border:1px solid var(--border); padding:12px; border-radius:14px; margin-top:10px;">
          <div style="font-weight:800;">12/18/2025</div>
          <div style="margin-top:6px;">Initial hypertension management visit. Started lisinopril and ordered lab work.</div>
        </div>
      </div>
    </div>
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