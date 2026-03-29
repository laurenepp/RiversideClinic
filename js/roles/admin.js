// js/roles/admin.js

let adminEventLogs = [];
let adminEventLogsInterval = null;
let adminUsersData = [];

function loadAdmin() {
  setView(`
    <div class="admin-home-wrap">
      <div class="page-header">
        <h2>Administrator Dashboard</h2>
        <p>Manage clinic operations, users, and system activity.</p>
      </div>

      <div class="admin-cards">
        <div class="admin-card">
          <h3>Total Users</h3>
          <p>-</p>
          <span>Active clinic accounts</span>
        </div>

        <div class="admin-card">
          <h3>Today's Appointments</h3>
          <p>-</p>
          <span>Scheduled visits today</span>
        </div>

        <div class="admin-card">
          <h3>Staff On Duty</h3>
          <p>-</p>
          <span>Doctors, nurses, and front desk</span>
        </div>

        <div class="admin-card">
          <h3>System Alerts</h3>
          <p>-</p>
          <span>Items needing attention</span>
        </div>
      </div>

      <div id="admin_tiles"></div>

      <div class="admin-home-grid">
        <div class="admin-panel-box">
          <h3>Quick Actions</h3>
          <div class="quick-actions">
            <button class="admin-action-btn" onclick="admin_showUsers()">Manage Users</button>
            <button class="admin-action-btn" onclick="admin_showReports()">Reports</button>
          </div>
        </div>

        <div class="admin-panel-box">
          <h3>Recent Activity</h3>
          <ul class="admin-activity-list">
            <li>System activity will display when backend logging is connected</li>
            <li>User actions will appear once Admin APIs are complete</li>
            <li>Reports will use live clinic data after backend integration</li>
            <li>Review access control and audit events regularly</li>
          </ul>
        </div>
      </div>

      <div id="admin_panel"></div>
      <div id="admin_create_wrap" style="display:none;"></div>
      <div id="admin_msg"></div>
    </div>
  `);

  admin_loadTiles();
}

