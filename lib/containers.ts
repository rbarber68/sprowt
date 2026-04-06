/**
 * SproutPal — Container Inventory
 * CRUD + default container seeding
 */

import { uuidv4 } from './uuid'
import { db } from '@/db/client'
import { containers } from '@/db/schema'
import { eq, count } from 'drizzle-orm'

export const DEFAULT_CONTAINERS = [
  { name: 'Quart Mason Jar',  type: 'quart_jar',        capacityOz: 32 },
  { name: 'Half-Gallon Jar',  type: 'half_gallon_jar',  capacityOz: 64 },
  { name: 'Pint Mason Jar',   type: 'pint_jar',         capacityOz: 16 },
  { name: 'Wide-Mouth Quart', type: 'wide_mouth_quart', capacityOz: 32 },
  { name: 'Sprouting Tray',   type: 'sprouting_tray',   capacityOz: 0  },
] as const

export async function seedContainersIfNeeded() {
  const [{ value }] = await db.select({ value: count() }).from(containers)
  if (value > 0) return

  const now = Date.now()
  for (const c of DEFAULT_CONTAINERS) {
    await db.insert(containers).values({
      id: uuidv4(),
      name: c.name,
      type: c.type,
      capacityOz: c.capacityOz,
      createdAt: now,
    })
  }
  console.log(`Seeded ${DEFAULT_CONTAINERS.length} default containers`)
}

export async function getAllContainers() {
  return db.select().from(containers)
    .where(eq(containers.isActive, true))
    .orderBy(containers.name)
}

export async function addContainer(name: string, type: string, capacityOz: number, notes?: string) {
  const id = uuidv4()
  await db.insert(containers).values({
    id,
    name,
    type,
    capacityOz,
    notes: notes ?? null,
    createdAt: Date.now(),
  })
  return id
}

export async function deleteContainer(id: string) {
  await db.update(containers)
    .set({ isActive: false })
    .where(eq(containers.id, id))
}
