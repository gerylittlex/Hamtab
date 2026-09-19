document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("calculator-form");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      monthlyBill: Number(form.monthlyBill?.value) || undefined,
      monthlyUsage: Number(form.monthlyUsage?.value) || undefined,
      roofArea: Number(form.roofArea?.value) || undefined,
      independence: Number(form.independence?.value) || 80,
    };
    try {
      const { result } = await window.HamTabAPI.calculate(body);
      const out = document.getElementById("calc-result");
      if (out) {
        out.innerHTML = `
          <p>ظرفیت پیشنهادی: <strong>${result.recommendedCapacityKw} کیلووات</strong></p>
          <p>تعداد پنل تقریبی: ${result.estimatedPanels}</p>
          <p>پوشش مصرف: ${result.coveragePercent}٪</p>
          <p>باتری پیشنهادی: ${result.batteryRecommendationKwh} کیلووات‌ساعت</p>
        `;
      }
    } catch (err) {
      window.HamTabUI.showToast(err.message || "خطا در محاسبه", "error");
    }
  });
});
