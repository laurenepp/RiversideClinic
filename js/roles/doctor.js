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

function loadDoctorAppointments() {
  loadAppointmentsPage({
    role: "doctor",
    canCreate: false,
    canEdit: false,
    canCheckIn: false,
    providerScope: "self",
    allowScopeToggle: false
  });
}

async function loadDoctorPatientHistory() {
  const content = document.getElementById("dash_view") || document.getElementById("content");

  content.innerHTML = `
    <div class="card">
      <h2>Patient History</h2>
      <p>Select a patient to view past appointments</p>

      <div class="row compact" style="margin-top:12px;">
        <div class="field" style="max-width:360px;">
          <label>Search Patient</label>
          <input id="doc_patient_search" type="text" placeholder="Search by first or last name" oninput="doc_filterPatients()">
        </div>
      </div>

      <div id="doc_patient_list" style="margin-top:16px;">
        Loading patients...
      </div>
    </div>
  `;

  await doc_loadPatients();
}

let docPatientCache = [];

function doc_filterPatients() {
  const term = (document.getElementById("doc_patient_search")?.value || "").trim().toLowerCase();
  const filtered = !term
    ? docPatientCache
    : docPatientCache.filter(p =>
        String(p.First_Name || "").toLowerCase().includes(term) ||
        String(p.Last_Name || "").toLowerCase().includes(term)
      );

  const wrap = document.getElementById("doc_patient_list");
  if (!wrap) return;

  const rows = filtered.map(p => `
    <tr>
      <td>${p.Patient_ID}</td>
      <td>${escapeHtml(p.Last_Name)}</td>
      <td>${escapeHtml(p.First_Name)}</td>
      <td>${p.Birth_Date || ""}</td>
      <td>
        <button class="small" onclick="doc_openPatient(${p.Patient_ID})">Open</button>
      </td>
    </tr>
  `).join("");

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Last</th>
          <th>First</th>
          <th>Birth Date</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="5">No patients found</td></tr>`}
      </tbody>
    </table>
  `;
}


async function doc_loadPatients() {
  const wrap = document.getElementById("doc_patient_list");
  if (!wrap) return;

  try {
    const data = await api("api/doctor/patients_list.php");
    const patients = data.patients || [];
    docPatientCache = patients;
    doc_filterPatients();
  } catch (err) {
    wrap.innerHTML = `<div style="color:red;">Failed to load patients</div>`;
  }
}

async function doc_openPatient(patientId) {
  const content = document.getElementById("dash_view") || document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="card">
      <div class="section-title">
        <h3>Patient Appointments</h3>
        <div class="tools">
          <button class="ghost" onclick="loadDoctorPatientHistory()">Back</button>
        </div>
      </div>

      <div id="doc_patient_appts" style="margin-top:16px;">
        Loading appointments...
      </div>
    </div>
  `;

  try {
    const data = await api(`api/doctor/patient_appointments.php?patientId=${patientId}`);
    const appts = Array.isArray(data.appointments) ? data.appointments : [];

    const rows = appts.map(a => `
      <tr>
        <td>${fmtDT(a.Scheduled_Start)}</td>
        <td><span class="${badgeClass(a.Status)}">${a.Status}</span></td>
        <td>
          <button class="small" onclick="doc_open(${a.Appointment_ID}, 'historyPatient', ${patientId}, true)">
            Review
          </button>
        </td>
      </tr>
    `).join("");

    document.getElementById("doc_patient_appts").innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Date / Time</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="3">No appointments</td></tr>`}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error("Failed to load patient appointments:", err);
    document.getElementById("doc_patient_appts").innerHTML = `
      <div style="color:red;">Failed to load appointments</div>
    `;
  }
}

