import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

export default function MoreMenu({ items }) {
  const [open, setOpen] = useState(false);
  const [hoverKey, setHoverKey] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div className="more-menu-wrap" ref={ref}>
      <motion.button
        className={`icon-btn more-menu-trigger ${open ? "active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        title="เพิ่มเติม"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="more-menu-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {items.map((item, i) => (
              <motion.button
                key={item.key}
                className={`more-menu-item ${item.active ? "active" : ""}`}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                onMouseEnter={() => setHoverKey(item.key)}
                onMouseLeave={() => setHoverKey(null)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
              >
                <motion.span
                  className="more-menu-icon"
                  animate={{
                    scale: hoverKey === item.key ? 1.15 : 1,
                    rotate: hoverKey === item.key ? 8 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  {item.icon}
                </motion.span>
                <span>{item.label}</span>

                {item.active && (
                  <motion.span
                    layoutId="more-menu-active-dot"
                    className="more-menu-active-dot"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
