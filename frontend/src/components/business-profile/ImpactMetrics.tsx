'use client'

import { useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import type { ImpactStat } from './types'
import { fadeUp, stagger } from './motionPresets'

function AnimatedValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, (latest) => Math.round(latest))

  // Very conservative numeric animation: if it starts with a number, animate that part only.
  const match = value.match(/^(\d+)(.*)$/)
  const numberPart = match ? Number(match[1]) : null
  const suffix = match ? match[2] : value

  const isInView = useInView(ref, { once: true, margin: '-20% 0px' })

  useEffect(() => {
    if (!isInView) return
    if (numberPart === null || !Number.isFinite(numberPart)) return
    const controls = animate(mv, numberPart, { duration: 0.9, ease: 'easeOut' })
    return () => controls.stop()
  }, [isInView, mv, numberPart])

  if (numberPart === null) return <span ref={ref}>{value}</span>
  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}

export function ImpactMetrics({ stats }: { stats: ImpactStat[] }) {
  const safeStats = Array.isArray(stats) ? stats : []

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-8">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-white mb-8">
            Impact at scale
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {safeStats.map((s, idx) => (
              <motion.div
                key={`${s.label}-${idx}`}
                variants={fadeUp}
                className="rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur p-6"
              >
                <div className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  <AnimatedValue value={s.value} />
                </div>
                <div className="text-slate-300 mt-2 font-medium">{s.label}</div>
                {s.footnote_optional ? (
                  <div className="text-slate-400 text-sm mt-2">{s.footnote_optional}</div>
                ) : null}
              </motion.div>
            ))}
          </div>

          {safeStats.length === 0 ? (
            <motion.div variants={fadeUp} className="mt-6 text-slate-400">
              Add impact metrics in your Business Dashboard to show scale and credibility.
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </section>
  )
}