async function doc_openExamPage(appointmentId, backTarget = "history", backPatientId = null, readOnly = false, forceUnlock = false) {
  const content = document.getElementById("dash_view") || document.getElementById("content");
  if (!content) return;

  let backHtml = `loadDoctorPatientHistory()`;
  if (backTarget === "dashboard") backHtml = `doc_home()`;
  if (backTarget === "appointments") backHtml = `loadDoctorAppointments()`;
  if (backTarget === "historyPatient" && backPatientId) backHtml = `doc_openPatient(${backPatientId})`;

  content.innerHTML = `
    <div class="card">
      <div class="section-title">
        <h3>Complete Exam</h3>
        <div class="tools" id="doc_exam_tools">
          <button class="ghost" onclick="${backHtml}">Back</button>
        </div>
      </div>

      <div id="doc_exam_page_body" style="margin-top:16px;">
        Loading exam...
      </div>
    </div>
  `;

  const body = document.getElementById("doc_exam_page_body");

  try {
    const data = await api(`api/doctor/exam_get.php?appointmentId=${appointmentId}`);

    const a = data.appointment || {};
    const visit = data.visit || {};
    const exam = data.exam || {};
    const meds = data.medication || {};

    const lockedBySave = String(visit.Doctor_Case_Status || "").toUpperCase() === "COMPLETED";
    const effectiveReadOnly = forceUnlock ? false : (readOnly || lockedBySave);
    const allowUnlock = !forceUnlock && effectiveReadOnly && backTarget === "historyPatient";

    const tools = document.getElementById("doc_exam_tools");
    if (tools) {
      tools.innerHTML = `
        ${allowUnlock ? `<button class="secondary" onclick="doc_unlockExam(${appointmentId}, '${backTarget}', ${backPatientId ?? "null"})">Unlock</button>` : ""}
        <button class="ghost" onclick="${backHtml}">Back</button>
      `;
    }

    body.innerHTML = `
      <div class="form-grid">

        <div class="field">
          <label>Patient</label>
          <input value="${escapeHtml(a.Patient_Last || "")}, ${escapeHtml(a.Patient_First || "")}" disabled>
        </div>

        <div class="field">
          <label>Date of Birth</label>
          <input value="${a.Date_Of_Birth || ""}" disabled>
        </div>

        <div class="field">
          <label>Phone</label>
          <input value="${a.Phone_Number || ""}" disabled>
        </div>

        <div class="field">
          <label>Status</label>
          <input value="${a.Status || ""}" disabled>
        </div>

        <div class="field"><label>Blood Pressure</label><input value="${exam.Blood_Pressure || ""}" disabled></div>
        <div class="field"><label>Pulse</label><input value="${exam.Pulse || ""}" disabled></div>
        <div class="field"><label>Respiration</label><input value="${exam.Respiration || ""}" disabled></div>
        <div class="field"><label>Temperature</label><input value="${exam.Temperature || ""}" disabled></div>
        <div class="field"><label>Oxygen Saturation</label><input value="${exam.Oxygen_Saturation || ""}" disabled></div>
        <div class="field"><label>Height</label><input value="${exam.Height || ""}" disabled></div>
        <div class="field"><label>Weight</label><input value="${exam.Weight || ""}" disabled></div>
        <div class="field"><label>Pain Level</label><input value="${exam.Pain_Level || ""}" disabled></div>

      </div>

      <div class="field" style="margin-top:12px;">
        <label>Nurse Intake Note</label>
        <textarea disabled rows="4">${exam.Nurse_Intake_Note || ""}</textarea>
      </div>

      <div class="field">
        <label>Current Medications</label>
        <textarea disabled rows="3">${meds.Current_Medications || ""}</textarea>
      </div>

      <div class="field">
        <label>Medication Changes</label>
        <textarea id="doc_med_changes" rows="3" ${effectiveReadOnly ? "disabled" : ""}>${meds.Medication_Changes || ""}</textarea>
      </div>

      <div class="field">
        <label>Medication Notes</label>
        <textarea id="doc_med_notes" rows="3" ${effectiveReadOnly ? "disabled" : ""}>${meds.Medication_Notes || ""}</textarea>
      </div>

      <hr style="margin:20px 0;">

      <div class="section-title">
        <h3>Prescriptions</h3>
      </div>

      <div class="form-grid">

        <div class="field">
          <label>Medication</label>
          <select id="doc_med_select" ${effectiveReadOnly ? "disabled" : ""}>
            <option value="">Select Medication</option>
            <option>Atorvastatin (Lipitor)</option>
            <option>Levothyroxine</option>
            <option>Lisinopril</option>
            <option>Metformin</option>
            <option>Amlodipine</option>
            <option>Metoprolol</option>
            <option>Albuterol</option>
            <option>Omeprazole</option>
            <option>Losartan</option>
            <option>Gabapentin</option>
          </select>
        </div>

        <div class="field">
          <label>Amount</label>
          <input id="doc_med_amount" placeholder="e.g. 30 tablets" ${effectiveReadOnly ? "disabled" : ""}>
        </div>

        <div class="field">
          <label>Instructions</label>
          <input id="doc_med_instructions" placeholder="e.g. Take 1 tablet daily" ${effectiveReadOnly ? "disabled" : ""}>
        </div>

      </div>

      <div style="margin-top:10px;">
        ${effectiveReadOnly ? "" : `<button class="secondary" onclick="doc_addMedication()">Add Medication</button>`}
      </div>

      <div id="doc_med_list" style="margin-top:12px;"></div>

      <div class="field" style="margin-top:12px;">
        <label>Doctor Exam Note</label>
        <textarea id="doc_exam_note" rows="6" ${effectiveReadOnly ? "disabled" : ""}>${exam.Doctor_Exam_Note || ""}</textarea>
      </div>

      <div style="margin-top:12px;">
        ${effectiveReadOnly ? "" : `
          <button class="primary" onclick="doc_saveExam(${appointmentId}, ${visit.Visit_ID}, '${backTarget}', ${backPatientId ?? "null"})">
            Save Exam
          </button>
        `}
      </div>
    `;

    if (typeof doc_renderMedications === "function") {
      doc_renderMedications();
    }
  } catch (err) {
    console.error(err);
    body.innerHTML = `<div style="color:red;">Failed to load exam information.</div>`;
  }
}

