import { Router } from "express";
import { getDb, addLog, getDeviceMeta } from "../db/database.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;
  const { roomId, nameAr, nameEn, type } = req.body as { roomId: number; nameAr: string; nameEn: string; type: string };

  if (!roomId || !nameAr || !type) {
    res.status(400).json({ error: "roomId, nameAr, and type are required" });
    return;
  }

  const room = db.prepare("SELECT id, name_ar FROM rooms WHERE id = ? AND user_id = ?").get(roomId, userId) as { id: number; name_ar: string } | undefined;
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const meta = getDeviceMeta(type);
  const now = new Date().toISOString();
  const result = db.prepare(
    `INSERT INTO devices (user_id, room_id, name_ar, name_en, type, is_on, is_essential, is_heavy, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`
  ).run(userId, roomId, nameAr, nameEn || nameAr, type, meta.isEssential, meta.isHeavy, now, now) as { lastInsertRowid: number };

  addLog(userId, `تم إضافة ${nameAr} في ${room.name_ar}`, `${nameEn || nameAr} added to ${room.name_ar}`);

  const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(result.lastInsertRowid);
  res.json({ device });
});

router.patch("/:id/toggle", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;
  const deviceId = parseInt(String(req.params["id"]), 10);
  const { isOn } = req.body as { isOn: boolean };

  const device = db.prepare("SELECT * FROM devices WHERE id = ? AND user_id = ?").get(deviceId, userId) as {
    id: number; name_ar: string; name_en: string; room_id: number; is_on: number;
  } | undefined;

  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }

  const newState = isOn ? 1 : 0;
  db.prepare("UPDATE devices SET is_on = ?, updated_at = ? WHERE id = ?").run(newState, new Date().toISOString(), deviceId);

  const stateAr = newState ? "تشغيل" : "إطفاء";
  const stateEn = newState ? "turned on" : "turned off";
  addLog(userId, `تم ${stateAr} ${device.name_ar}`, `${device.name_en} ${stateEn}`);

  res.json({ success: true, isOn: Boolean(newState) });
});

router.delete("/:id", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;
  const deviceId = parseInt(String(req.params["id"]), 10);

  const device = db.prepare("SELECT * FROM devices WHERE id = ? AND user_id = ?").get(deviceId, userId) as {
    id: number; name_ar: string; name_en: string;
  } | undefined;

  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }

  db.prepare("DELETE FROM devices WHERE id = ?").run(deviceId);
  addLog(userId, `تم حذف ${device.name_ar}`, `${device.name_en} deleted`);
  res.json({ success: true });
});

export default router;
