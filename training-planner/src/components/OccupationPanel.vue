<template>
  <div class="occupation-panel" :class="{ embedded }">
    <div class="occ-header" @click="embedded || (expanded = !expanded)">
      <span class="occ-icon">🔧</span>
      <span class="occ-count">场地占用 {{ occupations.length }}</span>
      <span class="occ-toggle" v-if="!embedded">{{ expanded ? '收起' : '展开' }}</span>
    </div>
    <div class="occ-body" v-if="expanded">
      <div class="occ-toolbar" v-if="embedded">
        <button
          class="occ-add-btn"
          v-if="isOrganizer"
          @click="$emit('addOccupation')"
        >+ 登记占用</button>
        <div class="occ-venue-filter" v-if="embedded">
          <select v-model="venueFilter" class="occ-filter-select">
            <option value="">全部场地</option>
            <option v-for="v in store.state.venues" :key="v" :value="v">{{ v }}</option>
          </select>
        </div>
      </div>
      <button
        class="occ-add-btn"
        v-if="!embedded && isOrganizer"
        @click="$emit('addOccupation')"
      >+ 登记占用</button>
      <div class="occ-list" :class="{ 'occ-list-full': embedded }" v-if="filteredOccupations.length > 0">
        <div class="occ-item" :class="{ 'occ-item-full': embedded }" v-for="occ in filteredOccupations" :key="occ.id">
          <div class="occ-main">
            <span
              class="occ-type-badge"
              :style="{ background: OCCUPATION_TYPE_COLORS[occ.type].bg, color: OCCUPATION_TYPE_COLORS[occ.type].color }"
            >{{ OCCUPATION_TYPE_LABELS[occ.type] }}</span>
            <span class="occ-venue">{{ occ.venue }}</span>
            <span class="occ-time">{{ occ.startTime }}-{{ occ.endTime }}</span>
            <span class="occ-date" v-if="embedded && occ.date !== store.state.selectedDate">{{ occ.date }}</span>
          </div>
          <div class="occ-reason" v-if="occ.reason">{{ occ.reason }}</div>
          <div class="occ-notes" v-if="embedded && occ.notes">备注：{{ occ.notes }}</div>
          <div class="occ-affected" v-if="getAffectedCount(occ) > 0">
            <span class="affected-warn">⚠ 影响 {{ getAffectedCount(occ) }} 条计划</span>
            <template v-if="embedded">
              <span class="affected-detail" v-for="plan in getAffectedPlans(occ)" :key="plan.id">
                {{ plan.team }}({{ plan.startTime }}-{{ plan.endTime }})
                <span
                  class="affected-plan-status"
                  :style="{ background: PLAN_STATUS_COLORS[plan.status].bg, color: PLAN_STATUS_COLORS[plan.status].color }"
                >{{ PLAN_STATUS_LABELS[plan.status] }}</span>
              </span>
            </template>
          </div>
          <div class="occ-actions" v-if="isOrganizer">
            <button class="occ-cancel-btn" @click="handleCancel(occ)" title="取消占用">取消占用</button>
          </div>
        </div>
      </div>
      <div class="occ-empty" v-else>
        <template v-if="embedded">
          <div class="occ-empty-icon">🔧</div>
          <p>当前日期无场地占用</p>
          <p class="occ-empty-hint">点击"登记占用"按钮为场地登记维护、清场或检修时段</p>
        </template>
        <template v-else>当前日期无场地占用</template>
      </div>

      <div class="occ-venue-summary" v-if="embedded">
        <h4>今日各场地占用概览</h4>
        <div class="venue-summary-grid">
          <div class="venue-summary-card" v-for="venue in store.state.venues" :key="venue">
            <div class="venue-summary-name">{{ venue }}</div>
            <div class="venue-summary-occ" v-if="getVenueOccupations(venue).length > 0">
              <div class="venue-occ-item" v-for="occ in getVenueOccupations(venue)" :key="occ.id">
                <span
                  class="occ-type-badge"
                  :style="{ background: OCCUPATION_TYPE_COLORS[occ.type].bg, color: OCCUPATION_TYPE_COLORS[occ.type].color }"
                >{{ OCCUPATION_TYPE_LABELS[occ.type] }}</span>
                <span class="venue-occ-time">{{ occ.startTime }}-{{ occ.endTime }}</span>
              </div>
            </div>
            <div class="venue-summary-free" v-else>无占用</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, OCCUPATION_TYPE_LABELS, OCCUPATION_TYPE_COLORS, PLAN_STATUS, STATUS_LABELS as PLAN_STATUS_LABELS, STATUS_COLORS as PLAN_STATUS_COLORS } from '../store.js'

const props = defineProps({
  embedded: Boolean
})

defineEmits(['addOccupation'])

const expanded = ref(true)
const venueFilter = ref('')

const isOrganizer = computed(() => store.state.currentRole === 'organizer')

const occupations = computed(() => store.occupationsForDate.value)

