function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadDoctor() {
  const content = document.getElementById("content");
  const today = new Date().toISOString().slice(0, 10);

  content.innerHTML = `
    <div class="card">
      <h2>Doctor - My Day</h2>
      <p>Patients move here after intake is completed by nursing.</p>
      <div id="doc_tiles"></div>
      <div class="row compact" style="margin-top:14px;">
        <div class="field"><label>From</label><input id="d_from" type="date" value="${today}"></div>
        <div class="field"><label>To</label><input id="d_to" type="date" value="${today}"></div>
        <div style="align-self:end;"><button class="primary" onclick="doc_loadSchedule()">Load Schedule</button></div>
        <div style="align-self:end;"><button class="ghost" onclick="doc_refreshDay()">Refresh Day</button></div>
      </div>
      <div id="doc_queue" style="margin-top:16px;"></div>
      <div id="doc_list" style="margin-top:16px;"></div>
      <div id="doc_panel" style="margin-top:16px;"></div>
      <div id="doctor_modal_root"></div>
    </div>
  `;

  doc_refreshDay();
}

function doctor_openModal(title, subtitle, bodyHtml, footerHtml = "") {
  const root = document.getElementById("doctor_modal_root");
  if (!root) return;

  root.innerHTML = `
    <div class="appt-modal-backdrop" onclick="doctor_closeModal()">
      <div class="appt-modal doctor-exam-modal" onclick="event.stopPropagation()">
        <div class="appt-modal-header">
          <div>
            <h3>${title}</h3>
            ${subtitle ? `<div class="appt-modal-sub">${subtitle}</div>` : ""}
          </div>
          <button class="ghost" onclick="doctor_closeModal()">Close</button>
        </div>

        <div class="doctor-modal-body">
          ${bodyHtml}
        </div>

        ${footerHtml ? `
          <div class="appt-modal-footer">
            ${footerHtml}
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

function doctor_closeModal() {
  const root = document.getElementById("doctor_modal_root");
  if (root) root.innerHTML = "";
}

async function doc_refreshDay() { await doc_loadTilesAndQueue(); await doc_loadSchedule(); }

function doc_tile(label, value, sub, iconText, tone) {
  return `<div class="tile ${tone}"><div class="icon">${iconText}</div><div class="content"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div></div>`;
}

async function doc_loadTilesAndQueue() {
  const tilesWrap = document.getElementById("doc_tiles");
  const queueWrap = document.getElementById("doc_queue");
  if (!tilesWrap || !queueWrap) return;

  tilesWrap.innerHTML = `<div style="margin-top:12px; color: var(--muted); font-weight:700;">Loading doctor dashboard...</div>`;
  const d = await api("api/doctor/dashboard_summary.php");

  tilesWrap.innerHTML = `
    <div class="tiles">
      ${doc_tile("Appointments Today", d.totalToday ?? 0, "All statuses", "C", "gold")}
      ${doc_tile("Scheduled", d.scheduledToday ?? 0, "Upcoming", "S", "teal")}
      ${doc_tile("Checked-In", d.checkedInToday ?? 0, "Waiting on nurse", "CI", "dark")}
      ${doc_tile("Ready for Provider", d.readyToday ?? 0, "Doctor queue", "R", "sage")}
      ${doc_tile("Completed", d.completedToday ?? 0, "Finished", "OK", "teal")}
    </div>
  `;

  const rows = (d.checkedInQueue || []).map(a => `
    <tr>
      <td>${fmtDT(a.Scheduled_Start)}</td>
      <td>${escapeHtml(a.Patient_Last)}, ${escapeHtml(a.Patient_First)}</td>
      <td>${a.Date_Of_Birth || ''}</td>
      <td><button class="small primary" onclick="doc_open(${a.Appointment_ID})">Complete Exam</button></td>
    </tr>
  `).join("");

  queueWrap.innerHTML = `
    <div class="section">
      <div class="section-title"><h3>Doctor Queue</h3><div class="tools"><button class="ghost" onclick="doc_loadTilesAndQueue()">Refresh</button></div></div>
      <table><thead><tr><th>Scheduled</th><th>Patient</th><th>DOB</th><th>Action</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No patients ready for provider.</td></tr>`}</tbody></table>
    </div>
  `;
}

async function doc_loadSchedule() {
  const fromEl = document.getElementById("d_from");
  const toEl = document.getElementById("d_to");
  const listEl = document.getElementById("doc_list");
  const panelEl = document.getElementById("doc_panel");
  if (!fromEl || !toEl || !listEl) return;

  const data = await api(`api/doctor/appointments_my.php?from=${fromEl.value}&to=${toEl.value}`);
  const appts = Array.isArray(data.appointments) ? data.appointments : [];

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
      <div class="section-title"><h3>Schedule</h3><div class="tools"><button class="ghost" onclick="doc_loadSchedule()">Refresh</button></div></div>
      <table><thead><tr><th>ID</th><th>Start</th><th>End</th><th>Status</th><th>Patient</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="6">No appointments</td></tr>`}</tbody></table>
    </div>
  `;

  if (panelEl) panelEl.innerHTML = "";
}

async function doc_open(appointmentId) {
  const data = await api(`api/doctor/exam_get.php?appointmentId=${appointmentId}`);
  const a = data.appointment;
  const exam = data.exam || {};
  const meds = data.medication || {};

  const bodyHtml = `
    <div class="section">
      <div class="section-title">
        <h3>Complete Exam for Appointment #${appointmentId}</h3>
        <div class="tools"><span class="${badgeClass(a.Status)}">${a.Status}</span></div>
      </div>

      <div class="form-grid">
        <div class="field"><label>Patient</label><input value="${escapeHtml(a.Patient_Last)}, ${escapeHtml(a.Patient_First)}" disabled></div>
        <div class="field"><label>Date of Birth</label><input value="${a.Date_Of_Birth || ''}" disabled></div>
        <div class="field"><label>Phone</label><input value="${a.Phone_Number || ''}" disabled></div>
        <div class="field"><label>Visit ID</label><input value="${data.visit.Visit_ID}" disabled></div>
      </div>

      <div class="section" style="margin-top:14px;">
        <div class="section-title"><h3>Intake Summary</h3></div>
        <div class="form-grid">
          <div class="form-grid compact-vitals">
            <div class="field"><label>Blood Pressure</label><input value="${exam.Blood_Pressure || ''}" disabled></div>
            <div class="field"><label>Pulse</label><input value="${exam.Pulse || ''}" disabled></div>
            <div class="field"><label>Respiration</label><input value="${exam.Respiration || ''}" disabled></div>
            <div class="field"><label>Temperature</label><input value="${exam.Temperature || ''}" disabled></div>
            <div class="field"><label>Oxygen Saturation</label><input value="${exam.Oxygen_Saturation || ''}" disabled></div>
            <div class="field"><label>Pain</label><input value="${exam.Pain_Level || ''}" disabled></div>
          </div>
        </div>
        <div class="field" style="margin-top:12px;"><label>Nurse Intake Note</label><textarea disabled rows="4">${exam.Nurse_Intake_Note || ''}</textarea></div>
        <div class="field" style="margin-top:12px;"><label>Current Medications</label><textarea disabled rows="3">${meds.Current_Medications || ''}</textarea></div>
      </div>

      <div class="field" style="margin-top:12px;">
        <label>Doctor Exam Note</label>
        <textarea id="doc_exam_note" rows="6" placeholder="Document the exam and plan...">${exam.Doctor_Exam_Note || ''}</textarea>
      </div>

      <div id="doc_exam_msg" style="margin-top:10px;"></div>
    </div>
  `;

  const footerHtml = `
    <button class="ghost" onclick="doctor_closeModal()">Close</button>
    <button class="primary" onclick="doc_saveExam(${appointmentId}, ${data.visit.Visit_ID})">
      Save Exam and Complete Visit
    </button>
  `;

  doctor_openModal(
    "Complete Exam",
    `${escapeHtml(a.Patient_Last)}, ${escapeHtml(a.Patient_First)}${a.Date_Of_Birth ? ` • DOB: ${a.Date_Of_Birth}` : ""}`,
    bodyHtml,
    footerHtml
  );
}

async function doc_saveExam(appointmentId, visitId) {
  const payload = {
    appointmentId,
    visitId,
    doctorExamNote: document.getElementById("doc_exam_note")?.value.trim() || "",
    doctorCaseStatus: "COMPLETED"
  };

  const msg = document.getElementById("doc_exam_msg");
  if (msg) msg.textContent = "Saving exam...";

  await api("api/doctor/exam_save.php", "POST", payload);
  toast("Visit Completed", "Patient moved back to receptionist checkout.", "ok");
  doctor_closeModal();
  await doc_refreshDay();
}
