<template>
  <div class="cr-form-overlay" v-if="store.state.showChangeRequestForm" @click.self="cancel">
    <div class="cr-form">
      <div class="form-header">
        <h3>发起变更申请</h3>
        <button class="btn-icon" @click="cancel">✕</button>
      </div>

      <div class="original-plan-info" v-if="originalPlan">
        <div class="info-title">📋 原计划信息</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">队伍</span>
            <span class="info-value">{{ originalPlan.team }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">场地</span>
            <span class="info-value">{{ originalPlan.venue }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">日期</span>
            <span class="info-value">{{ originalPlan.date }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">时段</span>
            <span class="info-value">{{ originalPlan.startTime }}-{{ originalPlan.endTime }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">状态</span>
            <span
              class="plan-status-badge"
              :style="{ background: STATUS_COLORS[originalPlan.status].bg, color: STATUS_COLORS[originalPlan.status].color }"
            >{{ STATUS_LABELS[originalPlan.status] }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">负责人</span>
            <span class="info-value">{{ originalPlan.responsiblePerson }}</span>
          </div>
        </div>
      </div>

      <div class="form-body">
        <div class="form-row">
          <div class="form-group">
            <label>变更类型</label>
            <select v-model="form.changeType" @change="onChangeType">
              <option v-for="(label, key) in CHANGE_TYPE_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
        </div>

        <div class="cancel-warning" v-if="form.changeType === 'cancel'">
          <div class="cancel-icon">⚠</div>
          <div class="cancel-text">取消计划变更将使原计划标记为已取消，此操作需经监督人审核和组织者确认后方可生效</div>
        </div>

        <template v-if="form.changeType !== 'cancel'">
          <div class="form-row">
            <div class="form-group">
              <label>目标日期</label>
              <input type="date" v-model="form.targetDate" />
            </div>
            <div class="form-group">
              <label>目标场地</label>
              <select v-model="form.targetVenue">
                <option value="">请选择场地</option>
                <option v-for="v in store.state.venues" :key="v" :value="v">{{ v }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>目标开始时间</label>
              <input type="time" v-model="form.targetStartTime" step="900" />
            </div>
            <div class="form-group">
              <label>目标结束时间</label>
              <input type="time" v-model="form.targetEndTime" step="900" />
            </div>
          </div>

          <div class="midday-break-notice" v-if="targetSpansBreak">
            ⚠ 目标时段跨越午休（{{ store.state.middayBreak.start }}-{{ store.state.middayBreak.end }}），冲突检测将排除午休时段
          </div>

          <div class="time-error-notice" v-if="targetTimeOrderError">
            ✕ 目标结束时间必须晚于开始时间
          </div>

          <div class="change-diff" v-if="hasTargetSchedule && !targetTimeOrderError">
            <div class="diff-title">🔄 变更对比</div>
            <div class="diff-row">
              <span class="diff-label">日期</span>
              <span class="diff-old">{{ originalPlan?.date }}</span>
              <span class="diff-arrow">→</span>
              <span class="diff-new" :class="{ changed: form.targetDate !== originalPlan?.date }">{{ form.targetDate }}</span>
            </div>
            <div class="diff-row">
              <span class="diff-label">场地</span>
              <span class="diff-old">{{ originalPlan?.venue }}</span>
              <span class="diff-arrow">→</span>
              <span class="diff-new" :class="{ changed: form.targetVenue !== originalPlan?.venue }">{{ form.targetVenue }}</span>
            </div>
            <div class="diff-row">
              <span class="diff-label">时段</span>
              <span class="diff-old">{{ originalPlan?.startTime }}-{{ originalPlan?.endTime }}</span>
              <span class="diff-arrow">→</span>
              <span class="diff-new" :class="{ changed: form.targetStartTime !== originalPlan?.startTime || form.targetEndTime !== originalPlan?.endTime }">{{ form.targetStartTime }}-{{ form.targetEndTime }}</span>
            </div>
          </div>

          <div class="conflict-preview" v-if="previewConflicts.length > 0">
            <div class="conflict-title">⚠ 目标时段存在冲突</div>
            <div class="conflict-item" v-for="c in previewConflicts" :key="c.id">
              <span class="conflict-team">{{ c.team }}</span>
              <span class="conflict-time">{{ c.startTime }}-{{ c.endTime }}</span>
              <span class="conflict-venue">{{ c.venue }}</span>
              <span
                class="conflict-status"
                :style="{ background: STATUS_COLORS[c.status].bg, color: STATUS_COLORS[c.status].color }"
              >{{ STATUS_LABELS[c.status] }}</span>
            </div>
            <div class="conflict-hint">冲突不阻止提交变更申请，但需在审核时注意</div>
          </div>

          <div class="occupation-conflict-preview" v-if="occupationConflicts.length > 0">
            <div class="occ-conflict-title">🚫 目标时段场地已被占用</div>
            <div class="occ-conflict-item" v-for="occ in occupationConflicts" :key="occ.id">
              <span
                class="occ-type-badge"
                :style="{ background: OCCUPATION_TYPE_COLORS[occ.type].bg, color: OCCUPATION_TYPE_COLORS[occ.type].color }"
              >{{ OCCUPATION_TYPE_LABELS[occ.type] }}</span>
              <span class="occ-conflict-venue">{{ occ.venue }}</span>
              <span class="occ-conflict-time">{{ occ.startTime }}-{{ occ.endTime }}</span>
              <span class="occ-conflict-reason" v-if="occ.reason">{{ occ.reason }}</span>
            </div>
            <div class="occ-conflict-hint">场地占用冲突不阻止提交，但审核时可能被驳回</div>
          </div>
        </template>

        <div class="form-group full-width">
          <label>变更原因 <span class="required">*</span></label>
          <textarea v-model="form.reason" rows="3" placeholder="请详细说明变更原因，如：接到上级通知、场地临时安排、天气原因等"></textarea>
        </div>
      </div>

      <div class="form-footer">
        <button class="btn btn-secondary" @click="cancel">取消</button>
        <button class="btn btn-primary" @click="submit" :disabled="!canSubmit">
          提交变更申请
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import {
  store, spansMiddayBreak, timeToMinutes, checkConflictsForPreview,
  PLAN_STATUS, STATUS_LABELS, STATUS_COLORS, OCCUPATION_TYPE_LABELS, OCCUPATION_TYPE_COLORS,
  CHANGE_TYPE, CHANGE_TYPE_LABELS
} from '../store.js'

const originalPlan = computed(() => store.changeRequestTargetPlan.value)

const form = reactive({
  changeType: CHANGE_TYPE.CHANGE_TIME,
  targetDate: '',
  targetVenue: '',
  targetStartTime: '',
  targetEndTime: '',
  reason: ''
})

const hasTargetSchedule = computed(() => {
  return form.targetDate && form.targetVenue && form.targetStartTime && form.targetEndTime
})

const targetTimeOrderError = computed(() => {
  if (!form.targetStartTime || !form.targetEndTime) return false
  return timeToMinutes(form.targetEndTime) <= timeToMinutes(form.targetStartTime)
})

const targetSpansBreak = computed(() => {
  if (!form.targetStartTime || !form.targetEndTime) return false
  return spansMiddayBreak(form.targetStartTime, form.targetEndTime, store.state.middayBreak)
})

const previewConflicts = computed(() => {
  if (!hasTargetSchedule.value || targetTimeOrderError.value) return []
  return checkConflictsForPreview(
    { venue: form.targetVenue, date: form.targetDate, startTime: form.targetStartTime, endTime: form.targetEndTime },
    store.state.changeRequestTargetPlanId
  )
})

const occupationConflicts = computed(() => {
  if (!hasTargetSchedule.value || targetTimeOrderError.value) return []
  return store.checkOccupationConflictsForPreview(
    { venue: form.targetVenue, date: form.targetDate, startTime: form.targetStartTime, endTime: form.targetEndTime }
  )
})

const canSubmit = computed(() => {
  if (!form.reason.trim()) return false
  if (form.changeType === CHANGE_TYPE.CANCEL) return true
  return hasTargetSchedule.value && !targetTimeOrderError.value
})

watch(() => store.state.showChangeRequestForm, (shown) => {
  if (shown && originalPlan.value) {
    form.changeType = CHANGE_TYPE.CHANGE_TIME
    form.targetDate = originalPlan.value.date
    form.targetVenue = originalPlan.value.venue
    form.targetStartTime = originalPlan.value.startTime
    form.targetEndTime = originalPlan.value.endTime
    form.reason = ''
  }
})

function onChangeType() {
  if (form.changeType === CHANGE_TYPE.CANCEL) return
}

function cancel() {
  store.closeChangeRequestForm()
}

function submit() {
  if (!canSubmit.value) return
  const planId = store.state.changeRequestTargetPlanId
  if (!planId) return

  const result = store.addChangeRequest({
    originalPlanId: planId,
    changeType: form.changeType,
    reason: form.reason,
    targetDate: form.changeType === CHANGE_TYPE.CANCEL ? '' : form.targetDate,
    targetVenue: form.changeType === CHANGE_TYPE.CANCEL ? '' : form.targetVenue,
    targetStartTime: form.changeType === CHANGE_TYPE.CANCEL ? '' : form.targetStartTime,
    targetEndTime: form.changeType === CHANGE_TYPE.CANCEL ? '' : form.targetEndTime
  })

  if (result) {
    store.closeChangeRequestForm()
  }
}
</script>

<style scoped>
.cr-form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.cr-form {
  background: var(--bg-card);
  border-radius: 12px;
  width: 600px;
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

.original-plan-info {
  margin: 16px 24px 0;
  background: rgba(99, 102, 241, 0.06);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  padding: 12px 14px;
}

.info-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.info-label {
  color: var(--text-secondary);
  min-width: 40px;
}

.info-value {
  color: var(--text-primary);
  font-weight: 500;
}

.plan-status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
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

.required {
  color: #dc2626;
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

.cancel-warning {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 16px;
}

.cancel-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.cancel-text {
  font-size: 13px;
  color: #dc2626;
  line-height: 1.5;
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

.change-diff {
  background: rgba(168, 85, 247, 0.06);
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 16px;
}

.diff-title {
  font-size: 13px;
  font-weight: 600;
  color: #9333ea;
  margin-bottom: 8px;
}

.diff-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  padding: 4px 0;
}

.diff-label {
  color: var(--text-secondary);
  min-width: 36px;
}

.diff-old {
  color: var(--text-secondary);
}

.diff-arrow {
  color: var(--text-secondary);
  font-size: 12px;
}

.diff-new {
  color: var(--text-primary);
  font-weight: 500;
}

.diff-new.changed {
  color: #9333ea;
}

.conflict-preview {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 16px;
}

.conflict-title {
  font-size: 13px;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 8px;
}

.conflict-item {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 0;
  align-items: center;
}

.conflict-team {
  color: var(--text-primary);
  font-weight: 500;
}

.conflict-time {
  color: #dc2626;
}

.conflict-venue {
  color: var(--text-secondary);
}

.conflict-status {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.conflict-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(239, 68, 68, 0.15);
}

.occupation-conflict-preview {
  background: rgba(249, 115, 22, 0.08);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 16px;
}

.occ-conflict-title {
  font-size: 13px;
  font-weight: 600;
  color: #ea580c;
  margin-bottom: 8px;
}

.occ-conflict-item {
  display: flex;
  gap: 10px;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 0;
  align-items: center;
}

.occ-type-badge {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}

.occ-conflict-venue {
  color: var(--text-primary);
  font-weight: 500;
}

.occ-conflict-time {
  color: #ea580c;
  font-variant-numeric: tabular-nums;
}

.occ-conflict-reason {
  color: var(--text-secondary);
}

.occ-conflict-hint {
  font-size: 12px;
  color: #ea580c;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(249, 115, 22, 0.15);
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
