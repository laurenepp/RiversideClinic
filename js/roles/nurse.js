function nurse_home() {
  const content = document.getElementById("dash_view") || document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="card">
      <h2>Nurse Dashboard</h2>
      <p>Patient intake and queue management</p>

      <div id="nurse_tiles"></div>
      <div id="nurse_queue" style="margin-top:18px;"></div>
    </div>
  `;

  nurse_loadTilesAndQueue();
}

function nurse_tile(label, value, sub, iconText, tone) {
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

async function nurse_loadTilesAndQueue() {
  const tilesWrap = document.getElementById("nurse_tiles");
  const queueWrap = document.getElementById("nurse_queue");

  if (!tilesWrap || !queueWrap) return;

  tilesWrap.innerHTML = `<div style="margin-top:12px; color: var(--muted); font-weight:700;">Loading nurse dashboard…</div>`;
  queueWrap.innerHTML = "";

  try {
    const data = await api("api/nurse/queue_list.php");
    const queue = data.queue || [];

    const checkedInCount = queue.filter(x => (x.Status || "").toUpperCase() === "CHECKED_IN").length;
    const totalCount = queue.length;

    tilesWrap.innerHTML = `
      <div class="tiles">
        ${nurse_tile("Patients in Queue", totalCount, "Nurse worklist", "Q", "sage")}
        ${nurse_tile("Checked-In", checkedInCount, "Waiting for intake", "C", "gold")}
        ${nurse_tile("In Progress", 0, "Currently being worked", "I", "teal")}
        ${nurse_tile("Ready for Provider", 0, "Prepared for doctor", "✓", "dark")}
      </div>
    `;

    const rows = queue.map(p => `
      <tr>
        <td>${p.Scheduled_Start ? fmtDT(p.Scheduled_Start) : ""}</td>
        <td>${p.Patient_Last}, ${p.Patient_First}</td>
        <td>
          <button class="small gold" onclick="nurse_openIntake(${p.Appointment_ID})">Open Intake</button>
        </td>
      </tr>
    `).join("");

    queueWrap.innerHTML = `
      <div class="section">
        <div class="section-title">
          <h3>Patient Queue</h3>
          <div class="tools">
            <button class="ghost" onclick="nurse_loadTilesAndQueue()">Refresh</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Start</th>
              <th>Patient</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="3">No patients currently in queue.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    tilesWrap.innerHTML = `<div class="err">Failed to load nurse dashboard.</div>`;
    queueWrap.innerHTML = "";
    throw err;
  }
}

function nurse_openIntake(appointmentId) {
  nurse_intake(appointmentId);
}

function nurseAppointments() {
  loadAppointmentsPage({
    role: "nurse",
    canCreate: false,
    canEdit: false,
    canCheckIn: false,
    providerScope: "all",
    allowScopeToggle: false
  });
}

function nurse_schedule() {
  const content = document.getElementById("dash_view") || document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="card">
      <h2>Nurse Schedules</h2>
      <p>Nurse schedule information will appear here.</p>
    </div>
  `;
}

function nurse_intake(appointmentId = null) {
  const content = document.getElementById("dash_view") || document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="card">
      <h2>Patient Intake</h2>
      <p>${appointmentId ? `Working intake for appointment #${appointmentId}` : "Vitals, notes, and intake forms will appear here." }</p>
      <div id="nurse_intake_form" style="margin-top:18px;"></div>
    </div>
  `;

  if (appointmentId) {
    nurse_renderIntakeForm(appointmentId);
  }
}

function nurse_renderIntakeForm(appointmentId) {
  const wrap = document.getElementById("nurse_intake_form");
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="form-grid">
      <div class="field">
        <label>Blood Pressure</label>
        <input id="ni_bp" placeholder="120/80">
      </div>

      <div class="field">
        <label>Pulse</label>
        <input id="ni_pulse" placeholder="72">
      </div>

      <div class="field">
        <label>Respiration</label>
        <input id="ni_respiration" placeholder="16">
      </div>

      <div class="field">
        <label>Temperature</label>
        <input id="ni_temp" placeholder="98.6">
      </div>

      <div class="field">
        <label>Oxygen Saturation</label>
        <input id="ni_oxygen" placeholder="99%">
      </div>

      <div class="field">
        <label>Height</label>
        <input id="ni_height" placeholder="5'7&quot;">
      </div>

      <div class="field">
        <label>Weight</label>
        <input id="ni_weight" placeholder="160 lbs">
      </div>

      <div class="field">
        <label>Pain Level</label>
        <input id="ni_pain" placeholder="0-10">
      </div>
    </div>

    <div class="field" style="margin-top:14px;">
      <label>Nurse Intake Note</label>
      <textarea id="ni_note" rows="4" placeholder="Enter intake notes"></textarea>
    </div>

    <div class="field" style="margin-top:14px;">
      <label>Current Medications</label>
      <textarea id="ni_meds" rows="3" placeholder="List current medications"></textarea>
    </div>

    <div class="field" style="margin-top:14px;">
      <label>Medication Changes</label>
      <textarea id="ni_med_changes" rows="3" placeholder="Document medication changes"></textarea>
    </div>

    <div class="field" style="margin-top:14px;">
      <label>Medication Notes</label>
      <textarea id="ni_med_notes" rows="3" placeholder="Additional medication notes"></textarea>
    </div>

    <div class="row" style="margin-top:16px;">
      <button class="primary" onclick="nurse_saveIntake(${appointmentId})">Save Intake</button>
      <button class="ghost" onclick="nurse_home()">Back to Dashboard</button>
    </div>

    <div id="nurse_intake_msg" style="margin-top:12px;"></div>
  `;
}

async function nurse_saveIntake(appointmentId) {
  const payload = {
    appointmentId: Number(appointmentId),

    bloodPressure: document.getElementById("ni_bp")?.value.trim() || "",
    pulse: document.getElementById("ni_pulse")?.value.trim() || "",
    respiration: document.getElementById("ni_respiration")?.value.trim() || "",
    temperature: document.getElementById("ni_temp")?.value.trim() || "",
    oxygenSaturation: document.getElementById("ni_oxygen")?.value.trim() || "",
    height: document.getElementById("ni_height")?.value.trim() || "",
    weight: document.getElementById("ni_weight")?.value.trim() || "",
    painLevel: document.getElementById("ni_pain")?.value.trim() || "",

    nurseIntakeNote: document.getElementById("ni_note")?.value.trim() || "",

    currentMedications: document.getElementById("ni_meds")?.value.trim() || "",
    medicationChanges: document.getElementById("ni_med_changes")?.value.trim() || "",
    medicationNotes: document.getElementById("ni_med_notes")?.value.trim() || ""
  };

  const msg = document.getElementById("nurse_intake_msg");
  if (msg) msg.innerHTML = "Saving intake...";

  try {
    const result = await api("api/nurse/intake_save.php", "POST", payload);

    if (msg) {
      msg.innerHTML = `<div class="ok">Intake saved successfully. Visit ID: ${result.visitId}</div>`;
    }

    toast("Success", "Intake saved successfully.", "ok");
    nurse_home();
  } catch (err) {
    if (msg) {
      msg.innerHTML = `<div class="err">Failed to save intake.</div>`;
    }
    throw err;
  }
}