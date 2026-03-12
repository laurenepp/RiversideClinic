window.logout = function () {
  const ok = confirm("Are you sure you want to log out?");
  if (!ok) return;

  api("api/auth/logout.php", "POST", {})
    .catch(err => console.error("Logout failed:", err))
    .finally(() => location.reload());
};