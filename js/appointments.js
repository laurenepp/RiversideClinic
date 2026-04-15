let appointmentsState = {
  role: "",
  canCreate: false,
  canEdit: false,
  canCheckIn: false,
  providerScope: "all",
  providerId: null,
  selectedDate: new Date(),
  viewMode: "day",
  providers: [],
  appointments: [],
  selectedPatient: null,
  patientSearchResults: []
};

function loadAppointmentsPage(options = {}) {
    appointmentsState = {
        ...appointmentsState,
        ...options,
        selectedDate: options.selectedDate || appointmentsState.selectedDate || new Date()
    };

    const content = document.getElementById("dash_view") || document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
      <div class="card appointments-page">
        <div id="appointments_page"></div>
      </div>

      <div id="appt_modal_root"></div>
    `;

    renderAppointmentsPage();
    appointmentsLoadData();
}

function renderAppointmentsPage() {
  const mount = document.getElementById("appointments_page");
  if (!mount) return;

  const prettyDate =
    appointmentsState.viewMode === "week"
      ? formatAppointmentsWeekRange(appointmentsState.selectedDate)
      : formatAppointmentsLongDate(appointmentsState.selectedDate);

  mount.innerHTML = `
    <div class="appt-shell">
      <div class="appt-page-header">
        <div>
          <h2>Appointments</h2>
          <div class="appt-subdate">${prettyDate}</div>
        </div>
      </div>

      <div class="appt-toolbar">
        <div class="appt-toolbar-left">
          <button class="ghost appt-nav-btn" onclick="appointmentsPrevPeriod()">&#8249;</button>
          <div class="appt-date-pill">${prettyDate}</div>
          <button class="ghost appt-nav-btn" onclick="appointmentsNextPeriod()">&#8250;</button>
          <button class="ghost" onclick="appointmentsToday()">Today</button>
        </div>

        <div class="appt-toolbar-right">
          ${appointmentsState.allowScopeToggle ? `
            <div class="appt-view-toggle">
              <button class="${appointmentsState.providerScope === 'self' ? 'primary' : 'ghost'}" onclick="appointmentsSetScope('self')">My Calendar</button>
              <button class="${appointmentsState.providerScope === 'all' ? 'primary' : 'ghost'}" onclick="appointmentsSetScope('all')">All Providers</button>
            </div>
          ` : ""}

          <div class="appt-view-toggle">
            <button class="${appointmentsState.viewMode === 'day' ? 'primary' : 'ghost'}" onclick="appointmentsSetView('day')">Day</button>
            <button class="${appointmentsState.viewMode === 'week' ? 'primary' : 'ghost'}" onclick="appointmentsSetView('week')">Week</button>
          </div>

          ${appointmentsState.canCreate ? `
            <button class="primary" onclick="appointmentsOpenNew()">+ New Appointment</button>
          ` : ""}
        </div>
      </div>

      <div id="appointments_scheduler">
        <div style="padding:16px;">Loading appointments...</div>
      </div>
    </div>
  `;
}

function appointmentsSetView(mode) {
  appointmentsState.viewMode = mode;
  renderAppointmentsPage();
  appointmentsLoadData();
}

function formatAppointmentsLongDate(dateObj) {
    return dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatAppointmentsDateInput(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatAppointmentsDateTimeInput(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const mins = String(dateObj.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${mins}`;
}

function appointmentsPrevDay() {
    const d = new Date(appointmentsState.selectedDate);
    d.setDate(d.getDate() - 1);
    appointmentsState.selectedDate = d;
    renderAppointmentsPage();
    appointmentsLoadData();
}

function appointmentsNextDay() {
    const d = new Date(appointmentsState.selectedDate);
    d.setDate(d.getDate() + 1);
    appointmentsState.selectedDate = d;
    renderAppointmentsPage();
    appointmentsLoadData();
}

function appointmentsToday() {
    appointmentsState.selectedDate = new Date();
    renderAppointmentsPage();
    appointmentsLoadData();
}

