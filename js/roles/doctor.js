// js/roles/doctor.js

/* CHANGE 1:
   Added escapeHtml so punctuation and special characters do not break HTML output.
*/
function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadDoctor() {
  /* CHANGE 2:
     Keep the main dashboard layout and tiles on the Doctor dashboard.
  */
  console.log("doctor.js loaded");

  const content = document.getElementById("content");
  const today = new Date().toISOString().slice(0, 10);

  content.innerHTML = `
    <div class="card">
      <h2>Doctor - My Day</h2>
      <p>Schedule, checked-in queue, visit notes</p>

      <!-- NOTE:
           Main dashboard summary tiles load here.
      -->
      <div id="doc_tiles"></div>

      <div class="row compact" style="margin-top:14px;">
        <div class="field"><label>From</label><input id="d_from" type="date" value="${today}"></div>
        <div class="field"><label>To</label><input id="d_to" type="date" value="${today}"></div>
        <div style="align-self:end;">
          <button class="primary" onclick="doc_loadSchedule()">Load Schedule</button>
        </div>
        <div style="align-self:end;">
          <button class="ghost" onclick="doc_refreshDay()">Refresh Day</button>
        </div>
      </div>

      <!-- NOTE:
           Checked-in queue shows under the summary tiles.
      -->
      <div id="doc_queue" style="margin-top:16px;"></div>

      <!-- NOTE:
           Schedule table loads here.
      -->
      <div id="doc_list" style="margin-top:16px;"></div>

      <!-- NOTE:
           Appointment details / visit note workspace loads here.
      -->
      <div id="doc_panel" style="margin-top:16px;"></div>
    </div>
  `;

  doc_refreshDay();
}

async function doc_refreshDay() {
  /* NOTE:
     Refresh both the summary area and the schedule area together.
  */
  await doc_loadTilesAndQueue();
  await doc_loadSchedule();
}

async function doc_loadTilesAndQueue() {
  const tilesWrap = document.getElementById("doc_tiles");
  const queueWrap = document.getElementById("doc_queue");

  if (!tilesWrap) return;
  if (queueWrap) queueWrap.innerHTML = "";

  tilesWrap.innerHTML = `
    <div style="margin-top:12px; color: var(--muted); font-weight:700;">
      Loading doctor dashboard...
    </div>
  `;

  try {
    const d = await apiSafe("api/doctor/dashboard_summary.php");

    /* CHANGE 3:
       Keep the main tiles, but protect values with null fallback.
    */
    tilesWrap.innerHTML = `
      <div class="tiles">
        ${doc_tile("Appointments Today", d.totalToday ?? 0, "All statuses", "C", "gold")}
        ${doc_tile("Scheduled", d.scheduledToday ?? 0, "Upcoming", "S", "teal")}
        ${doc_tile("Checked-In", d.checkedInToday, "Ready now", "CI", "dark")}
        ${doc_tile("Completed", d.completedToday, "Finished", "OK", "teal")}
        ${doc_tile("Cancelled", d.cancelledToday, "Cancelled", "X", "gold")}
        ${doc_tile("Rescheduled", d.rescheduledToday ?? 0, "Moved", "R", "sage")}
      </div>
    `;

    if (!queueWrap) return;

    /* CHANGE 4:
       Protected queue data and escaped patient names.
    */
    const rows = (Array.isArray(d.checkedInQueue) ? d.checkedInQueue : []).map(a => `
      <tr>
        <td>${fmtDT(a.Scheduled_Start)}</td>
        <td>${escapeHtml(a.Patient_Last)}, ${escapeHtml(a.Patient_First)}</td>
        <td>${fmtDT(a.Scheduled_End)}</td>
        <td><button class="small primary" onclick="doc_open(${a.Appointment_ID})">Open</button></td>
      </tr>
    `).join("");

    queueWrap.innerHTML = `
      <div class="section">
        <div class="section-title">
          <h3>Checked-In Queue</h3>
          <div class="tools">
            <button class="ghost" onclick="doc_loadTilesAndQueue()">Refresh</button>
          </div>
        </div>
        <table>
          <thead><tr><th>Start</th><th>Patient</th><th>End</th><th>Action</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="4">No checked-in patients right now.</td></tr>`}</tbody>
        </table>
      </div>
    `;
  } catch (err) {
    console.error("doc_loadTilesAndQueue failed:", err);

    /* CHANGE 5:
       If dashboard_summary.php fails, do not leave the screen stuck on loading.
       Show a clear message instead.
    */
    tilesWrap.innerHTML = `
      <div class="section">
        <div class="section-title"><h3>Doctor Summary</h3></div>
        <div style="color:#b00020; font-weight:700;">
          Failed to load dashboard summary.
        </div>
      </div>
    `;

    if (queueWrap) {
      queueWrap.innerHTML = `
        <div class="section">
          <div class="section-title"><h3>Checked-In Queue</h3></div>
          <div style="color:#b00020; font-weight:700;">
            Failed to load checked-in queue.
          </div>
        </div>
      `;
    }
  }
}

function doc_tile(label, value, sub, iconText, tone) {
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

async function doc_loadSchedule() {
  const fromEl = document.getElementById("d_from");
  const toEl = document.getElementById("d_to");
  const listEl = document.getElementById("doc_list");
  const panelEl = document.getElementById("doc_panel");

  /* NOTE:
     Guard against pages that do not currently have the schedule filter fields.
  */
  if (!fromEl || !toEl || !listEl) return;

  const from = fromEl.value;
  const to = toEl.value;

  const data = await apiSafe(`api/doctor/appointments_my.php?from=${from}&to=${to}`);
  const appts = Array.isArray(data.appointments) ? data.appointments : [];

  /* CHANGE 6:
     Used appts.map instead of data.appointments.map
     and escaped patient names.
  */
  const rows = appts.map(a => `
    <tr>
      <td>${a.Appointment_ID}</td>
      <td>${fmtDT(a.Scheduled_Start)}</td>
      <td>${fmtDT(a.Scheduled_End)}</td>
      <td><span class="${badgeClass(a.Status)}">${a.Status}</span></td>
      <td>${escapeHtml(a.Patient_Last)}, ${escapeHtml(a.Patient_First)}</td>
      <td><button class="small" onclick="doc_open(${a.Appointment_ID})">Open</button></td>
    </tr>
  `).join("");

  listEl.innerHTML = `
    <div class="section">
      <div class="section-title">
        <h3>Schedule</h3>
        <div class="tools">
          <button class="ghost" onclick="doc_loadSchedule()">Refresh</button>
        </div>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Start</th><th>End</th><th>Status</th><th>Patient</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="6">No appointments</td></tr>`}</tbody>
      </table>
    </div>
  `;

  if (panelEl) {
    panelEl.innerHTML = "";
  }
}

