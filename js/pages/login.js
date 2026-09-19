document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;
    try {
      const data = await window.HamTabAPI.login({ email, password });
      window.HamTabAPI.setToken(data.token);
      const params = new URLSearchParams(location.search);
      const redirect = params.get("redirect") || "/pages/dashboard.html";
      // safe redirect: only relative .html
      const safe = /^\/?pages\/[a-z-]+\.html$/.test(redirect) ? redirect : "/pages/dashboard.html";
      location.href = safe;
    } catch (err) {
      window.HamTabUI.showToast(err.message || "خطا در ورود", "error");
    }
  });
});