function admin_loadTiles() {
  const wrap = document.getElementById("admin_tiles");
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="admin-top-tabs card">
      <button
        type="button"
        id="adminTabUsers"
        class="admin-top-tab active"
        onclick="admin_showUsers()"
      >
        User Management
      </button>

      <button
        type="button"
        id="adminTabLogs"
        class="admin-top-tab"
        onclick="admin_showEventLogs()"
      >
        Event Logs
      </button>
    </div>
  `;
}

function admin_panel(html) {
  const panel = document.getElementById("admin_panel");
  if (panel) panel.innerHTML = html;
}

function admin_setActiveTab(tabName) {
  const usersTab = document.getElementById("adminTabUsers");
  const logsTab = document.getElementById("adminTabLogs");

  if (usersTab) usersTab.classList.remove("active");
  if (logsTab) logsTab.classList.remove("active");

  if (tabName === "users" && usersTab) usersTab.classList.add("active");
  if (tabName === "logs" && logsTab) logsTab.classList.add("active");
}

function admin_clearEventLogsInterval() {
  if (adminEventLogsInterval) {
    clearInterval(adminEventLogsInterval);
    adminEventLogsInterval = null;
  }
}

/* -------------------------
   USERS
------------------------- */

function admin_showUsers() {
  admin_clearEventLogsInterval();
  admin_setActiveTab("users");

  setView(`
    <div class="page-header">
      <h2>User Management</h2>
      <p>View, search, and manage clinic users.</p>
    </div>

    <div class="admin-panel-box">
      <div class="admin-users-toolbar">
        <input
          id="adminUserSearch"
          type="text"
          placeholder="Search users..."
          oninput="admin_filterUsers()"
        />
        <button id="adminAddUserBtn" class="admin-action-btn" type="button" onclick="admin_showCreateUser()">
          + Add User
        </button>
      </div>

      <div id="adminUsersStats" class="admin-users-stats">
        Total Users: 0 | Active: 0 | Locked: 0
      </div>

      <div id="admin_users"></div>
    </div>

    <div id="admin_panel" class="admin-panel-box" style="display:none;"></div>
    <div id="admin_msg"></div>
  `);

  admin_loadUsers();
}


function admin_loadUsers() {
  // Only create mock data once
  if (!window.adminUsersData || !Array.isArray(window.adminUsersData) || !window.adminUsersData.length) {
    window.adminUsersData = [
      {
        User_ID: 1,
        First_Name: "Reyna",
        Last_Name: "Administrator",
        Email: "reyna@clinic.com",
        Role_Name: "Administrator",
        Is_Disabled: 0,
        Last_Login_At: "-"
      },
      {
        User_ID: 2,
        First_Name: "Fernando",
        Last_Name: "Doctor",
        Email: "fernando@clinic.com",
        Role_Name: "Doctor",
        Is_Disabled: 0,
        Last_Login_At: "-"
      },
      {
        User_ID: 3,
        First_Name: "Logan",
        Last_Name: "Nurse",
        Email: "logan@clinic.com",
        Role_Name: "Nurse",
        Is_Disabled: 0,
        Last_Login_At: "-"
      },
      {
        User_ID: 4,
        First_Name: "Michael",
        Last_Name: "Phillips",
        Email: "michael@clinic.com",
        Role_Name: "Administrator",
        Is_Disabled: 0,
        Last_Login_At: "-"
      },
      {
        User_ID: 5,
        First_Name: "Andrea",
        Last_Name: "Receptionist",
        Email: "andrea@clinic.com",
        Role_Name: "Receptionist",
        Is_Disabled: 0,
        Last_Login_At: "-"
      }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch users");
    }

    const data = await res.json();
    adminUsersData = Array.isArray(data) ? data : [];

    admin_refreshUsersUI();
  } catch (err) {
    console.error(err);
    adminUsersData = [];

    const stats = document.getElementById("adminUsersStats");
    if (stats) {
      stats.innerHTML = "Total Users: 0 | Active: 0 | Locked: 0";
    }

    if (usersWrap) {
      usersWrap.innerHTML = `
        <table class="admin-users-table">
          <thead>
            <tr>
              <th>USER</th>
              <th>ROLE</th>
              <th>STATUS</th>
              <th>LAST LOGIN</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="5">Unable to load users from the database.</td>
            </tr>
          </tbody>
        </table>
      `;
    }
  }
}

function admin_refreshUsersUI() {
  const totalUsers = adminUsersData.length;
  const activeUsers = adminUsersData.filter(u => !Number(u.Is_Disabled)).length;
  const lockedUsers = adminUsersData.filter(u => Number(u.Is_Disabled)).length;

  const stats = document.getElementById("adminUsersStats");
  if (stats) {
    stats.innerHTML = `Total Users: ${totalUsers} | Active: ${activeUsers} | Locked: ${lockedUsers}`;
  }

  admin_renderUsersTable(adminUsersData);
}

function admin_filterUsers() {
  const searchEl = document.getElementById("adminUserSearch");
  const term = (searchEl?.value || "").trim().toLowerCase();

  if (!term) {
    admin_renderUsersTable(adminUsersData);
    return;
  }

  const filtered = adminUsersData.filter(u => {
    const fullName = `${u.First_Name || ""} ${u.Last_Name || ""}`.toLowerCase();
    const reverseName = `${u.Last_Name || ""}, ${u.First_Name || ""}`.toLowerCase();
    const email = (u.Email || "").toLowerCase();
    const role = (u.Role_Name || "").toLowerCase();
    const id = String(u.User_ID || "").toLowerCase();

    return (
      fullName.includes(term) ||
      reverseName.includes(term) ||
      email.includes(term) ||
      role.includes(term) ||
      id.includes(term)
    );
  });

  admin_renderUsersTable(filtered);
}

function admin_renderUsersTable(users) {
  const usersWrap = document.getElementById("admin_users");
  if (!usersWrap) return;

  if (!Array.isArray(users) || !users.length) {
    usersWrap.innerHTML = `
      <table class="admin-users-table">
        <thead>
          <tr>
            <th>USER</th>
            <th>ROLE</th>
            <th>STATUS</th>
            <th>LAST LOGIN</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="5">No users found.</td>
          </tr>
        </tbody>
      </table>
    `;
    return;
  }

  const rows = users.map(u => `
    <tr>
      <td>
        <div class="admin-user-cell">
          <div class="admin-user-avatar">
            ${((u.First_Name || "").charAt(0) + (u.Last_Name || "").charAt(0)).toUpperCase() || "U"}
          </div>
          <div class="admin-user-meta">
            <div class="admin-user-name">${u.First_Name || ""} ${u.Last_Name || ""}</div>
            <div class="admin-user-sub">${u.Email || ""}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="admin-role-pill role-${(u.Role_Name || "").toLowerCase()}">
          ${(u.Role_Name || "").toLowerCase()}
        </span>
      </td>
      <td>
        ${
          Number(u.Is_Disabled)
            ? `<span class="admin-status-pill locked">locked</span>`
            : `<span class="admin-status-pill active">active</span>`
        }
      </td>
      <td>${u.Last_Login_At || "-"}</td>
      <td class="admin-actions-cell">
        <button class="small ghost" type="button" disabled>Edit</button>
        <button class="small secondary" type="button" disabled>
          ${Number(u.Is_Disabled) ? "Enable" : "Disable"}
        </button>
      </td>
    </tr>
  `).join("");

  usersWrap.innerHTML = `
    <table class="admin-users-table">
      <thead>
        <tr>
          <th>USER</th>
          <th>ROLE</th>
          <th>STATUS</th>
          <th>LAST LOGIN</th>
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function admin_showCreateUser() {
  admin_clearEventLogsInterval();
  admin_setActiveTab("users");

  setView(`
    <div class="page-header">
      <h2>Add New User</h2>
      <p>Create a new clinic user account.</p>
    </div>

    <div class="admin-panel-box">
      <div class="section-title">
        <h3>New User Details</h3>
        <div class="tools">
          <button class="ghost" onclick="admin_showUsers()">Back to Users</button>
        </div>
      </div>

      <div class="card form-grid">

        <input id="cu_first" placeholder="First Name">
        <input id="cu_last" placeholder="Last Name">

        <input id="cu_email" placeholder="Email">
        <input id="cu_phone" placeholder="Phone">

        <select id="cu_role">
          <option value="">Select Role</option>
          <option value="Administrator">Administrator</option>
          <option value="Doctor">Doctor</option>
          <option value="Nurse">Nurse</option>
          <option value="Receptionist">Receptionist</option>
        </select>

        <input id="cu_username" placeholder="Username">
        <input id="cu_password" type="password" placeholder="Temporary Password">

        <button class="primary" onclick="admin_createUser()">Create User</button>

      </div>

      <div id="admin_msg" style="margin-top:10px;"></div>
    </div>
  `);
}

function admin_closePanel() {
  const panel = document.getElementById("admin_panel");
  if (!panel) return;

  panel.style.display = "none";
  panel.innerHTML = "";
}

function admin_cancelCreateUser() {
  const wrap = document.getElementById("admin_create_wrap");
  if (!wrap) return;

  wrap.style.display = "none";
  wrap.innerHTML = "";
}

async function admin_createUser() {
  const msg = document.getElementById("admin_msg");

  const payload = {
    firstName: document.getElementById("cu_first").value.trim(),
    lastName: document.getElementById("cu_last").value.trim(),
    email: document.getElementById("cu_email").value.trim(),
    phone: document.getElementById("cu_phone").value.trim(),
    roleName: document.getElementById("cu_role").value.trim(),
    username: document.getElementById("cu_username").value.trim(),
    password: document.getElementById("cu_password").value
  };

  try {
    const res = await fetch("api/admin/users_create.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Create failed");
    }

    msg.innerHTML = `<span style="color:green;">User created successfully</span>`;

    // reload user list after create
    setTimeout(() => {
      admin_showUsers();
    }, 800);

  } catch (err) {
    console.error(err);
    msg.innerHTML = `<span style="color:red;">${err.message}</span>`;
  }
}