async function doc_open(appointmentId) {
  const appt = await apiSafe(`api/doctor/appointment_get.php?appointmentId=${appointmentId}`);
  const visit = await apiSafe(`api/doctor/visits_get_or_create.php`, "POST", { appointmentId });
  const notes = await apiSafe(`api/doctor/notes_list.php?visitId=${visit.visitId}`);

  /* CHANGE 7:
     Escaped note header names too, not just the visit note text.
  */
  const nrows = (Array.isArray(notes.notes) ? notes.notes : []).map(n => `
    <div style="border:1px solid var(--border); padding:12px; margin:10px 0; border-radius:14px;">
      <div style="font-weight:900; color: var(--teal-dark);">
        ${escapeHtml(n.Last_Name)}, ${escapeHtml(n.First_Name)}
        <span class="badge" style="margin-left:8px;">${fmtDT(n.Note_DateTime)}</span>
      </div>
      <div style="margin-top:8px; color: var(--text); font-weight:700;">
        ${escapeHtml(n.Visit_Note)}
      </div>
    </div>
  `).join("");

  document.getElementById("doc_panel").innerHTML = `
    <div class="section">
      <div class="section-title">
        <h3>Appointment #${appointmentId}</h3>
        <div class="tools">
          <span class="${badgeClass(appt.appointment.Status)}">${appt.appointment.Status}</span>
          <button class="secondary" onclick="doc_setStatus(${appointmentId}, 'IN_PROGRESS')">In Progress</button>
          <button class="primary" onclick="doc_setStatus(${appointmentId}, 'COMPLETED')">Completed</button>
        </div>
      </div>

      <div class="form-grid">
        <div class="field">
          <label>Patient</label>
          <input value="${escapeHtml(appt.appointment.Patient_Last)}, ${escapeHtml(appt.appointment.Patient_First)}" disabled>
        </div>
        <div class="field">
          <label>Visit ID</label>
          <input value="${visit.visitId}" disabled>
        </div>
      </div>

      <div class="field" style="margin-top:12px;">
        <label>New Note</label>
        <textarea id="doc_note" rows="4" placeholder="Write visit note..."></textarea>
      </div>

      <div class="row" style="margin-top:12px;">
        <button class="primary" onclick="doc_saveNote(${visit.visitId}, ${appointmentId})">Save Note</button>
      </div>

      <div class="section">
        <div class="section-title"><h3>Notes</h3></div>
        ${nrows || `<span class="badge">No notes yet</span>`}
      </div>
    </div>
  `;
}

