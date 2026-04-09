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
          <p id="admin_total_users">-</p>
          <span>Active clinic accounts</span>
        </div>

        <div class="admin-card">
          <h3>Today's Appointments</h3>
          <p id="admin_today_appts">-</p>
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
  loadAdminSummary();
}

async function loadAdminSummary() {
  try {
    const res = await api("api/admin/dashboard_summary.php");
    console.log("Admin summary response:", res);

    if (!res) return;

    const totalUsersEl = document.getElementById("admin_total_users");
    const todayApptsEl = document.getElementById("admin_today_appts");

    if (totalUsersEl) {
      totalUsersEl.innerText = res.totalUsers ?? 0;
    }

    if (todayApptsEl) {
      todayApptsEl.innerText = res.appointmentsToday ?? 0;
    }
  } catch (err) {
    console.error("Admin summary load failed:", err);
  }
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
  if (panel) {
    panel.style.display = "block";
    panel.innerHTML = html;
  }
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

      <div id="admin_users">Loading users...</div>
    </div>

    <div id="admin_panel" class="admin-panel-box" style="display:none;"></div>
    <div id="admin_msg"></div>
  `);

  admin_loadUsers();
}

async function admin_loadUsers() {
  const usersWrap = document.getElementById("admin_users");
  const stats = document.getElementById("adminUsersStats");

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
            <td colspan="5">Loading users...</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  if (stats) {
    stats.innerHTML = `Total Users: 0 | Active: 0 | Locked: 0`;
  }

  try {
    const data = await api("api/admin/users_list.php");

    adminUsersData = Array.isArray(data) ? data : [];
    window.adminUsersData = adminUsersData;

    admin_refreshUsersUI();
  } catch (err) {
    console.error("Failed to load admin users:", err);

    adminUsersData = [];
    window.adminUsersData = [];

    if (stats) {
      stats.innerHTML = `Total Users: 0 | Active: 0 | Locked: 0`;
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
        <button class="small ghost" type="button" onclick="admin_editUser(${Number(u.User_ID)})">Edit</button>
        <button class="small secondary" type="button" onclick="admin_toggleDisable(${Number(u.User_ID)}, ${Number(u.Is_Disabled) ? 0 : 1})">
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

    setTimeout(() => {
      admin_showUsers();
    }, 800);
  } catch (err) {
    console.error(err);
    msg.innerHTML = `<span style="color:red;">${err.message}</span>`;
  }
}

function admin_editUser(userId) {
  const user = (adminUsersData || []).find(u => Number(u.User_ID) === Number(userId));
  if (!user) return;

  const oldModal = document.getElementById("adminEditModal");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.id = "adminEditModal";
  modal.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
    ">
      <div style="
        background: #fff;
        width: 100%;
        max-width: 700px;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.25);
        max-height: 90vh;
        overflow-y: auto;
      ">
        <div class="section-title">
          <h3>Edit User</h3>
          <div class="tools">
            <button class="ghost" type="button" onclick="admin_closeEditModal()">Close</button>
          </div>
        </div>

        <div class="card form-grid">
          <input id="eu_first" placeholder="First Name" value="${admin_escapeHtml(user.First_Name || "")}">
          <input id="eu_last" placeholder="Last Name" value="${admin_escapeHtml(user.Last_Name || "")}">

          <input id="eu_email" placeholder="Email" value="${admin_escapeHtml(user.Email || "")}">
          <input id="eu_phone" placeholder="Phone" value="${admin_escapeHtml(user.Phone_Number || "")}">

          <select id="eu_role">
            <option value="Administrator" ${user.Role_Name === "Administrator" ? "selected" : ""}>Administrator</option>
            <option value="Doctor" ${user.Role_Name === "Doctor" ? "selected" : ""}>Doctor</option>
            <option value="Nurse" ${user.Role_Name === "Nurse" ? "selected" : ""}>Nurse</option>
            <option value="Receptionist" ${user.Role_Name === "Receptionist" ? "selected" : ""}>Receptionist</option>
          </select>

          <input id="eu_password" type="password" placeholder="New Temporary Password">
          <input id="eu_password_confirm" type="password" placeholder="Confirm New Password">

          <button class="primary" type="button" onclick="admin_updateUser(${Number(user.User_ID)})">Save Changes</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

async function admin_toggleDisable(userId, isDisabled) {
  try {
    const res = await fetch("api/admin/users_disable.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: Number(userId),
        isDisabled: Number(isDisabled) ? 1 : 0
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to update user status");
    }

    if (typeof toast === "function") {
      toast(
        "Success",
        Number(isDisabled) ? "User disabled." : "User enabled.",
        "ok"
      );
    }

    admin_loadUsers();
    admin_closeEditModal();
  } catch (err) {
    console.error("Disable/Enable error:", err);

    if (typeof toast === "function") {
      toast("Error", err.message || "Unable to update user.", "err");
    }
  }
}

async function admin_updateUser(userId) {
  const password = document.getElementById("eu_password")?.value || "";
  const confirm = document.getElementById("eu_password_confirm")?.value || "";

  if (password !== "" && password !== confirm) {
    alert("Passwords do not match.");
    return;
  }

  const payload = {
    userId: Number(userId),
    firstName: document.getElementById("eu_first")?.value.trim() || "",
    lastName: document.getElementById("eu_last")?.value.trim() || "",
    email: document.getElementById("eu_email")?.value.trim() || "",
    phone: document.getElementById("eu_phone")?.value.trim() || "",
    roleName: document.getElementById("eu_role")?.value.trim() || "",
    password
  };

  try {
    const res = await fetch("api/admin/users_update.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Update failed");
    }

    alert(
      data.passwordReset
        ? "User updated and password reset."
        : "User updated successfully."
    );

    admin_closeEditModal();
    admin_loadUsers();
  } catch (err) {
    console.error("Update error:", err);
    alert(err.message || "Unable to update user.");
  }
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
      <div class="row" style="gap:12px; flex-wrap:wrap; margin-bottom:12px;">
        <div class="field">
          <label for="adminReportDateFrom">From</label>
          <input id="adminReportDateFrom" type="date">
        </div>

        <div class="field">
          <label for="adminReportDateTo">To</label>
          <input id="adminReportDateTo" type="date">
        </div>

        <div class="field">
          <label for="adminReportStatus">Status</label>
          <select id="adminReportStatus">
            <option value="">All</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELED">Canceled</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        </div>

        <div class="field" style="align-self:flex-end;">
          <button class="admin-action-btn" type="button" onclick="admin_loadReport()">Run Report</button>
        </div>
      </div>

      <div id="admin_report_wrap">Choose filters and run the report.</div>
    </div>
  `);
}

