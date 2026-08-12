import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function IconButton({ icon, label, active, onClick, className = "" }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="icon-btn-wrap"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <motion.button
        className={`icon-btn ${active ? "active" : ""} ${className}`}
        onClick={onClick}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {icon}
      </motion.button>

      <AnimatePresence>
        {hover && label && (
          <motion.div
            className="icon-tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
