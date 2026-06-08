<template>
  <div class="timeline-preview">
    <div class="timeline-controls">
      <button class="tl-btn" @click="timeStart = Math.max(0, timeStart - 60)">◀ 早间</button>
      <span class="tl-range">{{ minutesToTime(timeStart) }} — {{ minutesToTime(timeEnd) }}</span>
      <button class="tl-btn" @click="timeEnd = Math.min(24 * 60, timeEnd + 60)">晚间 ▶</button>
      <label class="tl-slot-size">
        刻度：
        <select v-model="slotMinutes">
          <option :value="15">15分钟</option>
          <option :value="30">30分钟</option>
          <option :value="60">60分钟</option>
        </select>
      </label>
    </div>

    <div class="timeline-table-wrap">
      <table class="timeline-table">
        <thead>
          <tr>
            <th class="th-venue">场地</th>
            <th
              v-for="slot in timeSlots"
              :key="slot.label"
              class="th-time"
              :class="{ 'is-break': slot.isBreak }"
            >
              {{ slot.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="venue in store.state.venues" :key="venue">
            <td class="td-venue">{{ venue }}</td>
            <td
              v-for="slot in timeSlots"
              :key="slot.label"
              class="td-cell"
              :class="{ 'is-break': slot.isBreak }"
            >
              <template v-if="getSlotPlans(venue, slot).length > 0">
                <div
                  v-for="plan in getSlotPlans(venue, slot)"
                  :key="plan.id"
                  class="slot-plan"
                  :class="[
                    plan.intensity,
                    { conflict: plan.hasConflict }
                  ]"
                  :title="`${plan.team} | ${plan.startTime}-${plan.endTime} | ${plan.responsiblePerson} | ${plan.hasConflict ? '⚠ 冲突' : '正常'}`"
                  @click="store.startEdit(plan)"
                >
                  {{ plan.team }}
                </div>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="timeline-legend">
      <span class="legend-item"><span class="legend-color low"></span>低强度</span>
      <span class="legend-item"><span class="legend-color medium"></span>中强度</span>
      <span class="legend-item"><span class="legend-color high"></span>高强度</span>
      <span class="legend-item"><span class="legend-color conflict"></span>冲突</span>
      <span class="legend-item"><span class="legend-color break"></span>午休</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, timeToMinutes, minutesToTime, getEffectiveSegments } from '../store.js'

const timeStart = ref(6 * 60)
const timeEnd = ref(21 * 60)
const slotMinutes = ref(30)

const timeSlots = computed(() => {
  const slots = []
  const bs = timeToMinutes(store.state.middayBreak.start)
  const be = timeToMinutes(store.state.middayBreak.end)
  for (let t = timeStart.value; t < timeEnd.value; t += slotMinutes.value) {
    const isBreak = t >= bs && t < be
    slots.push({
      start: t,
      end: Math.min(t + slotMinutes.value, timeEnd.value),
      label: minutesToTime(t),
      isBreak
    })
  }
  return slots
})

const datePlans = computed(() => store.plansForDate.value)

function planOccupiesSlot(plan, slot) {
  const segments = getEffectiveSegments(plan.startTime, plan.endTime, store.state.middayBreak)
  return segments.some(seg => {
    const s = timeToMinutes(seg.start)
    const e = timeToMinutes(seg.end)
    return s < slot.end && e > slot.start
  })
}

function getSlotPlans(venue, slot) {
  return datePlans.value.filter(plan =>
    plan.venue === venue && planOccupiesSlot(plan, slot)
  )
}

function slotTooltip(venue, slot) {
  const plans = getSlotPlans(venue, slot)
  if (plans.length === 0) return ''
  return plans.map(p =>
    `${p.team} | ${p.startTime}-${p.endTime} | ${p.responsiblePerson} | ${p.hasConflict ? '⚠ 冲突' : '正常'}`
  ).join('\n')
}

function onSlotClick(venue, slot) {
  const plans = getSlotPlans(venue, slot)
  if (plans.length > 0) {
    store.startEdit(plans[0])
  }
}
</script>

<style scoped>
.timeline-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.timeline-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.tl-btn {
  padding: 4px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
}

.tl-btn:hover {
  border-color: var(--accent);
}

.tl-range {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.tl-slot-size {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: auto;
}

.tl-slot-size select {
  padding: 3px 6px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 12px;
}

.timeline-table-wrap {
  flex: 1;
  overflow: auto;
}

.timeline-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.th-venue {
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--bg-card);
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border);
  border-right: 1px solid var(--border);
  min-width: 90px;
}

.th-time {
  padding: 8px 4px;
  text-align: center;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border);
  min-width: 55px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.th-time.is-break {
  background: rgba(245, 158, 11, 0.08);
  color: #d97706;
}

.td-venue {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--bg-card);
  padding: 6px 12px;
  font-weight: 500;
  color: var(--text-primary);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.td-cell {
  padding: 1px 2px;
  border-bottom: 1px solid var(--border);
  border-right: 1px solid rgba(255, 255, 255, 0.03);
  min-width: 55px;
  vertical-align: top;
}

.td-cell.is-break {
  background: rgba(245, 158, 11, 0.06);
}

.slot-plan {
  padding: 1px 3px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: filter 0.15s;
  margin-bottom: 1px;
  line-height: 1.4;
}

.slot-plan:hover {
  filter: brightness(1.1);
}

.slot-plan.low {
  background: rgba(34, 197, 94, 0.2);
  color: #15803d;
}

.slot-plan.medium {
  background: rgba(245, 158, 11, 0.2);
  color: #b45309;
}

.slot-plan.high {
  background: rgba(239, 68, 68, 0.2);
  color: #b91c1c;
}

.slot-plan.conflict {
  outline: 2px solid #ef4444;
  outline-offset: -1px;
  animation: pulse-conflict 2s infinite;
}

@keyframes pulse-conflict {
  0%, 100% { outline-color: #ef4444; }
  50% { outline-color: rgba(239, 68, 68, 0.4); }
}

.timeline-legend {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.legend-color.low { background: rgba(34, 197, 94, 0.3); }
.legend-color.medium { background: rgba(245, 158, 11, 0.3); }
.legend-color.high { background: rgba(239, 68, 68, 0.3); }
.legend-color.conflict { background: rgba(239, 68, 68, 0.1); outline: 2px solid #ef4444; }
.legend-color.break { background: rgba(245, 158, 11, 0.15); }
</style>
