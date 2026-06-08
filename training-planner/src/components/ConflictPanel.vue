<template>
  <div class="conflict-panel" v-if="conflicts.length > 0">
    <div class="conflict-header" @click="expanded = !expanded">
      <span class="conflict-icon">⚠</span>
      <span class="conflict-count">{{ conflicts.length }} 条冲突</span>
      <span class="conflict-toggle">{{ expanded ? '收起' : '展开' }}</span>
    </div>
    <div class="conflict-list" v-if="expanded">
      <div class="conflict-entry" v-for="c in conflicts" :key="c.id">
        <div class="conflict-main">
          <span class="conflict-venue">{{ c.venue }}</span>
          <span class="conflict-date">{{ c.date }}</span>
          <span class="conflict-time">{{ c.startTime }}-{{ c.endTime }}</span>
          <span class="conflict-team">{{ c.team }}</span>
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, STATUS_LABELS, STATUS_COLORS } from '../store.js'

const expanded = ref(true)

const conflicts = computed(() => store.allConflicts.value)

function getPlanLabel(id) {
  const plan = store.state.plans.find(p => p.id === id)
  if (!plan) return '(已删除)'
  return `${plan.team} ${plan.startTime}-${plan.endTime}`
}

function goToPlan(id) {
  const plan = store.state.plans.find(p => p.id === id)
  if (plan && (plan.status === 'draft' || plan.status === 'rejected')) {
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
  max-height: 200px;
  overflow-y: auto;
}

.conflict-entry {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(239, 68, 68, 0.08);
}

.conflict-entry:last-child {
  border-bottom: none;
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

.conflict-team {
  color: var(--text-primary);
}

.conflict-status-badge {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
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
</style>
