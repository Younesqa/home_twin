import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, type ApiUser, type ApiRoom, type ApiDevice, type ApiSetup, type BillInfo, type BatteryInfo, type ActivityLog, type HomeData } from "@/lib/api";

export type HomeMode = "normal" | "saving" | "night" | "outage";

interface HomeContextType {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  setup: ApiSetup | null;
  rooms: ApiRoom[];
  devices: ApiDevice[];
  mode: HomeMode;
  bill: BillInfo | null;
  battery: BatteryInfo;
  activityLogs: ActivityLog[];
  login: (token: string, user: ApiUser) => void;
  logout: () => void;
  refreshHome: () => Promise<HomeData | null>;
  setDevices: (devices: ApiDevice[]) => void;
  setMode: (mode: HomeMode) => void;
  setActivityLogs: (logs: ActivityLog[]) => void;
}

const HomeContext = createContext<HomeContextType | undefined>(undefined);
const DEFAULT_BATTERY: BatteryInfo = { capacity: null, hasBattery: false, runtimeHours: 0 };

export function HomeProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("homeTwinToken"));
  const [isLoading, setIsLoading] = useState(true);
  const [setup, setSetup] = useState<ApiSetup | null>(null);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [devices, setDevices] = useState<ApiDevice[]>([]);
  const [mode, setModeState] = useState<HomeMode>("normal");
  const [bill, setBill] = useState<BillInfo | null>(null);
  const [battery, setBattery] = useState<BatteryInfo>(DEFAULT_BATTERY);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const applyHomeData = useCallback((data: HomeData) => {
    setSetup(data.setup);
    setRooms(data.rooms);
    setDevices(data.devices);
    setModeState((data.mode?.active_mode || "normal") as HomeMode);
    setBill(data.bill);
    setBattery(data.battery);
    setActivityLogs(data.activityLogs || []);
  }, []);

  const refreshHome = useCallback(async (): Promise<HomeData | null> => {
    try {
      const data = await api.getHome();
      applyHomeData(data);
      return data;
    } catch (err) {
      console.error("Failed to refresh home", err);
      return null;
    }
  }, [applyHomeData]);

  const login = useCallback((newToken: string, newUser: ApiUser) => {
    localStorage.setItem("homeTwinToken", newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("homeTwinToken");
    setToken(null);
    setUser(null);
    setSetup(null);
    setRooms([]);
    setDevices([]);
    setModeState("normal");
    setBill(null);
    setBattery(DEFAULT_BATTERY);
    setActivityLogs([]);
  }, []);

  const setMode = useCallback((newMode: HomeMode) => setModeState(newMode), []);

  useEffect(() => {
    const storedToken = localStorage.getItem("homeTwinToken");
    if (!storedToken) { setIsLoading(false); return; }

    api.me()
      .then(({ user: fetchedUser }) => {
        setUser(fetchedUser);
        setToken(storedToken);
        return api.getHome();
      })
      .then(applyHomeData)
      .catch(() => {
        localStorage.removeItem("homeTwinToken");
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [applyHomeData]);

  return (
    <HomeContext.Provider value={{
      user, token, isLoading, setup, rooms, devices, mode, bill, battery, activityLogs,
      login, logout, refreshHome, setDevices, setMode, setActivityLogs,
    }}>
      {children}
    </HomeContext.Provider>
  );
}

export function useHome() {
  const ctx = useContext(HomeContext);
  if (!ctx) throw new Error("useHome must be used within HomeProvider");
  return ctx;
}
