import { Router } from "express";
import { getDb, addLog } from "../db/database.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const rooms = db.prepare("SELECT * FROM rooms WHERE user_id = ? ORDER BY sort_order").all(req.userId);
  res.json({ rooms });
});

router.patch("/:id", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const roomId = parseInt(String(req.params["id"]), 10);
  const userId = req.userId!;
  const { nameAr, nameEn } = req.body as { nameAr?: string; nameEn?: string };

  const room = db.prepare("SELECT * FROM rooms WHERE id = ? AND user_id = ?").get(roomId, userId) as {
    id: number; name_ar: string; name_en: string;
  } | undefined;

  if (!room) {
    res.status(404).json({ error: "Room not found", errorAr: "الغرفة غير موجودة" });
    return;
  }

  const nextAr = nameAr?.trim() || room.name_ar;
  const nextEn = nameEn?.trim() || nameAr?.trim() || room.name_en;

  db.prepare("UPDATE rooms SET name_ar = ?, name_en = ? WHERE id = ? AND user_id = ?").run(nextAr, nextEn, roomId, userId);
  addLog(userId, `تم تعديل اسم الغرفة إلى ${nextAr}`, `Room renamed to ${nextEn}`);

  const updated = db.prepare("SELECT * FROM rooms WHERE id = ? AND user_id = ?").get(roomId, userId);
  res.json({ room: updated });
});

export default router;