async function admin_loadReport() {
  const wrap = document.getElementById("admin_report_wrap");
  if (!wrap) return;

  const from = document.getElementById("adminReportDateFrom")?.value || "";
  const to = document.getElementById("adminReportDateTo")?.value || "";
  const status = document.getElementById("adminReportStatus")?.value || "";

  wrap.innerHTML = `<p>Loading report...</p>`;

  try {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (status) params.append("status", status);

    const endpoint = `api/admin/reports_appointments.php${params.toString() ? "?" + params.toString() : ""}`;
    const data = await api(endpoint);

    const rows = Array.isArray(data) ? data : (data?.appointments || []);

    if (!rows.length) {
      wrap.innerHTML = `<p>No appointment report data found for the selected filters.</p>`;
      return;
    }

    const tableRows = rows.map(r => `
      <tr>
        <td>${admin_escapeHtml(String(r.Appointment_ID ?? ""))}</td>
        <td>${admin_escapeHtml(`${r.Patient_First_Name || ""} ${r.Patient_Last_Name || ""}`.trim() || "-")}</td>
        <td>${admin_escapeHtml(`${r.Provider_First_Name || ""} ${r.Provider_Last_Name || ""}`.trim() || "-")}</td>
        <td>${admin_escapeHtml(r.Scheduled_Start || "-")}</td>
        <td>${admin_escapeHtml(r.Scheduled_End || "-")}</td>
        <td>${admin_escapeHtml(r.Status || "-")}</td>
      </tr>
    `).join("");

    wrap.innerHTML = `
      <table class="admin-users-table">
        <thead>
          <tr>
            <th>APPT ID</th>
            <th>PATIENT</th>
            <th>PROVIDER</th>
            <th>START</th>
            <th>END</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error("Failed to load admin report:", err);
    wrap.innerHTML = `<p>Unable to load appointment report data.</p>`;
  }
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

function admin_appointments() {
  loadAppointmentsPage({
    role: "admin",
    canCreate: true,
    canEdit: true,
    canCheckIn: false,
    providerScope: "all",
    allowScopeToggle: false
  });
}

function admin_clinicHours() {
  setView(`
    <div class="page-header">
      <h2>Clinic Hours</h2>
      <p>Set the clinic's weekly opening and closing hours.</p>
    </div>

    <div class="admin-panel-box">
      <div id="clinic_hours_wrap">Loading clinic hours...</div>

      <div class="row" style="margin-top:16px;">
        <button class="primary" onclick="admin_saveClinicHours()">Save Clinic Hours</button>
      </div>

      <div id="clinic_hours_msg" style="margin-top:12px;"></div>
    </div>
  `);

  admin_loadClinicHours();
}

async function admin_loadClinicHours() {
  const wrap = document.getElementById("clinic_hours_wrap");
  if (!wrap) return;

  try {
    const data = await api("api/admin/clinic_hours_get.php");
    const hours = data.hours || [];

    const dayNames = {
      1: "Sunday",
      2: "Monday",
      3: "Tuesday",
      4: "Wednesday",
      5: "Thursday",
      6: "Friday",
      7: "Saturday"
    };

    const rows = [1,2,3,4,5,6,7].map(day => {
      const row = hours.find(h => Number(h.Day_Of_Week) === day) || {
        Day_Of_Week: day,
        Is_Open: 0,
        Open_Time: "",
        Close_Time: ""
      };

      const openTime = row.Open_Time ? String(row.Open_Time).slice(0,5) : "";
      const closeTime = row.Close_Time ? String(row.Close_Time).slice(0,5) : "";
      const isOpen = Number(row.Is_Open) === 1;

      return `
        <tr>
          <td>${dayNames[day]}</td>
          <td>
            <input type="checkbox" id="ch_open_${day}" ${isOpen ? "checked" : ""} onchange="admin_toggleClinicDay(${day})">
          </td>
          <td>
            <input type="time" id="ch_start_${day}" value="${openTime}" ${isOpen ? "" : "disabled"}>
          </td>
          <td>
            <input type="time" id="ch_end_${day}" value="${closeTime}" ${isOpen ? "" : "disabled"}>
          </td>
        </tr>
      `;
    }).join("");

    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Open</th>
            <th>Open Time</th>
            <th>Close Time</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  } catch (err) {
    wrap.innerHTML = `<div class="err">Failed to load clinic hours.</div>`;
    throw err;
  }
}

function admin_toggleClinicDay(day) {
  const isOpen = document.getElementById(`ch_open_${day}`)?.checked;
  const start = document.getElementById(`ch_start_${day}`);
  const end = document.getElementById(`ch_end_${day}`);

  if (start) start.disabled = !isOpen;
  if (end) end.disabled = !isOpen;

  if (!isOpen) {
    if (start) start.value = "";
    if (end) end.value = "";
  }
}

async function admin_saveClinicHours() {
  const payload = {
    hours: [1,2,3,4,5,6,7].map(day => ({
      dayOfWeek: day,
      isOpen: !!document.getElementById(`ch_open_${day}`)?.checked,
      openTime: document.getElementById(`ch_start_${day}`)?.value || "",
      closeTime: document.getElementById(`ch_end_${day}`)?.value || ""
    }))
  };

  const msg = document.getElementById("clinic_hours_msg");
  if (msg) msg.innerHTML = "Saving clinic hours...";

  try {
    await api("api/admin/clinic_hours_save.php", "POST", payload);

    if (msg) {
      msg.innerHTML = `<div class="ok">Clinic hours saved successfully.</div>`;
    }

    toast("Success", "Clinic hours saved successfully.", "ok");
  } catch (err) {
    if (msg) {
      msg.innerHTML = `<div class="err">Failed to save clinic hours.</div>`;
    }
    throw err;
  }
}

function admin_staff() {
  setView(`
    <div class="page-header">
      <h2>Staff Scheduling</h2>
      <p>Manage weekly provider schedules.</p>
    </div>

    <div class="admin-panel-box">
      <div class="form-grid">
        <div class="field">
          <label>Provider</label>
          <select id="sched_provider"></select>
        </div>

        <div class="field">
          <label>Day</label>
          <select id="sched_day">
            <option value="1">Sunday</option>
            <option value="2">Monday</option>
            <option value="3">Tuesday</option>
            <option value="4">Wednesday</option>
            <option value="5">Thursday</option>
            <option value="6">Friday</option>
            <option value="7">Saturday</option>
          </select>
        </div>

        <div class="field">
          <label>Start Time</label>
          <input id="sched_start" type="time">
        </div>

        <div class="field">
          <label>End Time</label>
          <input id="sched_end" type="time">
        </div>
      </div>

      <div class="row" style="margin-top:16px;">
        <button class="primary" onclick="admin_saveSchedule()">Add Schedule Block</button>
      </div>

      <div id="sched_msg" style="margin-top:12px;"></div>
    </div>

    <div class="admin-panel-box" style="margin-top:18px;">
      <div class="section-title">
        <h3>Current Schedule</h3>
        <div class="tools">
          <button class="ghost" onclick="admin_loadSchedules()">Refresh</button>
        </div>
      </div>
      <div id="sched_table_wrap">Loading schedules...</div>
    </div>
  `);

  admin_loadProvidersForSchedule();
  admin_loadSchedules();
}

async function admin_loadProvidersForSchedule() {
  const select = document.getElementById("sched_provider");
  if (!select) return;

  try {
    const data = await api("api/shared/providers_list.php");
    const providers = data.providers || [];

    select.innerHTML = `
      <option value="">Select provider</option>
      ${providers.map(p => `
        <option value="${p.User_ID}">Dr. ${p.First_Name} ${p.Last_Name}</option>
      `).join("")}
    `;
  } catch (err) {
    select.innerHTML = `<option value="">Failed to load providers</option>`;
    throw err;
  }
}

async function admin_loadSchedules() {
  const wrap = document.getElementById("sched_table_wrap");
  if (!wrap) return;

  try {
    const data = await api("api/shared/schedules_list.php");
    const schedules = data.schedules || [];

    const dayNames = {
      1: "Sunday",
      2: "Monday",
      3: "Tuesday",
      4: "Wednesday",
      5: "Thursday",
      6: "Friday",
      7: "Saturday"
    };

    const rows = schedules.map(s => `
      <tr>
        <td>Dr. ${s.First_Name} ${s.Last_Name}</td>
        <td>${dayNames[Number(s.Day_Of_The_Week)] || s.Day_Of_The_Week}</td>
        <td>${String(s.Start_Time).slice(0,5)}</td>
        <td>${String(s.End_Time).slice(0,5)}</td>
        <td>
          <button class="small gold" onclick="admin_deleteSchedule(${s.Schedule_ID})">Delete</button>
        </td>
      </tr>
    `).join("");

    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Day</th>
            <th>Start</th>
            <th>End</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="5">No schedule blocks found.</td></tr>`}
        </tbody>
      </table>
    `;
  } catch (err) {
    wrap.innerHTML = `<div class="err">Failed to load schedules.</div>`;
    throw err;
  }
}

async function admin_saveSchedule() {
  const payload = {
    providerUserId: Number(document.getElementById("sched_provider")?.value || 0),
    dayOfWeek: Number(document.getElementById("sched_day")?.value || 0),
    startTime: document.getElementById("sched_start")?.value || "",
    endTime: document.getElementById("sched_end")?.value || ""
  };

  const msg = document.getElementById("sched_msg");

  if (!payload.providerUserId || !payload.dayOfWeek || !payload.startTime || !payload.endTime) {
    if (msg) msg.innerHTML = `<div class="err">All schedule fields are required.</div>`;
    return;
  }

  if (msg) msg.innerHTML = "Saving schedule block...";

  try {
    await api("api/shared/schedules_save.php", "POST", payload);

    if (msg) msg.innerHTML = `<div class="ok">Schedule block added successfully.</div>`;
    toast("Success", "Schedule block added successfully.", "ok");

    document.getElementById("sched_day").value = "1";
    document.getElementById("sched_start").value = "";
    document.getElementById("sched_end").value = "";

    admin_loadSchedules();
  } catch (err) {
    const errorMessage = err?.error || "Failed to save schedule block.";
    if (msg) msg.innerHTML = `<div class="err">${errorMessage}</div>`;
    throw err;
  }
}

async function admin_deleteSchedule(scheduleId) {
  try {
    await api("api/shared/schedules_delete.php", "POST", {
      scheduleId: Number(scheduleId)
    });

    toast("Success", "Schedule block deleted.", "ok");
    admin_loadSchedules();
  } catch (err) {
    toast("Error", err?.error || "Failed to delete schedule block.", "err");
    throw err;
  }
}

window.admin_closeEditModal = function () {
  const modal = document.getElementById("adminEditModal");
  if (modal) modal.remove();
};