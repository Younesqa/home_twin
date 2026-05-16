import { Router } from "express";
import { getDb, addLog, getDeviceMeta } from "../db/database.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { ensureWallet } from "./billing.js";

const router = Router();

type SetupRow = {
  id: number;
  user_id: number;
  home_type: string;
  room_count: number;
  family_size: string;
  bill_level: string;
  has_battery: number;
  battery_capacity: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type DeviceRow = { type: string };

type RoomRow = { id: number; type: string; sort_order: number; name_ar: string; name_en: string };

function normalizeTotalRooms(roomCount: unknown): number {
  const total = Number(roomCount);
  return Math.min(8, Math.max(4, Number.isFinite(total) ? Math.round(total) : 5));
}

function bedroomsFromTotalRooms(totalRooms: number): number {
  // User enters total rooms including salon, kitchen and bathroom. The rest are bedrooms.
  return Math.min(5, Math.max(1, totalRooms - 3));
}

function calcBill(setup: {
  bill_level: string; has_battery: number; family_size: string;
}, devices: DeviceRow[]): {
  estimatedBill: number; mainReasonAr: string; mainReasonEn: string; tipAr: string; tipEn: string; noteAr: string; noteEn: string;
} {
  const base: Record<string, number> = { low: 150, medium: 250, high: 350, منخفضة: 150, متوسطة: 250, مرتفعة: 350 };
  let bill = base[setup.bill_level] ?? 250;

  const types = devices.map(d => d.type);
  const hasHeater = types.includes("heater");
  const hasAc = types.includes("ac");
  const hasWasher = types.includes("washingMachine");
  const hasOutdoor = types.includes("outdoorLight");

  if (hasHeater) bill += 30;
  if (hasAc) bill += 45;
  if (hasWasher) bill += 20;
  if (hasOutdoor) bill += 15;
  if (setup.family_size === "large" || setup.family_size === "5+") bill += 25;
  if (setup.family_size === "small" || setup.family_size === "1-2") bill -= 10;
  if (setup.has_battery) bill -= 20;
  bill = Math.max(80, bill);

  let mainReasonAr = "الاستخدام اليومي";
  let mainReasonEn = "Daily usage";
  if (hasHeater && hasAc) { mainReasonAr = "السخان والمكيف"; mainReasonEn = "Heater and AC"; }
  else if (hasHeater) { mainReasonAr = "السخان"; mainReasonEn = "Heater"; }
  else if (hasAc) { mainReasonAr = "المكيف"; mainReasonEn = "AC"; }
  else if (hasWasher) { mainReasonAr = "الغسالة"; mainReasonEn = "Washing machine"; }

  return {
    estimatedBill: bill,
    mainReasonAr,
    mainReasonEn,
    tipAr: "فعّل وضع التوفير مساءً وراقب الأجهزة الثقيلة من خريطة البيت.",
    tipEn: "Enable Saving Mode in the evening and monitor heavy devices from the home map.",
    noteAr: "هذه أرقام توضيحية مبسطة وليست فاتورة حقيقية.",
    noteEn: "These are simplified illustrative estimates, not a real bill.",
  };
}

function calcBatteryRuntime(capacity: number | null): number {
  if (!capacity) return 0;
  if (capacity === 2) return 2;
  if (capacity === 5) return 4;
  if (capacity === 10) return 8;
  return Math.max(1, Math.round(capacity * 0.8));
}

function insertRoom(userId: number, nameAr: string, nameEn: string, type: string, sort: number): number {
  const db = getDb();
  const result = db.prepare(
    "INSERT INTO rooms (user_id, name_ar, name_en, type, sort_order) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, nameAr, nameEn, type, sort) as { lastInsertRowid: number };
  return Number(result.lastInsertRowid);
}

function addDefaultLight(userId: number, roomId: number, now: string) {
  const db = getDb();
  const meta = getDeviceMeta("light");
  db.prepare(
    `INSERT INTO devices (user_id, room_id, name_ar, name_en, type, is_on, is_essential, is_heavy, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(userId, roomId, "الإضاءة", "Light", "light", 1, meta.isEssential, meta.isHeavy, now, now);
}

function ensureCoreRooms(userId: number, now: string) {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM rooms WHERE user_id = ?").all(userId) as RoomRow[];
  const getOrCreate = (type: string, nameAr: string, nameEn: string, sort: number) => {
    const found = existing.find(r => r.type === type);
    if (found) return found.id;
    const id = insertRoom(userId, nameAr, nameEn, type, sort);
    addDefaultLight(userId, id, now);
    return id;
  };

  return {
    livingRoom: getOrCreate("livingRoom", "الصالون", "Living Room", 1),
    kitchen: getOrCreate("kitchen", "المطبخ", "Kitchen", 2),
    bathroom: getOrCreate("bathroom", "الحمام", "Bathroom", 3),
  };
}

function createInitialRoomsAndDevices(userId: number, totalRooms: number, selectedDevices: string[], now: string) {
  const db = getDb();
  const targetBedrooms = bedroomsFromTotalRooms(totalRooms);
  const roomIds: Record<string, number> = ensureCoreRooms(userId, now);

  for (let i = 1; i <= targetBedrooms; i++) {
    const bedroomId = insertRoom(userId, `غرفة النوم ${i}`, `Bedroom ${i}`, "bedroom", 3 + i);
    roomIds[`bedroom_${i}`] = bedroomId;
    addDefaultLight(userId, bedroomId, now);
  }

  if (selectedDevices.includes("outdoorLight")) {
    const outdoorId = insertRoom(userId, "الخارج", "Outdoor", "outdoor", 20);
    roomIds.outdoor = outdoorId;
    addDefaultLight(userId, outdoorId, now);
  }

  const deviceMap: Record<string, { roomKey: string; nameAr: string; nameEn: string; type: string }[]> = {
    heater: [{ roomKey: "bathroom", nameAr: "سخان كهربائي", nameEn: "Electric Heater", type: "heater" }],
    ac: [
      { roomKey: "livingRoom", nameAr: "مكيف الصالون", nameEn: "Living Room AC", type: "ac" },
      { roomKey: "bedroom_1", nameAr: "مكيف غرفة النوم", nameEn: "Bedroom AC", type: "ac" },
    ],
    fridge: [{ roomKey: "kitchen", nameAr: "ثلاجة", nameEn: "Refrigerator", type: "fridge" }],
    washingMachine: [{ roomKey: "kitchen", nameAr: "غسالة", nameEn: "Washing Machine", type: "washingMachine" }],
    tv: [{ roomKey: "livingRoom", nameAr: "تلفزيون", nameEn: "Television", type: "tv" }],
    outdoorLight: [{ roomKey: roomIds.outdoor ? "outdoor" : "livingRoom", nameAr: "إنارة خارجية", nameEn: "Outdoor Light", type: "outdoorLight" }],
  };

  for (const appliance of selectedDevices || []) {
    const defs = deviceMap[appliance] || [];
    for (const d of defs) {
      const roomId = roomIds[d.roomKey];
      if (!roomId) continue;
      const meta = getDeviceMeta(d.type);
      db.prepare(
        `INSERT INTO devices (user_id, room_id, name_ar, name_en, type, is_on, is_essential, is_heavy, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(userId, roomId, d.nameAr, d.nameEn, d.type, d.type === "fridge" ? 1 : 0, meta.isEssential, meta.isHeavy, now, now);
    }
  }
}

function reconcileRoomsForEdit(userId: number, newTotalRooms: number, confirmRemoveRooms: boolean, now: string) {
  const db = getDb();
  ensureCoreRooms(userId, now);
  const targetBedrooms = bedroomsFromTotalRooms(newTotalRooms);
  const bedrooms = db.prepare("SELECT * FROM rooms WHERE user_id = ? AND type = 'bedroom' ORDER BY sort_order ASC").all(userId) as RoomRow[];

  if (bedrooms.length < targetBedrooms) {
    for (let i = bedrooms.length + 1; i <= targetBedrooms; i++) {
      const id = insertRoom(userId, `غرفة النوم ${i}`, `Bedroom ${i}`, "bedroom", 3 + i);
      addDefaultLight(userId, id, now);
    }
  }

  if (bedrooms.length > targetBedrooms) {
    if (!confirmRemoveRooms) {
      const error = new Error("CONFIRM_REMOVE_ROOMS");
      throw error;
    }
    const extra = bedrooms.slice(targetBedrooms);
    for (const room of extra) {
      db.prepare("DELETE FROM devices WHERE room_id = ? AND user_id = ?").run(room.id, userId);
      db.prepare("DELETE FROM rooms WHERE id = ? AND user_id = ?").run(room.id, userId);
    }
  }

  // Re-sort bedrooms after changes.
  const updatedBedrooms = db.prepare("SELECT id FROM rooms WHERE user_id = ? AND type = 'bedroom' ORDER BY sort_order ASC").all(userId) as { id: number }[];
  updatedBedrooms.forEach((room, index) => {
    db.prepare("UPDATE rooms SET sort_order = ? WHERE id = ? AND user_id = ?").run(4 + index, room.id, userId);
  });
}

router.post("/setup", requireAuth, (req: AuthRequest, res) => {
  const { homeType, roomCount, familySize, billLevel, hasBattery, batteryCapacity, selectedDevices, confirmRemoveRooms } = req.body as {
    homeType: string; roomCount: number; familySize: string; billLevel: string;
    hasBattery: boolean; batteryCapacity: number | null; selectedDevices: string[]; confirmRemoveRooms?: boolean;
  };

  const db = getDb();
  const userId = req.userId!;
  const now = new Date().toISOString();
  const totalRooms = normalizeTotalRooms(roomCount);

  const existing = db.prepare("SELECT * FROM home_setups WHERE user_id = ?").get(userId) as SetupRow | undefined;

  try {
    if (!existing) {
      db.prepare(
        `INSERT INTO home_setups (user_id, home_type, room_count, family_size, bill_level, has_battery, battery_capacity, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(userId, homeType, totalRooms, familySize, billLevel, hasBattery ? 1 : 0, batteryCapacity ?? null, now, now);

      createInitialRoomsAndDevices(userId, totalRooms, selectedDevices || [], now);
      addLog(userId, "تم إنشاء المنزل الرقمي", "Digital home created");

      // Ensure wallet exists
      ensureWallet(userId);

      // Create current invoice if no unpaid current one exists
      const freshDevices = db.prepare("SELECT * FROM devices WHERE user_id = ?").all(userId) as DeviceRow[];
      const freshSetup = db.prepare("SELECT * FROM home_setups WHERE user_id = ?").get(userId) as SetupRow;
      const freshBill = calcBill(
        { bill_level: freshSetup.bill_level, has_battery: freshSetup.has_battery, family_size: freshSetup.family_size },
        freshDevices
      );
      const currentMonth = new Date().toISOString().slice(0, 7);
      const existingCurrentInvoice = db.prepare(
        "SELECT id FROM invoices WHERE user_id = ? AND type = 'current' AND status = 'unpaid'"
      ).get(userId);
      if (!existingCurrentInvoice) {
        db.prepare(
          "INSERT INTO invoices (user_id, title, amount, status, type, month, created_at) VALUES (?, ?, ?, 'unpaid', 'current', ?, ?)"
        ).run(userId, "فاتورة هذا الشهر", freshBill.estimatedBill, currentMonth, now);
      }

      // Create demo previous invoices only once
      const existingPrevious = db.prepare(
        "SELECT id FROM invoices WHERE user_id = ? AND type = 'previous'"
      ).get(userId);
      if (!existingPrevious) {
        const prevData = [
          { daysAgo: 30, amount: freshBill.estimatedBill - 20 },
          { daysAgo: 60, amount: freshBill.estimatedBill + 15 },
          { daysAgo: 90, amount: freshBill.estimatedBill - 35 },
        ];
        for (const prev of prevData) {
          const prevDate = new Date(Date.now() - prev.daysAgo * 24 * 60 * 60 * 1000).toISOString();
          const prevMonth = prevDate.slice(0, 7);
          const paidAt = new Date(Date.now() - (prev.daysAgo - 5) * 24 * 60 * 60 * 1000).toISOString();
          db.prepare(
            "INSERT INTO invoices (user_id, title, amount, status, type, month, created_at, paid_at) VALUES (?, ?, ?, 'paid', 'previous', ?, ?, ?)"
          ).run(userId, "فاتورة شهر سابق", Math.max(50, prev.amount), prevMonth, prevDate, paidAt);
        }
      }
    } else {
      reconcileRoomsForEdit(userId, totalRooms, Boolean(confirmRemoveRooms), now);
      db.prepare(
        `UPDATE home_setups SET home_type=?, room_count=?, family_size=?, bill_level=?, has_battery=?, battery_capacity=?, updated_at=? WHERE user_id=?`
      ).run(homeType, totalRooms, familySize, billLevel, hasBattery ? 1 : 0, batteryCapacity ?? null, now, userId);
      addLog(userId, "تم تعديل بيانات المنزل", "Home details updated");
    }
  } catch (err) {
    if (err instanceof Error && err.message === "CONFIRM_REMOVE_ROOMS") {
      res.status(409).json({
        error: "Reducing rooms will delete extra rooms. Confirm to continue.",
        errorAr: "تقليل عدد الغرف سيحذف الغرف الزائدة وأجهزتها. أكّد الحفظ للمتابعة.",
        code: "CONFIRM_REMOVE_ROOMS",
      });
      return;
    }
    throw err;
  }

  db.prepare(
    `INSERT INTO modes (user_id, active_mode, battery_active, updated_at) VALUES (?, 'normal', 0, ?)
     ON CONFLICT(user_id) DO UPDATE SET active_mode='normal', battery_active=0, updated_at=?`
  ).run(userId, now, now);

  res.json({ success: true });
});

router.get("/", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;

  const user = db.prepare("SELECT id, name, area, role FROM users WHERE id = ?").get(userId);
  const setup = db.prepare("SELECT * FROM home_setups WHERE user_id = ?").get(userId) as SetupRow | undefined;
  const rooms = db.prepare("SELECT * FROM rooms WHERE user_id = ? ORDER BY sort_order").all(userId);
  const devices = db.prepare("SELECT * FROM devices WHERE user_id = ?").all(userId) as DeviceRow[];
  const mode = db.prepare("SELECT * FROM modes WHERE user_id = ?").get(userId);
  const activityLogs = db.prepare("SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10").all(userId);

  const batteryCapacity = setup ? setup.battery_capacity : null;
  const hasBattery = setup ? Boolean(setup.has_battery) : false;
  const billInfo = setup ? calcBill(
    {
      bill_level: setup.bill_level,
      has_battery: setup.has_battery,
      family_size: setup.family_size,
    },
    devices
  ) : null;

  res.json({
    user,
    setup: setup || null,
    rooms,
    devices,
    mode: mode || { active_mode: "normal", battery_active: 0 },
    bill: billInfo,
    battery: {
      capacity: batteryCapacity,
      hasBattery,
      runtimeHours: calcBatteryRuntime(batteryCapacity),
    },
    activityLogs,
  });
});

router.put("/setup", requireAuth, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;
  const { homeType, roomCount, familySize, billLevel, hasBattery, batteryCapacity, confirmRemoveRooms } = req.body as Record<string, unknown>;
  const now = new Date().toISOString();
  const totalRooms = normalizeTotalRooms(roomCount);
  try {
    reconcileRoomsForEdit(userId, totalRooms, Boolean(confirmRemoveRooms), now);
  } catch (err) {
    if (err instanceof Error && err.message === "CONFIRM_REMOVE_ROOMS") {
      res.status(409).json({ errorAr: "تقليل عدد الغرف سيحذف الغرف الزائدة وأجهزتها. أكّد الحفظ للمتابعة.", code: "CONFIRM_REMOVE_ROOMS" });
      return;
    }
    throw err;
  }
  db.prepare(
    `UPDATE home_setups SET home_type=?, room_count=?, family_size=?, bill_level=?, has_battery=?, battery_capacity=?, updated_at=? WHERE user_id=?`
  ).run(homeType, totalRooms, familySize, billLevel, hasBattery ? 1 : 0, batteryCapacity ?? null, now, userId);
  addLog(userId, "تم تحديث إعدادات المنزل", "Home setup updated");
  res.json({ success: true });
});

export { calcBill, calcBatteryRuntime };
export default router;
