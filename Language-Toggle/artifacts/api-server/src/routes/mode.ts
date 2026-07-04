import { Router } from "express";
import { getDb, addLog } from "../db/database.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const mode = db.prepare("SELECT * FROM modes WHERE user_id = ?").get(req.userId);
  res.json(mode || { active_mode: "normal", battery_active: 0 });
});

router.post("/", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;
  const { mode } = req.body as { mode: string };
  const now = new Date().toISOString();

  const validModes = ["normal", "saving", "night", "outage"];
  if (!validModes.includes(mode)) {
    res.status(400).json({ error: "Invalid mode" });
    return;
  }

  const setup = db.prepare("SELECT has_battery FROM home_setups WHERE user_id = ?").get(userId) as { has_battery: number } | undefined;
  const hasBattery = setup?.has_battery === 1;

  let logAr = "";
  let logEn = "";

  if (mode === "normal") {
    // Set mode to normal — does NOT automatically change device states.
    // User can control devices manually from the rooms.
    logAr = "تم الرجوع للوضع العادي. يمكنك تشغيل الأجهزة من الغرف.";
    logEn = "Normal mode is active. You can control devices from the rooms.";

  } else if (mode === "saving") {
    // Turn off heavy devices
    db.prepare("UPDATE devices SET is_on = 0, updated_at = ? WHERE user_id = ? AND is_heavy = 1").run(now, userId);
    db.prepare("UPDATE devices SET is_on = 0, updated_at = ? WHERE user_id = ? AND type = 'outdoorLight'").run(now, userId);
    logAr = "تم تفعيل وضع التوفير: تم إطفاء الأجهزة الثقيلة";
    logEn = "Saving mode activated: heavy devices were turned off";

  } else if (mode === "night") {
    // Turn on living room and bedroom lights, keep fridge, turn off washer and outdoor
    db.prepare("UPDATE devices SET is_on = 0, updated_at = ? WHERE user_id = ? AND type IN ('washingMachine', 'outdoorLight')").run(now, userId);
    // Turn on lights in living room and first bedroom
    const livingRoom = db.prepare("SELECT id FROM rooms WHERE user_id = ? AND type = 'livingRoom' LIMIT 1").get(userId) as { id: number } | undefined;
    const bedroom = db.prepare("SELECT id FROM rooms WHERE user_id = ? AND type = 'bedroom' LIMIT 1").get(userId) as { id: number } | undefined;
    if (livingRoom) {
      db.prepare("UPDATE devices SET is_on = 1, updated_at = ? WHERE user_id = ? AND room_id = ? AND type = 'light'").run(now, userId, livingRoom.id);
    }
    if (bedroom) {
      db.prepare("UPDATE devices SET is_on = 1, updated_at = ? WHERE user_id = ? AND room_id = ? AND type = 'light'").run(now, userId, bedroom.id);
    }
    // Keep fridge on
    db.prepare("UPDATE devices SET is_on = 1, updated_at = ? WHERE user_id = ? AND type = 'fridge'").run(now, userId);
    logAr = "تم تفعيل وضع الليل: تم تشغيل الإضاءة الأساسية";
    logEn = "Night mode activated: essential lights are on";

  } else if (mode === "outage") {
    if (hasBattery) {
      // Turn off heavy devices and non-essentials
      db.prepare("UPDATE devices SET is_on = 0, updated_at = ? WHERE user_id = ? AND is_heavy = 1").run(now, userId);
      db.prepare("UPDATE devices SET is_on = 0, updated_at = ? WHERE user_id = ? AND type IN ('tv', 'outdoorLight')").run(now, userId);
      // Keep essentials on
      db.prepare("UPDATE devices SET is_on = 1, updated_at = ? WHERE user_id = ? AND type IN ('light', 'fridge', 'wifi', 'phone')").run(now, userId);
      logAr = "انقطاع كهرباء: البطارية تشغّل الأساسيات فقط";
      logEn = "Power outage: battery is powering essentials only";
    } else {
      db.prepare("UPDATE devices SET is_on = 0, updated_at = ? WHERE user_id = ? AND is_heavy = 1").run(now, userId);
      db.prepare("UPDATE devices SET is_on = 0, updated_at = ? WHERE user_id = ? AND is_essential = 0").run(now, userId);
      logAr = "لا توجد بطارية: تم إطفاء الأجهزة غير الأساسية";
      logEn = "No battery: non-essential devices were turned off";
    }
    db.prepare(
      `INSERT INTO modes (user_id, active_mode, battery_active, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET active_mode=?, battery_active=?, updated_at=?`
    ).run(userId, mode, hasBattery ? 1 : 0, now, mode, hasBattery ? 1 : 0, now);

    addLog(userId, logAr, logEn);
    const updatedDevices = db.prepare("SELECT * FROM devices WHERE user_id = ?").all(userId);
    const updatedMode = db.prepare("SELECT * FROM modes WHERE user_id = ?").get(userId);
    res.json({ success: true, mode: updatedMode, devices: updatedDevices });
    return;
  }

  db.prepare(
    `INSERT INTO modes (user_id, active_mode, battery_active, updated_at) VALUES (?, ?, 0, ?)
     ON CONFLICT(user_id) DO UPDATE SET active_mode=?, battery_active=0, updated_at=?`
  ).run(userId, mode, now, mode, now);

  addLog(userId, logAr, logEn);
  const updatedDevices = db.prepare("SELECT * FROM devices WHERE user_id = ?").all(userId);
  const updatedMode = db.prepare("SELECT * FROM modes WHERE user_id = ?").get(userId);
  res.json({ success: true, mode: updatedMode, devices: updatedDevices });
});

export default router;
