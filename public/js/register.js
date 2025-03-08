document.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
  
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
  
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
  
    const data = await response.json();
  
    if (response.ok) {
      localStorage.setItem("token", data.token); // Save token
      window.location.href = "/dashboard"; // Redirect
    } else {
      alert(data.message);
    }
  });
  