async function appointmentsLoadData() {
  try {
    let fromDate;
    let toDate;

    if (appointmentsState.viewMode === "week") {
      fromDate = formatAppointmentsDateInput(getStartOfWeek(appointmentsState.selectedDate));
      toDate = formatAppointmentsDateInput(getEndOfWeek(appointmentsState.selectedDate));
    } else {
      const day = formatAppointmentsDateInput(appointmentsState.selectedDate);
      fromDate = day;
      toDate = day;
    }

    let appointmentsUrl = `api/shared/appointments_list.php?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;

    if (appointmentsState.providerScope === "self" && appointmentsState.providerId) {
      appointmentsUrl += `&providerId=${encodeURIComponent(appointmentsState.providerId)}`;
    }

    const [providersRes, appointmentsRes] = await Promise.all([
      api("api/shared/providers_list.php"),
      api(appointmentsUrl)
    ]);

    appointmentsState.providers = providersRes.providers || [];
    appointmentsState.appointments = appointmentsRes.appointments || [];

    if (appointmentsState.viewMode === "week") {
      renderAppointmentsWeekGrid();
    } else {
      renderAppointmentsDayGrid();
    }
  } catch (err) {
    const scheduler = document.getElementById("appointments_scheduler");
    if (scheduler) {
      scheduler.innerHTML = `<div class="err" style="padding:16px;">Failed to load appointments.</div>`;
    }
    throw err;
  }
}

function appointmentsGetVisibleProviders() {
    const allProviders = appointmentsState.providers || [];

    if (appointmentsState.providerScope === "self" && appointmentsState.providerId) {
        return allProviders.filter(p => Number(p.User_ID) === Number(appointmentsState.providerId));
    }

    return allProviders;
}

function appointmentsFormatTimeLabel(datetimeStr) {
    const dt = new Date(datetimeStr.replace(" ", "T"));
    let hours = dt.getHours();
    const mins = String(dt.getMinutes()).padStart(2, "0");
    return `${String(hours).padStart(2, "0")}:${mins}`;
}

function appointmentsDurationMinutes(startStr, endStr) {
    const start = new Date(startStr.replace(" ", "T"));
    const end = new Date(endStr.replace(" ", "T"));
    return Math.round((end - start) / 60000);
}

function appointmentsTone(status) {
    const s = String(status || "").toUpperCase();
    if (s === "CHECKED_IN") return "blue";
    if (s === "COMPLETED") return "blue";
    if (s === "CANCELLED") return "gray";
    return "green";
}

function appointmentsFormatStatusLabel(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function renderAppointmentsDayGrid() {
    const scheduler = document.getElementById("appointments_scheduler");
    if (!scheduler) return;

    const visibleProviders = appointmentsGetVisibleProviders();

    const times = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
        "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
    ];

    let html = `
        <div class="appt-grid" style="grid-template-columns: 120px repeat(${Math.max(visibleProviders.length, 1)}, 1fr);">
        <div class="appt-head appt-time-head">Time</div>
        ${visibleProviders.length
          ? visibleProviders.map(p => `<div class="appt-head">Dr. ${p.Last_Name ? `${escapeHtml(p.First_Name || "")} ${escapeHtml(p.Last_Name || "")}` : escapeHtml(p.First_Name || "")}</div>`).join("")
          : `<div class="appt-head">No Providers</div>`}
           `;

    times.forEach(time => {
        html += `<div class="appt-time-cell">${time}</div>`;

        if (!visibleProviders.length) {
        html += `<div class="appt-cell"></div>`;
        } else {
        visibleProviders.forEach(provider => {
            const appt = appointmentsState.appointments.find(a =>
            String(a.Provider_ID) === String(provider.User_ID) &&
            appointmentsFormatTimeLabel(a.Scheduled_Start) === time
            );

            html += `<div class="appt-cell">`;

            if (appt) {
            const duration = appointmentsDurationMinutes(appt.Scheduled_Start, appt.Scheduled_End);
            const patientName = `${escapeHtml(appt.Patient_First || "")} ${escapeHtml(appt.Patient_Last || "")}`;
            const tone = appointmentsTone(appt.Status);

            html += `
              <div class="appt-card ${tone}" onclick="appointmentsView(${appt.Appointment_ID})">
              <div class="appt-patient">${patientName}</div>
              <div class="appt-type">${appointmentsFormatStatusLabel(appt.Status)}</div>
              <div class="appt-duration">${duration} min</div>
              </div>
              `;
            }

            html += `</div>`;
        });
        }
    });

    html += `</div>`;
    scheduler.innerHTML = html;
}

function appointmentsView(appointmentId) {
  const appt = appointmentsState.appointments.find(
    a => Number(a.Appointment_ID) === Number(appointmentId)
  );
  if (!appt) return;

  // Doctor should go straight to Complete Exam instead of editing appointment data
  if (appointmentsState.role === "doctor") {
    if (typeof doc_open === "function") {
      doc_open(appt.Appointment_ID, 'appointments');
    }
    return;
  }

  const patientName = `${escapeHtml(appt.Patient_First || "")} ${escapeHtml(appt.Patient_Last || "")}`;
  const providerName = `Dr. ${escapeHtml(appt.Provider_First || "")} ${escapeHtml(appt.Provider_Last || "")}`;

  const modalRoot = document.getElementById("appt_modal_root");
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="appt-modal-backdrop" onclick="appointmentsCloseModal()">
      <div class="appt-modal" onclick="event.stopPropagation()">
        <div class="appt-modal-header">
          <div>
            <h3>Appointment #${appt.Appointment_ID}</h3>
            <div class="appt-modal-sub">${patientName}</div>
          </div>
          <button class="ghost" onclick="appointmentsCloseModal()">Close</button>
        </div>

        <div class="appt-modal-body">
          <div class="form-grid">
            <div class="field">
              <label>Patient</label>
              <input value="${patientName}" disabled>
            </div>

            <div class="field">
              <label>Provider</label>
              <input value="${providerName}" disabled>
            </div>

            <div class="field">
              <label>Start</label>
              <input id="appt_edit_start" type="datetime-local" value="${appointmentsToDateTimeLocal(appt.Scheduled_Start)}">
            </div>

            <div class="field">
              <label>End</label>
              <input id="appt_edit_end" type="datetime-local" value="${appointmentsToDateTimeLocal(appt.Scheduled_End)}">
            </div>

            <div class="field">
              <label>Status</label>
              <select id="appt_edit_status">
                <option value="SCHEDULED" ${appt.Status === "SCHEDULED" ? "selected" : ""}>SCHEDULED</option>
                <option value="CHECKED_IN" ${appt.Status === "CHECKED IN" ? "selected" : ""}>CHECKED IN</option>
                <option value="COMPLETED" ${appt.Status === "COMPLETED" ? "selected" : ""}>COMPLETED</option>
                <option value="RESCHEDULED" ${appt.Status === "RESCHEDULED" ? "selected" : ""}>RESCHEDULED</option>
                <option value="CANCELLED" ${appt.Status === "CANCELLED" ? "selected" : ""}>CANCELLED</option>
              </select>
            </div>
          </div>

          <div id="appt_edit_msg" style="margin-top:12px;"></div>
        </div>

        <div class="appt-modal-footer">
          <button class="ghost" onclick="appointmentsCloseModal()">Close</button>
          <button class="ghost" onclick="appointmentsCancel(${appt.Appointment_ID})">Cancel Appointment</button>
          <button class="primary" onclick="appointmentsSave(${appt.Appointment_ID})">Save Changes</button>
        </div>
      </div>
    </div>
  `;
}

function appointmentsSyncEditEndTime() {
  const startInput = document.getElementById("appt_edit_start");
  const endInput = document.getElementById("appt_edit_end");

  if (!startInput || !endInput || !startInput.value) return;

  const start = new Date(startInput.value);
  if (isNaN(start.getTime())) return;

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  const year = end.getFullYear();
  const month = String(end.getMonth() + 1).padStart(2, "0");
  const day = String(end.getDate()).padStart(2, "0");
  const hours = String(end.getHours()).padStart(2, "0");
  const mins = String(end.getMinutes()).padStart(2, "0");

  endInput.value = `${year}-${month}-${day}T${hours}:${mins}`;
}

function appointmentsCloseModal() {
  const modalRoot = document.getElementById("appt_modal_root");
  if (modalRoot) {
    modalRoot.innerHTML = "";
  }
}

function appointmentsToDateTimeLocal(dateTimeStr) {
  if (!dateTimeStr) return "";
  return dateTimeStr.replace(" ", "T").slice(0, 16);
}

async function appointmentsSave(appointmentId) {
  const payload = {
    appointmentId: Number(appointmentId),
    startDateTime: document.getElementById("appt_edit_start")?.value || "",
    endDateTime: document.getElementById("appt_edit_end")?.value || "",
    status: document.getElementById("appt_edit_status")?.value || ""
  };

  if (!payload.startDateTime || !payload.endDateTime || !payload.status) {
    toast("Missing Information", "Start, end, and status are required.", "err");
    return;
  }

  const msg = document.getElementById("appt_edit_msg");
  if (msg) msg.innerHTML = "Saving changes...";

  try {
    await api("api/shared/appointments_update.php", "POST", payload);

    if (msg) {
      msg.innerHTML = `<div class="ok">Appointment updated successfully.</div>`;
    }

    toast("Success", "Appointment updated successfully.", "ok");
    await appointmentsLoadData();
    appointmentsCloseModal();
    } catch (err) {
      const open = err.clinicOpen?.slice(0,5) || "?";
      const close = err.clinicClose?.slice(0,5) || "?";
      const errorMessage =
      err?.error === "Appointment is outside clinic hours"
        ? `Allowed hours are ${open} to ${close}.`
        : (err?.error || "Failed to update appointment.");
    if (msg) {
      msg.innerHTML = `<div class="err">${errorMessage}</div>`;
    }

    toast("Error", errorMessage, "err");
    throw err;
  }
}

function appointmentsOpenNew() {
  const scheduler = document.getElementById("appointments_scheduler");
  if (!scheduler) return;

    appointmentsState.selectedPatient = null;
    appointmentsState.patientSearchResults = [];

  const providerOptions = (appointmentsState.providers || []).map(p =>
  `<option value="${escapeHtml(String(p.User_ID || ""))}">Dr. ${escapeHtml(p.First_Name || "")} ${escapeHtml(p.Last_Name || "")}</option>`
  ).join("");

  const defaultDate = formatAppointmentsDateInput(appointmentsState.selectedDate);

  scheduler.innerHTML = `
    <div class="section">
      <div class="section-title">
        <h3>New Appointment</h3>
        <div class="tools">
          <button class="ghost" onclick="renderAppointmentsDayGrid()">Close</button>
        </div>
      </div>

      <div class="section" style="margin-bottom:16px;">
        <h4 style="margin-bottom:10px;">Find Patient</h4>

        <div class="row compact">
          <div class="field" style="flex:1;">
            <label>Search Patient</label>
            <input id="appt_patient_search" placeholder="Name / phone / email" onkeydown="appointmentsHandlePatientSearchKey(event)">
          </div>
          <div style="align-self:end;">
            <button class="primary" onclick="appointmentsPatientSearch()">Search</button>
          </div>
        </div>

        <div id="appt_patient_selected" style="margin-top:10px;"></div>
        <div id="appt_patient_results" style="margin-top:12px;"></div>
      </div>

      <div class="form-grid">
        <div class="field">
          <label>Provider</label>
          <select id="appt_provider_id">
            <option value="">Select provider</option>
            ${providerOptions}
          </select>
        </div>

        <div class="field">
          <label>Start</label>
          <input id="appt_start" type="datetime-local" value="${defaultDate}T09:00" onchange="appointmentsSyncEndTime()">
        </div>

        <div class="field">
          <label>End</label>
          <input id="appt_end" type="datetime-local" value="${defaultDate}T09:30">
        </div>
      </div>

      <div class="row" style="margin-top:12px;">
        <button class="primary" onclick="appointmentsCreate()">Create Appointment</button>
      </div>

      <div id="appt_msg" style="margin-top:12px;"></div>
    </div>
  `;
}

function appointmentsSyncEndTime() {
  const startInput = document.getElementById("appt_start");
  const endInput = document.getElementById("appt_end");

  if (!startInput || !endInput || !startInput.value) return;

  const start = new Date(startInput.value);
  if (isNaN(start.getTime())) return;

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  const year = end.getFullYear();
  const month = String(end.getMonth() + 1).padStart(2, "0");
  const day = String(end.getDate()).padStart(2, "0");
  const hours = String(end.getHours()).padStart(2, "0");
  const mins = String(end.getMinutes()).padStart(2, "0");

  endInput.value = `${year}-${month}-${day}T${hours}:${mins}`;
}

function appointmentsHandlePatientSearchKey(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    appointmentsPatientSearch();
  }
}

