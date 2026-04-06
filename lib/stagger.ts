/**
 * SproutPal — Stagger Optimizer Algorithm
 * Generates rolling batch schedules for continuous harvest
 */

import { SPROUT_TYPES, type BeanType } from '@/data/sproutTypes'

export interface StaggerBatch {
  beanTypeId: string
  beanType: BeanType
  soakStartDate: Date
  jarStartDate: Date
  harvestDate: Date
  dayOffset: number
}

export function generateStaggerPlan(
  cadenceDays: number,
  beanTypeIds: string[],
  startDate: Date = new Date(),
  durationDays: number = 14,
): StaggerBatch[] {
  const plan: StaggerBatch[] = []
  const beanTypes = beanTypeIds
    .map(id => SPROUT_TYPES.find(s => s.id === id))
    .filter(Boolean) as BeanType[]

  if (beanTypes.length === 0) return plan

  let dayOffset = 0
  let typeIndex = 0

  while (dayOffset < durationDays) {
    const beanType = beanTypes[typeIndex % beanTypes.length]
    const soakStart = new Date(startDate.getTime() + dayOffset * 86400000)
    const jarStart = new Date(soakStart.getTime() + beanType.soakHours * 3600000)
    const harvest = new Date(soakStart.getTime() + (beanType.soakHours / 24 + beanType.growDays) * 86400000)

    plan.push({
      beanTypeId: beanType.id,
      beanType,
      soakStartDate: soakStart,
      jarStartDate: jarStart,
      harvestDate: harvest,
      dayOffset,
    })

    dayOffset += cadenceDays
    typeIndex++
  }

  return plan
}
