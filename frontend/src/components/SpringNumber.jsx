import { useEffect } from 'react'
import { useSpring, useTransform, motion, useReducedMotion } from 'framer-motion'

const LEVELS = {
  micro: { stiffness: 300, damping: 30 },
  ui:    { stiffness: 170, damping: 26 },
  story: { stiffness: 60,  damping: 18, mass: 1.1 },
}

/**
 * A number that springs to its target when `value` changes.
 *   <SpringNumber value={spent} format={money} level="story" />
 */
export default function SpringNumber({
  value = 0,
  format = (n) => Math.round(n).toLocaleString('en-IN'),
  level = 'ui',
  className,
  style,
}) {
  const reduce = useReducedMotion()
  const mv = useSpring(value, LEVELS[level] || LEVELS.ui)
  const text = useTransform(mv, (n) => format(n))

  useEffect(() => {
    if (reduce) mv.jump(value)
    else mv.set(value)
  }, [value, reduce, mv])

  return (
    <motion.span className={className} style={{ ...style, fontVariantNumeric: 'tabular-nums' }}>
      {text}
    </motion.span>
  )
}
