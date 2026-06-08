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
              <div
                v-if="getSlotPlan(venue, slot)"
                class="slot-plan"
                :class="[
                  getSlotPlan(venue, slot).intensity,
                  { conflict: getSlotPlan(venue, slot).hasConflict }
                ]"
                :title="slotTooltip(venue, slot)"
                @click="onSlotClick(venue, slot)"
              >
                {{ getSlotPlan(venue, slot).team }}
              </div>
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
import { store, timeToMinutes, minutesToTime } from '../store.js'

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
  const ps = timeToMinutes(plan.startTime)
  const pe = timeToMinutes(plan.endTime)
  return ps < slot.end && pe > slot.start
}

function getSlotPlan(venue, slot) {
  for (const plan of datePlans.value) {
    if (plan.venue === venue && planOccupiesSlot(plan, slot)) {
      return plan
    }
  }
  return null
}

function slotTooltip(venue, slot) {
  const plan = getSlotPlan(venue, slot)
  if (!plan) return ''
  return `${plan.team} | ${plan.startTime}-${plan.endTime} | ${plan.responsiblePerson} | ${plan.hasConflict ? '⚠ 冲突' : '正常'}`
}

function onSlotClick(venue, slot) {
  const plan = getSlotPlan(venue, slot)
  if (plan) {
    store.startEdit(plan)
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
  padding: 2px;
  border-bottom: 1px solid var(--border);
  border-right: 1px solid rgba(255, 255, 255, 0.03);
  min-width: 55px;
  height: 36px;
  vertical-align: middle;
}

.td-cell.is-break {
  background: rgba(245, 158, 11, 0.06);
}

.slot-plan {
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: filter 0.15s;
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