async function admin_updateUser(userId) {
  // backend not connected yet
}

/* -------------------------
   EVENT LOGS
------------------------- */

function admin_showEventLogs() {
  admin_setActiveTab("logs");

  admin_panel(`
    <div class="admin-event-shell">
      <div class="card admin-event-filter-card">
        <div class="admin-event-toolbar">
          <div>
            <h3 class="admin-event-title">Filter Event Logs</h3>
          </div>

          <button type="button" id="adminExportCsvBtn" class="admin-export-csv-btn">
            Export CSV
          </button>
        </div>

        <div class="admin-event-filters-grid">
          <div class="field">
            <label>Action Type</label>
            <select id="adminLogActionType">
              <option value="">All Actions</option>
            </select>
          </div>

          <div class="field">
            <label>User</label>
            <input id="adminLogUser" type="text" placeholder="Filter by user">
          </div>

          <div class="field">
            <label>Severity</label>
            <select id="adminLogSeverity">
              <option value="">All Levels</option>
              <option value="Critical">Critical</option>
              <option value="Warning">Warning</option>
              <option value="Info">Info</option>
            </select>
          </div>

          <div class="field">
            <label>Date From</label>
            <input id="adminLogDateFrom" type="date">
          </div>

          <div class="field">
            <label>Date To</label>
            <input id="adminLogDateTo" type="date">
          </div>
        </div>

        <div class="admin-event-count" id="adminEventCountText">
          Loading event logs...
        </div>
      </div>

      <div class="admin-event-summary-grid" id="adminEventSummaryGrid"></div>

      <div class="card admin-event-history-card">
        <div class="section-title" style="margin-bottom:12px;">
          <h3>Event Log History</h3>
        </div>

        <div id="admin_event_logs_table"></div>
      </div>
    </div>
  `);

  const ids = [
    "adminLogActionType",
    "adminLogUser",
    "adminLogSeverity",
    "adminLogDateFrom",
    "adminLogDateTo"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", admin_renderFilteredEventLogs);
    el.addEventListener("change", admin_renderFilteredEventLogs);
  });

  const exportBtn = document.getElementById("adminExportCsvBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", admin_exportEventLogsCSV);
  }

  admin_fetchEventLogs();

  admin_clearEventLogsInterval();
  adminEventLogsInterval = setInterval(() => {
    if (document.getElementById("adminLogActionType")) {
      admin_fetchEventLogs();
    }
  }, 10000);
}

