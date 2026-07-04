import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { api, type ApiDevice } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Wind, Archive, RefreshCw, Tv, Sun, Lightbulb, Trash2, Plus, Wifi, Smartphone, Pencil, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RoomPanelProps { roomId: number | null; onClose: () => void; }

const DEVICE_TYPES = [
  { type: "light", ar: "إضاءة", en: "Light", Icon: Lightbulb },
  { type: "heater", ar: "سخان", en: "Heater", Icon: Flame },
  { type: "ac", ar: "مكيف", en: "AC", Icon: Wind },
  { type: "fridge", ar: "ثلاجة", en: "Fridge", Icon: Archive },
  { type: "washingMachine", ar: "غسالة", en: "Washer", Icon: RefreshCw },
  { type: "tv", ar: "تلفزيون", en: "TV", Icon: Tv },
  { type: "outdoorLight", ar: "إنارة خارجية", en: "Outdoor Light", Icon: Sun },
  { type: "wifi", ar: "راوتر", en: "WiFi", Icon: Wifi },
  { type: "phone", ar: "شاحن هاتف", en: "Phone Charger", Icon: Smartphone },
  { type: "other", ar: "جهاز آخر", en: "Other", Icon: Lightbulb },
];

function getDeviceIcon(type: string) { return DEVICE_TYPES.find(d => d.type === type)?.Icon ?? Lightbulb; }