async function doc_saveExamPage(appointmentId) {
  const chiefComplaint = document.getElementById("doc_exam_complaint")?.value || "";
  const assessment = document.getElementById("doc_exam_assessment")?.value || "";
  const plan = document.getElementById("doc_exam_plan")?.value || "";

  try {
    await api("api/doctor/exam_save.php", "POST", {
      appointmentId,
      chiefComplaint,
      assessment,
      plan
    });

    toast("Exam", "Exam saved successfully.", "ok");
  } catch (err) {
    console.error("Failed to save exam:", err);
    toast("Exam", "Failed to save exam.", "err");
  }
}

async function doc_saveExamNote(appointmentId) {
  const noteText = document.getElementById("doc_new_note")?.value || "";

  if (!noteText.trim()) {
    toast("Notes", "Please enter a note first.", "err");
    return;
  }

  try {
    await api("api/doctor/notes_save.php", "POST", {
      appointmentId,
      noteText
    });

    toast("Notes", "Note saved successfully.", "ok");
    await doc_openExamPage(appointmentId);
  } catch (err) {
    console.error("Failed to save note:", err);
    toast("Notes", "Failed to save note.", "err");
  }
}

function doc_unlockExam(appointmentId, backTarget = "history", backPatientId = null) {
  doc_openExamPage(appointmentId, backTarget, backPatientId, false, true);
}

function doctor_openModal(title, subtitle, bodyHtml, footerHtml = "") {
  const root =
    document.getElementById("doctor_modal_root") ||
    document.getElementById("appt_modal_root");

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
  const root =
    document.getElementById("doctor_modal_root") ||
    document.getElementById("appt_modal_root");

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
      <td><button class="small primary" onclick="doc_open(${a.Appointment_ID}, 'dashboard')">Complete Exam</button></td>
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
      <td><button class="small" onclick="doc_open(${a.Appointment_ID}, 'appointments')">Open</button></td>
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

async function doc_open(appointmentId, backTarget = "history", backPatientId = null, readOnly = false, forceUnlock = false) {
  await doc_openExamPage(appointmentId, backTarget, backPatientId, readOnly, forceUnlock);
}

async function doc_saveExam(appointmentId, visitId, backTarget = "history", backPatientId = null) {
  const payload = {
    appointmentId,
    visitId,
    doctorExamNote: document.getElementById("doc_exam_note")?.value.trim() || "",
    medicationChanges: document.getElementById("doc_med_changes")?.value.trim() || "",
    medicationNotes: document.getElementById("doc_med_notes")?.value.trim() || "",
    doctorCaseStatus: "COMPLETED"
  };

  await api("api/doctor/exam_save.php", "POST", payload);
  toast("Visit Completed", "Exam and medication updates saved.", "ok");

  // Return doctor to dashboard so the completed visit leaves the active workflow
  loadDoctor();

  // Force a fresh reload of tiles/queue/schedule after save
  setTimeout(() => {
    doc_refreshDay();
  }, 100);
}
let docMedications = [];

function doc_addMedication() {
  const name = document.getElementById("doc_med_select").value;
  const amount = document.getElementById("doc_med_amount").value.trim();
  const instructions = document.getElementById("doc_med_instructions").value.trim();

  if (!name) {
    alert("Select a medication");
    return;
  }

  docMedications.push({ name, amount, instructions });

  const medLine = `${name} - ${amount} - ${instructions}`.trim();
  const changesBox = document.getElementById("doc_med_changes");
  if (changesBox) {
    changesBox.value = changesBox.value.trim()
      ? `${changesBox.value.trim()}\n${medLine}`
      : medLine;
  }

  document.getElementById("doc_med_select").value = "";
  document.getElementById("doc_med_amount").value = "";
  document.getElementById("doc_med_instructions").value = "";

  doc_renderMedications();
}

function doc_renderMedications() {
  const wrap = document.getElementById("doc_med_list");
  if (!wrap) return;

  const rows = docMedications.map((m, i) => `
    <div style="padding:6px; border-bottom:1px solid #ddd;">
      ${m.name} - ${m.amount} - ${m.instructions}
      <button class="ghost small" onclick="doc_removeMedication(${i})">Remove</button>
    </div>
  `).join("");

  wrap.innerHTML = rows || "<div>No medications added</div>";
}

function doc_removeMedication(index) {
  docMedications.splice(index, 1);
  doc_renderMedications();
}

window.doc_openPatient = doc_openPatient;
window.loadDoctorPatientHistory = loadDoctorPatientHistory;
window.loadDoctorAppointments = loadDoctorAppointments;
window.doc_home = doc_home;