// js/roles/receptionist.js

function loadReception(){
  const content = document.getElementById("dash_view") || document.getElementById("content");
  content.innerHTML = `
    <div class="card">
      <h2>Receptionist - Front Desk</h2>
      <p>Patients + Appointments</p>

      <div id="rx_tiles"></div>

      <div class="section">
        <div class="section-title">
          <h3>Quick Actions</h3>
          <div class="tools">
            <button class="primary" onclick="rx_showPatientSearch()">Search Patients</button>
            <button class="secondary" onclick="rx_showPatientCreate()">Register Patient</button>
            <button class="ghost" onclick="rx_showAppointmentBoard()">Appointments Board</button>
          </div>
        </div>
      </div>

      <div id="rx_next"></div>
      <div id="rx_panel" style="margin-top:18px;"></div>
    </div>
  `;

  rx_loadTilesAndNext();
}

function rx_panel(html){
  document.getElementById("rx_panel").innerHTML = html;
}

async function rx_loadTilesAndNext(){
  const tilesWrap = document.getElementById("rx_tiles");
  const nextWrap  = document.getElementById("rx_next");

  tilesWrap.innerHTML = `<div style="margin-top:12px; color: var(--muted); font-weight:700;">Loading front desk…</div>`;
  nextWrap.innerHTML  = "";

  const d = await api("api/receptionist/dashboard_summary.php");

  tilesWrap.innerHTML = `
    <div class="tiles">
      ${rx_tile("Patients (Total)", d.totalPatients, `Clinic registry`, "P", "sage")}
      ${rx_tile("Appointments Today", d.appointmentsToday, `All statuses`, "C", "gold")}
      ${rx_tile("Scheduled Today", d.scheduledToday, `Upcoming visits`, "S", "teal")}
      ${rx_tile("Checked-In Today", d.checkedInToday, `Waiting/arrived`, "\u2713", "dark")}
      ${rx_tile("Completed Today", d.completedToday, `Finished`, "\u2713", "teal")}
      ${rx_tile("Cancelled Today", d.cancelledToday, `Cancelled`, "\u2715", "gold")}
    </div>
  `;

  const rows = (d.nextUp || []).map(a => `
    <tr>
      <td>${fmtDT(a.Scheduled_Start)}</td>
      <td>${a.Patient_Last}, ${a.Patient_First}</td>
      <td>Dr. ${a.Provider_Last}</td>
      <td><span class="${badgeClass(a.Status)}">${a.Status}</span></td>
      <td>
        <button class="small gold" onclick="rx_checkin(${a.Appointment_ID})">Check-In</button>
      </td>
    </tr>
  `).join("");

  nextWrap.innerHTML = `
    <div class="section">
      <div class="section-title">
        <h3>Next Up</h3>
        <div class="tools">
          <button class="ghost" onclick="rx_loadTilesAndNext()">Refresh</button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Start</th><th>Patient</th><th>Provider</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="5">No upcoming appointments today.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
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

/* -------------------------
   PATIENTS
------------------------- */

function rx_showPatientSearch(){
  rx_panel(`
    <div class="section-title">
      <h3>Search Patients</h3>
      <div class="tools">
        <button class="ghost" onclick="rx_panel('')">Close</button>
      </div>
    </div>

    <div class="row compact">
      <div class="field">
        <label>Search</label>
        <input id="rx_search" placeholder="Name / phone / email">
      </div>
      <div style="align-self:end;">
        <button class="primary" onclick="rx_patientSearch()">Search</button>
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
      <td>${p.Patient_ID}</td>
      <td>${p.Last_Name}, ${p.First_Name}</td>
      <td>${p.Phone_Number}</td>
      <td>${p.Email ?? ""}</td>
      <td>${p.Date_Of_Birth}</td>
      <td><button class="small" onclick='rx_editPatient(${JSON.stringify(p)})'>Edit</button></td>
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

function rx_showPatientCreate() {
  rx_panel(`
    <div class="section-title">
      <h3>Register Patient</h3>
      <div class="tools">
        <button class="ghost" onclick="rx_panel('')">Close</button>
      </div>
    </div>

    <div class="section">
      <h3>Patient Information</h3>
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
          <div class="hint">Required</div>
        </div>
      </div>
    </div>

    <div class="section" style="margin-top:18px;">
      <details open>
        <summary><strong>Emergency Contact</strong></summary>

        <div class="form-grid" style="margin-top:10px;">
          <div class="field">
            <label>First Name</label>
            <input id="ec_first" placeholder="Emergency Contact First Name">
          </div>
          <div class="field">
            <label>Last Name</label>
            <input id="ec_last" placeholder="Emergency Contact Last Name">
          </div>
          <div class="field">
            <label>Phone</label>
            <input id="ec_phone" placeholder="Emergency Contact Phone">
          </div>
          <div class="field">
            <label>Relationship</label>
            <input id="ec_relationship" placeholder="Relationship to Patient">
          </div>
        </div>

        <div class="hint">Recommended for intake.</div>
      </details>
    </div>

    <div class="section" style="margin-top:18px;">
      <details>
        <summary><strong>Insurance Information</strong></summary>

        <div class="form-grid" style="margin-top:10px;">
          <div class="field">
            <label>Insurance Provider</label>
            <input id="ins_provider" placeholder="Insurance Provider">
          </div>

          <div class="field">
            <label>Payment Status</label>
            <select id="ins_status">
              <option value="">Select status</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="DENIED">DENIED</option>
            </select>
          </div>

          <div class="field">
            <label>Date Sent</label>
            <input id="ins_date_sent" type="date">
          </div>
        </div>

        <div class="hint">Optional for first version.</div>
      </details>
    </div>

    <div class="row" style="margin-top:12px;">
      <button class="primary" onclick="rx_createPatient()">Create Patient</button>
    </div>

    <div id="rx_msg" style="margin-top:10px;"></div>
  `);
}
async function rx_createPatient(){
  const firstName = document.getElementById("p_first").value.trim();
  const lastName  = document.getElementById("p_last").value.trim();
  const phone     = document.getElementById("p_phone").value.trim();
  const email     = document.getElementById("p_email").value.trim();
  const dob       = document.getElementById("p_dob").value;

  const emergencyFirstName = document.getElementById("ec_first").value.trim();
  const emergencyLastName  = document.getElementById("ec_last").value.trim();
  const emergencyPhone     = document.getElementById("ec_phone").value.trim();
  const emergencyRelationship = document.getElementById("ec_relationship").value.trim();

  const insuranceProvider = document.getElementById("ins_provider").value.trim();
  const insuranceStatus   = document.getElementById("ins_status").value;
  const insuranceDateSent = document.getElementById("ins_date_sent").value;

  const res = await api("api/receptionist/patients_create.php", "POST", {
    firstName,
    lastName,
    phone,
    email,
    dob,
    emergencyFirstName,
    emergencyLastName,
    emergencyPhone,
    emergencyRelationship,
    insuranceProvider,
    insuranceStatus,
    insuranceDateSent
  });

  toast("Patient created", `Patient ID ${res.patientId}`, "ok");

  document.getElementById("rx_msg").innerHTML = `
    <span class="badge teal">Created Patient ID: ${res.patientId}</span>
  `;

  await rx_loadTilesAndNext();
}
function rx_editPatient(p){
  rx_panel(`
    <div class="section-title">
      <h3>Edit Patient #${p.Patient_ID}</h3>
      <div class="tools">
        <button class="ghost" onclick="rx_showPatientSearch()">Back</button>
      </div>
    </div>

    <div class="form-grid">
      <div class="field"><label>First Name</label><input id="e_first" value="${p.First_Name}"></div>
      <div class="field"><label>Last Name</label><input id="e_last" value="${p.Last_Name}"></div>
      <div class="field"><label>Phone</label><input id="e_phone" value="${p.Phone_Number}"></div>
      <div class="field"><label>Email</label><input id="e_email" value="${p.Email ?? ""}"></div>
      <div class="field"><label>Date of Birth</label><input id="e_dob" type="date" value="${p.Date_Of_Birth}"></div>
    </div>

    <div class="row" style="margin-top:12px;">
      <button class="primary" onclick="rx_updatePatient(${p.Patient_ID})">Save</button>
    </div>

    <div id="rx_msg" style="margin-top:10px;"></div>
  `);
}

async function rx_updatePatient(patientId){
  const firstName = document.getElementById("e_first").value.trim();
  const lastName  = document.getElementById("e_last").value.trim();
  const phone     = document.getElementById("e_phone").value.trim();
  const email     = document.getElementById("e_email").value.trim();
  const dob       = document.getElementById("e_dob").value;

  await api("api/receptionist/patients_update.php","POST",{patientId,firstName,lastName,phone,email,dob});
  toast("Saved", "Patient updated", "ok");
  document.getElementById("rx_msg").innerHTML = `<span class="badge teal">Saved</span>`;
  await rx_loadTilesAndNext();
}

/* -------------------------
   APPOINTMENTS
------------------------- */

async function rx_showAppointmentBoard(){
  const today = new Date().toISOString().slice(0,10);

  rx_panel(`
    <div class="section-title">
      <h3>Appointments Board</h3>
      <div class="tools">
        <button class="primary" onclick="rx_showAppointmentCreate()">Schedule New</button>
        <button class="ghost" onclick="rx_loadAppointments()">Refresh</button>
      </div>
    </div>

    <div class="row compact">
      <div class="field"><label>From</label><input id="a_from" type="date" value="${today}"></div>
      <div class="field"><label>To</label><input id="a_to" type="date" value="${today}"></div>
      <div style="align-self:end;">
        <button class="secondary" onclick="rx_loadAppointments()">Load</button>
      </div>
    </div>

    <div id="rx_appts" style="margin-top:12px;"></div>
  `);

  await rx_loadAppointments();
}

async function rx_loadAppointments(){
  const from = document.getElementById("a_from").value;
  const to   = document.getElementById("a_to").value;

  const data = await api(`api/receptionist/appointments_list.php?from=${from}&to=${to}`);

  const rows = data.appointments.map(a => `
    <tr>
      <td>${a.Appointment_ID}</td>
      <td>${fmtDT(a.Scheduled_Start)}</td>
      <td>${fmtDT(a.Scheduled_End)}</td>
      <td><span class="${badgeClass(a.Status)}">${a.Status}</span></td>
      <td>${a.Patient_Last}, ${a.Patient_First}</td>
      <td>Dr. ${a.Provider_Last}</td>
      <td>
        <button class="small" onclick='rx_editAppointment(${JSON.stringify(a)})'>Edit</button>
        <button class="small gold" onclick='rx_cancelAppointment(${a.Appointment_ID})'>Cancel</button>
        <button class="small secondary" onclick='rx_checkin(${a.Appointment_ID})'>Check-In</button>
      </td>
    </tr>
  `).join("");

  document.getElementById("rx_appts").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th><th>Start</th><th>End</th><th>Status</th><th>Patient</th><th>Provider</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="7">No appointments</td></tr>`}</tbody>
    </table>
  `;
}

async function rx_showAppointmentCreate(){
  const providers = await api("api/receptionist/providers_list.php");
  const providerOptions = providers.providers.map(p =>
    `<option value="${p.User_ID}">${p.Last_Name}, ${p.First_Name}</option>`
  ).join("");

  rx_panel(`
    <div class="section-title">
      <h3>Schedule Appointment</h3>
      <div class="tools">
        <button class="ghost" onclick="rx_showAppointmentBoard()">Back</button>
      </div>
    </div>

    <div class="form-grid">
      <div class="field">
        <label>Patient ID</label>
        <input id="ap_patientId" placeholder="Patient ID">
        <div class="hint">Tip: search patient first, then use their ID.</div>
      </div>

      <div class="field">
        <label>Provider</label>
        <select id="ap_providerId">${providerOptions}</select>
      </div>

      <div class="field">
        <label>Start</label>
        <input id="ap_start" type="datetime-local">
      </div>

      <div class="field">
        <label>End</label>
        <input id="ap_end" type="datetime-local">
        <div class="hint">Variable duration allowed.</div>
      </div>
    </div>

    <div class="row" style="margin-top:12px;">
      <button class="primary" onclick="rx_createAppointment()">Create Appointment</button>
    </div>

    <div id="rx_msg" style="margin-top:10px;"></div>
  `);
}

async function rx_createAppointment(){
  const patientId = parseInt(document.getElementById("ap_patientId").value, 10);
  const providerUserId = parseInt(document.getElementById("ap_providerId").value, 10);
  const startDateTime = document.getElementById("ap_start").value;
  const endDateTime   = document.getElementById("ap_end").value;

  const res = await api("api/receptionist/appointments_create.php","POST",{
    patientId, providerUserId, startDateTime, endDateTime
  });

  if (typeof rx_loadTilesAndNext === "function") await rx_loadTilesAndNext();

  if (document.getElementById("rx_appts")) await rx_loadAppointments();

  toast("Appointment created", `Appointment ID ${res.appointmentId}`, "ok");
  document.getElementById("rx_msg").innerHTML = `<span class="badge teal">Created Appointment ID: ${res.appointmentId}</span>`;

}

function rx_editAppointment(a){
  rx_panel(`
    <div class="section-title">
      <h3>Edit Appointment #${a.Appointment_ID}</h3>
      <div class="tools">
        <button class="ghost" onclick="rx_showAppointmentBoard()">Back</button>
      </div>
    </div>

    <div class="form-grid">
      <div class="field">
        <label>Patient</label>
        <input value="${a.Patient_Last}, ${a.Patient_First}" disabled>
      </div>

      <div class="field">
        <label>Provider User ID</label>
        <input id="ea_providerId" value="${a.Provider_ID}">
      </div>

      <div class="field">
        <label>Start</label>
        <input id="ea_start" type="datetime-local" value="${a.Scheduled_Start.replace(' ','T').slice(0,16)}">
      </div>

      <div class="field">
        <label>End</label>
        <input id="ea_end" type="datetime-local" value="${a.Scheduled_End.replace(' ','T').slice(0,16)}">
      </div>
    </div>

    <div class="row" style="margin-top:12px;">
      <button class="primary" onclick="rx_updateAppointment(${a.Appointment_ID})">Save</button>
    </div>

    <div id="rx_msg" style="margin-top:10px;"></div>
  `);
}

async function rx_updateAppointment(appointmentId){
  const providerUserId = parseInt(document.getElementById("ea_providerId").value, 10);
  const startDateTime = document.getElementById("ea_start").value;
  const endDateTime   = document.getElementById("ea_end").value;

  await api("api/receptionist/appointments_update.php","POST",{
    appointmentId, providerUserId, startDateTime, endDateTime
  });

  toast("Saved", "Appointment updated", "ok");
  document.getElementById("rx_msg").innerHTML = `<span class="badge teal">Saved</span>`;

  await rx_loadTilesAndNext();
}

async function rx_cancelAppointment(appointmentId){
  await api("api/receptionist/appointments_cancel.php","POST",{appointmentId});
  toast("Updated", "Appointment cancelled", "ok");
  await rx_loadAppointments();
  await rx_loadTilesAndNext();
}

async function rx_checkin(appointmentId){
  await api("api/receptionist/appointments_checkin.php","POST",{appointmentId});
  toast("Checked in", `Appointment #${appointmentId}`, "ok");
  if (document.getElementById("rx_appts")) await rx_loadAppointments();
  await rx_loadTilesAndNext();
}