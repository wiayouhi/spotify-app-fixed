import { useState, useEffect } from "react";

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return (
    <div className="app-clock" style={{ fontSize: "1.1rem", fontWeight: "bold", marginLeft: "auto", marginRight: "1rem", color: "var(--text-secondary)" }}>
      {timeString}
    </div>
  );
}
