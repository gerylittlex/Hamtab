document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const phone = form.phone?.value?.trim();
    try {
      const data = await window.HamTabAPI.register({ name, email, password, phone });
      window.HamTabAPI.setToken(data.token);
      location.href = "/pages/dashboard.html";
    } catch (err) {
      window.HamTabUI.showToast(err.message || "خطا در ثبت‌نام", "error");
    }
  });
});