async function appointmentsPatientSearch() {
  const q = document.getElementById("appt_patient_search")?.value.trim() || "";
  const resultsWrap = document.getElementById("appt_patient_results");

  if (!q) {
    toast("Search", "Type something to search.", "err");
    return;
  }

  if (resultsWrap) {
    resultsWrap.innerHTML = "Searching patients...";
  }

  try {
    const data = await api(`api/shared/patients_search.php?search=${encodeURIComponent(q)}`);
    const patients = data.patients || [];

    appointmentsState.patientSearchResults = patients;

    if (!resultsWrap) return;

    if (!patients.length) {
      resultsWrap.innerHTML = `<div class="hint">No patients found.</div>`;
      return;
    }

    const rows = patients.map(p => `
  <tr>
    <td>${escapeHtml(String(p.Patient_ID || ""))}</td>
    <td>${escapeHtml(p.Last_Name || "")}, ${escapeHtml(p.First_Name || "")}</td>
    <td>${escapeHtml(p.Phone_Number || "")}</td>
    <td>${escapeHtml(p.Email || "")}</td>
    <td>${escapeHtml(p.Date_Of_Birth || "")}</td>
    <td>
      <button class="ghost" onclick="appointmentsSelectPatient(${Number(p.Patient_ID)})">Select</button>
    </td>
  </tr>
`).join("");;

    resultsWrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>DOB</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  } catch (err) {
    if (resultsWrap) {
      resultsWrap.innerHTML = `<div class="err">Failed to search patients.</div>`;
    }
    throw err;
  }
}

