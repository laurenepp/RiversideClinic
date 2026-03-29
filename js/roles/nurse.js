// js/roles/nurse.js

function loadNurse() {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="nurse-page-shell">
      <div class="nurse-page-header">
        <h2>Nurse Dashboard</h2>
        <p>Patient queue, schedules, and intake tools</p>
      </div>

      <div id="nurse_tiles" class="nurse-tiles-wrap"></div>
      <div id="nurse_panel" class="nurse-panel-wrap"></div>
    </div>
  `;

  nurse_loadTiles();
  nurse_showHome();
}

function nurse_loadTiles() {
  const wrap = document.getElementById("nurse_tiles");
  if (!wrap) return;

  wrap.innerHTML = `
    <button class="tile-btn active" id="nurseTabHome" onclick="nurse_showHome()">Dashboard</button>
    <button class="tile-btn" id="nurseTabSchedule" onclick="nurse_showSchedule()">Schedules</button>
    <button class="tile-btn" id="nurseTabIntake" onclick="nurse_showIntake()">Patient Intake</button>
  `;
}

function nurse_setActiveTab(tabName) {
  document.getElementById("nurseTabHome")?.classList.remove("active");
  document.getElementById("nurseTabSchedule")?.classList.remove("active");
  document.getElementById("nurseTabIntake")?.classList.remove("active");

  if (tabName === "home") {
    document.getElementById("nurseTabHome")?.classList.add("active");
  } else if (tabName === "schedule") {
    document.getElementById("nurseTabSchedule")?.classList.add("active");
  } else if (tabName === "intake") {
    document.getElementById("nurseTabIntake")?.classList.add("active");
  }
}

function nurse_showHome() {
  nurse_setActiveTab("home");

  const panel = document.getElementById("nurse_panel");
  if (!panel) return;

  panel.innerHTML = `
    <div class="card">
      <h3>Nurse Dashboard</h3>
      <p>Quick overview of patient care tasks.</p>
    </div>

    <div class="card">
      <h3>Today's Queue</h3>
      <p>No patient queue connected yet.</p>
    </div>
  `;
}

function nurse_showSchedule() {
  nurse_setActiveTab("schedule");

  const panel = document.getElementById("nurse_panel");
  if (!panel) return;

  panel.innerHTML = `
    <div class="card">
      <h3>Schedules</h3>
      <p>Nurse schedule information will appear here.</p>
    </div>
  `;
}

function nurse_showIntake() {
  nurse_setActiveTab("intake");

  const panel = document.getElementById("nurse_panel");
  if (!panel) return;

  panel.innerHTML = `
    <div class="card">
      <h3>Patient Intake</h3>
      <p>Vitals, notes, and intake forms will appear here.</p>
    </div>
  `;
}function nurse_home() {
  loadNurse();
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
  nurse_showSchedule();
}

function nurse_intake() {
  nurse_showIntake();
}