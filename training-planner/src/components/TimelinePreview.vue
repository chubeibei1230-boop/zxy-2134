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
              :class="{ 'is-break': slot.isBreak, 'has-occupation': getSlotOccupations(venue, slot).length > 0 }"
            >
              <template v-if="getSlotOccupations(venue, slot).length > 0">
                <div
                  v-for="occ in getSlotOccupations(venue, slot)"
                  :key="occ.id"
                  class="slot-occupation"
                  :class="[occ.type]"
                  :title="slotOccupationTooltip(occ)"
                >
                  <span class="slot-occ-icon">🔧</span>
                  <span class="slot-occ-name">{{ OCCUPATION_TYPE_LABELS[occ.type] }}</span>
                </div>
              </template>
              <template v-if="getSlotPlans(venue, slot).length > 0">
                <div
                  v-for="plan in getSlotPlans(venue, slot)"
                  :key="plan.id"
                  class="slot-plan"
                  :class="[
                    plan.intensity,
                    {
                      conflict: plan.hasConflict,
                      'occupation-affected': plan.affectedByOccupation,
                      'status-draft': plan.status === PLAN_STATUS.DRAFT,
                      'status-pending': plan.status === PLAN_STATUS.PENDING_APPROVAL,
                      'status-approved': plan.status === PLAN_STATUS.APPROVED,
                      'status-rejected': plan.status === PLAN_STATUS.REJECTED,
                      'status-published': plan.status === PLAN_STATUS.PUBLISHED,
                      'has-change-request': !!getActiveChangeRequest(plan.id),
                      'has-batch': plan.batchId
                    }
                  ]"
                  :title="slotPlanTooltip(plan)"
                  @click="handlePlanClick(plan)"
                >
                  <span class="slot-plan-name">{{ plan.team }}</span>
                  <span class="slot-plan-status-dot" :style="{ background: STATUS_COLORS[plan.status].color }"></span>
                  <span class="slot-cr-dot" v-if="getActiveChangeRequest(plan.id)" title="有变更申请">📝</span>
                  <span class="slot-batch-dot" v-if="plan.batchId" :title="'批次 ' + plan.batchId.split('_').slice(0,2).join('_')">📦</span>
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
      <span class="legend-item"><span class="legend-color occupation"></span>场地占用</span>
      <span class="legend-item"><span class="legend-color break"></span>午休</span>
      <span class="legend-separator">|</span>
      <span class="legend-item"><span class="legend-color change"></span>变更申请中</span>
      <span class="legend-separator">|</span>
      <span class="legend-item"><span class="legend-color batch"></span>批次计划</span>
      <span class="legend-separator">|</span>
      <span class="legend-item"><span class="legend-dot" style="background:#6b7280"></span>草稿</span>
      <span class="legend-item"><span class="legend-dot" style="background:#d97706"></span>待审批</span>
      <span class="legend-item"><span class="legend-dot" style="background:#16a34a"></span>已通过</span>
      <span class="legend-item"><span class="legend-dot" style="background:#dc2626"></span>已驳回</span>
      <span class="legend-item"><span class="legend-dot" style="background:#6366f1"></span>已发布</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, timeToMinutes, minutesToTime, getEffectiveSegments, PLAN_STATUS, STATUS_LABELS, STATUS_COLORS, OCCUPATION_TYPE_LABELS, OCCUPATION_TYPE_COLORS, CHANGE_REQUEST_STATUS, CHANGE_TYPE_LABELS, CHANGE_TYPE_COLORS, CHANGE_REQUEST_STATUS_LABELS, CHANGE_REQUEST_STATUS_COLORS } from '../store.js'

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

const dateOccupations = computed(() => store.occupationsForDate.value)

function planOccupiesSlot(plan, slot) {
  const segments = getEffectiveSegments(plan.startTime, plan.endTime, store.state.middayBreak)
  return segments.some(seg => {
    const s = timeToMinutes(seg.start)
    const e = timeToMinutes(seg.end)
    return s < slot.end && e > slot.start
  })
}

function occupationOccupiesSlot(occ, slot) {
  const s = timeToMinutes(occ.startTime)
  const e = timeToMinutes(occ.endTime)
  return s < slot.end && e > slot.start
}

function getSlotPlans(venue, slot) {
  return datePlans.value.filter(plan =>
    plan.venue === venue && planOccupiesSlot(plan, slot)
  )
}

function getSlotOccupations(venue, slot) {
  return dateOccupations.value.filter(occ =>
    occ.venue === venue && occupationOccupiesSlot(occ, slot)
  )
}

