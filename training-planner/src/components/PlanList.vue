<template>
  <div class="plan-list">
    <div class="filter-bar">
      <select v-model="store.state.filters.venue" class="filter-select">
        <option value="">全部场地</option>
        <option v-for="v in store.state.venues" :key="v" :value="v">{{ v }}</option>
      </select>
      <select v-model="store.state.filters.team" class="filter-select">
        <option value="">全部队伍</option>
        <option v-for="t in store.state.teams" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="store.state.filters.intensity" class="filter-select">
        <option value="">全部强度</option>
        <option value="low">低强度</option>
        <option value="medium">中强度</option>
        <option value="high">高强度</option>
      </select>
      <label class="filter-check">
        <input type="checkbox" v-model="store.state.filters.conflictOnly" />
        <span>仅冲突</span>
      </label>
      <button class="btn-clear" v-if="hasFilters" @click="clearFilters">清除筛选</button>
    </div>

    <div class="list-header">
      <span class="col-date">日期</span>
      <span class="col-venue">场地</span>
      <span class="col-time">时段</span>
      <span class="col-team">队伍</span>
      <span class="col-person">负责人</span>
      <span class="col-count">人数</span>
      <span class="col-intensity">强度</span>
      <span class="col-status">状态</span>
      <span class="col-actions">操作</span>
    </div>

    <div class="list-body" v-if="store.filteredPlans.value.length > 0">
      <div
        v-for="plan in store.filteredPlans.value"
        :key="plan.id"
        class="list-row"
        :class="{ 'has-conflict': plan.hasConflict }"
      >
        <span class="col-date">{{ plan.date }}</span>
        <span class="col-venue">{{ plan.venue }}</span>
        <span class="col-time">{{ plan.startTime }}-{{ plan.endTime }}</span>
        <span class="col-team">{{ plan.team }}</span>
        <span class="col-person">{{ plan.responsiblePerson }}</span>
        <span class="col-count">{{ plan.headcount }}</span>
        <span class="col-intensity">
          <span class="intensity-badge" :class="plan.intensity">
            {{ intensityLabel(plan.intensity) }}
          </span>
        </span>
        <span class="col-status">
          <span class="status-badge" :class="plan.hasConflict ? 'conflict' : 'ok'">
            {{ plan.hasConflict ? '冲突' : '正常' }}
          </span>
        </span>
        <span class="col-actions">
          <button class="action-btn edit" @click="store.startEdit(plan)" title="编辑" v-if="!isSupervisor">✎</button>
          <button class="action-btn end-early" @click="handleEndEarly(plan)" title="提前结束" v-if="isExecutor">⏹</button>
          <button class="action-btn extend" @click="handleExtend(plan)" title="临时延长" v-if="isExecutor">⏩</button>
          <button class="action-btn delete" @click="handleDelete(plan)" title="删除" v-if="!isSupervisor">🗑</button>
        </span>
      </div>
    </div>

    <div class="list-empty" v-else>
      <div class="empty-icon">📋</div>
      <p>暂无计划数据</p>
      <p class="empty-hint">点击"新建计划"按钮添加训练安排</p>
    </div>

    <div class="quick-adjust" v-if="adjustingPlan">
      <div class="quick-adjust-overlay" @click="adjustingPlan = null"></div>
      <div class="quick-adjust-panel">
        <h4>{{ adjustMode === 'early' ? '提前结束' : '临时延长' }}</h4>
        <p class="adjust-info">{{ adjustingPlan.team }} · {{ adjustingPlan.startTime }}-{{ adjustingPlan.endTime }}</p>
        <div class="adjust-time">
          <label>新结束时间</label>
          <input type="time" v-model="adjustEndTime" step="900" />
        </div>
        <div class="adjust-actions">
          <button class="btn btn-secondary" @click="adjustingPlan = null">取消</button>
          <button class="btn btn-primary" @click="confirmAdjust">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, timeToMinutes, minutesToTime } from '../store.js'

