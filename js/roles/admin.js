// js/roles/admin.js

function loadAdmin(){
  const content = document.getElementById("content");

  content.innerHTML = `
    <div class="card">
      <h2>Administrator — System Oversight</h2>
      <p>Users, system status, reporting</p>

      <div id="admin_tiles"></div>

      <div class="section">
        <div class="section-title">
          <h3>Admin Tools</h3>
          <div class="tools">
            <button class="primary" onclick="admin_showUsers()">Manage Users</button>
            <button class="secondary" onclick="admin_showReports()">Reporting</button>
          </div>
        </div>
      </div>

      <div id="admin_panel"></div>
    </div>
  `;

  admin_loadTiles();
  admin_showUsers();
}

async function admin_loadTiles(){
  const wrap = document.getElementById("admin_tiles");
  wrap.innerHTML = `<div style="margin-top:12px; color: var(--muted); font-weight:700;">Loading dashboard…</div>`;

  const d = await apiSafe("api/admin/dashboard_summary.php");

  wrap.innerHTML = `
    <div class="tiles">
      ${admin_tile("Users (Total)", d.totalUsers, `As of ${d.today}`, "U", "teal")}
      ${admin_tile("Users (Active)", d.activeUsers, `Not disabled`, "A", "sage")}
      ${admin_tile("Appointments Today", d.appointmentsToday, `Scheduled today`, "C", "gold")}
      ${admin_tile("Checked-In Today", d.checkedInToday, `Front desk check-ins`, "✓", "dark")}
      ${admin_tile("Completed Today", d.completedToday, `Visits completed`, "✔", "teal")}
      ${admin_tile("Cancelled Today", d.cancelledToday, `Cancelled visits`, "×", "gold")}
    </div>
  `;
}

function admin_tile(label, value, sub, iconText, tone){
  return `
    <div class="tile ${tone}">
      <div class="icon">${iconText}</div>
      <div class="content">
        <div class="label">${label}</div>
        <div class="value">${value}</div>
        <div class="sub">${sub}</div>
      </div>
    </div>
  `;
}

function admin_panel(html){
  document.getElementById("admin_panel").innerHTML = html;
}

/* -------------------------
   USERS
------------------------- */

async function admin_showUsers(){
  admin_panel(`
    <div class="section-title">
      <h3>Manage Users</h3>
      <div class="tools">
        <button class="primary" onclick="admin_showCreateUser()">+ Create User</button>
        <button class="ghost" onclick="admin_loadUsers()">Refresh</button>
      </div>
    </div>
    <div id="admin_users"></div>
  `);
  await admin_loadUsers();
}

async function admin_loadUsers(){
  const data = await apiSafe("api/admin/users_list.php");

  const rows = data.users.map(u => `
    <tr>
      <td>${u.User_ID}</td>
      <td>${u.Last_Name}, ${u.First_Name}</td>
      <td>${u.Role_Name}</td>
      <td>${u.Email}</td>
      <td>${u.Phone_Number}</td>
      <td>${u.Is_Disabled ? `<span class="badge gold">DISABLED</span>` : `<span class="badge teal">ACTIVE</span>`}</td>
      <td>
        <button class="small" onclick='admin_editUser(${JSON.stringify(u)})'>Edit</button>
        <button class="small ${u.Is_Disabled ? "secondary" : "gold"}"
          onclick="admin_toggleDisable(${u.User_ID}, ${u.Is_Disabled ? 0 : 1})">
          ${u.Is_Disabled ? "Enable" : "Disable"}
        </button>
      </td>
    </tr>
  `).join("");

  document.getElementById("admin_users").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="7">No users</td></tr>`}</tbody>
    </table>
  `;
}

function admin_showCreateUser(){
  admin_panel(`
    <div class="section-title">
      <h3>Create User</h3>
      <div class="tools">
        <button class="ghost" onclick="admin_showUsers()">Back</button>
      </div>
    </div>

    <div class="form-grid">
      <div class="field">
        <label>First Name</label>
        <input id="cu_first" placeholder="First Name">
      </div>
      <div class="field">
        <label>Last Name</label>
        <input id="cu_last" placeholder="Last Name">
      </div>
      <div class="field">
        <label>Email</label>
        <input id="cu_email" placeholder="Email">
      </div>
      <div class="field">
        <label>Phone</label>
        <input id="cu_phone" placeholder="Phone">
      </div>
      <div class="field">
        <label>Role</label>
        <select id="cu_role">
          <option>Administrator</option>
          <option>Doctor</option>
          <option>Nurse</option>
          <option>Receptionist</option>
        </select>
      </div>
      <div class="field">
        <label>Username</label>
        <input id="cu_username" placeholder="Username">
      </div>
      <div class="field">
        <label>Password</label>
        <input id="cu_password" type="password" placeholder="Password">
        <div class="hint">This is hashed server-side.</div>
      </div>
    </div>

    <div class="row" style="margin-top:12px;">
      <button class="primary" onclick="admin_createUser()">Create User</button>
    </div>

    <div id="admin_msg" style="margin-top:10px;"></div>
  `);
}

