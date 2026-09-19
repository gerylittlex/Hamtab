document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { systems } = await window.HamTabAPI.getSystems();
    if (!systems.length) {
      document.getElementById("controller-root")?.insertAdjacentHTML("beforeend", "<p>سیستمی برای نمایش وجود ندارد.</p>");
      return;
    }
    const sys = systems[0];
    const data = await window.HamTabAPI.getController(sys.id);
    const root = document.getElementById("controller-root");
    if (root) {
      root.innerHTML = `
        <div class="card">
          <h2>وضعیت کنترلر</h2>
          <p>اتصال: <strong>${data.connection}</strong></p>
          <p>تولید لحظه‌ای: ${data.hourlyProductionKw ?? 0} کیلووات</p>
          <p>ظرفیت: ${data.capacityKw} کیلووات</p>
        </div>`;
    }
  } catch (err) {
    window.HamTabUI?.showToast(err.message || "خطا", "error");
  }
});