function appointmentsSelectPatient(patientId) {
  const patient = (appointmentsState.patientSearchResults || []).find(
    p => Number(p.Patient_ID) === Number(patientId)
  );

  if (!patient) {
    toast("Selection Error", "Could not load the selected patient.", "err");
    return;
  }

  appointmentsState.selectedPatient = patient;

  const selectedWrap = document.getElementById("appt_patient_selected");
  if (selectedWrap) {
    selectedWrap.innerHTML = `
  <div class="ok">
    Selected Patient: <strong>${escapeHtml(patient.First_Name || "")} ${escapeHtml(patient.Last_Name || "")}</strong>
    (ID: ${escapeHtml(String(patient.Patient_ID || ""))})
  </div>
`;
  }

  const resultsWrap = document.getElementById("appt_patient_results");
  if (resultsWrap) {
    resultsWrap.innerHTML = "";
  }
}

async function appointmentsCreate() {
  const selectedPatient = appointmentsState.selectedPatient;

  const payload = {
    patientId: selectedPatient ? Number(selectedPatient.Patient_ID) : 0,
    providerUserId: Number(document.getElementById("appt_provider_id")?.value || 0),
    startDateTime: document.getElementById("appt_start")?.value || "",
    endDateTime: document.getElementById("appt_end")?.value || ""
  };

  if (!payload.patientId) {
    toast("Missing Information", "Please search for and select a patient.", "err");
    return;
  }

  if (!payload.providerUserId || !payload.startDateTime || !payload.endDateTime) {
    toast("Missing Information", "Provider, start time, and end time are required.", "err");
    return;
  }

  const msg = document.getElementById("appt_msg");
  if (msg) msg.innerHTML = "Creating appointment...";

  try {
    const result = await api("api/shared/appointments_create.php", "POST", payload);

    if (msg) {
      msg.innerHTML = `<div class="ok">Appointment created successfully. Appointment ID: ${result.appointmentId}</div>`;
    }

    toast("Success", "Appointment created successfully.", "ok");
    appointmentsState.selectedPatient = null;
    await appointmentsLoadData();
    } catch (err) {
      let errorMessage = err?.error || "Failed to create appointment.";

      if (err?.error === "Appointment is outside clinic hours") {
        errorMessage = `Appointment is outside clinic hours. Clinic hours: ${err.clinicOpen?.slice(0,5) || "?"} - ${err.clinicClose?.slice(0,5) || "?"}`;
      } else if (err?.error === "Provider is not scheduled to work on that day") {
        errorMessage = "That provider is not scheduled to work on that day.";
      } else if (err?.error === "Appointment is outside provider schedule") {
        errorMessage = "That appointment falls outside the selected provider's schedule.";
      }

      if (msg) {
        msg.innerHTML = `<div class="err">${errorMessage}</div>`;
      }

      toast("Error", errorMessage, "err");
      throw err;
    }
}