async function admin_createUser(){
  const firstName = document.getElementById("cu_first").value.trim();
  const lastName  = document.getElementById("cu_last").value.trim();
  const email     = document.getElementById("cu_email").value.trim();
  const phone     = document.getElementById("cu_phone").value.trim();
  const roleName  = document.getElementById("cu_role").value;
  const username  = document.getElementById("cu_username").value.trim();
  const password  = document.getElementById("cu_password").value;

  const res = await apiSafe("api/admin/users_create.php","POST",{
    firstName,lastName,email,phone,roleName,username,password
  });

  toast("User created", `User ID ${res.userId}`, "ok");
  document.getElementById("admin_msg").innerHTML = `<span class="badge teal">Created User ID: ${res.userId}</span>`;

  await admin_loadUsers();
  await admin_loadTiles();
}

function admin_editUser(u){
  admin_panel(`
    <div class="section-title">
      <h3>Edit User #${u.User_ID}</h3>
      <div class="tools">
        <button class="ghost" onclick="admin_showUsers()">Back</button>
      </div>
    </div>

    <div class="form-grid">
      <div class="field">
        <label>First Name</label>
        <input id="eu_first" value="${u.First_Name}">
      </div>
      <div class="field">
        <label>Last Name</label>
        <input id="eu_last" value="${u.Last_Name}">
      </div>
      <div class="field">
        <label>Email</label>
        <input id="eu_email" value="${u.Email}">
      </div>
      <div class="field">
        <label>Phone</label>
        <input id="eu_phone" value="${u.Phone_Number}">
      </div>
      <div class="field">
        <label>Role</label>
        <select id="eu_role">
          ${["Administrator","Doctor","Nurse","Receptionist"].map(r =>
            `<option ${r===u.Role_Name?"selected":""}>${r}</option>`
          ).join("")}
        </select>
      </div>
    </div>

    <div class="row" style="margin-top:12px;">
      <button class="primary" onclick="admin_updateUser(${u.User_ID})">Save</button>
      <button class="${u.Is_Disabled ? "secondary" : "gold"}"
        onclick="admin_toggleDisable(${u.User_ID}, ${u.Is_Disabled ? 0 : 1})">
        ${u.Is_Disabled ? "Enable" : "Disable"}
      </button>
    </div>

    <div id="admin_msg" style="margin-top:10px;"></div>
  `);
}

async function admin_updateUser(userId){
  const firstName = document.getElementById("eu_first").value.trim();
  const lastName  = document.getElementById("eu_last").value.trim();
  const email     = document.getElementById("eu_email").value.trim();
  const phone     = document.getElementById("eu_phone").value.trim();
  const roleName  = document.getElementById("eu_role").value;

  await apiSafe("api/admin/users_update.php","POST",{
    userId, firstName, lastName, email, phone, roleName
  });

  toast("Saved", "User updated", "ok");
  document.getElementById("admin_msg").innerHTML = `<span class="badge teal">Saved</span>`;

  await admin_loadUsers();
  await admin_loadTiles();
}

async function admin_toggleDisable(userId, isDisabled){
  await apiSafe("api/admin/users_disable.php","POST",{userId, isDisabled});
  toast("Updated", isDisabled ? "User disabled" : "User enabled", "ok");
  await admin_loadUsers();
  await admin_loadTiles();
}

/* -------------------------
   REPORTS
------------------------- */

function admin_showReports(){
  const today = new Date().toISOString().slice(0,10);
  admin_panel(`
    <div class="section-title">
      <h3>Reporting — Appointments</h3>
      <div class="tools">
        <button class="ghost" onclick="admin_showUsers()">Back</button>
      </div>
    </div>

    <div class="row compact">
      <div class="field">
        <label>From</label>
        <input id="r_from" type="date" value="${today}">
      </div>
      <div class="field">
        <label>To</label>
        <input id="r_to" type="date" value="${today}">
      </div>
      <div style="align-self:end;">
        <button class="primary" onclick="admin_loadReport()">Run Report</button>
      </div>
    </div>

    <div id="admin_report" style="margin-top:12px;"></div>
  `);
}

async function admin_loadReport(){
  const from = document.getElementById("r_from").value;
  const to   = document.getElementById("r_to").value;

  const data = await apiSafe(`api/admin/reports_appointments.php?from=${from}&to=${to}`);

  const totals = (data.totalsByStatus || []).map(t =>
    `<span class="${badgeClass(t.Status)}" style="margin-right:8px;">${t.Status}: ${t.Count}</span>`
  ).join("");

  const rows = (data.appointments || []).map(a => `
    <tr>
      <td>${a.Appointment_ID}</td>
      <td>${fmtDT(a.Scheduled_Start)}</td>
      <td>${fmtDT(a.Scheduled_End)}</td>
      <td><span class="${badgeClass(a.Status)}">${a.Status}</span></td>
      <td>${a.Patient_Last}, ${a.Patient_First}</td>
      <td>Dr. ${a.Provider_Last}</td>
    </tr>
  `).join("");

  document.getElementById("admin_report").innerHTML = `
    <div class="section">
      <div class="section-title">
        <h3>Totals</h3>
      </div>
      <div>${totals || `<span class="badge">No data</span>`}</div>
    </div>

    <div class="section">
      <div class="section-title">
        <h3>Appointments</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Start</th><th>End</th><th>Status</th><th>Patient</th><th>Provider</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="6">No appointments</td></tr>`}</tbody>
      </table>
    </div>
  `;
}