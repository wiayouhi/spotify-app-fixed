import { createContext, useContext, useState, useCallback } from "react";

/**
 * DeviceContext
 * ─────────────
 * ปัญหาเดิม: WebPlayer.jsx เก็บ deviceId ของตัวเองไว้คนเดียว (useRef ภายใน
 * component) ทำให้ SearchBar / PlayerControls / VolumeSlider ไม่รู้จัก device
 * ของเว็บเลย เวลาสั่งเล่น/พัก/เปลี่ยนเสียง คำสั่งเลยไม่มี device_id กำกับ
 * แล้วปล่อยให้ Spotify เดาเอาว่าจะสั่งอุปกรณ์ไหน (บางทีก็ไปเข้าเครื่องอื่นแทน
 * เว็บ ทำให้เพลงที่เลือกในเว็บไม่เล่นต่อ)
 *
 * Context นี้เป็นจุดกลางเก็บ "device_id ของเว็บเบราว์เซอร์ตอนนี้" +
 * สถานะว่าเว็บเป็นตัวที่ผู้ใช้ต้องการเล่นอยู่หรือเปล่า (isWebPlayerActive)
 * ให้ทุก component ที่สั่งงาน Spotify API เรียกใช้ร่วมกัน
 */
const DeviceContext = createContext({
  webDeviceId: null,
  isWebPlayerActive: false,
  setWebDeviceId: () => {},
  setIsWebPlayerActive: () => {},
  // targetDeviceId: device_id ที่ควรแนบไปกับคำสั่งเล่นเพลงทุกตัว
  // ถ้าเว็บ active → ใช้ id ของเว็บ, ถ้าไม่ → undefined (ให้ Spotify ใช้ device ที่ active อยู่ตามปกติ)
  targetDeviceId: null,
});

export function DeviceProvider({ children }) {
  const [webDeviceId, setWebDeviceId] = useState(null);
  const [isWebPlayerActive, setIsWebPlayerActive] = useState(false);

  const targetDeviceId = isWebPlayerActive ? webDeviceId : undefined;

  const value = {
    webDeviceId,
    isWebPlayerActive,
    setWebDeviceId: useCallback((id) => setWebDeviceId(id), []),
    setIsWebPlayerActive: useCallback((v) => setIsWebPlayerActive(v), []),
    targetDeviceId,
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  return useContext(DeviceContext);
}
