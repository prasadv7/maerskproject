document.addEventListener("DOMContentLoaded", () => {
    const formTitle = document.getElementById("form-title");
    const authButton = document.getElementById("auth-button");
    const toggleLink = document.getElementById("toggle-link");
    const toggleText = document.getElementById("toggle-text");
    const nameField = document.getElementById("name-field");
  
    // Track the current form state (login or register)
    let isLogin = true;
  
    // Toggle between login and registration forms
    toggleLink.addEventListener("click", (e) => {
      e.preventDefault();
      isLogin = !isLogin;
  
      if (isLogin) {
        // Switch to Login form
        formTitle.textContent = "Sign In";
        authButton.value = "Sign In";
        toggleText.innerHTML = `You do not have an account? <a href="#" id="toggle-link" class="text-warning">Sign up</a>`;
        nameField.classList.add("hidden");
      } else {
        // Switch to Registration form
        formTitle.textContent = "Register";
        authButton.value = "Register";
        toggleText.innerHTML = `Already have an account? <a href="#" id="toggle-link" class="text-warning">Sign in</a>`;
        nameField.classList.remove("hidden");
      }
    });
  
    // Handle form submission
    const authForm = document.getElementById("auth-form");
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
  
      if (isLogin) {
        // Login logic
        console.log("Logging in:", { email, password });
  
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
            }),
          });
  
          if (response.ok) {
            const result = await response.json();
            const jwtToken = result.token; // Store JWT token
  
            // Save the token to localStorage
            localStorage.setItem("jwtToken", jwtToken);
  
            alert("Login successful!");
            console.log("JWT Token:", jwtToken);
  
            // Redirect to dashboard.html
            window.location.href = "dashboard.html";
          } else {
            const error = await response.json();
            alert(`Login failed: ${error.message || "Unknown error"}`);
          }
        } catch (err) {
          console.error("Error during login:", err);
          alert("An error occurred while logging in.");
        }
      } else {
        // Registration logic
        console.log("Registering:", { name, email, password });
  
        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name,
              email,
              password,
            }),
          });
  
          if (response.ok) {
            const result = await response.json();
            alert("Registration successful!");
            console.log("Server Response:", result);
  
            // Redirect to login form
            toggleLink.click();
          } else {
            const error = await response.json();
            alert(`Registration failed: ${error.message || "Unknown error"}`);
          }
        } catch (err) {
          console.error("Error during registration:", err);
          alert("An error occurred while registering.");
        }
      }
    });
  });
  