const filteredOccupations = computed(() => {
  if (!venueFilter.value) return occupations.value
  return occupations.value.filter(occ => occ.venue === venueFilter.value)
})

function getAffectedCount(occ) {
  return store.plansAffectedByOccupation(occ).filter(p => p.status !== 'rejected').length
}

function getAffectedPlans(occ) {
  return store.plansAffectedByOccupation(occ).filter(p => p.status !== 'rejected')
}

function getVenueOccupations(venue) {
  return occupations.value.filter(occ => occ.venue === venue)
}

function handleCancel(occ) {
  const affected = store.plansAffectedByOccupation(occ)
  const activeAffected = affected.filter(p => p.status !== 'rejected')
  let msg = `确定取消「${occ.venue} ${occ.startTime}-${occ.endTime}」的${OCCUPATION_TYPE_LABELS[occ.type]}占用？`
  if (activeAffected.length > 0) {
    msg += `\n\n⚠ 该占用量影响 ${activeAffected.length} 条训练计划，取消后这些计划将恢复可预约状态。`
  }
  if (confirm(msg)) {
    store.cancelOccupation(occ.id)
  }
}
</script>

<style scoped>
.occupation-panel {
  background: rgba(249, 115, 22, 0.06);
  border: 1px solid rgba(249, 115, 22, 0.2);
  border-radius: 10px;
  overflow: hidden;
}

.occupation-panel.embedded {
  background: transparent;
  border: none;
  border-radius: 0;
  height: 100%;
  overflow: auto;
}

.occ-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
}

.embedded .occ-header {
  cursor: default;
  padding: 16px 20px;
}

.occ-header:hover {
  background: rgba(249, 115, 22, 0.04);
}

.embedded .occ-header:hover {
  background: transparent;
}

.occ-icon {
  font-size: 16px;
}

.occ-count {
  font-size: 14px;
  font-weight: 600;
  color: #ea580c;
}

.embedded .occ-count {
  font-size: 18px;
}

.occ-toggle {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-secondary);
}

.occ-body {
  border-top: 1px solid rgba(249, 115, 22, 0.15);
  padding: 10px;
}

.embedded .occ-body {
  border-top: 1px solid var(--border);
  padding: 0 20px 20px;
}

.occ-toolbar {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  align-items: center;
}

.occ-filter-select {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  min-width: 120px;
}

.occ-add-btn {
  width: 100%;
  padding: 7px 12px;
  border: 1px dashed rgba(249, 115, 22, 0.4);
  border-radius: 8px;
  background: rgba(249, 115, 22, 0.08);
  color: #ea580c;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.embedded .occ-add-btn {
  width: auto;
  margin-bottom: 0;
  padding: 7px 16px;
  border-style: solid;
}

.occ-add-btn:hover {
  background: rgba(249, 115, 22, 0.15);
  border-color: #ea580c;
}

.occ-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.occ-list-full {
  max-height: none;
}

.occ-item {
  padding: 8px 10px;
  background: rgba(249, 115, 22, 0.04);
  border: 1px solid rgba(249, 115, 22, 0.12);
  border-radius: 8px;
}

.occ-item-full {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 14px 16px;
}

.occ-main {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  flex-wrap: wrap;
}

.occ-type-badge {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}

.occ-venue {
  font-weight: 500;
  color: var(--text-primary);
}

.occ-time {
  color: #ea580c;
  font-variant-numeric: tabular-nums;
}

.occ-date {
  color: var(--text-secondary);
  font-size: 12px;
}

.occ-reason {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.occ-notes {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
  opacity: 0.7;
}

.occ-affected {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.affected-warn {
  font-size: 11px;
  color: #dc2626;
  background: rgba(239, 68, 68, 0.08);
  padding: 1px 6px;
  border-radius: 4px;
}

.affected-detail {
  font-size: 12px;
  color: var(--text-secondary);
}

.affected-plan-status {
  padding: 1px 4px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 500;
}

.occ-actions {
  margin-top: 6px;
  display: flex;
  gap: 6px;
}

.occ-cancel-btn {
  padding: 3px 10px;
  border: 1px solid rgba(107, 114, 128, 0.3);
  border-radius: 6px;
  background: none;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.occ-cancel-btn:hover {
  border-color: #dc2626;
  color: #dc2626;
  background: rgba(239, 68, 68, 0.08);
}

.occ-empty {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 0;
  text-align: center;
}

.embedded .occ-empty {
  padding: 40px 0;
}

.occ-empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.occ-empty-hint {
  font-size: 13px;
  margin-top: 4px;
  opacity: 0.7;
}

.occ-venue-summary {
  margin-top: 20px;
  border-top: 1px solid var(--border);
  padding-top: 16px;
}

.occ-venue-summary h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.venue-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.venue-summary-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}

.venue-summary-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.venue-summary-occ {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.venue-occ-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.venue-occ-time {
  color: #ea580c;
  font-variant-numeric: tabular-nums;
}

.venue-summary-free {
  font-size: 12px;
  color: #16a34a;
}
</style>
