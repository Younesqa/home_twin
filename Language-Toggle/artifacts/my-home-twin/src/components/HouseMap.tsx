import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { motion } from "framer-motion";
import type { ApiRoom } from "@/lib/api";

interface HouseMapProps { onRoomClick: (roomId: number) => void; activeRoomId: number | null; }
interface RoomSlot { x: number; y: number; w: number; h: number }

function buildRoomLayouts(rooms: ApiRoom[]): Map<number, RoomSlot> {
  const layoutMap = new Map<number, RoomSlot>();
  const living = rooms.find(r => r.type === "livingRoom");
  const kitchen = rooms.find(r => r.type === "kitchen");
  const bathroom = rooms.find(r => r.type === "bathroom");
  const outdoor = rooms.find(r => r.type === "outdoor");
  const bedrooms = rooms.filter(r => r.type === "bedroom").sort((a, b) => a.sort_order - b.sort_order);

  if (living) layoutMap.set(living.id, { x: 40, y: 110, w: 250, h: 140 });
  if (kitchen) layoutMap.set(kitchen.id, { x: 310, y: 110, w: 250, h: 140 });
  if (bathroom) layoutMap.set(bathroom.id, { x: 40, y: 270, w: 150, h: 95 });

  const bedroomSlots: RoomSlot[] = [
    { x: 210, y: 270, w: 165, h: 95 },
    { x: 395, y: 270, w: 165, h: 95 },
    { x: 40, y: 385, w: 165, h: 90 },
    { x: 225, y: 385, w: 165, h: 90 },
    { x: 410, y: 385, w: 150, h: 90 },
  ];
  bedrooms.forEach((room, index) => layoutMap.set(room.id, bedroomSlots[index] ?? bedroomSlots[bedroomSlots.length - 1]));
  if (outdoor) layoutMap.set(outdoor.id, { x: 40, y: 485, w: 520, h: 45 });
  return layoutMap;
}

