document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { packages } = await window.HamTabAPI.getPackages();
    const list = document.getElementById("packages-list");
    if (!list) return;
    list.innerHTML = packages
      .map(
        (p) => `
      <div class="card package-card" data-id="${p.id}">
        <h3>${window.HamTabUI.escapeHtml(p.name)}</h3>
        <p>${p.capacity_kw} کیلووات — ${(p.price / 1e6).toFixed(0)} میلیون تومان</p>
        <button class="btn order-btn" data-id="${p.id}">سفارش</button>
      </div>`
      )
      .join("");

    list.querySelectorAll(".order-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          const { order } = await window.HamTabAPI.createOrder({ packageId: btn.dataset.id });
          await window.HamTabAPI.payOrder(order.id);
          window.HamTabUI.showToast("سفارش با موفقیت ثبت و پرداخت شد", "success");
          location.href = "/pages/dashboard.html";
        } catch (err) {
          window.HamTabUI.showToast(err.message || "خطا در سفارش", "error");
        }
      });
    });
  } catch (err) {
    window.HamTabUI?.showToast(err.message || "خطا در بارگذاری پکیج‌ها", "error");
  }
});
