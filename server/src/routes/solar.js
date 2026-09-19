import { db } from "../db.js";
import { calculate } from "../services/calculator.js";
import { getUserFromRequest } from "../middleware/auth.js";
import { number, optionalStr } from "../validate.js";
import { newId } from "../crypto-utils.js";

export function registerSolarRoutes(router) {
  router.post("/api/solar/calculate", async (req, res) => {
    const monthlyBill = number(req.body, "monthlyBill", { required: false, min: 0 });
    const monthlyUsage = number(req.body, "monthlyUsage", { required: false, min: 0 });
    const roofArea = number(req.body, "roofArea", { required: false, min: 0 });
    const independence = number(req.body, "independence", { required: false, min: 0, max: 100 });

    const result = calculate({ monthlyBill, monthlyUsage, roofArea, independence });

    const user = getUserFromRequest(req);
    const id = newId("calc");
    db.prepare(
      `INSERT INTO solar_calculations (id, user_id, monthly_bill, monthly_usage, roof_area, independence,
        recommended_capacity_kw, suggested_package_id, result_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      user ? user.id : null,
      monthlyBill ?? null,
      monthlyUsage ?? null,
      roofArea ?? null,
      independence ?? null,
      result.recommendedCapacityKw,
      result.suggestedPackageId || null,
      JSON.stringify(result)
    );

    res.json(200, { result });
  });
}
