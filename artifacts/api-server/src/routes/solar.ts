import { Router } from "express";
import { getDb, addLog } from "../db/database.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { ensureWallet } from "./billing.js";

const router = Router();

type SolarAccountRow = {
  id: number;
  user_id: number;
  available_kwh: number;
  rate_per_kwh: number;
  generation_per_minute: number;
  last_updated_at: string;
  created_at: string;
};

export function ensureSolarAccount(userId: number): void {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM solar_accounts WHERE user_id = ?").get(userId);
  if (!existing) {
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO solar_accounts (user_id, available_kwh, rate_per_kwh, generation_per_minute, last_updated_at, created_at) VALUES (?, 0, 0.60, 0.05, ?, ?)"
    ).run(userId, now, now);
  }
}

function updateAndGetSolar(userId: number): SolarAccountRow {
  const db = getDb();
  ensureSolarAccount(userId);
  const solar = db.prepare("SELECT * FROM solar_accounts WHERE user_id = ?").get(userId) as SolarAccountRow;
  const now = new Date().toISOString();
  const minutesPassed = (Date.now() - new Date(solar.last_updated_at).getTime()) / 60000;
  const newKwh = solar.available_kwh + minutesPassed * solar.generation_per_minute;
  db.prepare("UPDATE solar_accounts SET available_kwh = ?, last_updated_at = ? WHERE user_id = ?").run(newKwh, now, userId);
  return { ...solar, available_kwh: newKwh };
}

function buildSummary(userId: number, solar: SolarAccountRow) {
  const db = getDb();
  const wallet = db.prepare("SELECT balance FROM wallets WHERE user_id = ?").get(userId) as { balance: number } | undefined;
  const availableKwh = Math.round(solar.available_kwh * 100) / 100;
  const estimatedValue = Math.round(availableKwh * solar.rate_per_kwh * 100) / 100;
  return {
    hasSolar: true,
    availableKwh,
    ratePerKwh: solar.rate_per_kwh,
    generationPerMinute: solar.generation_per_minute,
    estimatedValue,
    walletBalance: wallet?.balance ?? 0,
  };
}

router.get("/summary", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;
  const setup = db.prepare("SELECT has_solar FROM home_setups WHERE user_id = ?").get(userId) as { has_solar: number } | undefined;

  if (!setup || !setup.has_solar) {
    res.json({ hasSolar: false });
    return;
  }

  ensureWallet(userId);
  const solar = updateAndGetSolar(userId);
  res.json(buildSummary(userId, solar));
});

router.post("/sell", requireAuth, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const db = getDb();
  const { kwh } = req.body as { kwh?: number };

  const setup = db.prepare("SELECT has_solar FROM home_setups WHERE user_id = ?").get(userId) as { has_solar: number } | undefined;
  if (!setup || !setup.has_solar) {
    res.status(403).json({ error: "No solar panels registered", errorAr: "لا توجد خلايا شمسية مسجلة" });
    return;
  }

  if (!kwh || Number(kwh) <= 0) {
    res.status(400).json({ error: "Amount must be positive", errorAr: "يجب أن تكون الكمية موجبة" });
    return;
  }

  const solar = updateAndGetSolar(userId);
  if (Number(kwh) > solar.available_kwh) {
    res.status(400).json({ error: "You cannot sell more than the available energy", errorAr: "لا يمكنك بيع أكثر من الطاقة المتاحة" });
    return;
  }

  const kwhNum = Number(kwh);
  const earnings = Math.round(kwhNum * solar.rate_per_kwh * 100) / 100;
  const now = new Date().toISOString();

  ensureWallet(userId);
  db.prepare("UPDATE solar_accounts SET available_kwh = available_kwh - ?, last_updated_at = ? WHERE user_id = ?").run(kwhNum, now, userId);
  db.prepare("UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE user_id = ?").run(earnings, now, userId);
  db.prepare(
    "INSERT INTO wallet_transactions (user_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, "solar_sale", earnings, "بيع طاقة شمسية للبلدية", now);
  addLog(userId, "تم بيع طاقة شمسية للبلدية وإضافة الرصيد للمحفظة", "Solar energy sold to municipality, balance added to wallet");

  const updatedSolar = db.prepare("SELECT * FROM solar_accounts WHERE user_id = ?").get(userId) as SolarAccountRow;
  res.json(buildSummary(userId, updatedSolar));
});

export default router;
