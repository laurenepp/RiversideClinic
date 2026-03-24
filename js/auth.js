function logout() {
  showLogoutModal();
}

function showLogoutModal() {
  const existing = document.getElementById("logout-modal-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "logout-modal-overlay";
  overlay.innerHTML = `
    <div class="logout-modal-backdrop">
      <div class="logout-modal-card">
        <div class="logout-modal-icon"</div>
        <h2 class="logout-modal-title">Log Out of Riverside Clinic</h2>
        <p class="logout-modal-text">
          Are you sure you want to log out of Riverside Clinic?
        </p>
        <div class="logout-modal-actions">
          <button class="logout-cancel-btn" id="logoutCancelBtn">Cancel</button>
          <button class="logout-confirm-btn" id="logoutConfirmBtn">Log Out</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("logoutCancelBtn")?.addEventListener("click", closeLogoutModal);
  document.getElementById("logoutConfirmBtn")?.addEventListener("click", confirmLogout);

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay.firstElementChild) {
      closeLogoutModal();
    }
  });
}

function closeLogoutModal() {
  document.getElementById("logout-modal-overlay")?.remove();
}

function confirmLogout() {
  api("api/auth/logout.php", "POST", {})
    .catch(err => console.error("Logout failed:", err))
    .finally(() => location.reload());
}
