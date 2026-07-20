import { useState, useEffect } from "react";
import LoginScreen from "./LoginScreen";
import LoginScreenMobile from "./LoginScreenMobile";

const MOBILE_BREAKPOINT = 900;

// ────────────────────────────────────────
//  ตัวสลับหน้าจอตามความกว้างของ viewport
//
//  ⚠️ มือถือยังไม่รองรับอย่างเป็นทางการ:
//  LoginScreenMobile.jsx เป็น UI แบบ first-pass ที่แยกไฟล์
//  ออกมาต่างหากตามที่ขอ แต่ยังไม่ผ่านการทดสอบบนอุปกรณ์จริง
//  (ขนาดจอต่างๆ, safe-area ของ notch, performance ของ
//  framer-motion บนมือถือรุ่นล่าง ฯลฯ) ก่อนใช้งานจริงควร
//  ทดสอบให้ครบก่อน ship — ตอนนี้ถือว่าเป็น work-in-progress
// ────────────────────────────────────────
export default function LoginScreenSwitcher() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile ? <LoginScreenMobile /> : <LoginScreen />;
}
