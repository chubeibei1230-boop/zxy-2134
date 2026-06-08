<template>
  <div class="batch-form-overlay" v-if="store.state.showBatchScheduleForm" @click.self="cancel">
    <div class="batch-form">
      <div class="form-header">
        <h3>周期排期</h3>
        <button class="btn-icon" @click="cancel">✕</button>
      </div>
      <div class="form-body">
        <div class="form-row">
          <div class="form-group">
            <label>重复模式</label>
            <select v-model="config.repeatMode">
              <option value="consecutive">连续多日</option>
              <option value="daily">每日重复</option>
              <option value="weekly">按周重复</option>
            </select>
          </div>
        </div>

        <div class="form-row" v-if="config.repeatMode === 'consecutive'">
          <div class="form-group">
            <label>开始日期</label>
            <input type="date" v-model="config.startDate" />
          </div>
          <div class="form-group">
            <label>总天数</label>
            <input type="number" v-model.number="config.totalDays" min="1" max="365" />
          </div>
        </div>

        <div class="form-row" v-if="config.repeatMode === 'daily'">
          <div class="form-group">
            <label>开始日期</label>
            <input type="date" v-model="config.startDate" />
          </div>
          <div class="form-group">
            <label>结束日期</label>
            <input type="date" v-model="config.endDate" />
          </div>
        </div>

        <div class="form-row" v-if="config.repeatMode === 'daily'">
          <div class="form-group">
            <label>间隔天数</label>
            <input type="number" v-model.number="config.repeatInterval" min="1" max="30" />
          </div>
        </div>

        <div class="form-row" v-if="config.repeatMode === 'weekly'">
          <div class="form-group">
            <label>开始日期</label>
            <input type="date" v-model="config.startDate" />
          </div>
          <div class="form-group">
            <label>结束日期</label>
            <input type="date" v-model="config.endDate" />
          </div>
        </div>

        <div class="form-row" v-if="config.repeatMode === 'weekly'">
          <div class="form-group full-width">
            <label>选择星期</label>
            <div class="weekday-checkboxes">
              <label
                v-for="wd in weekdayOptions"
                :key="wd.value"
                class="weekday-checkbox"
                :class="{ active: config.weekdays.includes(wd.value) }"
              >
                <input
                  type="checkbox"
                  :value="wd.value"
                  v-model="config.weekdays"
                />
                <span>{{ wd.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="generated-count" v-if="generatedCount > 0">
          将生成 <strong>{{ generatedCount }}</strong> 条训练计划
        </div>
        <div class="generated-count generated-count-zero" v-else-if="config.startDate">
          未匹配到有效日期
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>场地</label>
            <select v-model="config.venue">
              <option value="">请选择场地</option>
              <option v-for="v in store.state.venues" :key="v" :value="v">{{ v }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>队伍</label>
            <select v-model="config.team">
              <option value="">请选择队伍</option>
              <option v-for="t in store.state.teams" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>开始时间</label>
            <input type="time" v-model="config.startTime" step="900" />
          </div>
          <div class="form-group">
            <label>结束时间</label>
            <input type="time" v-model="config.endTime" step="900" />
          </div>
        </div>

        <div class="midday-break-notice" v-if="spansBreak">
          ⚠ 此计划跨越午休时段（{{ store.state.middayBreak.start }}-{{ store.state.middayBreak.end }}），冲突检测将排除午休时段
        </div>

        <div class="time-error-notice" v-if="timeOrderError">
          ✕ 结束时间必须晚于开始时间
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>人数</label>
            <input type="number" v-model.number="config.headcount" min="1" />
          </div>
          <div class="form-group">
            <label>负责人</label>
            <input type="text" v-model="config.responsiblePerson" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>训练强度</label>
            <select v-model="config.intensity">
              <option value="">请选择强度</option>
              <option value="low">低强度</option>
              <option value="medium">中强度</option>
              <option value="high">高强度</option>
            </select>
          </div>
        </div>

        <div class="form-group full-width">
          <label>备注</label>
          <textarea v-model="config.notes" rows="2"></textarea>
        </div>
      </div>

      <div class="form-footer">
        <button class="btn btn-secondary" @click="cancel">取消</button>
        <button class="btn btn-primary" @click="submit" :disabled="!canSubmit">预览排期</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { store, spansMiddayBreak, PLAN_STATUS } from '../store.js'

const weekdayOptions = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' }
]

const config = reactive({
  repeatMode: 'consecutive',
  startDate: store.state.selectedDate,
  endDate: '',
  totalDays: 3,
  weekdays: [],
  repeatInterval: 1,
  venue: '',
  startTime: '',
  endTime: '',
  team: '',
  headcount: 1,
  responsiblePerson: '',
  intensity: '',
  notes: ''
})

const spansBreak = computed(() => {
  if (!config.startTime || !config.endTime) return false
  return spansMiddayBreak(config.startTime, config.endTime, store.state.middayBreak)
})

const timeOrderError = computed(() => {
  if (!config.startTime || !config.endTime) return false
  const [sh, sm] = config.startTime.split(':').map(Number)
  const [eh, em] = config.endTime.split(':').map(Number)
  return eh * 60 + em <= sh * 60 + sm
})

const generatedCount = computed(() => {
  return store.generateBatchDates(config).length
})

const canSubmit = computed(() => {
  if (!config.startDate) return false
  if (config.repeatMode === 'consecutive' && (!config.totalDays || config.totalDays < 1)) return false
  if ((config.repeatMode === 'daily' || config.repeatMode === 'weekly') && !config.endDate) return false
  if (config.repeatMode === 'weekly' && config.weekdays.length === 0) return false
  if (generatedCount.value === 0) return false
  if (!config.venue) return false
  if (!config.startTime || !config.endTime) return false
  if (timeOrderError.value) return false
  if (!config.team) return false
  if (!config.intensity) return false
  return true
})

watch(() => store.state.showBatchScheduleForm, (shown) => {
  if (shown) {
    resetConfig()
  }
})

function resetConfig() {
  config.repeatMode = 'consecutive'
  config.startDate = store.state.selectedDate
  config.endDate = ''
  config.totalDays = 3
  config.weekdays = []
  config.repeatInterval = 1
  config.venue = ''
  config.startTime = ''
  config.endTime = ''
  config.team = ''
  config.headcount = 1
  config.responsiblePerson = ''
  config.intensity = ''
  config.notes = ''
}

function submit() {
  if (!canSubmit.value) return
  store.submitBatchSchedule({ ...config })
}

function cancel() {
  store.closeBatchScheduleForm()
}
</script>

<style scoped>
.batch-form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.batch-form {
  background: var(--bg-card);
  border-radius: 12px;
  width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.form-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.btn-icon {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px 8px;
  border-radius: 6px;
}

.btn-icon:hover {
  background: var(--bg-hover);
}

.form-body {
  padding: 20px 24px;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full-width {
  margin-bottom: 16px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--accent);
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.weekday-checkboxes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.weekday-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-input);
  transition: all 0.2s;
  user-select: none;
}

.weekday-checkbox input {
  display: none;
}

.weekday-checkbox:hover {
  border-color: var(--accent);
}

.weekday-checkbox.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.generated-count {
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #818cf8;
  margin-bottom: 16px;
}

.generated-count strong {
  color: var(--accent);
  font-weight: 600;
}

.generated-count-zero {
  background: rgba(107, 114, 128, 0.08);
  border: 1px solid rgba(107, 114, 128, 0.25);
  color: var(--text-secondary);
}

.midday-break-notice {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #d97706;
  margin-bottom: 16px;
}

.time-error-notice {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #dc2626;
  margin-bottom: 16px;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

.btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-secondary {
  background: var(--bg-hover);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border);
}
</style>
