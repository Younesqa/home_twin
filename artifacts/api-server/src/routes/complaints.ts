import { Router } from "express";
import { getDb, addLog } from "../db/database.js";
import { requireAuth, requireAdmin, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/my", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const complaints = db.prepare(
    "SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC"
  ).all(req.userId);
  res.json({ complaints });
});

router.post("/", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;
  const { title, message } = req.body as { title?: string; message?: string };
  if (!title?.trim() || !message?.trim()) {
    res.status(400).json({ error: "Title and message are required", errorAr: "عنوان الشكوى والتفاصيل مطلوبة" });
    return;
  }
  const now = new Date().toISOString();
  const result = db.prepare(
    "INSERT INTO complaints (user_id, title, message, status, created_at) VALUES (?, ?, ?, 'open', ?)"
  ).run(userId, title.trim(), message.trim(), now) as { lastInsertRowid: number };
  addLog(userId, "تم إرسال شكوى جديدة", "New complaint submitted");
  const complaint = db.prepare("SELECT * FROM complaints WHERE id = ?").get(result.lastInsertRowid);
  res.json({ complaint });
});

router.get("/admin/all", requireAdmin, (_req: AuthRequest, res) => {
  const db = getDb();
  const complaints = db.prepare(
    `SELECT c.*, u.name AS user_name, u.area AS user_area
     FROM complaints c
     JOIN users u ON u.id = c.user_id
     ORDER BY c.created_at DESC`
  ).all();
  res.json({ complaints });
});

router.patch("/admin/:id/reply", requireAdmin, (req: AuthRequest, res) => {
  const db = getDb();
  const complaintId = parseInt(String(req.params["id"]), 10);
  const { reply } = req.body as { reply?: string };
  if (!reply?.trim()) {
    res.status(400).json({ error: "Reply is required", errorAr: "الرد مطلوب" });
    return;
  }
  const complaint = db.prepare("SELECT * FROM complaints WHERE id = ?").get(complaintId) as { id: number; user_id: number } | undefined;
  if (!complaint) {
    res.status(404).json({ error: "Complaint not found", errorAr: "الشكوى غير موجودة" });
    return;
  }
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE complaints SET status = 'replied', reply = ?, replied_by = ?, replied_at = ? WHERE id = ?"
  ).run(reply.trim(), req.userId, now, complaintId);
  addLog(complaint.user_id, "تم الرد على شكواك من المشرف", "Your complaint has been replied to by the admin");
  const updated = db.prepare(
    `SELECT c.*, u.name AS user_name, u.area AS user_area
     FROM complaints c JOIN users u ON u.id = c.user_id WHERE c.id = ?`
  ).get(complaintId);
  res.json({ complaint: updated });
});

export default router;