const isExecutor = computed(() => store.state.currentRole === 'executor')
const isSupervisor = computed(() => store.state.currentRole === 'supervisor')

const hasFilters = computed(() => {
  const f = store.state.filters
  return f.venue || f.team || f.intensity || f.conflictOnly
})

function clearFilters() {
  store.state.filters.venue = ''
  store.state.filters.team = ''
  store.state.filters.intensity = ''
  store.state.filters.conflictOnly = false
}

function intensityLabel(intensity) {
  const map = { low: '低', medium: '中', high: '高' }
  return map[intensity] || intensity
}

const adjustingPlan = ref(null)
const adjustMode = ref('early')
const adjustEndTime = ref('')

function handleEndEarly(plan) {
  adjustingPlan.value = plan
  adjustMode.value = 'early'
  const currentEnd = timeToMinutes(plan.endTime)
  const currentStart = timeToMinutes(plan.startTime)
  const mid = Math.floor((currentStart + currentEnd) / 2)
  adjustEndTime.value = minutesToTime(mid)
}

function handleExtend(plan) {
  adjustingPlan.value = plan
  adjustMode.value = 'extend'
  const currentEnd = timeToMinutes(plan.endTime)
  adjustEndTime.value = minutesToTime(Math.min(currentEnd + 60, 22 * 60))
}

function confirmAdjust() {
  if (!adjustingPlan.value || !adjustEndTime.value) return
  if (adjustMode.value === 'early') {
    store.endEarly(adjustingPlan.value.id, adjustEndTime.value)
  } else {
    store.extendTemporarily(adjustingPlan.value.id, adjustEndTime.value)
  }
  adjustingPlan.value = null
}

function handleDelete(plan) {
  if (confirm(`确定删除 ${plan.team} 在 ${plan.venue} 的训练计划？`)) {
    store.deletePlan(plan.id)
  }
}
</script>

<style scoped>
.plan-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filter-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
  align-items: center;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  min-width: 100px;
}

.filter-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}

.filter-check input {
  accent-color: var(--accent);
}

.btn-clear {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
}

.btn-clear:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.list-header {
  display: flex;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
}

.list-body {
  flex: 1;
  overflow-y: auto;
}

.list-row {
  display: flex;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
  align-items: center;
  transition: background 0.15s;
}

.list-row:hover {
  background: var(--bg-hover);
}

.list-row.has-conflict {
  background: rgba(239, 68, 68, 0.04);
  border-left: 3px solid #ef4444;
}

.col-date { width: 90px; }
.col-venue { width: 100px; }
.col-time { width: 110px; font-variant-numeric: tabular-nums; }
.col-team { width: 100px; }
.col-person { width: 80px; }
.col-count { width: 50px; text-align: center; }
.col-intensity { width: 60px; }
.col-status { width: 60px; }
.col-actions { flex: 1; display: flex; gap: 4px; }

.intensity-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.intensity-badge.low { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
.intensity-badge.medium { background: rgba(245, 158, 11, 0.15); color: #d97706; }
.intensity-badge.high { background: rgba(239, 68, 68, 0.15); color: #dc2626; }

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.ok { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
.status-badge.conflict { background: rgba(239, 68, 68, 0.15); color: #dc2626; }

.action-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-input);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.action-btn:hover {
  border-color: var(--accent);
  background: var(--bg-hover);
}

.action-btn.delete:hover {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.list-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  padding: 40px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 13px;
  margin-top: 4px;
  opacity: 0.7;
}

.quick-adjust-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 150;
}

.quick-adjust-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  width: 320px;
  z-index: 151;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
}

.quick-adjust-panel h4 {
  margin: 0 0 8px;
  font-size: 16px;
  color: var(--text-primary);
}

.adjust-info {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 16px;
}

.adjust-time {
  margin-bottom: 16px;
}

.adjust-time label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.adjust-time input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
}

.adjust-time input:focus {
  border-color: var(--accent);
}

.adjust-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-primary { background: var(--accent); color: white; }
.btn-secondary { background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border); }
</style>
