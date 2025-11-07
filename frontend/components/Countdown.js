// frontend/components/Countdown.js
import { motion, AnimatePresence } from 'framer-motion';

export default function Countdown({ value = null }) {
  if (value === null) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[56] grid place-items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.5, opacity: 0, rotate: 15 }}
          transition={{ 
            duration: 0.35, 
            ease: [0.34, 1.56, 0.64, 1], // spring-like easing
          }}
          className="relative"
        >
          {/* Glow effect */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.3, 1.1], opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 bg-rose-400 rounded-full blur-3xl"
          />
          
          {/* Main text */}
          <div className="relative text-white text-8xl font-black drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" 
               style={{ 
                 textShadow: '0 0 20px rgba(244, 63, 94, 0.8), 0 0 40px rgba(244, 63, 94, 0.4)',
                 WebkitTextStroke: '2px rgba(0,0,0,0.2)'
               }}>
            {value === 0 ? 'Go!' : value}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}