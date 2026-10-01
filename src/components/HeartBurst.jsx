import { AnimatePresence, motion } from 'framer-motion'

const EMOJIS = ['💗', '🍼', '✨', '🌸', '🤍', '🍓']

export default function HeartBurst({ trigger }) {
  if (!trigger) return null
  const hearts = Array.from({ length: 14 }, (_, i) => ({
    id: `${trigger}-${i}`,
    left: 12 + Math.random() * 76,
    top: 45 + Math.random() * 30,
    emoji: EMOJIS[i % EMOJIS.length],
    delay: Math.random() * 0.25,
    size: 16 + Math.random() * 20,
  }))
  return (
    <div className="heart-burst" key={trigger} aria-hidden="true">
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.span
            key={h.id}
            initial={{ opacity: 0, y: 0, scale: 0.3 }}
            animate={{ opacity: [0, 1, 1, 0], y: -260, scale: 1.3, x: (Math.random() - 0.5) * 120 }}
            transition={{ duration: 1.6, delay: h.delay, ease: 'easeOut' }}
            style={{ left: `${h.left}%`, top: `${h.top}%`, fontSize: h.size, position: 'absolute' }}
          >
            {h.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}