export function RoomPanel({ roomId, onClose }: RoomPanelProps) {
  const { t, isRtl } = useLanguage();
  const { rooms, devices, setDevices, refreshHome, mode } = useHome();
  const { toast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDeviceType, setNewDeviceType] = useState("light");
  const [newDeviceNameAr, setNewDeviceNameAr] = useState("");
  const [addingDevice, setAddingDevice] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [savingName, setSavingName] = useState(false);

  if (!roomId) return null;
  const room = rooms.find(r => r.id === roomId);
  if (!room) return null;
  const roomDevices = devices.filter(d => d.room_id === roomId);

  const startRename = () => {
    setRoomName(t(room.name_ar, room.name_en));
    setEditingName(true);
  };

  const handleRename = async () => {
    if (!roomName.trim()) return;
    setSavingName(true);
    try {
      await api.renameRoom(room.id, roomName.trim(), roomName.trim());
      await refreshHome();
      setEditingName(false);
      toast({ title: t("تم تعديل اسم الغرفة", "Room name updated"), duration: 2000 });
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : t("حدث خطأ", "Error"), variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  };

  const handleToggle = async (device: ApiDevice) => {
    const newState = !device.is_on;
    setDevices(devices.map(d => d.id === device.id ? { ...d, is_on: newState ? 1 : 0 } : d));
    try {
      await api.toggleDevice(device.id, newState);
      await refreshHome();
      const deviceName = t(device.name_ar, device.name_en);
      toast({ title: newState ? t(`تم تشغيل ${deviceName}`, `${deviceName} turned on`) : t(`تم إطفاء ${deviceName}`, `${deviceName} turned off`), duration: 2000 });
    } catch {
      await refreshHome();
      toast({ title: t("تعذر تعديل الجهاز", "Could not update device"), variant: "destructive" });
    }
  };

  const handleDelete = async (device: ApiDevice) => {
    const ok = window.confirm(t(`هل تريد حذف ${device.name_ar}؟`, `Delete ${device.name_en}?`));
    if (!ok) return;
    try {
      await api.deleteDevice(device.id);
      await refreshHome();
      toast({ title: t(`تم حذف ${device.name_ar}`, `${device.name_en} deleted`), duration: 2000 });
    } catch {
      await refreshHome();
      toast({ title: t("تعذر حذف الجهاز", "Could not delete device"), variant: "destructive" });
    }
  };

  const handleAddDevice = async () => {
    if (!newDeviceNameAr.trim()) return;
    const typeDef = DEVICE_TYPES.find(d => d.type === newDeviceType);
    const nameEn = typeDef?.en ?? newDeviceNameAr;
    setAddingDevice(true);
    try {
      await api.addDevice(roomId, newDeviceNameAr.trim(), nameEn, newDeviceType);
      await refreshHome();
      setShowAddForm(false);
      setNewDeviceNameAr("");
      setNewDeviceType("light");
      toast({ title: t("تم إضافة الجهاز", "Device added"), duration: 2000 });
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : t("حدث خطأ", "Error"), variant: "destructive", duration: 2000 });
    } finally {
      setAddingDevice(false);
    }
  };

  const isOutage = mode === "outage";

  return (
    <AnimatePresence>
      <motion.div initial={{ x: isRtl ? "-100%" : "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: isRtl ? "-100%" : "100%", opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className={`fixed top-0 ${isRtl ? "left-0" : "right-0"} bottom-0 w-80 z-40 flex flex-col shadow-2xl border-white/10 ${isRtl ? "border-r" : "border-l"}`} style={{ background: "rgba(8, 14, 30, 0.96)", backdropFilter: "blur(20px)" }}>
        <div className="px-5 py-4 border-b border-white/8 pt-16">
          <div className="flex items-center justify-between gap-2">
            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <input value={roomName} onChange={e => setRoomName(e.target.value)} className="flex-1 bg-slate-950/70 border border-cyan-500/30 text-white rounded-xl h-9 px-3 text-sm focus:outline-none" />
                <button onClick={handleRename} disabled={savingName} className="p-2 rounded-xl bg-cyan-500 text-slate-950"><Save className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{t(room.name_ar, room.name_en)}</h2>
                <button onClick={startRename} className="p-1.5 rounded-lg text-white/35 hover:text-cyan-300 hover:bg-white/8" title={t("تعديل اسم الغرفة", "Rename room")}><Pencil className="w-4 h-4" /></button>
              </div>
            )}
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/8 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-white/35 text-xs mt-2">{t("يمكنك تشغيل/إطفاء الأجهزة أو إضافة وحذف جهاز.", "Turn devices on/off or add/delete devices.")}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {roomDevices.length === 0 && !showAddForm && <div className="text-center py-8 text-white/30 text-sm">{t("لا توجد أجهزة في هذه الغرفة", "No devices in this room")}</div>}
          {roomDevices.map(device => {
            const Icon = getDeviceIcon(device.type);
            const isOn = Boolean(device.is_on);
            const isHeavy = Boolean(device.is_heavy);
            const disabledByMode = isOutage && isHeavy;
            return <motion.div key={device.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${isOn ? "bg-cyan-500/10 border-cyan-500/30" : "bg-white/3 border-white/8"} ${disabledByMode ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0"><div className={`p-2 rounded-lg ${isOn ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800/60 text-white/40"}`}><Icon className="w-4 h-4" /></div><div className="min-w-0"><p className={`text-sm font-medium truncate ${isOn ? "text-white" : "text-white/60"}`}>{t(device.name_ar, device.name_en)}</p>{disabledByMode && <p className="text-amber-400/60 text-xs">{t("غير مناسب للبطارية", "Not for battery")}</p>}</div></div>
              <div className="flex items-center gap-2"><button onClick={() => !disabledByMode && handleToggle(device)} disabled={disabledByMode} className={`w-11 h-6 rounded-full relative transition-colors ${isOn ? "bg-cyan-500" : "bg-slate-700"}`}><motion.div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" animate={{ [isRtl ? "right" : "left"]: isOn ? "calc(100% - 20px)" : "4px" }} /></button><button onClick={() => handleDelete(device)} className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button></div>
            </motion.div>;
          })}

          <AnimatePresence>{showAddForm && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="p-4 rounded-xl bg-white/4 border border-white/10 space-y-3">
            <p className="text-white/80 text-sm font-medium">{t("إضافة جهاز جديد", "Add New Device")}</p>
            <div className="space-y-2"><label className="text-white/50 text-xs">{t("نوع الجهاز", "Device Type")}</label><select value={newDeviceType} onChange={e => { const typeDef = DEVICE_TYPES.find(d => d.type === e.target.value); setNewDeviceType(e.target.value); if (typeDef) setNewDeviceNameAr(t(typeDef.ar, typeDef.en)); }} className="w-full bg-slate-900/60 border border-white/10 text-white text-sm h-9 rounded-lg px-2 focus:outline-none focus:border-cyan-400">{DEVICE_TYPES.map(d => <option key={d.type} value={d.type} className="bg-slate-900">{t(d.ar, d.en)}</option>)}</select></div>
            <div className="space-y-2"><label className="text-white/50 text-xs">{t("اسم الجهاز", "Device Name")}</label><input value={newDeviceNameAr} onChange={e => setNewDeviceNameAr(e.target.value)} placeholder={t("مثال: سخان الحمام", "e.g. Bathroom heater")} className="w-full bg-slate-900/60 border border-white/10 text-white text-sm h-9 rounded-lg px-3 focus:outline-none focus:border-cyan-400 placeholder:text-white/20" /></div>
            <div className="flex gap-2"><button onClick={handleAddDevice} disabled={addingDevice || !newDeviceNameAr.trim()} className="flex-1 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-900 font-bold text-sm">{addingDevice ? "..." : t("إضافة", "Add")}</button><button onClick={() => setShowAddForm(false)} className="px-3 h-8 rounded-lg border border-white/10 text-white/50 text-sm hover:bg-white/5">{t("إلغاء", "Cancel")}</button></div>
          </motion.div>}</AnimatePresence>
        </div>

        {!showAddForm && <div className="px-4 py-3 border-t border-white/8"><button onClick={() => setShowAddForm(true)} className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed border-white/15 text-white/40 hover:text-white/70 hover:border-white/25 text-sm"><Plus className="w-4 h-4" />{t("إضافة جهاز", "Add Device")}</button></div>}
      </motion.div>
    </AnimatePresence>
  );
}
