// js/roles/doctor.js

function loadDoctor(){
  const content = document.getElementById("content");
  const today = new Date().toISOString().slice(0,10);

  content.innerHTML = `
    <div class="card">
      <h2>Doctor — My Day</h2>
      <p>Schedule, checked-in queue, visit notes</p>

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

      <div id="doc_queue" style="margin-top:16px;"></div>
      <div id="doc_list" style="margin-top:16px;"></div>
      <div id="doc_panel" style="margin-top:16px;"></div>
    </div>
  `;

  doc_refreshDay();
}

async function doc_refreshDay(){
  await doc_loadTilesAndQueue();
  await doc_loadSchedule();
}

async function doc_loadTilesAndQueue(){
  const tilesWrap = document.getElementById("doc_tiles");
  const queueWrap = document.getElementById("doc_queue");

  tilesWrap.innerHTML = `<div style="margin-top:12px; color: var(--muted); font-weight:700;">Loading doctor dashboard…</div>`;
  queueWrap.innerHTML = "";

  const d = await apiSafe("api/doctor/dashboard_summary.php");

  tilesWrap.innerHTML = `
    <div class="tiles">
      ${doc_tile("Appointments Today", d.totalToday, `All statuses`, "C", "gold")}
      ${doc_tile("Scheduled", d.scheduledToday, `Upcoming`, "S", "teal")}
      ${doc_tile("Checked-In", d.checkedInToday, `Ready now`, "✓", "dark")}
      ${doc_tile("Completed", d.completedToday, `Finished`, "✔", "teal")}
      ${doc_tile("Cancelled", d.cancelledToday, `Cancelled`, "×", "gold")}
      ${doc_tile("Rescheduled", d.rescheduledToday, `Moved`, "R", "sage")}
    </div>
  `;

  const rows = (d.checkedInQueue || []).map(a => `
    <tr>
      <td>${fmtDT(a.Scheduled_Start)}</td>
      <td>${a.Patient_Last}, ${a.Patient_First}</td>
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
}

function doc_tile(label, value, sub, iconText, tone){
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

async function doc_loadSchedule(){
  const from = document.getElementById("d_from").value;
  const to   = document.getElementById("d_to").value;

  const data = await apiSafe(`api/doctor/appointments_my.php?from=${from}&to=${to}`);

  const rows = data.appointments.map(a => `
    <tr>
      <td>${a.Appointment_ID}</td>
      <td>${fmtDT(a.Scheduled_Start)}</td>
      <td>${fmtDT(a.Scheduled_End)}</td>
      <td><span class="${badgeClass(a.Status)}">${a.Status}</span></td>
      <td>${a.Patient_Last}, ${a.Patient_First}</td>
      <td><button class="small" onclick="doc_open(${a.Appointment_ID})">Open</button></td>
    </tr>
  `).join("");

  document.getElementById("doc_list").innerHTML = `
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

  document.getElementById("doc_panel").innerHTML = "";
}

async function doc_open(appointmentId){
  const appt = await apiSafe(`api/doctor/appointment_get.php?appointmentId=${appointmentId}`);
  const visit = await apiSafe(`api/doctor/visits_get_or_create.php`, "POST", { appointmentId });
  const notes = await apiSafe(`api/doctor/notes_list.php?visitId=${visit.visitId}`);

  const nrows = (notes.notes || []).map(n => `
    <div style="border:1px solid var(--border); padding:12px; margin:10px 0; border-radius:14px;">
      <div style="font-weight:900; color: var(--teal-dark);">
        ${n.Last_Name}, ${n.First_Name} <span class="badge" style="margin-left:8px;">${fmtDT(n.Note_DateTime)}</span>
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
          <input value="${appt.appointment.Patient_Last}, ${appt.appointment.Patient_First}" disabled>
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

async function doc_saveNote(visitId, appointmentId){
  const noteText = document.getElementById("doc_note").value.trim();
  if(!noteText) return;

  await apiSafe("api/doctor/notes_save.php","POST",{visitId, noteText});
  toast("Saved", "Note added", "ok");

  if (typeof doc_loadTilesAndQueue === "function") await doc_loadTilesAndQueue();
  await doc_open(appointmentId);
}

async function doc_setStatus(appointmentId, status){
  await apiSafe("api/doctor/appointment_status.php","POST",{appointmentId, status});
  toast("Updated", `Status set to ${status}`, "ok");

  if (typeof doc_loadTilesAndQueue === "function") await doc_loadTilesAndQueue();
  await doc_loadSchedule();
}