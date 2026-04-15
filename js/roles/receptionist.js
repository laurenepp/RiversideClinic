// js/roles/receptionist.js

function loadReceptionist() {
  const content = document.getElementById("dash_view") || document.getElementById("content");
  content.innerHTML = `
    <div class="card">
      <h2>Receptionist Dashboard</h2>
      <p>Check in scheduled patients and complete checkout after the visit.</p>

      <div id="rx_tiles"></div>
      <div id="rx_next" style="margin-top:18px;"></div>
      <div id="rx_checkout" style="margin-top:18px;"></div>
      <div id="rx_panel" style="margin-top:18px;"></div>
      <div id="rx_modal_root"></div>
    </div>
  `;

  rx_loadTilesAndNext();
}

function receptionistFormatStatusLabel(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function rx_panel(html){
  const el = document.getElementById("rx_panel");
  if (el) el.innerHTML = html;
}

function rx_tile(label, value, sub, iconText, tone){
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

function rx_openModal(title, subtitle, bodyHtml, footerHtml = "") {
  const root = document.getElementById("rx_modal_root");
  if (!root) return;

  root.innerHTML = `
    <div class="appt-modal-backdrop" onclick="rx_closeModal()">
      <div class="appt-modal" onclick="event.stopPropagation()">
        <div class="appt-modal-header">
          <div>
            <h3>${title}</h3>
            ${subtitle ? `<div class="appt-modal-sub">${subtitle}</div>` : ""}
          </div>
          <button class="ghost" onclick="rx_closeModal()">Close</button>
        </div>

        <div class="appt-modal-body">
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

function rx_closeModal() {
  const root = document.getElementById("rx_modal_root");
  if (root) root.innerHTML = "";
}

async function rx_loadTilesAndNext(){
  const tilesWrap = document.getElementById("rx_tiles");
  const nextWrap  = document.getElementById("rx_next");
  const checkoutWrap = document.getElementById("rx_checkout");

  if (!tilesWrap || !nextWrap || !checkoutWrap) return;

  tilesWrap.innerHTML = `<div style="margin-top:12px; color: var(--muted); font-weight:700;">Loading front desk…</div>`;
  nextWrap.innerHTML  = "";
  checkoutWrap.innerHTML = "";

  const d = await api("api/receptionist/dashboard_summary.php");

  tilesWrap.innerHTML = `
    <div class="tiles">
      ${rx_tile("Patients (Total)", d.totalPatients ?? 0, `Clinic registry`, "P", "sage")}
      ${rx_tile("Appointments Today", d.appointmentsToday ?? 0, `All statuses`, "C", "gold")}
      ${rx_tile("Scheduled Today", d.scheduledToday ?? 0, `Needs check-in`, "S", "teal")}
      ${rx_tile("Checked-In Today", d.checkedInToday ?? 0, `Waiting for nurse`, "&#10003;", "dark")}
      ${rx_tile("Ready for Provider", d.readyToday ?? 0, `Waiting for doctor`, "R", "sage")}
      ${rx_tile("Completed Today", d.completedToday ?? 0, `Ready to bill`, "$", "teal")}
    </div>
  `;

  const scheduledRows = (d.scheduledQueue || []).map(a => `
  <tr>
    <td>${escapeHtml(fmtDT(a.Scheduled_Start) || "")}</td>
    <td>${escapeHtml(a.Patient_Last || "")}, ${escapeHtml(a.Patient_First || "")}</td>
    <td>${escapeHtml(a.Date_Of_Birth || "")}</td>
    <td>Dr. ${escapeHtml(a.Provider_Last || "")}</td>
    <td><span class="${badgeClass(a.Status)}">${escapeHtml(receptionistFormatStatusLabel(a.Status || ""))}</span></td>
    <td><button class="small gold" onclick="rx_openCheckIn(${Number(a.Appointment_ID)})">Check In</button></td>
  </tr>
`).join("");

  nextWrap.innerHTML = `
    <div class="section">
      <div class="section-title">
        <h3>Receptionist Queue</h3>
        <div class="tools">
          <button class="admin-create-submit" type="button" onclick="rx_loadTilesAndNext()">Refresh</button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Start</th><th>Patient</th><th>DOB</th><th>Provider</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${scheduledRows || `<tr><td colspan="6">No scheduled patients for today.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  const completedRows = (d.checkoutQueue || []).map(a => `
  <tr>
    <td>${escapeHtml(fmtDT(a.Scheduled_Start) || "")}</td>
    <td>${escapeHtml(a.Patient_Last || "")}, ${escapeHtml(a.Patient_First || "")}</td>
    <td>Dr. ${escapeHtml(a.Provider_Last || "")}</td>
    <td><span class="${badgeClass(a.Status)}">${escapeHtml(receptionistFormatStatusLabel(a.Status || ""))}</span></td>
    <td><button class="small admin-create-submit" onclick="rx_billAndReschedule(${Number(a.Appointment_ID)})">Bill / Reschedule</button></td>
  </tr>
`).join("");

  checkoutWrap.innerHTML = `
    <div class="section">
      <div class="section-title">
        <h3>Checkout Queue</h3>
        <div class="tools"></div>
      </div>
      <table>
        <thead><tr><th>Visit</th><th>Patient</th><th>Provider</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${completedRows || `<tr><td colspan="5">No completed patients waiting on checkout.</td></tr>`}</tbody>
      </table>
    </div>
  `;
}

function receptionistAppointments() {
  loadAppointmentsPage({
    role: "receptionist",
    canCreate: true,
    canEdit: true,
    canCheckIn: true,
    providerScope: "all",
    allowScopeToggle: false
  });
}

async function rx_openCheckIn(appointmentId) {
  try {
    const data = await api(`api/receptionist/patients_checkin_get.php?appointmentId=${appointmentId}`);

    const a = data.appointment || {};
    const ins = data.insurance || {};

    const patientId = a.Patient_ID || 0;
    const patientName = `${a.Last_Name || ""}, ${a.First_Name || ""}`.trim().replace(/^,\s*/, "") || "Patient";
    const dob = a.Date_Of_Birth || "";
    const phone = a.Phone_Number || "";

    const addressLine1 = a.Address_Line1 || "";
    const addressLine2 = a.Address_Line2 || "";
    const city = a.City || "";
    const state = a.State || "";
    const postalCode = a.Postal_Code || "";

    const insuranceProvider = ins.Insurance_Provider || "";
    const policyNumber = ins.Policy_Number || "";
    const policyHolder = ins.Policy_Holder || "";

    rx_openModal(
      "Check In Patient",
      `${escapeHtml(patientName)}${dob ? ` • DOB: ${escapeHtml(dob)}` : ""}`,
      `
        <input id="rx_patient_id" type="hidden" value="${escapeHtml(String(patientId || ""))}">

        <div class="form-grid">
          <div class="field" style="grid-column:1 / -1;">
            <label>Full Name</label>
            <input type="text" value="${escapeHtml(patientName)}" disabled>
          </div>

          <div class="field">
            <label>Date of Birth</label>
            <input type="text" value="${escapeHtml(dob)}" disabled>
          </div>

          <div class="field">
            <label>Phone Number</label>
            <input id="rx_phone" type="text" value="${escapeHtml(phone)}">
          </div>

          <div class="field" style="grid-column:1 / -1;">
            <label>Address Line 1</label>
            <input id="rx_address1" type="text" value="${escapeHtml(addressLine1)}">
          </div>

          <div class="field" style="grid-column:1 / -1;">
            <label>Address Line 2</label>
            <input id="rx_address2" type="text" value="${escapeHtml(addressLine2)}">
          </div>

          <div class="field">
            <label>City</label>
            <input id="rx_city" type="text" value="${escapeHtml(city)}">
          </div>

          <div class="field">
            <label>State</label>
            <input id="rx_state" type="text" value="${escapeHtml(state)}">
          </div>

          <div class="field">
            <label>Postal Code</label>
            <input id="rx_postal" type="text" value="${escapeHtml(postalCode)}">
          </div>

          <div class="field">
            <label>Insurance Provider</label>
            <input id="rx_insurance_provider" type="text" value="${escapeHtml(insuranceProvider)}">
          </div>

          <div class="field">
            <label>Policy Number</label>
            <input id="rx_policy_number" type="text" value="${escapeHtml(policyNumber)}">
          </div>

          <div class="field" style="grid-column:1 / -1;">
            <label>Policy Holder</label>
            <input id="rx_policy_holder" type="text" value="${escapeHtml(policyHolder)}">
          </div>
        </div>

        <div id="rx_checkin_msg" style="margin-top:10px;"></div>
      `,
      `
        <button class="admin-create-submit" onclick="rx_closeModal()">Close</button>
        <button class="admin-create-submit" onclick="rx_saveCheckIn(${appointmentId})">Check In Patient</button>
      `
    );
  } catch (err) {
    toast("Error", err.message || "Unable to load check-in form.", "error");
  }
}

async function rx_saveCheckIn(appointmentId) {
  const payload = {
    appointmentId: appointmentId,
    patientId: parseInt(document.getElementById("rx_patient_id")?.value || "0", 10),
    addressLine1: document.getElementById("rx_address1")?.value?.trim() || "",
    addressLine2: document.getElementById("rx_address2")?.value?.trim() || "",
    city: document.getElementById("rx_city")?.value?.trim() || "",
    state: document.getElementById("rx_state")?.value?.trim() || "",
    postalCode: document.getElementById("rx_postal")?.value?.trim() || "",
    phoneNumber: document.getElementById("rx_phone")?.value?.trim() || "",
    insuranceProvider: document.getElementById("rx_insurance_provider")?.value?.trim() || "",
    policyNumber: document.getElementById("rx_policy_number")?.value?.trim() || "",
    policyHolder: document.getElementById("rx_policy_holder")?.value?.trim() || ""
  };

  try {
    await api("api/receptionist/patient_checkin_save.php", "POST", payload);
    toast("Checked In", "Patient checked in successfully.", "ok");
    rx_closeModal();
    rx_loadTilesAndNext();
  } catch (err) {
    const msg = document.getElementById("rx_checkin_msg");
    if (msg) {
      msg.innerHTML = `<div class="alert error">${err.message || "Unable to check in patient."}</div>`;
    } else {
      toast("Error", err.message || "Unable to check in patient.", "error");
    }
  }
}

async function rx_billAndReschedule(appointmentId) {
  rx_openModal(
    "Bill and Reschedule",
    `Appointment #${appointmentId}`,
    `
      <div class="form-grid">
        <div class="field">
          <label>Billing Amount</label>
          <input id="rx_bill_amount" type="number" step="0.01" value="0.00">
        </div>

        <div class="field">
          <label>Billing Status</label>
          <select id="rx_bill_status">
            <option value="UNPAID">UNPAID</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>

        <div class="field">
          <label>Next Appointment Start</label>
          <input id="rx_next_start" type="datetime-local">
        </div>

        <div class="field">
          <label>Next Appointment End</label>
          <input id="rx_next_end" type="datetime-local">
        </div>
      </div>

      <div id="rx_checkout_msg" style="margin-top:10px;"></div>
    `,
    `
      <button class="ghost" onclick="rx_closeModal()">Close</button>
      <button class="primary" onclick="rx_saveBillReschedule(${appointmentId})">
        Save Billing and Schedule Next Visit
      </button>
    `
  );
}

async function rx_saveBillReschedule(appointmentId) {
  const startRaw = document.getElementById("rx_next_start")?.value || "";
  const endRaw = document.getElementById("rx_next_end")?.value || "";
  const msg = document.getElementById("rx_checkout_msg");

  const payload = {
    appointmentId,
    amount: document.getElementById("rx_bill_amount")?.value || "0.00",
    billingStatus: document.getElementById("rx_bill_status")?.value || "UNPAID",
    nextStart: startRaw ? startRaw.replace("T", " ") + ":00" : "",
    nextEnd: endRaw ? endRaw.replace("T", " ") + ":00" : ""
  };

  // 🔴 Validate before sending
  if (!startRaw || !endRaw) {
    if (msg) {
      msg.innerHTML = `<div class="alert error">Next appointment start and end are required.</div>`;
    }
    return;
  }

  if (msg) {
    msg.innerHTML = `<div class="hint">Saving checkout...</div>`;
  }

  try {
    const result = await api("api/receptionist/billing_reschedule_save.php", "POST", payload);

    //  SUCCESS MESSAGE (THIS IS YOUR UPGRADE)
    if (msg) {
      msg.innerHTML = `
        <div class="alert success">
          <strong>Success:</strong> Billing saved and next appointment scheduled.
          <div style="margin-top:6px;">
            New Appointment ID: <strong>${result.nextAppointmentId}</strong>
          </div>
        </div>
      `;
    }

    //  Toast popup
    toast(
      "Checkout Complete",
      `Patient billed and next appointment #${result.nextAppointmentId} created.`,
      "ok"
    );

    //  Let user SEE success before closing
    setTimeout(() => {
      rx_closeModal();
      rx_loadTilesAndNext();

      if (typeof appointmentsLoadData === "function") {
        appointmentsLoadData();
      }
    }, 1200);

  } catch (err) {
    const errorText = err?.message || err?.error || "Unable to bill and reschedule patient.";

    if (msg) {
      msg.innerHTML = `<div class="alert error">${errorText}</div>`;
    }

    toast("Error", errorText, "error");
  }
}

function loadReceptionistPatientCreate() {
  const content = document.getElementById("dash_view") || document.getElementById("content");
  content.innerHTML = `
    <div class="card">
      <h2>Register Patient</h2>
      <p>Create a new patient record.</p>
      <div id="rx_panel" style="margin-top:18px;"></div>
    </div>
  `;

  rx_showPatientCreate();
}

function rx_showPatientCreate() {
  rx_openModal(
    "Register Patient",
    "Create a new patient record.",
    `
    <div class="form-grid">
      <div class="field">
        <label>First Name</label>
        <input id="p_first" placeholder="First Name">
      </div>

      <div class="field">
        <label>Last Name</label>
        <input id="p_last" placeholder="Last Name">
      </div>

      <div class="field">
        <label>Phone</label>
        <input id="p_phone" placeholder="Phone">
      </div>

      <div class="field">
        <label>Email</label>
        <input id="p_email" placeholder="Email (optional)">
      </div>

      <div class="field">
        <label>Date of Birth</label>
        <input id="p_dob" type="date">
      </div>
    </div>

    <div style="margin-top:16px;">
      <strong>Emergency Contact</strong>
      <div class="form-grid" style="margin-top:10px;">
        <input id="ec_first" placeholder="First Name">
        <input id="ec_last" placeholder="Last Name">
        <input id="ec_phone" placeholder="Phone">
        <input id="ec_relationship" placeholder="Relationship">
      </div>
    </div>

    <div style="margin-top:16px;">
      <strong>Insurance Information</strong>
      <div class="form-grid" style="margin-top:10px;">
        <input id="ins_provider" placeholder="Provider">
        <input id="ins_policy_number" placeholder="Policy Number">
        <input id="ins_policy_holder" placeholder="Policy Holder">
      </div>
    </div>

    <div id="rx_msg" style="margin-top:10px;"></div>
    `,
    `
      <button class="ghost" onclick="rx_closeModal()">Cancel</button>
      <button class="admin-create-submit" onclick="rx_createPatient()">Register Patient</button>
    `
  );
}

function rx_showPatientSearchInfo() {
  const existing = document.getElementById("rxPatientInfoModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "rxPatientInfoModal";
  modal.innerHTML = `
    <div
      style="
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 24px;
      "
    >
      <div
        style="
          background: #ffffff;
          width: 100%;
          max-width: 980px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 18px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
          padding: 24px;
        "
      >
        <div class="card-header">
          <h3>Search Patient Info</h3>
          <p>Search by patient name and date of birth, review demographics, save updates, or create an appointment.</p>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="rx_search_info_name">Patient Name</label>
            <input
              type="text"
              id="rx_search_info_name"
              class="input"
              placeholder="Enter first or last name"
            />
          </div>

          <div class="form-group">
            <label for="rx_search_info_dob">Date of Birth</label>
            <input
              type="date"
              id="rx_search_info_dob"
              class="input"
            />
          </div>
        </div>

        <div class="form-actions" style="margin-top:16px;">
          <button class="admin-create-submit" onclick="rx_runPatientSearchInfo()">Search</button>
          <button class="small gold" onclick="rx_closePatientSearchInfoModal()">Close</button>
        </div>

        <div id="rx_search_info_msg" style="margin-top:16px;"></div>
        <div id="rx_search_info_results" style="margin-top:16px;"></div>

        <div id="rx_patient_info_editor" style="display:none; margin-top:24px;">
          <h3>Patient Demographics</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="rx_info_first_name">First Name</label>
              <input type="text" id="rx_info_first_name" class="input" />
            </div>

            <div class="form-group">
              <label for="rx_info_last_name">Last Name</label>
              <input type="text" id="rx_info_last_name" class="input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="rx_info_phone">Phone</label>
              <input type="text" id="rx_info_phone" class="input" />
            </div>

            <div class="form-group">
              <label for="rx_info_email">Email</label>
              <input type="text" id="rx_info_email" class="input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="rx_info_dob">Date of Birth</label>
              <input type="date" id="rx_info_dob" class="input" />
            </div>

            <div class="form-group">
              <label for="rx_info_address1">Address Line 1</label>
              <input type="text" id="rx_info_address1" class="input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="rx_info_address2">Address Line 2</label>
              <input type="text" id="rx_info_address2" class="input" />
            </div>

            <div class="form-group">
              <label for="rx_info_city">City</label>
              <input type="text" id="rx_info_city" class="input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="rx_info_state">State</label>
              <input type="text" id="rx_info_state" class="input" />
            </div>

            <div class="form-group">
              <label for="rx_info_postal">Postal Code</label>
              <input type="text" id="rx_info_postal" class="input" />
            </div>
          </div>

          <input type="hidden" id="rx_info_patient_id" />

          <div id="rx_patient_info_save_msg" style="margin-top:16px;"></div>

          <div class="form-actions" style="margin-top:20px;">
            <button class="admin-create-submit" onclick="rx_savePatientInfo()">Save Changes</button>
            <button class="admin-create-submit" onclick="rx_createAppointmentFromPatientInfo()">Create Appointment</button>
            <button class="small gold" onclick="rx_closePatientSearchInfoModal()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

async function rx_runPatientSearchInfo() {
  const rawName = document.getElementById("rx_search_info_name")?.value.trim() || "";
  const dob = document.getElementById("rx_search_info_dob")?.value || "";

  const msg = document.getElementById("rx_search_info_msg");
  const results = document.getElementById("rx_search_info_results");

  if (msg) msg.innerHTML = "";
  if (results) results.innerHTML = "";

  if (!rawName && !dob) {
    if (msg) {
      msg.innerHTML = `<p style="color:red;">Enter a patient name or date of birth to search.</p>`;
    }
    return;
  }

  if (!rawName && dob) {
    if (msg) {
      msg.innerHTML = `<p style="color:red;">Please enter at least a first or last name. Date of birth is used as a filter after name search.</p>`;
    }
    return;
  }

  try {
    const terms = rawName.split(/\s+/).filter(Boolean);
    const queries = terms.length ? terms : [rawName];

    const patientMap = new Map();

    for (const q of queries) {
      const data = await api(`api/receptionist/patients_search.php?search=${encodeURIComponent(q)}`);
      const list = Array.isArray(data?.patients) ? data.patients : [];

      list.forEach(p => {
        const id = Number(p.Patient_ID || 0);
        if (id > 0 && !patientMap.has(id)) {
          patientMap.set(id, p);
        }
      });
    }

    let patients = Array.from(patientMap.values());

    if (dob) {
      patients = patients.filter(p => (p.Date_Of_Birth || "") === dob);
    }

    if (!patients.length) {
      if (msg) {
        msg.innerHTML = `<p>No patients found.</p>`;
      }
      return;
    }

    const rows = patients.map(p => {
  const fullName = `${p.Last_Name || ""}, ${p.First_Name || ""}`.replace(/^,\s*|\s*,\s*$/g, "");
  const patientId = Number(p.Patient_ID || 0);

  return `
    <tr>
      <td>${escapeHtml(fullName)}</td>
      <td>${escapeHtml(p.Date_Of_Birth || "")}</td>
      <td>${escapeHtml(p.Phone_Number || "")}</td>
      <td>
        <button class="small admin-create-submit" onclick="rx_loadPatientInfo(${patientId})">
          Select
        </button>
      </td>
    </tr>
  `;
}).join("");

    results.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>DOB</th>
            <th>Phone</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error(err);
    if (msg) {
      msg.innerHTML = `<p style="color:red;">${err.message || "Unable to search patients."}</p>`;
    }
  }
}

function rx_closePatientSearchInfoModal() {
  const modal = document.getElementById("rxPatientInfoModal");
  if (modal) modal.remove();
}

async function rx_loadPatientInfo(patientId) {
  const msg = document.getElementById("rx_search_info_msg");
  const saveMsg = document.getElementById("rx_patient_info_save_msg");
  const editor = document.getElementById("rx_patient_info_editor");

  if (msg) msg.innerHTML = "";
  if (saveMsg) saveMsg.innerHTML = "";

  try {
    const data = await api(`api/receptionist/patient_info_get.php?patientId=${encodeURIComponent(patientId)}`);

    const patient = data?.patient || null;
    if (!patient) {
      if (msg) {
        msg.innerHTML = `<p style="color:red;">Patient details could not be loaded.</p>`;
      }
      return;
    }

    const setVal = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value ?? "";
    };

    setVal("rx_info_patient_id", patient.Patient_ID);
    setVal("rx_info_first_name", patient.First_Name);
    setVal("rx_info_last_name", patient.Last_Name);
    setVal("rx_info_phone", patient.Phone_Number);
    setVal("rx_info_email", patient.Email);
    setVal("rx_info_dob", patient.Date_Of_Birth);
    setVal("rx_info_address1", patient.Address_Line1);
    setVal("rx_info_address2", patient.Address_Line2);
    setVal("rx_info_city", patient.City);
    setVal("rx_info_state", patient.State);
    setVal("rx_info_postal", patient.Postal_Code);

    if (editor) {
      editor.style.display = "block";
      editor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (err) {
    console.error(err);
    if (msg) {
      msg.innerHTML = `<p style="color:red;">${err.message || "Unable to load patient details."}</p>`;
    }
  }
}

async function rx_savePatientInfo() {
  const saveMsg = document.getElementById("rx_patient_info_save_msg");
  if (saveMsg) saveMsg.innerHTML = "";

  const getVal = (id) => document.getElementById(id)?.value?.trim() || "";

  const payload = {
    patientId: Number(document.getElementById("rx_info_patient_id")?.value || 0),
    firstName: getVal("rx_info_first_name"),
    lastName: getVal("rx_info_last_name"),
    phone: getVal("rx_info_phone"),
    email: getVal("rx_info_email"),
    dob: document.getElementById("rx_info_dob")?.value || ""
  };

  if (!payload.patientId || !payload.firstName || !payload.lastName || !payload.phone || !payload.dob) {
    if (saveMsg) {
      saveMsg.innerHTML = `<p style="color:red;">First name, last name, phone, and date of birth are required.</p>`;
    }
    return;
  }

  try {
    const result = await api("api/receptionist/patients_update.php", "POST", payload);

    if (saveMsg) {
      saveMsg.innerHTML = `<p style="color:green;">Patient information updated successfully.</p>`;
    }

    return result;
  } catch (err) {
    console.error(err);
    if (saveMsg) {
      saveMsg.innerHTML = `<p style="color:red;">${err.message || "Unable to save patient information."}</p>`;
    }
  }
}

function rx_createAppointmentFromPatientInfo() {
  const patientId = Number(document.getElementById("rx_info_patient_id")?.value || 0);
  const first = document.getElementById("rx_info_first_name")?.value || "";
  const last = document.getElementById("rx_info_last_name")?.value || "";

  if (!patientId) {
    alert("No patient selected.");
    return;
  }

  // Close the modal first
  rx_closePatientSearchInfoModal();

  // Open your existing appointment page
  receptionistAppointments();

  // Small delay to let the page render
  setTimeout(() => {
    if (typeof appointmentsOpenCreate === "function") {
      appointmentsOpenCreate({
        patientId: patientId,
        patientName: `${last}, ${first}`
      });
    }
  }, 200);
}

function rx_showPatientSearch(){
  rx_panel(`
    <div class="section-title">
      <h3>Search Patients</h3>
      <div class="tools">
        <button class="admin-create-submit" onclick="rx_panel('')">Close</button>
      </div>
    </div>

    <div class="row compact">
      <div class="field">
        <label>Search</label>
        <input id="rx_search" placeholder="Name / phone / email">
      </div>
      <div style="align-self:end;">
        <button class="admin-create-submit" onclick="rx_patientSearch()">Search</button>
      </div>
    </div>

    <div id="rx_results" style="margin-top:12px;"></div>
  `);
}

async function rx_patientSearch(){
  const q = document.getElementById("rx_search").value.trim();
  if(!q){
    toast("Search", "Type something to search.", "err");
    return;
  }

  const data = await api(`api/receptionist/patients_search.php?search=${encodeURIComponent(q)}`);

  const rows = data.patients.map(p => `
  <tr>
    <td>${escapeHtml(String(p.Patient_ID || ""))}</td>
    <td>${escapeHtml(p.Last_Name || "")}, ${escapeHtml(p.First_Name || "")}</td>
    <td>${escapeHtml(p.Phone_Number || "")}</td>
    <td>${escapeHtml(p.Email || "")}</td>
    <td>${escapeHtml(p.Date_Of_Birth || "")}</td>
    <td><button class="small admin-create-submit" onclick='rx_editPatient(${JSON.stringify(p)})'>Edit</button></td>
  </tr>
`).join("");

  document.getElementById("rx_results").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>DOB</th><th></th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="6">No results</td></tr>`}</tbody>
    </table>
  `;
}

async function rx_createPatient() {
  const payload = {
    firstName: document.getElementById("p_first")?.value.trim() || "",
    lastName: document.getElementById("p_last")?.value.trim() || "",
    phone: document.getElementById("p_phone")?.value.trim() || "",
    email: document.getElementById("p_email")?.value.trim() || "",
    dob: document.getElementById("p_dob")?.value || "",

    emergencyFirstName: document.getElementById("ec_first")?.value.trim() || "",
    emergencyLastName: document.getElementById("ec_last")?.value.trim() || "",
    emergencyPhone: document.getElementById("ec_phone")?.value.trim() || "",
    emergencyRelationship: document.getElementById("ec_relationship")?.value.trim() || "",

    insuranceProvider: document.getElementById("ins_provider")?.value.trim() || "",
    insurancePolicyNumber: document.getElementById("ins_policy_number")?.value.trim() || "",
    insurancePolicyHolder: document.getElementById("ins_policy_holder")?.value.trim() || ""
  };

  if (!payload.firstName || !payload.lastName || !payload.dob) {
    toast("Missing Information", "First name, last name, and date of birth are required.", "err");
    return;
  }

  const msg = document.getElementById("rx_msg");
  if (msg) msg.innerHTML = "Creating patient...";

  try {
    const result = await api("api/receptionist/patients_create.php", "POST", payload);

    if (msg) {
      msg.innerHTML = `<div class="ok">Patient created successfully. Patient ID: ${result.patientId}</div>`;
    }

    toast("Success", "Patient registered successfully.", "ok");
  } catch (err) {
    if (msg) {
      msg.innerHTML = `<div class="err">Failed to register patient.</div>`;
    }
    throw err;
  }
}