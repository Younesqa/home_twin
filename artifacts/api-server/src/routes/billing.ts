import { Router } from "express";
import { getDb, addLog } from "../db/database.js";
import { requireAuth, requireAdmin, type AuthRequest } from "../middleware/auth.js";

const router = Router();

type WalletRow = { id: number; user_id: number; balance: number; updated_at: string };
type InvoiceRow = { id: number; user_id: number; title: string; amount: number; status: string; type: string; month: string; created_at: string; paid_at: string | null };
type TransactionRow = { id: number; user_id: number; type: string; amount: number; description: string; created_at: string };

export function ensureWallet(userId: number): void {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM wallets WHERE user_id = ?").get(userId);
  if (!existing) {
    db.prepare(
      "INSERT INTO wallets (user_id, balance, updated_at) VALUES (?, 0, ?)"
    ).run(userId, new Date().toISOString());
  }
}

function getSummary(userId: number) {
  const db = getDb();
  ensureWallet(userId);
  const wallet = db.prepare("SELECT * FROM wallets WHERE user_id = ?").get(userId) as WalletRow;
  const currentInvoice = db.prepare(
    "SELECT * FROM invoices WHERE user_id = ? AND type = 'current' ORDER BY created_at DESC LIMIT 1"
  ).get(userId) as InvoiceRow | undefined;
  const previousInvoices = db.prepare(
    "SELECT * FROM invoices WHERE user_id = ? AND type = 'previous' ORDER BY created_at DESC"
  ).all(userId) as InvoiceRow[];
  const transactions = db.prepare(
    "SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 30"
  ).all(userId) as TransactionRow[];
  return { wallet, currentInvoice: currentInvoice ?? null, previousInvoices, transactions };
}

router.get("/summary", requireAuth, (req: AuthRequest, res) => {
  res.json(getSummary(req.userId!));
});

router.post("/topup", requireAuth, (req: AuthRequest, res) => {
  const { amount, cardholderName, cardNumber, expiry, cvv } = req.body as Record<string, unknown>;

  if (!amount || Number(amount) <= 0) {
    res.status(400).json({ error: "Amount must be positive", errorAr: "يجب أن يكون المبلغ موجباً" });
    return;
  }
  if (!String(cardholderName ?? "").trim() || !String(cardNumber ?? "").trim() ||
      !String(expiry ?? "").trim() || !String(cvv ?? "").trim()) {
    res.status(400).json({ error: "All card fields are required", errorAr: "جميع حقول البطاقة مطلوبة" });
    return;
  }

  const db = getDb();
  const userId = req.userId!;
  const now = new Date().toISOString();
  const topupAmount = Number(amount);

  ensureWallet(userId);
  db.prepare("UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE user_id = ?").run(topupAmount, now, userId);
  db.prepare(
    "INSERT INTO wallet_transactions (user_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, "topup", topupAmount, "إضافة رصيد", now);
  addLog(userId, "تم إضافة رصيد إلى المحفظة", "Wallet balance added");

  res.json(getSummary(userId));
});

router.post("/pay-invoice/:invoiceId", requireAuth, (req: AuthRequest, res) => {
  const invoiceId = Number(req.params.invoiceId);
  const userId = req.userId!;
  const db = getDb();
  const now = new Date().toISOString();

  const invoice = db.prepare("SELECT * FROM invoices WHERE id = ? AND user_id = ?").get(invoiceId, userId) as InvoiceRow | undefined;
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found", errorAr: "الفاتورة غير موجودة" });
    return;
  }
  if (invoice.status === "paid") {
    res.status(400).json({ error: "Invoice already paid", errorAr: "الفاتورة مدفوعة بالفعل" });
    return;
  }

  ensureWallet(userId);
  const wallet = db.prepare("SELECT * FROM wallets WHERE user_id = ?").get(userId) as WalletRow;
  if (wallet.balance < invoice.amount) {
    res.status(400).json({ error: "Insufficient balance to pay the bill", errorAr: "الرصيد غير كافٍ لدفع الفاتورة" });
    return;
  }

  db.prepare("UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE user_id = ?").run(invoice.amount, now, userId);
  db.prepare("UPDATE invoices SET status = 'paid', paid_at = ? WHERE id = ? AND user_id = ?").run(now, invoiceId, userId);
  db.prepare(
    "INSERT INTO wallet_transactions (user_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, "bill_payment", invoice.amount, "دفع فاتورة الكهرباء", now);
  addLog(userId, "تم دفع الفاتورة بنجاح", "Bill paid successfully");

  res.json(getSummary(userId));
});

router.get("/admin/all", requireAdmin, (req: AuthRequest, res) => {
  const db = getDb();
  const invoices = db.prepare(`
    SELECT i.*, u.name AS user_name, u.area AS user_area,
           COALESCE(w.balance, 0) AS wallet_balance
    FROM invoices i
    JOIN users u ON u.id = i.user_id
    LEFT JOIN wallets w ON w.user_id = i.user_id
    ORDER BY i.created_at DESC
  `).all();
  res.json({ invoices });
});

export default router;