async function admin_fetchEventLogs() {
  try {
    const res = await fetch("api/admin/event_logs.php", {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch event logs");
    }

    const data = await res.json();

    adminEventLogs = Array.isArray(data) ? data : [];
    admin_populateEventActionOptions(adminEventLogs);
    admin_renderFilteredEventLogs();
  } catch (err) {
    console.error(err);

    const count = document.getElementById("adminEventCountText");
    if (count) {
      count.textContent = "Unable to load event logs.";
    }

    const summary = document.getElementById("adminEventSummaryGrid");
    if (summary) {
      summary.innerHTML = "";
    }

    const tableWrap = document.getElementById("admin_event_logs_table");
    if (tableWrap) {
      tableWrap.innerHTML = `
        <div class="card">
          <p style="margin:0;">Unable to load event logs from the database.</p>
        </div>
      `;
    }
  }
}

function admin_populateEventActionOptions(logs) {
  const select = document.getElementById("adminLogActionType");
  if (!select) return;

  const selected = select.value || "";
  const uniqueActions = [...new Set(logs.map(log => log.actionType).filter(Boolean))].sort();

  select.innerHTML = `
    <option value="">All Actions</option>
    ${uniqueActions.map(action => `<option value="${admin_escapeHtml(action)}">${admin_escapeHtml(action)}</option>`).join("")}
  `;

  select.value = uniqueActions.includes(selected) ? selected : "";
}

function admin_getFilteredEventLogs() {
  const actionType = (document.getElementById("adminLogActionType")?.value || "").trim();
  const user = (document.getElementById("adminLogUser")?.value || "").trim().toLowerCase();
  const severity = (document.getElementById("adminLogSeverity")?.value || "").trim();
  const dateFrom = document.getElementById("adminLogDateFrom")?.value || "";
  const dateTo = document.getElementById("adminLogDateTo")?.value || "";

  return adminEventLogs.filter(log => {
    const logUser = (log.user || "").toLowerCase();
    const logAction = log.actionType || "";
    const logSeverity = log.severity || "";
    const logDate = (log.date || "").slice(0, 10);

    const matchesAction = !actionType || logAction === actionType;
    const matchesUser = !user || logUser.includes(user);
    const matchesSeverity = !severity || logSeverity === severity;
    const matchesDateFrom = !dateFrom || logDate >= dateFrom;
    const matchesDateTo = !dateTo || logDate <= dateTo;

    return matchesAction && matchesUser && matchesSeverity && matchesDateFrom && matchesDateTo;
  });
}

function admin_renderFilteredEventLogs() {
  const logs = admin_getFilteredEventLogs();

  const countText = document.getElementById("adminEventCountText");
  if (countText) {
    countText.textContent = `Showing ${logs.length} of ${adminEventLogs.length} events`;
  }

  admin_renderEventSummary(logs);
  admin_renderEventLogsTable(logs);
}

function admin_renderEventSummary(logs) {
  const wrap = document.getElementById("adminEventSummaryGrid");
  if (!wrap) return;

  const total = logs.length;
  const critical = logs.filter(log => (log.severity || "") === "Critical").length;
  const warning = logs.filter(log => (log.severity || "") === "Warning").length;
  const info = logs.filter(log => (log.severity || "") === "Info").length;

  wrap.innerHTML = `
    <div class="admin-event-summary-card">
      <div class="admin-event-summary-label">Total Events</div>
      <div class="admin-event-summary-value">${total}</div>
    </div>

    <div class="admin-event-summary-card">
      <div class="admin-event-summary-label">Critical</div>
      <div class="admin-event-summary-value critical">${critical}</div>
    </div>

    <div class="admin-event-summary-card">
      <div class="admin-event-summary-label">Warnings</div>
      <div class="admin-event-summary-value warning">${warning}</div>
    </div>

    <div class="admin-event-summary-card">
      <div class="admin-event-summary-label">Info</div>
      <div class="admin-event-summary-value info">${info}</div>
    </div>
  `;
}

function admin_renderEventLogsTable(logs) {
  const wrap = document.getElementById("admin_event_logs_table");
  if (!wrap) return;

  if (!logs.length) {
    wrap.innerHTML = `
      <table class="admin-users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>DATE</th>
            <th>USER</th>
            <th>ACTION</th>
            <th>SEVERITY</th>
            <th>DETAILS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="6">No event logs found.</td>
          </tr>
        </tbody>
      </table>
    `;
    return;
  }

  const rows = logs.map(log => `
    <tr>
      <td>${admin_escapeHtml(String(log.id ?? ""))}</td>
      <td>${admin_escapeHtml(admin_formatEventDate(log.date))}</td>
      <td>${admin_escapeHtml(log.user || "-")}</td>
      <td>${admin_escapeHtml(log.actionType || "-")}</td>
      <td>
        <span class="admin-severity-pill ${(log.severity || "").toLowerCase()}">
          ${admin_escapeHtml((log.severity || "Info").toLowerCase())}
        </span>
      </td>
      <td>${admin_escapeHtml(log.details || "-")}</td>
    </tr>
  `).join("");

  wrap.innerHTML = `
    <table class="admin-users-table admin-event-log-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>DATE</th>
          <th>USER</th>
          <th>ACTION</th>
          <th>SEVERITY</th>
          <th>DETAILS</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function admin_exportEventLogsCSV() {
  const logs = admin_getFilteredEventLogs();

  if (!logs.length) {
    toast("Export CSV", "There are no event logs to export.", "warn");
    return;
  }

  const headers = ["ID", "Date", "User", "Action Type", "Severity", "Details"];

  const rows = logs.map(log => [
    String(log.id ?? ""),
    String(log.date ?? ""),
    String(log.user ?? ""),
    String(log.actionType ?? ""),
    String(log.severity ?? ""),
    String(log.details ?? "")
  ]);

  const csv = [
    headers.join(","),
    ...rows.map(row =>
      row.map(value => `"${value.replace(/"/g, '""')}"`).join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `event_logs_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  window.URL.revokeObjectURL(url);
}

/* -------------------------
   REPORTS
------------------------- */

function admin_showReports() {
  admin_clearEventLogsInterval();
  admin_setActiveTab("users");

  admin_panel(`
    <div class="section-title">
      <h3>Reporting - Appointments</h3>
      <div class="tools">
        <button class="ghost" onclick="admin_showUsers()">Back</button>
      </div>
    </div>

    <div class="card">
      <p>Reporting is temporarily UI-only while backend/database work is in progress.</p>
    </div>
  `);
}

async function admin_loadReport() {
  // intentionally disabled for now
}

/* -------------------------
   HELPERS
------------------------- */

function admin_formatEventDate(dateValue) {
  if (!dateValue) return "-";

  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);

  return d.toLocaleString();
}

function admin_escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function adminAppointments() {
  loadAppointmentsPage({
    role: "admin",
    canCreate: true,
    canEdit: true,
    canCheckIn: false,
    providerScope: "all",
    allowScopeToggle: false
  });
}