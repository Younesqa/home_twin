const BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("homeTwinToken");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) Object.assign(headers, authHeaders());

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.errorAr || data.error || "Request failed";
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  // Auth
  register: (name: string, area: string, password: string) =>
    request<{ token: string; user: ApiUser }>("POST", "/auth/register", { name, area, password }, false),

  login: (name: string, password: string) =>
    request<{ token: string; user: ApiUser }>("POST", "/auth/login", { name, password }, false),

  me: () => request<{ user: ApiUser }>("GET", "/auth/me"),

  // Home
  setupHome: (data: SetupPayload) => request<{ success: boolean }>("POST", "/home/setup", data),
  getHome: () => request<HomeData>("GET", "/home"),
  renameRoom: (id: number, nameAr: string, nameEn?: string) =>
    request<{ room: ApiRoom }>("PATCH", `/rooms/${id}`, { nameAr, nameEn }),

  // Devices
  addDevice: (roomId: number, nameAr: string, nameEn: string, type: string) =>
    request<{ device: ApiDevice }>("POST", "/devices", { roomId, nameAr, nameEn, type }),

  toggleDevice: (id: number, isOn: boolean) =>
    request<{ success: boolean; isOn: boolean }>("PATCH", `/devices/${id}/toggle`, { isOn }),

  deleteDevice: (id: number) => request<{ success: boolean }>("DELETE", `/devices/${id}`),

  // Mode
  setMode: (mode: string) => request<{ success: boolean; mode: ApiMode; devices: ApiDevice[] }>("POST", "/mode", { mode }),

  // Complaints
  getMyComplaints: () => request<{ complaints: Complaint[] }>("GET", "/complaints/my"),
  submitComplaint: (title: string, message: string) =>
    request<{ complaint: Complaint }>("POST", "/complaints", { title, message }),

  // Admin
  adminStats: () => request<{ totalCitizens: number; byArea: { area: string; count: number }[] }>("GET", "/admin/stats"),
  adminUsers: () => request<{ users: ApiUser[] }>("GET", "/admin/users"),
  adminUserDetail: (id: number) => request<AdminUserDetail>("GET", `/admin/users/${id}`),
  adminComplaints: () => request<{ complaints: Complaint[] }>("GET", "/complaints/admin/all"),
  adminReplyComplaint: (id: number, reply: string) =>
    request<{ complaint: Complaint }>("PATCH", `/complaints/admin/${id}/reply`, { reply }),
};

// Types
export interface ApiUser {
  id: number;
  name: string;
  area: string;
  role: string;
  created_at?: string;
}

export interface ApiRoom {
  id: number;
  user_id: number;
  name_ar: string;
  name_en: string;
  type: string;
  sort_order: number;
}

export interface ApiDevice {
  id: number;
  user_id: number;
  room_id: number;
  name_ar: string;
  name_en: string;
  type: string;
  is_on: number;
  is_essential: number;
  is_heavy: number;
}

export interface ApiMode {
  active_mode: string;
  battery_active: number;
}

export interface ApiSetup {
  id: number;
  user_id: number;
  home_type: string;
  room_count: number;
  family_size: string;
  bill_level: string;
  has_battery: number;
  battery_capacity: number | null;
}

export interface BillInfo {
  estimatedBill: number;
  mainReasonAr: string;
  mainReasonEn: string;
  tipAr: string;
  tipEn: string;
  noteAr: string;
  noteEn: string;
}

export interface BatteryInfo {
  capacity: number | null;
  hasBattery: boolean;
  runtimeHours: number;
}

export interface ActivityLog {
  id: number;
  message_ar: string;
  message_en: string;
  created_at: string;
}

export interface HomeData {
  user: ApiUser;
  setup: ApiSetup | null;
  rooms: ApiRoom[];
  devices: ApiDevice[];
  mode: ApiMode;
  bill: BillInfo | null;
  battery: BatteryInfo;
  activityLogs: ActivityLog[];
}

export interface SetupPayload {
  homeType: string;
  roomCount: number;
  familySize: string;
  billLevel: string;
  hasBattery: boolean;
  batteryCapacity: number | null;
  selectedDevices: string[];
  confirmRemoveRooms?: boolean;
}


export interface Complaint {
  id: number;
  user_id: number;
  title: string;
  message: string;
  status: "open" | "replied" | "closed" | string;
  reply?: string | null;
  replied_by?: number | null;
  created_at: string;
  replied_at?: string | null;
  user_name?: string;
  user_area?: string;
}

export interface AdminUserDetail extends HomeData {
  user: ApiUser;
}
