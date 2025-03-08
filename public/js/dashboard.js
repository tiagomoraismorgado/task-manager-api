const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/login.html"; // Redirect to login if not authenticated
}
