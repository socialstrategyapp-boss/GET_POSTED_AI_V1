import { motion } from 'framer-motion'

/**
 * Neon Glow Ring spinner — used for loading states.
 * A ring with pink top + cyan right borders, spinning and glowing.
 */
export default function NeonSpinner({ size = 20 }: { size?: number }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2px solid transparent',
        borderTopColor: '#ff0099',
        borderRightColor: '#00ccff',
        boxShadow: '0 0 15px rgba(255, 0, 153, 0.3)',
      }}
    />
  )
}