export function HouseMap({ onRoomClick, activeRoomId }: HouseMapProps) {
  const { t } = useLanguage();
  const { mode, rooms, devices, battery } = useHome();
  const isOutage = mode === "outage";
  const isNight = mode === "night";
  const isSaving = mode === "saving";
  const layoutMap = buildRoomLayouts(rooms);

  function getRoomColor(roomId: number) {
    const roomDevices = devices.filter(d => d.room_id === roomId);
    const hasLightOn = roomDevices.some(d => d.type === "light" && d.is_on);
    const hasDeviceOn = roomDevices.some(d => d.is_on);
    if (isOutage) return hasLightOn ? "rgba(245,158,11,0.25)" : "rgba(15,23,42,0.55)";
    if (isNight) return hasLightOn ? "rgba(59,130,246,0.22)" : "rgba(15,23,42,0.42)";
    if (isSaving) return hasDeviceOn ? "rgba(16,185,129,0.18)" : "rgba(15,23,42,0.4)";
    return hasDeviceOn ? "rgba(0,229,255,0.18)" : "rgba(15,23,42,0.35)";
  }

  function getRoomStroke(roomId: number, isActive: boolean) {
    if (isActive) return "#00e5ff";
    const hasDeviceOn = devices.filter(d => d.room_id === roomId).some(d => d.is_on);
    if (isOutage) return hasDeviceOn ? "rgba(245,158,11,0.7)" : "rgba(255,255,255,0.12)";
    if (isNight) return hasDeviceOn ? "rgba(59,130,246,0.7)" : "rgba(255,255,255,0.12)";
    if (isSaving) return hasDeviceOn ? "rgba(16,185,129,0.7)" : "rgba(255,255,255,0.12)";
    return hasDeviceOn ? "rgba(0,229,255,0.6)" : "rgba(255,255,255,0.12)";
  }

  const gridLines: string[] = [];
  for (let x = 0; x <= 640; x += 40) gridLines.push(`M${x},0 L${x},560`);
  for (let y = 0; y <= 560; y += 40) gridLines.push(`M0,${y} L640,${y}`);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2">
      <svg viewBox="0 0 640 560" className="w-full h-full" preserveAspectRatio="xMidYMid meet" style={{ maxHeight: 480 }}>
        <defs>
          <filter id="glow-cyan-hm"><feGaussianBlur stdDeviation="6" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="glow-amber-hm"><feGaussianBlur stdDeviation="8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="glow-emerald-hm"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {gridLines.map((d, i) => <path key={i} d={d} stroke="rgba(255,255,255,0.025)" strokeWidth="1" />)}

        <motion.line x1="320" y1="0" x2="320" y2="52" stroke={isOutage ? "rgba(100,100,100,0.3)" : "#00e5ff"} strokeWidth="2" strokeDasharray="6 6" animate={isOutage ? {} : { strokeDashoffset: [12, 0] }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
        <path d="M20,110 L320,22 L600,110 L600,540 L20,540 Z" fill="rgba(8,14,30,0.62)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
        <path d="M12,112 L320,18 L608,112" fill="none" stroke={isOutage ? "rgba(100,100,100,0.4)" : "rgba(0,229,255,0.5)"} strokeWidth="2" />

        {rooms.map((room, idx) => {
          const layout = layoutMap.get(room.id);
          if (!layout) return null;
          const isActive = activeRoomId === room.id;
          const fill = getRoomColor(room.id);
          const stroke = getRoomStroke(room.id, isActive);
          const label = t(room.name_ar, room.name_en);
          const onCount = devices.filter(d => d.room_id === room.id && d.is_on).length;
          const cx = layout.x + layout.w / 2;
          const midY = layout.y + layout.h / 2;
          return (
            <g key={room.id} onClick={() => onRoomClick(room.id)} className="cursor-pointer">
              <motion.rect x={layout.x} y={layout.y} width={layout.w} height={layout.h} rx="10" fill={fill} stroke={stroke} strokeWidth={isActive ? 2.5 : 1.2} filter={isActive ? "url(#glow-cyan-hm)" : undefined} animate={{ fillOpacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 3 + idx * 0.35 }} />
              {isActive && <motion.rect x={layout.x - 4} y={layout.y - 4} width={layout.w + 8} height={layout.h + 8} rx="12" fill="none" stroke="#00e5ff" strokeWidth="1.5" animate={{ strokeOpacity: [0.25, 0.7, 0.25] }} transition={{ repeat: Infinity, duration: 1.5 }} />}
              {onCount > 0 && <motion.circle cx={layout.x + layout.w - 12} cy={layout.y + 12} r={5} fill={isOutage ? "#f59e0b" : isNight ? "#3b82f6" : "#00e5ff"} filter={isOutage ? "url(#glow-amber-hm)" : "url(#glow-cyan-hm)"} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 1.5 }} />}
              <text x={cx} y={midY - 8} textAnchor="middle" fill="white" fontSize="12" fontWeight="700" opacity={0.92}>{label}</text>
              <text x={cx} y={midY + 10} textAnchor="middle" fill={onCount > 0 ? "rgba(0,229,255,0.85)" : "rgba(255,255,255,0.35)"} fontSize="10">{onCount > 0 ? t(`${onCount} يعمل`, `${onCount} on`) : t("مطفأ", "off")}</text>
            </g>
          );
        })}

        {battery.hasBattery && <g>
          <rect x="570" y="302" width="36" height="110" rx="12" fill="rgba(8,14,30,0.85)" stroke={isOutage ? "rgba(245,158,11,0.9)" : "rgba(16,185,129,0.7)"} strokeWidth="1.5" />
          <rect x="578" y="296" width="20" height="8" rx="4" fill={isOutage ? "rgba(245,158,11,0.7)" : "rgba(16,185,129,0.7)"} />
          <motion.rect x="575" y="348" width="26" height="58" rx="8" fill={isOutage ? "#f59e0b" : "#10b981"} filter={isOutage ? "url(#glow-amber-hm)" : "url(#glow-emerald-hm)"} animate={{ opacity: isOutage ? [0.6, 1, 0.6] : [0.7, 0.95, 0.7] }} transition={{ repeat: Infinity, duration: 2 }} />
          <text x="588" y="430" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">{t("بطارية", "battery")}</text>
          {isOutage && <motion.path d="M570,355 L480,355 L480,270" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 6" fill="none" filter="url(#glow-amber-hm)" animate={{ strokeDashoffset: [12, 0] }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />}
        </g>}

        {!isOutage && rooms.slice(0, 3).map((room, idx) => {
          const layout = layoutMap.get(room.id);
          if (!layout) return null;
          return <motion.line key={`energy-${room.id}`} x1="320" y1="52" x2={layout.x + layout.w / 2} y2={layout.y} stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="5 5" animate={{ strokeDashoffset: [10, 0] }} transition={{ repeat: Infinity, duration: 1.2 + idx * 0.3, ease: "linear" }} />;
        })}

        {isOutage && <motion.text x="320" y="552" textAnchor="middle" fill="rgba(245,158,11,0.9)" fontSize="11" fontWeight="700" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>{t("انقطاع كهرباء — البطارية تعمل", "Power Outage — Battery Active")}</motion.text>}
        {isNight && <text x="320" y="552" textAnchor="middle" fill="rgba(59,130,246,0.85)" fontSize="11">{t("وضع الليل — إضاءة أساسية", "Night Mode — Essential Lights")}</text>}
        {isSaving && <text x="320" y="552" textAnchor="middle" fill="rgba(16,185,129,0.85)" fontSize="11">{t("وضع التوفير — أجهزة ثقيلة مطفأة", "Saving Mode — Heavy Devices Off")}</text>}
      </svg>
    </div>
  );
}
