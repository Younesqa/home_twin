import { Router } from "express";
import { getDb } from "../db/database.js";
import { requireAdmin, type AuthRequest } from "../middleware/auth.js";
import { calcBill, calcBatteryRuntime } from "./home.js";

const router = Router();

router.get("/stats", requireAdmin, (_req: AuthRequest, res) => {
  const db = getDb();

  const totalCitizens = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'citizen'").get() as { count: number }).count;
  const byArea = db.prepare(
    "SELECT area, COUNT(*) as count FROM users WHERE role = 'citizen' GROUP BY area"
  ).all();

  res.json({ totalCitizens, byArea });
});

router.get("/users", requireAdmin, (_req: AuthRequest, res) => {
  const db = getDb();
  const users = db.prepare(
    "SELECT id, name, area, role, created_at FROM users WHERE role = 'citizen' ORDER BY created_at DESC"
  ).all();
  res.json({ users });
});

router.get("/users/:id", requireAdmin, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = parseInt(String(req.params["id"]), 10);

  const user = db.prepare("SELECT id, name, area, role, created_at FROM users WHERE id = ?").get(userId) as Record<string, unknown> | undefined;
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const setup = db.prepare("SELECT * FROM home_setups WHERE user_id = ?").get(userId) as Record<string, unknown> | undefined;
  const rooms = db.prepare("SELECT * FROM rooms WHERE user_id = ? ORDER BY sort_order").all(userId);
  const devices = db.prepare("SELECT * FROM devices WHERE user_id = ?").all(userId) as { type: string }[];
  const modeRow = db.prepare("SELECT * FROM modes WHERE user_id = ?").get(userId);
  const activityLogs = db.prepare("SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").all(userId);

  const batteryCapacity = setup?.["battery_capacity"] as number | null;
  const hasBattery = Boolean(setup?.["has_battery"]);

  const bill = setup ? calcBill(
    {
      bill_level: setup["bill_level"] as string,
      has_battery: setup["has_battery"] as number,
      family_size: setup["family_size"] as string,
    },
    devices
  ) : null;

  res.json({
    user,
    setup,
    rooms,
    devices,
    mode: modeRow || { active_mode: "normal", battery_active: 0 },
    bill,
    battery: {
      capacity: batteryCapacity,
      hasBattery,
      runtimeHours: calcBatteryRuntime(batteryCapacity),
    },
    activityLogs,
  });
});

export default router;