async function doc_saveNote(visitId, appointmentId) {
  const noteBox = document.getElementById("doc_note");
  const noteText = noteBox ? noteBox.value.trim() : "";

  if (!noteText) return;

  await apiSafe("api/doctor/notes_save.php", "POST", { visitId, noteText });
  toast("Saved", "Note added", "ok");

  /* NOTE:
     Refresh tiles and queue after saving because note workflows may happen
     while the doctor is actively working through appointments.
  */
  if (typeof doc_loadTilesAndQueue === "function") await doc_loadTilesAndQueue();
  await doc_open(appointmentId);
}

async function doc_setStatus(appointmentId, status) {
  await apiSafe("api/doctor/appointment_status.php", "POST", { appointmentId, status });
  toast("Updated", `Status set to ${status}`, "ok");

  /* NOTE:
     Refresh both summary and schedule so counts and rows stay in sync.
  */
  if (typeof doc_loadTilesAndQueue === "function") await doc_loadTilesAndQueue();
  await doc_loadSchedule();
}

/* =========================
   DOCTOR TAB PAGES
   NOTE:
   These functions control what each doctor sidebar tab shows.
   This keeps the changes inside doctor.js only.
   ========================= */

/* NOTE:
   Dashboard tab still loads the main doctor dashboard page.
*/
function doc_showDashboard() {
  loadDoctor();
}

/* NOTE:
   My Schedule keeps the cleaner tab layout from your branch,
   but now also reuses the SAME summary tiles and checked-in queue
   from the dashboard so the doctor sees status cards here too.
*/
async function doc_showSchedule() {
  const content = document.getElementById("content");
  const today = new Date().toISOString().slice(0, 10);

  content.innerHTML = `
    <div class="card">
      <h2>My Schedule</h2>
      <p>View your appointments for the selected date range.</p>

      <!-- NOTE:
           Reuse the same summary containers from the dashboard.
           This keeps the main design visible on My Schedule too.
      -->
      <div id="doc_tiles"></div>
      <div id="doc_queue" style="margin-top:16px;"></div>

      <div class="section" style="margin-top:16px;">
        <div class="section-title">
          <h3>Schedule Filters</h3>
          <div class="tools">
            <button class="ghost" onclick="doc_showSchedule()">Reset</button>
          </div>
        </div>

        <div class="row compact" style="margin-top:14px;">
          <div class="field">
            <label>From</label>
            <input id="d_from" type="date" value="${today}">
          </div>

          <div class="field">
            <label>To</label>
            <input id="d_to" type="date" value="${today}">
          </div>

          <div style="align-self:end;">
            <button class="primary" onclick="doc_loadSchedule()">Load Schedule</button>
          </div>

          <div style="align-self:end;">
            <button class="ghost" onclick="doc_refreshDay()">Refresh Day</button>
          </div>
        </div>
      </div>

      <!-- NOTE:
           Schedule table loads here.
      -->
      <div id="doc_list" style="margin-top:16px;"></div>

      <!-- NOTE:
           Appointment details / visit note area loads here.
      -->
      <div id="doc_panel" style="margin-top:16px;"></div>
    </div>
  `;

  /* NOTE:
     Load the same summary area used on the main dashboard,
     then load the schedule list below it.
  */
  await doc_refreshDay();
}

/* NOTE:
   Patients tab keeps the simpler card/section/table structure.
   Per your request, do not show the summary tiles here.
*/
function doc_showPatients() {
  const content = document.getElementById("content");

  content.innerHTML = `
    <div class="card">
      <h2>Patients</h2>
      <p>View and manage doctor patient information.</p>

      <div class="section" style="margin-top:16px;">
        <div class="section-title">
          <h3>Patient List</h3>
          <div class="tools">
            <button class="ghost" disabled>Coming Soon</button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="4">This section is not connected yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* NOTE:
   Visit Notes tab also stays separate.
   Per your request, do not show the summary tiles here.
*/
function doc_showVisitNotes() {
  const content = document.getElementById("content");

  content.innerHTML = `
    <div class="card">
      <h2>Visit Notes</h2>
      <p>Select an appointment to view or add visit notes.</p>

      <div class="section" style="margin-top:16px;">
        <div class="section-title">
          <h3>Notes Workspace</h3>
          <div class="tools">
            <button class="ghost" onclick="doc_showSchedule()">Open Schedule</button>
          </div>
        </div>

        <div style="padding:12px 0;">
          <span class="badge">No appointment selected</span>
          <p style="margin-top:12px;">Open an appointment from My Schedule to work with visit notes.</p>
        </div>
      </div>
    </div>
  `;
}