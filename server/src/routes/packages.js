import { db } from "../db.js";
import { HttpError } from "../router.js";

export function registerPackageRoutes(router) {
  router.get("/api/packages", async (req, res) => {
    const packages = db.prepare("SELECT * FROM packages ORDER BY capacity_kw").all();
    res.json(200, { packages });
  });

  router.get("/api/packages/:id", async (req, res) => {
    const pkg = db.prepare("SELECT * FROM packages WHERE id = ?").get(req.params.id);
    if (!pkg) throw new HttpError(404, "Package not found");
    res.json(200, { package: pkg });
  });
}
