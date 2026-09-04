// Motion system — three deliberate levels, spring-driven.
//
//   L1  micro      ~120-180ms   hover, press, icon swaps
//   L2  transition ~280-380ms   views, sidebar, tabs, cards entering
//   L3  storytelling ~700-1100ms  the allocation run + results reveal (the hero moment)
//
// Everything below is a spring, not an ease, so cards and numbers glide.

export const spring = {
  micro:  { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 },
  ui:     { type: 'spring', stiffness: 210, damping: 26 },
  story:  { type: 'spring', stiffness: 90,  damping: 18, mass: 1.1 },
  softIn: { type: 'spring', stiffness: 140, damping: 20 },
}

// Long cubic-bezier for properties springs handle badly (bar widths, gradients).
export const storyEase = { duration: 0.9, ease: [0.16, 1, 0.3, 1] }

// --- reusable variants -----------------------------------------------------
export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: spring.ui },
}

export const staggerParent = (stagger = 0.06, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
})

// L2 view swap — content slides a touch and settles on a spring
export const viewTransition = {
  initial: { opacity: 0, y: 16, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: spring.ui },
  exit:    { opacity: 0, y: -10, filter: 'blur(2px)', transition: { duration: 0.16 } },
}

// L3 — funded rows stamping into the results register, one after another
export const stampIn = {
  hidden: { opacity: 0, y: 24, scale: 0.94 },
  show: (i = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { ...spring.story, delay: 0.12 + i * 0.07 },
  }),
}

// L1 — anything clickable
export const pressable = {
  whileHover: { y: -2, transition: spring.micro },
  whileTap: { scale: 0.97, transition: spring.micro },
}
