import { Router } from "express";
import bcrypt from "bcryptjs";
import { getDb } from "../db/database.js";
import { signToken, requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.post("/register", (req, res) => {
  const { name, area, password } = req.body as { name?: string; area?: string; password?: string };

  if (!name?.trim() || !area?.trim() || !password?.trim()) {
    res.status(400).json({ error: "name, area, and password are required", errorAr: "الاسم والمنطقة وكلمة المرور مطلوبة" });
    return;
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE name = ?").get(name.trim());
  if (existing) {
    res.status(409).json({ error: "Name already taken", errorAr: "هذا الاسم مستخدم بالفعل، اختر اسماً آخر" });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();
  const result = db.prepare(
    "INSERT INTO users (name, area, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(name.trim(), area.trim(), hash, "citizen", now) as { lastInsertRowid: number };

  const userId = result.lastInsertRowid;
  const token = signToken(userId, "citizen");

  res.json({
    token,
    user: { id: userId, name: name.trim(), area: area.trim(), role: "citizen" },
  });
});

router.post("/login", (req, res) => {
  const { name, password } = req.body as { name?: string; password?: string };

  if (!name?.trim() || !password?.trim()) {
    res.status(400).json({ error: "name and password are required", errorAr: "الاسم وكلمة المرور مطلوبان" });
    return;
  }

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE name = ?").get(name.trim()) as {
    id: number; name: string; area: string; password_hash: string; role: string;
  } | undefined;

  if (!user) {
    res.status(401).json({ error: "User not found", errorAr: "المستخدم غير موجود" });
    return;
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Wrong password", errorAr: "كلمة المرور غير صحيحة" });
    return;
  }

  const token = signToken(user.id, user.role);
  res.json({
    token,
    user: { id: user.id, name: user.name, area: user.area, role: user.role },
  });
});

router.get("/me", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const user = db.prepare("SELECT id, name, area, role, created_at FROM users WHERE id = ?").get(req.userId) as {
    id: number; name: string; area: string; role: string; created_at: string;
  } | undefined;

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

export default router;
