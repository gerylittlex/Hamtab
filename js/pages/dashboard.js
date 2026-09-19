document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { user } = await window.HamTabAPI.me();
    if (!user) {
      location.href = "/pages/login.html?redirect=/pages/dashboard.html";
      return;
    }
    const nameEl = document.getElementById("user-name");
    if (nameEl) nameEl.textContent = user.name;

    const { orders } = await window.HamTabAPI.getOrders();
    const ordersEl = document.getElementById("orders-list");
    if (ordersEl) {
      ordersEl.innerHTML = orders.length
        ? orders.map((o) => `<div class="card"><strong>${window.HamTabUI.escapeHtml(o.package_name)}</strong> — ${o.status} / ${o.payment_status}</div>`).join("")
        : "<p>هنوز سفارشی ثبت نکرده‌اید.</p>";
    }

    const { systems } = await window.HamTabAPI.getSystems();
    const systemsEl = document.getElementById("systems-list");
    if (systemsEl) {
      systemsEl.innerHTML = systems.length
        ? systems.map((s) => `<div class="card"><strong>${window.HamTabUI.escapeHtml(s.package_name || s.id)}</strong> — ${s.capacity_kw} kW</div>`).join("")
        : "<p>سیستمی ثبت نشده.</p>";
    }
  } catch (err) {
    window.HamTabUI?.showToast(err.message || "خطا", "error");
  }
});
