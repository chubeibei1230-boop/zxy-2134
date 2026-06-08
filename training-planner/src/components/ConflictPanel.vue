<template>
  <div class="conflict-panel" v-if="conflicts.length > 0 || occupationConflicts.length > 0">
    <div class="conflict-header" @click="expanded = !expanded">
      <span class="conflict-icon">⚠</span>
      <span class="conflict-count">{{ conflicts.length + occupationConflicts.length }} 条冲突</span>
      <span class="conflict-toggle">{{ expanded ? '收起' : '展开' }}</span>
    </div>
    <div class="conflict-list" v-if="expanded">
      <div class="conflict-entry" v-for="c in conflicts" :key="c.id">
        <div class="conflict-main">
          <span class="conflict-venue">{{ c.venue }}</span>
          <span class="conflict-date">{{ c.date }}</span>
          <span class="conflict-time">{{ c.startTime }}-{{ c.endTime }}</span>
          <span class="conflict-team">{{ c.team }}</span>
          <span class="conflict-batch" v-if="c.batchId">📦 {{ c.batchId.split('_').slice(0,2).join('_') }}</span>
          <span
            class="conflict-status-badge"
            :style="{ background: STATUS_COLORS[c.status].bg, color: STATUS_COLORS[c.status].color }"
          >{{ STATUS_LABELS[c.status] }}</span>
        </div>
        <div class="conflict-detail">
          与以下计划冲突：
          <span
            v-for="cid in c.conflictWith"
            :key="cid"
            class="conflict-with-link"
            @click="goToPlan(cid)"
          >
            {{ getPlanLabel(cid) }}
          </span>
        </div>
      </div>
      <div class="conflict-entry occupation-conflict" v-for="c in occupationConflicts" :key="'occ-' + c.id">
        <div class="conflict-main">
          <span class="conflict-venue">{{ c.venue }}</span>
          <span class="conflict-date">{{ c.date }}</span>
          <span class="conflict-time">{{ c.startTime }}-{{ c.endTime }}</span>
          <span class="conflict-team">{{ c.team }}</span>
          <span
            class="conflict-status-badge"
            :style="{ background: STATUS_COLORS[c.status].bg, color: STATUS_COLORS[c.status].color }"
          >{{ STATUS_LABELS[c.status] }}</span>
          <span class="occupation-conflict-badge">占用冲突</span>
        </div>
        <div class="conflict-detail">
          与以下场地占用冲突：
          <span
            v-for="occId in c.occupationConflicts"
            :key="occId"
            class="occupation-link"
          >
            {{ getOccupationLabel(occId) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, STATUS_LABELS, STATUS_COLORS, PLAN_STATUS, OCCUPATION_TYPE_LABELS } from '../store.js'

const expanded = ref(true)

const conflicts = computed(() => store.allConflicts.value)

const occupationConflicts = computed(() => store.allOccupationConflicts.value)

function isPlanVisibleToCurrentRole(plan) {
  const role = store.state.currentRole
  if (role === 'executor') return true
  if (role === 'supervisor') return plan.status !== PLAN_STATUS.DRAFT
  if (role === 'organizer') return plan.status === PLAN_STATUS.APPROVED || plan.status === PLAN_STATUS.PUBLISHED
  return false
}

function getPlanLabel(id) {
  const plan = store.state.plans.find(p => p.id === id)
  if (!plan) return '(已删除)'
  if (!isPlanVisibleToCurrentRole(plan)) return '(其他计划)'
  return `${plan.team} ${plan.startTime}-${plan.endTime}`
}

function getOccupationLabel(id) {
  const occ = store.state.occupations.find(o => o.id === id)
  if (!occ) return '(已取消)'
  return `${OCCUPATION_TYPE_LABELS[occ.type]} ${occ.venue} ${occ.startTime}-${occ.endTime}`
}

function goToPlan(id) {
  const plan = store.state.plans.find(p => p.id === id)
  if (!plan || !isPlanVisibleToCurrentRole(plan)) return
  if (plan.status === 'draft' || plan.status === 'rejected') {
    if (store.state.currentRole === 'executor') {
      store.startEdit(plan)
    }
  }
}
</script>

<style scoped>
.conflict-panel {
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 10px;
  overflow: hidden;
}

.conflict-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
}

.conflict-header:hover {
  background: rgba(239, 68, 68, 0.04);
}

.conflict-icon {
  font-size: 16px;
}

.conflict-count {
  font-size: 14px;
  font-weight: 600;
  color: #dc2626;
}

.conflict-toggle {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-secondary);
}

.conflict-list {
  border-top: 1px solid rgba(239, 68, 68, 0.15);
  max-height: 280px;
  overflow-y: auto;
}

.conflict-entry {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(239, 68, 68, 0.08);
}

.conflict-entry:last-child {
  border-bottom: none;
}

.conflict-entry.occupation-conflict {
  background: rgba(249, 115, 22, 0.04);
}

.conflict-main {
  display: flex;
  gap: 10px;
  font-size: 13px;
  margin-bottom: 4px;
  align-items: center;
  flex-wrap: wrap;
}

.conflict-venue {
  font-weight: 500;
  color: var(--text-primary);
}

.conflict-date {
  color: var(--text-secondary);
}

.conflict-time {
  color: #dc2626;
  font-variant-numeric: tabular-nums;
}

.conflict-batch {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}

.conflict-team {
  color: var(--text-primary);
}

.conflict-status-badge {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.occupation-conflict-badge {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(249, 115, 22, 0.15);
  color: #ea580c;
}

.conflict-detail {
  font-size: 12px;
  color: var(--text-secondary);
}

.conflict-with-link {
  color: var(--accent);
  cursor: pointer;
  margin-right: 8px;
  text-decoration: underline;
}

.conflict-with-link:hover {
  color: var(--accent-hover);
}

.occupation-link {
  color: #ea580c;
  margin-right: 8px;
}
</style>