function slotPlanTooltip(plan) {
  const statusLabel = STATUS_LABELS[plan.status]
  const conflictLabel = plan.hasConflict ? (plan.affectedByOccupation ? '⚠ 占用冲突' : '⚠ 冲突') : '正常'
  let tip = `${plan.team} | ${plan.startTime}-${plan.endTime} | ${plan.responsiblePerson} | ${conflictLabel} | ${statusLabel}`
  if (plan.affectedByOccupation && plan.occupationConflicts) {
    const occLabels = plan.occupationConflicts.map(id => {
      const occ = store.state.occupations.find(o => o.id === id)
      return occ ? `${OCCUPATION_TYPE_LABELS[occ.type]}(${occ.startTime}-${occ.endTime})` : ''
    }).filter(Boolean).join('、')
    tip += ` | 占用：${occLabels}`
  }
  if (plan.status === PLAN_STATUS.REJECTED && plan.rejectReason) {
    tip += ` | 驳回原因：${plan.rejectReason}`
  }
  const activeCR = getActiveChangeRequest(plan.id)
  if (activeCR) {
    tip += ` | 📝 变更申请：${CHANGE_TYPE_LABELS[activeCR.changeType]}(${CHANGE_REQUEST_STATUS_LABELS[activeCR.status]})`
  }
  if (plan.batchId) {
    tip += ` | 📦 批次 ${plan.batchId.split('_').slice(0,2).join('_')}`
  }
  return tip
}

function getActiveChangeRequest(planId) {
  return store.getActiveChangeRequestForPlan(planId)
}

function slotOccupationTooltip(occ) {
  let tip = `${OCCUPATION_TYPE_LABELS[occ.type]} | ${occ.venue} | ${occ.startTime}-${occ.endTime}`
  if (occ.reason) tip += ` | ${occ.reason}`
  if (occ.notes) tip += ` | 备注：${occ.notes}`
  return tip
}

function handlePlanClick(plan) {
  if (plan.status === PLAN_STATUS.DRAFT || plan.status === PLAN_STATUS.REJECTED) {
    if (store.state.currentRole === 'executor') {
      store.startEdit(plan)
    }
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

.td-cell.has-occupation {
  background: rgba(249, 115, 22, 0.04);
}

.slot-occupation {
  padding: 1px 3px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 1px;
  line-height: 1.4;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 1px dashed rgba(249, 115, 22, 0.5);
}

.slot-occ-icon {
  font-size: 8px;
}

.slot-occ-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot-occupation.maintenance { background: rgba(249, 115, 22, 0.15); color: #ea580c; border-color: rgba(249, 115, 22, 0.4); }
.slot-occupation.clearance { background: rgba(168, 85, 247, 0.15); color: #9333ea; border-color: rgba(168, 85, 247, 0.4); }
.slot-occupation.inspection { background: rgba(6, 182, 212, 0.15); color: #0891b2; border-color: rgba(6, 182, 212, 0.4); }
.slot-occupation.other { background: rgba(107, 114, 128, 0.15); color: #6b7280; border-color: rgba(107, 114, 128, 0.4); }

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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.slot-plan:hover {
  filter: brightness(1.1);
}

.slot-plan-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot-plan-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.slot-plan.low { background: rgba(34, 197, 94, 0.2); color: #15803d; }
.slot-plan.medium { background: rgba(245, 158, 11, 0.2); color: #b45309; }
.slot-plan.high { background: rgba(239, 68, 68, 0.2); color: #b91c1c; }

.slot-plan.conflict {
  outline: 2px solid #ef4444;
  outline-offset: -1px;
  animation: pulse-conflict 2s infinite;
}

.slot-plan.occupation-affected {
  outline: 2px solid #ea580c;
  outline-offset: -1px;
}

.slot-plan.status-draft { border-left: 2px solid #6b7280; }
.slot-plan.status-pending { border-left: 2px solid #d97706; }
.slot-plan.status-approved { border-left: 2px solid #16a34a; }
.slot-plan.status-rejected { border-left: 2px solid #dc2626; opacity: 0.6; }
.slot-plan.status-published { border-left: 2px solid #6366f1; }

.slot-plan.has-change-request {
  outline: 2px dashed #9333ea;
  outline-offset: -1px;
}

.slot-cr-dot {
  font-size: 8px;
  line-height: 1;
}

.slot-plan.has-batch {
  outline: 2px dotted #818cf8;
  outline-offset: -1px;
}

.slot-batch-dot {
  font-size: 8px;
  line-height: 1;
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
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-separator {
  color: var(--border);
  font-size: 12px;
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
.legend-color.occupation { background: rgba(249, 115, 22, 0.15); outline: 1px dashed #ea580c; }
.legend-color.break { background: rgba(245, 158, 11, 0.15); }

.legend-color.change { background: rgba(168, 85, 247, 0.1); outline: 2px dashed #9333ea; }

.legend-color.batch { background: rgba(99, 102, 241, 0.1); outline: 2px dotted #818cf8; }

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