async function appointmentsCancel(appointmentId) {
  const msg = document.getElementById("appt_edit_msg");
  if (msg) msg.innerHTML = "Cancelling appointment...";

  try {
    await api("api/shared/appointments_cancel.php", "POST", {
      appointmentId: Number(appointmentId)
    });

    if (msg) {
      msg.innerHTML = `<div class="ok">Appointment cancelled successfully.</div>`;
    }

    toast("Success", "Appointment cancelled successfully.", "ok");
    await appointmentsLoadData();
    appointmentsCloseModal();
  } catch (err) {
    if (msg) {
      msg.innerHTML = `<div class="err">Failed to cancel appointment.</div>`;
    }
    throw err;
  }
}

/* WEEK VIEW HELPER FUNCTION */

function appointmentsSetScope(scope) {
  appointmentsState.providerScope = scope;
  renderAppointmentsPage();
  appointmentsLoadData();
}

function appointmentsPrevPeriod() {
  const d = new Date(appointmentsState.selectedDate);

  if (appointmentsState.viewMode === "week") {
    d.setDate(d.getDate() - 7);
  } else {
    d.setDate(d.getDate() - 1);
  }

  appointmentsState.selectedDate = d;
  renderAppointmentsPage();
  appointmentsLoadData();
}

function appointmentsNextPeriod() {
  const d = new Date(appointmentsState.selectedDate);

  if (appointmentsState.viewMode === "week") {
    d.setDate(d.getDate() + 7);
  } else {
    d.setDate(d.getDate() + 1);
  }

  appointmentsState.selectedDate = d;
  renderAppointmentsPage();
  appointmentsLoadData();
}

