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

/* NOTE:
   Format DOB as date only so the patient identity section
   looks cleaner for the doctor.
*/
function fmtDateOnly(mysqlDate) {
  if (!mysqlDate) return "";
  const s = String(mysqlDate).trim();
  const d = new Date(s + "T00:00:00");
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString([], {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
}

/* NOTE:
   Show a clean fallback when optional patient fields are empty.
*/
function displayValue(value, fallback = "Not on file") {
  const v = String(value ?? "").trim();
  return v ? escapeHtml(v) : fallback;
}

/* NOTE:
   Holds the currently opened full patient chart.
   returnTo tells the Back button whether it should return to
   My Schedule or the Patients list.
*/
let doc_chartState = {
  appointmentId: 0,
  visitId: 0,
  patient: null,
  activeTab: "identity",
  returnTo: "patients",
  exam: {
    Nurse_Intake_Note: "",
    Doctor_Exam_Note: "",
    Blood_Pressure: "",
    Pulse: "",
    Respiration: "",
    Temperature: "",
    Oxygen_Saturation: "",
    Height: "",
    Weight: "",
    Pain_Level: "",
    Updated_At: null
  },
  medications: {
    Current_Medications: "",
    Medication_Changes: "",
    Medication_Notes: "",
    Updated_At: null
  },

  /* NOTE:
     Draft copies preserve unsaved typing while switching tabs.
     They are refreshed from saved data when a chart is opened or saved.
  */
  drafts: {
    exam: {
      Nurse_Intake_Note: "",
      Doctor_Exam_Note: "",
      Blood_Pressure: "",
      Pulse: "",
      Respiration: "",
      Temperature: "",
      Oxygen_Saturation: "",
      Height: "",
      Weight: "",
      Pain_Level: ""
    },
    medications: {
      Current_Medications: "",
      Medication_Changes: "",
      Medication_Notes: ""
    }
  }
};

/* NOTE:
   View Patient from My Schedule preview should go directly to
   the full patient chart, not to the Patients list first.
*/
function doc_viewPatient(appointmentId) {
  doc_openPatientChart(appointmentId, "schedule");
}

/* NOTE:
   Show an unsaved marker on tabs that have draft changes.
*/
function doc_chartTabButton(tabKey, label) {
  const isActive = doc_chartState.activeTab === tabKey;
  let dirty = false;

  if (tabKey === "exam") dirty = doc_isExamDirty();
  if (tabKey === "medications") dirty = doc_isMedicationsDirty();

  return `
    <button class="${isActive ? "primary" : "ghost"}" onclick="doc_switchChartTab('${tabKey}')">
      ${label}${dirty ? " *" : ""}
    </button>
  `;
}

/* NOTE:
   Switch tabs while preserving any unsaved typing on the current tab.
*/
function doc_switchChartTab(tabKey) {
  doc_captureActiveTabDraft();
  doc_chartState.activeTab = tabKey;
  doc_renderPatientChart();
}

/* NOTE:
   Return to the page the doctor came from.
   This avoids leaving the patient list visible while the chart is open.
*/
async function doc_chartBack() {
  if (doc_chartState.returnTo === "schedule") {
    await doc_showSchedule();
  } else {
    await doc_showPatients(doc_chartState.appointmentId || 0);
  }
}

/* NOTE:
   Small helper so textarea values stay safe in rendered HTML.
*/
function escapeAttr(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* NOTE:
   Show the doctor-only chart case status separately from the
   receptionist-facing appointment status.
*/
function docCaseStatusText(a) {
  const caseStatus = String(a?.Doctor_Case_Status ?? "").toUpperCase();
  const apptStatus = String(a?.Status ?? "").toUpperCase();

  /* NOTE:
     Display doctor workflow as Open / Closed
     while backend still uses IN_PROGRESS / FINISHED
  */
  if (caseStatus === "IN_PROGRESS") return "Open";
  if (caseStatus === "FINISHED") return "Closed";
  if (apptStatus === "CHECKED_IN") return "Open";
  return "Closed";
}

function docCaseStatusBadge(caseText) {
  const t = String(caseText ?? "").toUpperCase();

  if (t === "OPEN") {
    return `<span class="badge" style="background: rgba(11, 114, 133, 0.12); color: var(--teal-dark); border: 1px solid var(--border);">Open</span>`;
  }

  if (t === "CLOSED") {
    return `<span class="badge">Closed</span>`;
  }

  return `<span class="badge">${escapeHtml(caseText || "Closed")}</span>`;
}

/* NOTE:
   Split a stored blood pressure string like "120/80" into separate
   systolic and diastolic boxes for easier entry.
*/
function splitBloodPressure(bp) {
  const raw = String(bp ?? "").trim();
  if (!raw) return { systolic: "", diastolic: "" };

  const parts = raw.split("/");
  return {
    systolic: String(parts[0] ?? "").trim(),
    diastolic: String(parts[1] ?? "").trim()
  };
}

/* NOTE:
   Extract the numeric portion from values like "72 bpm", "98.6 F",
   "98%", or "165 lbs" so the form can show a clean number-only input.
*/
function numericOnly(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const match = raw.match(/[\d.]+/);
  return match ? match[0] : "";
}

/* NOTE:
   Split a stored height string like "5 ft 8 in" into separate ft/in inputs.
*/
function splitHeight(height) {
  const raw = String(height ?? "").trim();
  if (!raw) return { feet: "", inches: "" };

  const ftMatch = raw.match(/(\d+)\s*ft/i);
  const inMatch = raw.match(/(\d+)\s*in/i);

  return {
    feet: ftMatch ? ftMatch[1] : "",
    inches: inMatch ? inMatch[1] : ""
  };
}

/* NOTE:
   Build stored strings from the cleaned form inputs.
*/
function formatBloodPressure(systolic, diastolic) {
  const s = String(systolic ?? "").trim();
  const d = String(diastolic ?? "").trim();
  if (!s && !d) return "";
  return `${s}/${d}`;
}

function formatWithUnit(value, unit) {
  const v = String(value ?? "").trim();
  if (!v) return "";
  return `${v} ${unit}`;
}

function formatPercent(value) {
  const v = String(value ?? "").trim();
  if (!v) return "";
  return `${v}%`;
}

function formatHeight(feet, inches) {
  const ft = String(feet ?? "").trim();
  const inch = String(inches ?? "").trim();

  if (!ft && !inch) return "";

  if (ft && inch) return `${ft} ft ${inch} in`;
  if (ft) return `${ft} ft`;
  return `${inch} in`;
}

/* NOTE:
   Re-render the current chart tab while the user types so the unsaved
   badge updates immediately. Draft values are captured first.
*/
function doc_refreshDirtyState(tabName) {
  if (tabName === "exam") {
    doc_captureExamDraftFromDom();
  } else if (tabName === "medications") {
    doc_captureMedicationDraftFromDom();
  }

  const wrap = document.getElementById("doc_dirty_hint");
  if (!wrap) return;

  if (tabName === "exam") {
    wrap.innerHTML = doc_unsavedBadge(doc_isExamDirty());
  } else if (tabName === "medications") {
    wrap.innerHTML = doc_unsavedBadge(doc_isMedicationsDirty());
  }
}

/* NOTE:
   Copy the saved exam values into the unsaved draft state.
*/
function doc_syncExamDraftFromSaved() {
  const exam = doc_chartState.exam || {};

  doc_chartState.drafts.exam = {
    Nurse_Intake_Note: exam.Nurse_Intake_Note ?? "",
    Doctor_Exam_Note: exam.Doctor_Exam_Note ?? "",
    Blood_Pressure: exam.Blood_Pressure ?? "",
    Pulse: exam.Pulse ?? "",
    Respiration: exam.Respiration ?? "",
    Temperature: exam.Temperature ?? "",
    Oxygen_Saturation: exam.Oxygen_Saturation ?? "",
    Height: exam.Height ?? "",
    Weight: exam.Weight ?? "",
    Pain_Level: exam.Pain_Level ?? ""
  };
}

/* NOTE:
   Copy the saved medication values into the unsaved draft state.
*/
function doc_syncMedicationDraftFromSaved() {
  const meds = doc_chartState.medications || {};

  doc_chartState.drafts.medications = {
    Current_Medications: meds.Current_Medications ?? "",
    Medication_Changes: meds.Medication_Changes ?? "",
    Medication_Notes: meds.Medication_Notes ?? ""
  };
}

/* NOTE:
   Capture the current Exam tab values before switching away so typing
   is not lost when the chart re-renders.
*/
function doc_captureExamDraftFromDom() {
  const nurseEl = document.getElementById("doc_nurse_intake_note");
  const doctorEl = document.getElementById("doc_doctor_exam_note");

  const bpSystolicEl = document.getElementById("doc_bp_systolic");
  const bpDiastolicEl = document.getElementById("doc_bp_diastolic");
  const pulseEl = document.getElementById("doc_pulse");
  const respirationEl = document.getElementById("doc_respiration");
  const temperatureEl = document.getElementById("doc_temperature");
  const oxygenEl = document.getElementById("doc_oxygen_saturation");
  const heightFeetEl = document.getElementById("doc_height_feet");
  const heightInchesEl = document.getElementById("doc_height_inches");
  const weightEl = document.getElementById("doc_weight");
  const painEl = document.getElementById("doc_pain_level");

  const bloodPressure = formatBloodPressure(
    bpSystolicEl ? bpSystolicEl.value.trim() : "",
    bpDiastolicEl ? bpDiastolicEl.value.trim() : ""
  );

  const pulse = formatWithUnit(pulseEl ? pulseEl.value.trim() : "", "bpm");
  const respiration = formatWithUnit(respirationEl ? respirationEl.value.trim() : "", "rpm");
  const temperature = formatWithUnit(temperatureEl ? temperatureEl.value.trim() : "", "F");
  const oxygenSaturation = formatPercent(oxygenEl ? oxygenEl.value.trim() : "");
  const height = formatHeight(
    heightFeetEl ? heightFeetEl.value.trim() : "",
    heightInchesEl ? heightInchesEl.value.trim() : ""
  );
  const weight = formatWithUnit(weightEl ? weightEl.value.trim() : "", "lbs");
  const painLevel = (painEl && painEl.value.trim()) ? `${painEl.value.trim()}/10` : "";

  doc_chartState.drafts.exam = {
    Nurse_Intake_Note: nurseEl ? nurseEl.value : "",
    Doctor_Exam_Note: doctorEl ? doctorEl.value : "",
    Blood_Pressure: bloodPressure,
    Pulse: pulse,
    Respiration: respiration,
    Temperature: temperature,
    Oxygen_Saturation: oxygenSaturation,
    Height: height,
    Weight: weight,
    Pain_Level: painLevel
  };
}

/* NOTE:
   Compare draft exam values to the last saved exam values.
   If anything changed, show an unsaved indicator.
*/
function doc_isExamDirty() {
  const draft = doc_chartState.drafts?.exam || {};
  const saved = doc_chartState.exam || {};

  return (
    (draft.Nurse_Intake_Note ?? "") !== (saved.Nurse_Intake_Note ?? "") ||
    (draft.Doctor_Exam_Note ?? "") !== (saved.Doctor_Exam_Note ?? "") ||
    (draft.Blood_Pressure ?? "") !== (saved.Blood_Pressure ?? "") ||
    (draft.Pulse ?? "") !== (saved.Pulse ?? "") ||
    (draft.Respiration ?? "") !== (saved.Respiration ?? "") ||
    (draft.Temperature ?? "") !== (saved.Temperature ?? "") ||
    (draft.Oxygen_Saturation ?? "") !== (saved.Oxygen_Saturation ?? "") ||
    (draft.Height ?? "") !== (saved.Height ?? "") ||
    (draft.Weight ?? "") !== (saved.Weight ?? "") ||
    (draft.Pain_Level ?? "") !== (saved.Pain_Level ?? "")
  );
}

/* NOTE:
   Compare draft medication values to the last saved medication values.
*/
function doc_isMedicationsDirty() {
  const draft = doc_chartState.drafts?.medications || {};
  const saved = doc_chartState.medications || {};

  return (
    (draft.Current_Medications ?? "") !== (saved.Current_Medications ?? "") ||
    (draft.Medication_Changes ?? "") !== (saved.Medication_Changes ?? "") ||
    (draft.Medication_Notes ?? "") !== (saved.Medication_Notes ?? "")
  );
}

/* NOTE:
   Small reusable badge for unsaved changes.
*/
function doc_unsavedBadge(show) {
  if (!show) return "";
  return `<span class="badge gold">Unsaved Changes</span>`;
}

/* NOTE:
   Capture the current Medications tab values before switching away so typing
   is not lost when the chart re-renders.
*/
function doc_captureMedicationDraftFromDom() {
  const currentEl = document.getElementById("doc_current_medications");
  const changesEl = document.getElementById("doc_medication_changes");
  const notesEl = document.getElementById("doc_medication_notes");

  doc_chartState.drafts.medications = {
    Current_Medications: currentEl ? currentEl.value : "",
    Medication_Changes: changesEl ? changesEl.value : "",
    Medication_Notes: notesEl ? notesEl.value : ""
  };
}

/* NOTE:
   Capture whichever editable tab is currently on screen before changing tabs.
*/
function doc_captureActiveTabDraft() {
  if (doc_chartState.activeTab === "exam") {
    doc_captureExamDraftFromDom();
  } else if (doc_chartState.activeTab === "medications") {
    doc_captureMedicationDraftFromDom();
  }
}

/* NOTE:
   Revised Change 3 Part A:
   Full chart view replaces the whole page content so the doctor
   only sees the selected patient while working through chart tabs.
*/
function doc_renderPatientChart() {
  const content = document.getElementById("content");
  const a = doc_chartState.patient || {};

  const appointmentId = doc_chartState.appointmentId;
  const visitId = doc_chartState.visitId;
  const patientFullName = `${a.Patient_First ?? ""} ${a.Patient_Last ?? ""}`.trim() || "Unknown Patient";

  let tabBody = "";

  if (doc_chartState.activeTab === "identity") {
    tabBody = `
      <div class="section" style="margin-top:16px;">
        <div class="section-title">
          <h3>Patient Identity</h3>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Full Name</label>
            <input value="${displayValue(patientFullName, "Unknown")}" disabled>
          </div>

          <div class="field">
            <label>Date of Birth</label>
            <input value="${displayValue(fmtDateOnly(a.Date_Of_Birth), "Not on file")}" disabled>
          </div>

          <div class="field">
            <label>Age</label>
            <input value="${displayValue(calcAge(a.Date_Of_Birth), "Not available")}" disabled>
          </div>

          <div class="field">
            <label>Gender</label>
            <input value="${displayValue(a.Gender, "Not on file")}" disabled>
          </div>

          <div class="field">
            <label>Phone</label>
            <input value="${displayValue(a.Phone_Number, "Not on file")}" disabled>
          </div>

          <div class="field">
            <label>Email</label>
            <input value="${displayValue(a.Email, "Not on file")}" disabled>
          </div>

          <div class="field">
            <label>Appointment ID</label>
            <input value="${appointmentId}" disabled>
          </div>

          <div class="field">
            <label>Visit ID</label>
            <input value="${visitId}" disabled>
          </div>

          <div class="field">
            <label>Appointment Start</label>
            <input value="${displayValue(fmtDT(a.Scheduled_Start), "Not on file")}" disabled>
          </div>

          <div class="field">
            <label>Status</label>
            <input value="${displayValue(a.Status, "Unknown")}" disabled>
          </div>

          <div class="field">
            <label>Doctor Case Status</label>
            <input value="${displayValue(docCaseStatusText(a), "Not Open")}" disabled>
          </div>
        </div>
      </div>
    `;
  } else if (doc_chartState.activeTab === "exam") {
    const exam = doc_chartState.drafts?.exam || doc_chartState.exam || {};

    /* NOTE:
      Draft values keep unsaved typing, but Updated_At should come from
      the saved exam record, not the draft copy.
    */
    const savedExam = doc_chartState.exam || {};
    const updatedAt = savedExam.Updated_At ? fmtDT(savedExam.Updated_At) : "Not saved yet";

    tabBody = `
      <div class="section" style="margin-top:16px;">
        <div class="section-title">
          <h3>Exam Notes & Vitals</h3>
          <div class="tools">
            <span class="badge">Last Updated: ${escapeHtml(updatedAt)}</span>
          </div>
        </div>

        <!-- NOTE:
            Structured vitals go first because they are usually part of intake.
            The doctor can still correct these if needed.
        -->
        <div class="section" style="margin-top:12px;">
          <div class="section-title">
            <h3>Vitals</h3>
          </div>

          ${(() => {
            const bp = splitBloodPressure(exam.Blood_Pressure);
            const h = splitHeight(exam.Height);

            return `
              <div class="form-grid">
                <div class="field">
                  <label>Blood Pressure</label>
                  <div class="row" style="gap:8px; align-items:center;">
                    <input
                      id="doc_bp_systolic"
                      oninput="doc_refreshDirtyState('exam')"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      step="1"
                      value="${escapeAttr(bp.systolic)}"
                      placeholder="120"
                    >
                    <span>/</span>
                    <input
                      id="doc_bp_diastolic"
                      oninput="doc_refreshDirtyState('exam')"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      step="1"
                      value="${escapeAttr(bp.diastolic)}"
                      placeholder="80"
                    >
                  </div>
                </div>

                <div class="field">
                  <label>Pulse</label>
                  <div class="row" style="gap:8px; align-items:center;">
                    <input
                      id="doc_pulse"
                      oninput="doc_refreshDirtyState('exam')"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      step="1"
                      value="${escapeAttr(numericOnly(exam.Pulse))}"
                      placeholder="72"
                    >
                    <span>bpm</span>
                  </div>
                </div>

                <div class="field">
                  <label>Respiration</label>
                  <div class="row" style="gap:8px; align-items:center;">
                    <input
                      id="doc_respiration"
                      oninput="doc_refreshDirtyState('exam')"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      step="1"
                      value="${escapeAttr(numericOnly(exam.Respiration))}"
                      placeholder="16"
                    >
                    <span>rpm</span>
                  </div>
                </div>

                <div class="field">
                  <label>Temperature</label>
                  <div class="row" style="gap:8px; align-items:center;">
                    <input
                      id="doc_temperature"
                      oninput="doc_refreshDirtyState('exam')"
                      type="number"
                      inputmode="decimal"
                      min="0"
                      step="0.1"
                      value="${escapeAttr(numericOnly(exam.Temperature))}"
                      placeholder="98.6"
                    >
                    <span>F</span>
                  </div>
                </div>

                <div class="field">
                  <label>Oxygen Saturation</label>
                  <div class="row" style="gap:8px; align-items:center;">
                    <input
                      id="doc_oxygen_saturation"
                      oninput="doc_refreshDirtyState('exam')"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      max="100"
                      step="1"
                      value="${escapeAttr(numericOnly(exam.Oxygen_Saturation))}"
                      placeholder="98"
                    >
                    <span>%</span>
                  </div>
                </div>

                <div class="field">
                  <label>Height</label>
                  <div class="row" style="gap:8px; align-items:center; flex-wrap:wrap;">
                    <input
                      id="doc_height_feet"
                      oninput="doc_refreshDirtyState('exam')"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      step="1"
                      value="${escapeAttr(h.feet)}"
                      placeholder="5"
                      style="max-width:90px;"
                    >
                    <span>ft</span>
                    <input
                      id="doc_height_inches"
                      oninput="doc_refreshDirtyState('exam')"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      step="1"
                      value="${escapeAttr(h.inches)}"
                      placeholder="8"
                      style="max-width:90px;"
                    >
                    <span>in</span>
                  </div>
                </div>

                <div class="field">
                  <label>Weight</label>
                  <div class="row" style="gap:8px; align-items:center;">
                    <input
                      id="doc_weight"
                      oninput="doc_refreshDirtyState('exam')"
                      type="number"
                      inputmode="decimal"
                      min="0"
                      step="0.1"
                      value="${escapeAttr(numericOnly(exam.Weight))}"
                      placeholder="165"
                    >
                    <span>lbs</span>
                  </div>
                </div>

                <div class="field">
                  <label>Pain Level</label>
                  <div class="row" style="gap:8px; align-items:center;">
                    <input
                      id="doc_pain_level"
                      oninput="doc_refreshDirtyState('exam')"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      max="10"
                      step="1"
                      value="${escapeAttr(numericOnly(exam.Pain_Level))}"
                      placeholder="0"
                    >
                    <span>/ 10</span>
                  </div>
                </div>
              </div>
            `;
          })()}
        </div>

        <!-- NOTE:
            Nurse intake stays here so nurse-side changes later can stay minimal.
        -->
        <div class="field" style="margin-top:12px;">
          <label>Nurse Intake Note</label>
          <textarea
            id="doc_nurse_intake_note"
            oninput="doc_refreshDirtyState('exam')"
            rows="6"
            placeholder="Example: Patient reports right knee pain, started 2 days ago. Small abrasion seen."
          >${escapeHtml(exam.Nurse_Intake_Note ?? "")}</textarea>
        </div>

        <!-- NOTE:
            Doctor-focused assessment and exam notes.
        -->
        <div class="field" style="margin-top:12px;">
          <label>Doctor Exam Note</label>
          <textarea
            id="doc_doctor_exam_note"
            oninput="doc_refreshDirtyState('exam')"
            rows="8"
            placeholder="Doctor exam findings, assessment notes, and follow-up details..."
          >${escapeHtml(exam.Doctor_Exam_Note ?? "")}</textarea>
        </div>

        <div class="row" style="margin-top:12px; gap:8px; flex-wrap:wrap; align-items:center;">
          <button class="primary" onclick="doc_saveExamNotes(${visitId})">Save Exam Notes</button>
          <div id="doc_dirty_hint">${doc_unsavedBadge(doc_isExamDirty())}</div>
        </div>
      </div>
    `;
  } else if (doc_chartState.activeTab === "medications") {
    const meds = doc_chartState.drafts?.medications || doc_chartState.medications || {};

    /* NOTE:
      Draft values keep unsaved typing, but Updated_At should come from
      the saved medication record, not the draft copy.
    */
    const savedMeds = doc_chartState.medications || {};
    const updatedAt = savedMeds.Updated_At ? fmtDT(savedMeds.Updated_At) : "Not saved yet";

    tabBody = `
      <div class="section" style="margin-top:16px;">
        <div class="section-title">
          <h3>Medications</h3>
          <div class="tools">
            ${doc_unsavedBadge(doc_isMedicationsDirty())}
            <span class="badge">Last Updated: ${escapeHtml(updatedAt)}</span>
          </div>
        </div>

        <!-- NOTE:
            Main medication list currently on file for the patient during this visit.
        -->
        <div class="field" style="margin-top:12px;">
          <label>Current Medications</label>
          <textarea
            id="doc_current_medications"
            oninput="doc_refreshDirtyState('medications')"
            rows="6"
            placeholder="List current medications, doses, and frequency..."
          >${escapeHtml(meds.Current_Medications ?? "")}</textarea>
        </div>

        <!-- NOTE:
            Doctor-focused medication changes for this visit.
        -->
        <div class="field" style="margin-top:12px;">
          <label>Medication Changes / Orders</label>
          <textarea
            id="doc_medication_changes"
            oninput="doc_refreshDirtyState('medications')"
            rows="6"
            placeholder="Add new medications, dosage changes, discontinuations, or orders..."
          >${escapeHtml(meds.Medication_Changes ?? "")}</textarea>
        </div>

        <!-- NOTE:
            General medication notes and follow-up instructions.
        -->
        <div class="field" style="margin-top:12px;">
          <label>Medication Notes</label>
          <textarea
            id="doc_medication_notes"
            oninput="doc_refreshDirtyState('medications')"
            rows="6"
            placeholder="Medication-related notes, warnings, or follow-up instructions..."
          >${escapeHtml(meds.Medication_Notes ?? "")}</textarea>
        </div>

        <div class="row" style="margin-top:12px; gap:8px; flex-wrap:wrap; align-items:center;">
          <button class="primary" onclick="doc_saveMedications(${visitId})">Save Medications</button>
          <div id="doc_dirty_hint">${doc_unsavedBadge(doc_isMedicationsDirty())}</div>
        </div>
      </div>
    `;
  }

  content.innerHTML = `
    <div class="card">
      <h2>Patient Chart - ${escapeHtml(patientFullName)}</h2>
      <p>Doctor chart workspace for the selected patient.</p>

      <div class="section" style="margin-top:16px;">
        <div class="section-title">
          <h3>Chart Actions</h3>
          <div class="tools">
            <span class="${badgeClass(a.Status)}">${escapeHtml(a.Status ?? "")}</span>
            ${docCaseStatusBadge(docCaseStatusText(a))}
            <button class="ghost" onclick="doc_chartBack()">Back</button>
            <button class="secondary" onclick="doc_setStatus(${appointmentId}, 'IN_PROGRESS')">Open</button>
            <button class="primary" onclick="doc_setStatus(${appointmentId}, 'COMPLETED')">Close</button>
          </div>
        </div>

        <div class="row" style="gap:8px; margin-top:12px; flex-wrap:wrap;">
          ${doc_chartTabButton("identity", "Patient Identity")}
          ${doc_chartTabButton("exam", "Exam Notes")}
          ${doc_chartTabButton("medications", "Medications")}
        </div>
      </div>

      ${tabBody}
    </div>
  `;
}

/* NOTE:
   Open the full chart directly from either View Patient button.
   This now also loads the editable exam sheet for the visit.
*/
async function doc_openPatientChart(appointmentId, returnTo = "patients") {
  const appt = await apiSafe(`api/doctor/appointment_get.php?appointmentId=${appointmentId}`);
  const visit = await apiSafe("api/doctor/visits_get_or_create.php", "POST", { appointmentId });
  const exam = await apiSafe(`api/doctor/exam_get.php?visitId=${visit.visitId}`);

  let medsData = {
    Current_Medications: "",
    Medication_Changes: "",
    Medication_Notes: "",
    Updated_At: null
  };

  try {
    const meds = await apiSafe(`api/doctor/medications_get.php?visitId=${visit.visitId}`);
    medsData = meds.medications || medsData;
  } catch (err) {
    console.error("medications_get failed, opening chart with empty medication data:", err);
  }

  doc_chartState = {
    appointmentId,
    visitId: visit.visitId,
    patient: appt.appointment || {},
    activeTab: "identity",
    returnTo,
    exam: exam.exam || {
      Nurse_Intake_Note: "",
      Doctor_Exam_Note: "",
      Blood_Pressure: "",
      Pulse: "",
      Respiration: "",
      Temperature: "",
      Oxygen_Saturation: "",
      Height: "",
      Weight: "",
      Pain_Level: "",
      Updated_At: null
    },
    medications: medsData,
    drafts: {
      exam: {
        Nurse_Intake_Note: "",
        Doctor_Exam_Note: "",
        Blood_Pressure: "",
        Pulse: "",
        Respiration: "",
        Temperature: "",
        Oxygen_Saturation: "",
        Height: "",
        Weight: "",
        Pain_Level: ""
      },
      medications: {
        Current_Medications: "",
        Medication_Changes: "",
        Medication_Notes: ""
      }
    }
  };

  /* NOTE:
     Start the draft copies from the latest saved data when the chart opens.
  */
  doc_syncExamDraftFromSaved();
  doc_syncMedicationDraftFromSaved();

  doc_renderPatientChart();
}

/* NOTE:
   Save the editable exam note fields and vitals, then refresh the chart state
   so the doctor sees the latest saved values and timestamp.
*/
async function doc_saveExamNotes(visitId) {
  /* NOTE:
     Capture the current unsaved form values first.
  */
  doc_captureExamDraftFromDom();

  const draft = doc_chartState.drafts.exam || {};

  await apiSafe("api/doctor/exam_save.php", "POST", {
    visitId,
    nurseIntakeNote: draft.Nurse_Intake_Note ?? "",
    doctorExamNote: draft.Doctor_Exam_Note ?? "",
    bloodPressure: draft.Blood_Pressure ?? "",
    pulse: draft.Pulse ?? "",
    respiration: draft.Respiration ?? "",
    temperature: draft.Temperature ?? "",
    oxygenSaturation: draft.Oxygen_Saturation ?? "",
    height: draft.Height ?? "",
    weight: draft.Weight ?? "",
    painLevel: draft.Pain_Level ?? ""
  });

  const exam = await apiSafe(`api/doctor/exam_get.php?visitId=${visitId}`);

  doc_chartState.exam = exam.exam || {
    Nurse_Intake_Note: draft.Nurse_Intake_Note ?? "",
    Doctor_Exam_Note: draft.Doctor_Exam_Note ?? "",
    Blood_Pressure: draft.Blood_Pressure ?? "",
    Pulse: draft.Pulse ?? "",
    Respiration: draft.Respiration ?? "",
    Temperature: draft.Temperature ?? "",
    Oxygen_Saturation: draft.Oxygen_Saturation ?? "",
    Height: draft.Height ?? "",
    Weight: draft.Weight ?? "",
    Pain_Level: draft.Pain_Level ?? "",
    Updated_At: null
  };

  doc_syncExamDraftFromSaved();

  doc_chartState.activeTab = "exam";
  doc_renderPatientChart();
}

async function doc_saveMedications(visitId) {
  /* NOTE:
     Capture the current unsaved form values first.
  */
  doc_captureMedicationDraftFromDom();

  const draft = doc_chartState.drafts.medications || {};

  await apiSafe("api/doctor/medications_save.php", "POST", {
    visitId,
    currentMedications: draft.Current_Medications ?? "",
    medicationChanges: draft.Medication_Changes ?? "",
    medicationNotes: draft.Medication_Notes ?? ""
  });

  const meds = await apiSafe(`api/doctor/medications_get.php?visitId=${visitId}`);

  doc_chartState.medications = meds.medications || {
    Current_Medications: draft.Current_Medications ?? "",
    Medication_Changes: draft.Medication_Changes ?? "",
    Medication_Notes: draft.Medication_Notes ?? "",
    Updated_At: null
  };

  doc_syncMedicationDraftFromSaved();

  doc_chartState.activeTab = "medications";
  doc_renderPatientChart();
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
        <td><button class="small ghost" onclick="doc_open(${a.Appointment_ID})">Open</button></td>
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
      <td><button class="small ghost" onclick="doc_open(${a.Appointment_ID})">Open</button></td>
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
  /* NOTE:
     Change 1:
     Open from My Schedule should stay on My Schedule and show only
     a compact patient preview card in the panel area.
  */
  const appt = await apiSafe(`api/doctor/appointment_get.php?appointmentId=${appointmentId}`);

  /* NOTE:
     Keep visit creation/reuse here so the appointment is considered
     opened by the doctor and we already have the visit id available.
  */
  const visit = await apiSafe("api/doctor/visits_get_or_create.php", "POST", { appointmentId });

  const a = appt.appointment || {};
  const patientFullName = `${a.Patient_First ?? ""} ${a.Patient_Last ?? ""}`.trim() || "Unknown Patient";

  document.getElementById("doc_panel").innerHTML = `
    <div class="section">
      <div class="section-title">
        <h3>Patient Identity - ${escapeHtml(patientFullName)}</h3>
        <div class="tools">
          <span class="${badgeClass(a.Status)}">${escapeHtml(a.Status ?? "")}</span>
          ${docCaseStatusBadge(docCaseStatusText(a))}
          <button class="ghost" onclick="doc_loadSchedule()">Close Preview</button>
        </div>
      </div>

      <!-- NOTE:
           Compact preview only.
           The full chart will live under the Patients tab in Change 2.
      -->
      <div class="form-grid">
        <div class="field">
          <label>Full Name</label>
          <input value="${displayValue(patientFullName, "Unknown")}" disabled>
        </div>

        <div class="field">
          <label>Date of Birth</label>
          <input value="${displayValue(fmtDateOnly(a.Date_Of_Birth), "Not on file")}" disabled>
        </div>

        <div class="field">
          <label>Age</label>
          <input value="${displayValue(calcAge(a.Date_Of_Birth), "Not available")}" disabled>
        </div>

        <div class="field">
          <label>Gender</label>
          <input value="${displayValue(a.Gender, "Not on file")}" disabled>
        </div>

        <div class="field">
          <label>Phone</label>
          <input value="${displayValue(a.Phone_Number, "Not on file")}" disabled>
        </div>

        <div class="field">
          <label>Email</label>
          <input value="${displayValue(a.Email, "Not on file")}" disabled>
        </div>

        <div class="field">
          <label>Appointment ID</label>
          <input value="${appointmentId}" disabled>
        </div>

        <div class="field">
          <label>Doctor Case Status</label>
          <input value="${displayValue(docCaseStatusText(a), "Not Open")}" disabled>
        </div>

        <div class="field">
          <label>Visit ID</label>
          <input value="${visit.visitId}" disabled>
        </div>

        <div class="field">
          <label>Appointment Start</label>
          <input value="${displayValue(fmtDT(a.Scheduled_Start), "")}" disabled>
        </div>
      </div>

      <div class="row" style="margin-top:12px; gap:8px; flex-wrap:wrap;">
        <!-- NOTE:
             This is the bridge button.
             For Change 1 it opens the Patients tab workspace.
             In Change 2 we will wire it to the selected patient record there.
        -->
        <button class="primary" onclick="doc_viewPatient(${appointmentId})">View Patient</button>

        <!-- NOTE:
             Keep doctor workflow buttons available from the preview card.
        -->
        <button class="secondary" onclick="doc_setStatus(${appointmentId}, 'IN_PROGRESS')">Open</button>
        <button class="primary" onclick="doc_setStatus(${appointmentId}, 'COMPLETED')">Close</button>
      </div>
    </div>
  `;
}

/* NOTE:
   Calculate age from DOB.
   This keeps it accurate without storing it in the database.
*/
function calcAge(dob) {
  if (!dob) return "";

  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return "";

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  return age;
}

/* NOTE:
   Format the Open/Closed workflow label for the Patients tab.
*/
function docPatientCaseBadge(caseState) {
  const state = String(caseState ?? "").toUpperCase();

  if (state === "OPEN") {
    return `<span class="badge" style="background: rgba(11, 114, 133, 0.12); color: var(--teal-dark); border: 1px solid var(--border);">Open</span>`;
  }

  if (state === "CLOSED") {
    return `<span class="badge">Closed</span>`;
  }

  return `<span class="badge">${escapeHtml(state || "Unknown")}</span>`;
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
  /* NOTE:
     Keep the existing button calls, but map them to doctor-only case status.
     This avoids changing receptionist appointment status.
  */
  let caseStatus = status;

  if (String(status).toUpperCase() === "COMPLETED") {
    caseStatus = "FINISHED";
  }

  await apiSafe("api/doctor/case_status.php", "POST", { appointmentId, caseStatus });
  toast("Updated", `Case status set to ${caseStatus}`, "ok");

  if (typeof doc_loadTilesAndQueue === "function") await doc_loadTilesAndQueue();

  const fullChartVisible =
    !!document.querySelector('button[onclick^="doc_switchChartTab("]');

  const sameChartAppointment =
    typeof doc_chartState !== "undefined" &&
    Number(doc_chartState.appointmentId) === Number(appointmentId);

  if (fullChartVisible && sameChartAppointment && typeof doc_openPatientChart === "function") {
    await doc_openPatientChart(appointmentId, doc_chartState.returnTo || "patients");
    return;
  }

  await doc_loadSchedule();
  await doc_open(appointmentId);
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
   Change 2:
   Patients tab now shows a real doctor patient list instead of the placeholder.
   The optional selectedAppointmentId helps highlight the patient row that came
   from My Schedule -> View Patient.
*/
async function doc_showPatients(selectedAppointmentId = 0) {
  const content = document.getElementById("content");

  content.innerHTML = `
    <div class="card">
      <h2>Patients</h2>
      <p>View and manage doctor patient information.</p>

      <div class="section" style="margin-top:16px;">
        <div class="section-title">
          <h3>Patient List</h3>
          <div class="tools">
            <button class="ghost" onclick="doc_showPatients(${selectedAppointmentId || 0})">Refresh</button>
          </div>
        </div>

        <div id="doc_patients_table_wrap" style="margin-top:12px;">
          <span class="badge">Loading patients...</span>
        </div>
      </div>
    </div>
  `;

  const wrap = document.getElementById("doc_patients_table_wrap");

  try {
    const data = await apiSafe("api/doctor/patients_list.php");
    const rows = Array.isArray(data.patients) ? data.patients : [];

    if (!rows.length) {
      wrap.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Open / Closed</th>
              <th>Full Name</th>
              <th>Date of Birth</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Appointment ID</th>
              <th>Last Appointment</th>
              <th>Next Appointment</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="9">No patients found for this doctor yet.</td>
            </tr>
          </tbody>
        </table>
      `;
      return;
    }

    const htmlRows = rows.map(r => {
      const fullName = `${r.Patient_First ?? ""} ${r.Patient_Last ?? ""}`.trim() || "Unknown Patient";
      const isSelected = Number(r.Appointment_ID) === Number(selectedAppointmentId);

      return `
        <tr style="${isSelected ? "background: rgba(11,114,133,0.08);" : ""}">
          <td>${docPatientCaseBadge(r.Open_Closed)}</td>
          <td>${escapeHtml(fullName)}</td>
          <td>${escapeHtml(fmtDateOnly(r.Date_Of_Birth) || "Not on file")}</td>
          <td>${escapeHtml(String(calcAge(r.Date_Of_Birth) || "Not available"))}</td>
          <td>${displayValue(r.Gender, "Not on file")}</td>
          <td>${escapeHtml(String(r.Appointment_ID ?? ""))}</td>
          <td>${escapeHtml(r.Last_Appointment ? fmtDT(r.Last_Appointment) : "None")}</td>
          <td>${escapeHtml(r.Next_Appointment ? fmtDT(r.Next_Appointment) : "None")}</td>
          <td>
            <!-- NOTE:
                 For Change 2 this reopens the preview flow from My Schedule.
                 Full patient chart tabs come in the next change.
            -->
            <button class="primary" onclick="doc_openPatientFromList(${Number(r.Appointment_ID)})">View Patient</button>
          </td>
        </tr>
      `;
    }).join("");

    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Open / Closed</th>
            <th>Full Name</th>
            <th>Date of Birth</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Appointment ID</th>
            <th>Last Appointment</th>
            <th>Next Appointment</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${htmlRows}
        </tbody>
      </table>
    `;
  } catch (err) {
    wrap.innerHTML = `
      <div class="section">
        <span class="badge">Failed to load patients</span>
        <p style="margin-top:12px;">Please try again.</p>
      </div>
    `;
    console.error("doc_showPatients failed:", err);
  }
}

/* NOTE:
   View Patient from the Patients list should open the full chart directly.
   This replaces the list on screen so the doctor only sees one patient chart
   while working through tabs.
*/
function doc_openPatientFromList(appointmentId) {
  doc_openPatientChart(appointmentId, "patients");
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