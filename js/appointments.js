let appointmentsState = {
    role: "",
    canCreate: false,
    canEdit: false,
    canCheckIn: false,
    providerScope: "all",
    providerId: null,
    selectedDate: new Date(),
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

    const prettyDate = formatAppointmentsLongDate(appointmentsState.selectedDate);

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
                <button class="ghost appt-nav-btn" onclick="appointmentsPrevDay()">&#8249;</button>
                <div class="appt-date-pill">${prettyDate}</div>
                <button class="ghost appt-nav-btn" onclick="appointmentsNextDay()">&#8250;</button>
                <button class="ghost" onclick="appointmentsToday()">Today</button>
            </div>

        <div class="appt-toolbar-right">
            <div class="appt-view-toggle">
                <button class="primary">Day</button>
                <button class="ghost" onclick="toast('Coming Soon', 'Week view is not built yet.', 'err')">Week</button>
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
        const day = formatAppointmentsDateInput(appointmentsState.selectedDate);

        const [providersRes, appointmentsRes] = await Promise.all([
        api("api/shared/providers_list.php"),
        api(`api/shared/appointments_list.php?from=${encodeURIComponent(day)}&to=${encodeURIComponent(day)}`)
    ]);

        appointmentsState.providers = providersRes.providers || [];
        appointmentsState.appointments = appointmentsRes.appointments || [];

        renderAppointmentsDayGrid();
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
            ? visibleProviders.map(p => `<div class="appt-head">Dr. ${p.Last_Name ? `${p.First_Name} ${p.Last_Name}` : p.First_Name}</div>`).join("")
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
            const patientName = `${appt.Patient_First} ${appt.Patient_Last}`;
            const tone = appointmentsTone(appt.Status);

            html += `
                <div class="appt-card ${tone}" onclick="appointmentsView(${appt.Appointment_ID})" style="cursor:pointer;">
                <div class="appt-patient">${patientName}</div>
                <div class="appt-type">${appt.Status}</div>
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

  const patientName = `${appt.Patient_First} ${appt.Patient_Last}`;
  const providerName = `Dr. ${appt.Provider_First} ${appt.Provider_Last}`;

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
                <option value="CHECKED_IN" ${appt.Status === "CHECKED_IN" ? "selected" : ""}>CHECKED_IN</option>
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
    if (msg) {
      msg.innerHTML = `<div class="err">Failed to update appointment.</div>`;
    }
    throw err;
  }
}

function appointmentsOpenNew() {
  const scheduler = document.getElementById("appointments_scheduler");
  if (!scheduler) return;

    appointmentsState.selectedPatient = null;
    appointmentsState.patientSearchResults = [];

  const providerOptions = (appointmentsState.providers || []).map(p =>
    `<option value="${p.User_ID}">Dr. ${p.First_Name} ${p.Last_Name}</option>`
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
          <input id="appt_start" type="datetime-local" value="${defaultDate}T09:00">
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
        <td>${p.Patient_ID}</td>
        <td>${p.First_Name} ${p.Last_Name}</td>
        <td>${p.Phone_Number || ""}</td>
        <td>${p.Email || ""}</td>
        <td>${p.Date_Of_Birth || ""}</td>
        <td>
          <button class="small primary" onclick="appointmentsSelectPatient(${p.Patient_ID})">
            Select
          </button>
        </td>
      </tr>
    `).join("");

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
        Selected Patient: <strong>${patient.First_Name} ${patient.Last_Name}</strong>
        (ID: ${patient.Patient_ID})
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
    if (msg) {
      msg.innerHTML = `<div class="err">Failed to create appointment.</div>`;
    }
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