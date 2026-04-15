function nurse_home() {
  const content = document.getElementById("dash_view") || document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="card">
      <h2>Nurse Dashboard</h2>
      <p>All checked-in patients move here until intake is complete.</p>

      <div id="nurse_tiles"></div>
      <div id="nurse_queue" style="margin-top:18px;"></div>
    </div>
  `;

  nurse_loadTilesAndQueue();
}

function nurseFormatStatusLabel(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
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

  const data = await api("api/nurse/queue_list.php");
  const queue = data.queue || [];

  tilesWrap.innerHTML = `
    <div class="tiles">
      ${nurse_tile("Patients in Queue", queue.length, "Checked in across all dates", "Q", "sage")}
      ${nurse_tile("Checked-In", queue.length, "Waiting for intake", "C", "gold")}
      ${nurse_tile("Ready for Provider", 0, "Set after save", "✓", "dark")}
    </div>
  `;

  const rows = queue.map(p => `
  <tr>
    <td>${escapeHtml(p.Scheduled_Start ? fmtDT(p.Scheduled_Start) : "")}</td>
    <td>${escapeHtml(p.Patient_Last || "")}, ${escapeHtml(p.Patient_First || "")}</td>
    <td>${escapeHtml(p.Date_Of_Birth || "")}</td>
    <td><button class="small gold" onclick="nurse_openIntake(${Number(p.Appointment_ID)})">Complete Intake</button></td>
  </tr>
`).join("");

  queueWrap.innerHTML = `
    <div class="section">
      <div class="section-title">
        <h3>Nurse Queue</h3>
        <div class="tools"><button class="ghost" onclick="nurse_loadTilesAndQueue()">Refresh</button></div>
      </div>
      <table>
        <thead><tr><th>Scheduled</th><th>Patient</th><th>DOB</th><th>Action</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="4">No patients currently in queue.</td></tr>`}</tbody>
      </table>
    </div>
  `;
}

function nurse_openIntake(appointmentId) { nurse_intake(appointmentId); }
function nurseAppointments() { loadAppointmentsPage({ role: "nurse", canCreate: false, canEdit: false, canCheckIn: false, providerScope: "all", allowScopeToggle: false }); }
function nurse_schedule() { nurse_home(); }

async function nurse_intake(appointmentId = null) {
  const content = document.getElementById("dash_view") || document.getElementById("content");
  if (!content) return;

  const details = appointmentId
    ? await api(`api/nurse/appointment_get.php?appointmentId=${appointmentId}`)
    : null;

  const appt = details?.appointment;

  content.innerHTML = `
    <div class="card">
      <h2>Patient Intake</h2>
      <p>${appointmentId ? `Working intake for appointment #${Number(appointmentId)}` : "Vitals, notes, and intake forms will appear here."}</p>

      ${appt ? `
        <div class="section">
          <div class="form-grid">
            <div class="field">
              <label>Patient</label>
              <input type="text" value="${escapeHtml(`${appt.Patient_Last || ""}, ${appt.Patient_First || ""}`)}" disabled>
            </div>

            <div class="field">
              <label>Date of Birth</label>
              <input type="text" value="${escapeHtml(appt.Date_Of_Birth || "")}" disabled>
            </div>

            <div class="field">
              <label>Phone</label>
              <input type="text" value="${escapeHtml(appt.Phone_Number || "")}" disabled>
            </div>

            <div class="field">
              <label>Status</label>
              <input type="text" value="${escapeHtml(nurseFormatStatusLabel(appt.Status || ""))}" disabled>
            </div>
          </div>
        </div>
      ` : ""}

      <div id="nurse_intake_form" style="margin-top:18px;"></div>
    </div>
  `;

  if (appointmentId) nurse_renderIntakeForm(Number(appointmentId));
}

async function nurse_renderIntakeForm(appointmentId) {
  const wrap = document.getElementById("nurse_intake_form");
  if (!wrap) return;

  const existing = await api(`api/nurse/intake_get.php?appointmentId=${appointmentId}`)
    .catch(() => ({ intake: null }));

  const i = existing.intake || {};

  wrap.innerHTML = `
    <div class="form-grid">
      <div class="field">
        <label>Blood Pressure</label>
        <input id="ni_bp" placeholder="120/80" value="${escapeHtml(i.Blood_Pressure || "")}">
      </div>

      <div class="field">
        <label>Pulse</label>
        <input id="ni_pulse" placeholder="72" value="${escapeHtml(i.Pulse || "")}">
      </div>

      <div class="field">
        <label>Respiration</label>
        <input id="ni_respiration" placeholder="16" value="${escapeHtml(i.Respiration || "")}">
      </div>

      <div class="field">
        <label>Temperature</label>
        <input id="ni_temp" placeholder="98.6" value="${escapeHtml(i.Temperature || "")}">
      </div>

      <div class="field">
        <label>Oxygen Saturation</label>
        <input id="ni_oxygen" placeholder="99%" value="${escapeHtml(i.Oxygen_Saturation || "")}">
      </div>

      <div class="field">
        <label>Height</label>
        <input id="ni_height" placeholder="5'7&quot;" value="${escapeHtml(i.Height || "")}">
      </div>

      <div class="field">
        <label>Weight</label>
        <input id="ni_weight" placeholder="160 lbs" value="${escapeHtml(i.Weight || "")}">
      </div>

      <div class="field">
        <label>Pain Level</label>
        <input id="ni_pain" placeholder="0-10" value="${escapeHtml(i.Pain_Level || "")}">
      </div>
    </div>

    <div class="field" style="margin-top:14px;">
      <label>Nurse Intake Note</label>
      <textarea id="ni_note" rows="4">${escapeHtml(i.Nurse_Intake_Note || "")}</textarea>
    </div>

    <div class="field" style="margin-top:14px;">
      <label>Current Medications</label>
      <textarea id="ni_meds" rows="3">${escapeHtml(i.Current_Medications || "")}</textarea>
    </div>

    <div class="field" style="margin-top:14px;">
      <label>Medication Changes</label>
      <textarea id="ni_med_changes" rows="3">${escapeHtml(i.Medication_Changes || "")}</textarea>
    </div>

    <div class="field" style="margin-top:14px;">
      <label>Medication Notes</label>
      <textarea id="ni_med_notes" rows="3">${escapeHtml(i.Medication_Notes || "")}</textarea>
    </div>

    <div class="row" style="margin-top:16px;">
      <button class="admin-create-submit" onclick="nurse_saveIntake(${Number(appointmentId)})">Save Intake</button>
      <button class="admin-create-submit" onclick="nurse_home()">Back to Dashboard</button>
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
  const result = await api("api/nurse/intake_save.php", "POST", payload);
  if (msg) msg.innerHTML = `<div class="ok">Intake saved successfully. Visit ID: ${result.visitId}</div>`;
  toast("Success", "Patient moved to Ready for Provider.", "ok");
  nurse_home();
}

window.nurse_home = nurse_home;
window.nurseAppointments = nurseAppointments;
window.nurse_schedule = nurse_schedule;
window.nurse_openIntake = nurse_openIntake;
window.nurse_intake = nurse_intake;
window.nurse_saveIntake = nurse_saveIntake;