function getStartOfWeek(dateObj) {
  const d = new Date(dateObj);
  const day = d.getDay(); // 0=Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(dateObj) {
  const start = getStartOfWeek(dateObj);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function formatAppointmentsWeekRange(dateObj) {
  const start = getStartOfWeek(dateObj);
  const end = getEndOfWeek(dateObj);

  const startText = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });

  const endText = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return `${startText} - ${endText}`;
}

function renderAppointmentsWeekGrid() {
  const scheduler = document.getElementById("appointments_scheduler");
  if (!scheduler) return;

  const start = getStartOfWeek(appointmentsState.selectedDate);
  const days = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }

  const appointments = appointmentsState.appointments || [];

  scheduler.innerHTML = `
    <div class="appt-week-grid">
      ${days.map(d => `
        <div class="appt-week-col">
          <div class="appt-week-head">
            <div>${d.toLocaleDateString("en-US", { weekday: "short" })}</div>
            <div>${d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}</div>
          </div>
          <div class="appt-week-body">
            ${renderAppointmentsForDay(d, appointments)}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderAppointmentsForDay(dayObj, appointments) {
  const dayStr = formatAppointmentsDateInput(dayObj);

  const dayAppointments = appointments
    .filter(a => {
      const apptDate = formatAppointmentsDateInput(
        new Date(String(a.Scheduled_Start).replace(" ", "T"))
      );
      return apptDate === dayStr;
    })
    .sort((a, b) =>
      new Date(String(a.Scheduled_Start).replace(" ", "T")) -
      new Date(String(b.Scheduled_Start).replace(" ", "T"))
    );

  if (!dayAppointments.length) {
    return `<div class="hint">No appointments</div>`;
  }

  return dayAppointments.map(appt => {
    const patientName = `${escapeHtml(appt.Patient_First || "")} ${escapeHtml(appt.Patient_Last || "")}`;
    const providerName = `${escapeHtml(appt.Provider_First || "")} ${escapeHtml(appt.Provider_Last || "")}`;
    const tone = appointmentsTone(appt.Status);
    const start = appointmentsFormatTimeLabel(appt.Scheduled_Start);
    const end = appointmentsFormatTimeLabel(appt.Scheduled_End);

    return `
  <div class="appt-week-card ${tone}" onclick="appointmentsView(${appt.Appointment_ID})">
    <div class="appt-patient">${patientName}</div>
    <div class="appt-duration">${start} - ${end}</div>
    ${appointmentsState.providerScope === "all" ? `
      <div class="appt-type">Dr. ${providerName}</div>
    ` : ""}
    <div class="appt-type">${appointmentsFormatStatusLabel(appt.Status)}</div>
  </div>
`;
  }).join("");
}