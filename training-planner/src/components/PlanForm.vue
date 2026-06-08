<template>
  <div class="plan-form-overlay" v-if="store.state.showForm" @click.self="cancel">
    <div class="plan-form">
      <div class="form-header">
        <h3>{{ formTitle }}</h3>
        <button class="btn-icon" @click="cancel">✕</button>
      </div>

      <div class="form-reject-notice" v-if="isEdit && editingPlanData?.status === PLAN_STATUS.REJECTED">
        <div class="reject-notice-title">⚠ 该计划已被驳回</div>
        <div class="reject-notice-reason" v-if="editingPlanData?.rejectReason">
          驳回原因：{{ editingPlanData.rejectReason }}
        </div>
        <div class="reject-notice-hint">请根据驳回原因修改后重新提交</div>
      </div>

      <div class="form-body">
        <div class="form-row">
          <div class="form-group">
            <label>日期</label>
            <input type="date" v-model="form.date" />
          </div>
          <div class="form-group">
            <label>场地</label>
            <select v-model="form.venue">
              <option value="">请选择场地</option>
              <option v-for="v in store.state.venues" :key="v" :value="v">{{ v }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>开始时间</label>
            <input type="time" v-model="form.startTime" step="900" />
          </div>
          <div class="form-group">
            <label>结束时间</label>
            <input type="time" v-model="form.endTime" step="900" />
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
            <label>队伍</label>
            <select v-model="form.team">
              <option value="">请选择队伍</option>
              <option v-for="t in store.state.teams" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>人数</label>
            <input type="number" v-model.number="form.headcount" min="1" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>负责人</label>
            <input type="text" v-model="form.responsiblePerson" />
          </div>
          <div class="form-group">
            <label>训练强度</label>
            <select v-model="form.intensity">
              <option value="">请选择强度</option>
              <option value="low">低强度</option>
              <option value="medium">中强度</option>
              <option value="high">高强度</option>
            </select>
          </div>
        </div>

        <div class="form-group full-width">
          <label>备注</label>
          <textarea v-model="form.notes" rows="2"></textarea>
        </div>

        <div class="conflict-preview" v-if="previewConflicts.length > 0">
          <div class="conflict-title">⚠ 检测到时间冲突</div>
          <div class="conflict-item" v-for="c in previewConflicts" :key="c.id">
            <span class="conflict-team">{{ c.team }}</span>
            <span class="conflict-time">{{ c.startTime }}-{{ c.endTime }}</span>
            <span class="conflict-venue">{{ c.venue }}</span>
            <span
              class="conflict-status"
              :style="{ background: STATUS_COLORS[c.status].bg, color: STATUS_COLORS[c.status].color }"
            >{{ STATUS_LABELS[c.status] }}</span>
          </div>
        </div>

        <div class="occupation-conflict-preview" v-if="occupationConflicts.length > 0">
          <div class="occ-conflict-title">🚫 场地已被占用，不可提交审批</div>
          <div class="occ-conflict-item" v-for="occ in occupationConflicts" :key="occ.id">
            <span
              class="occ-type-badge"
              :style="{ background: OCCUPATION_TYPE_COLORS[occ.type].bg, color: OCCUPATION_TYPE_COLORS[occ.type].color }"
            >{{ OCCUPATION_TYPE_LABELS[occ.type] }}</span>
            <span class="occ-conflict-venue">{{ occ.venue }}</span>
            <span class="occ-conflict-time">{{ occ.startTime }}-{{ occ.endTime }}</span>
            <span class="occ-conflict-reason" v-if="occ.reason">{{ occ.reason }}</span>
          </div>
          <div class="occ-conflict-hint">请调整时段或更换场地后再提交</div>
        </div>
      </div>

      <div class="form-footer">
        <button class="btn btn-secondary" @click="cancel">取消</button>
        <template v-if="isExecutor">
          <button class="btn btn-draft" @click="saveDraft" :disabled="!canSaveDraft">
            {{ isEdit && editingPlanData?.status === PLAN_STATUS.REJECTED ? '保存修改' : '保存草稿' }}
          </button>
          <button class="btn btn-primary" @click="submitAndApprove" :disabled="!canSubmit">
            {{ isEdit && editingPlanData?.status === PLAN_STATUS.REJECTED ? '修改并重新提交' : '创建并提交审批' }}
          </button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="saveDraft" :disabled="!canSaveDraft">
            保存
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { store, spansMiddayBreak, checkConflictsForPreview, timeToMinutes, PLAN_STATUS, STATUS_LABELS, STATUS_COLORS, OCCUPATION_TYPE_LABELS, OCCUPATION_TYPE_COLORS } from '../store.js'

const isEdit = computed(() => !!store.state.editingPlanId)
const isExecutor = computed(() => store.state.currentRole === 'executor')

const editingPlanData = computed(() => store.editingPlan.value)

const formTitle = computed(() => {
  if (!isEdit.value) return '新建计划'
  const plan = editingPlanData.value
  if (plan?.status === PLAN_STATUS.REJECTED) return '修改计划（已驳回）'
  return '编辑计划'
})

const form = reactive({
  date: store.state.selectedDate,
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
  if (!form.startTime || !form.endTime) return false
  return spansMiddayBreak(form.startTime, form.endTime, store.state.middayBreak)
})

const previewConflicts = computed(() => {
  if (!form.venue || !form.date || !form.startTime || !form.endTime || timeOrderError.value) return []
  return checkConflictsForPreview(
    { venue: form.venue, date: form.date, startTime: form.startTime, endTime: form.endTime },
    store.state.editingPlanId
  )
})

const occupationConflicts = computed(() => {
  if (!form.venue || !form.date || !form.startTime || !form.endTime || timeOrderError.value) return []
  return store.checkOccupationConflictsForPreview(
    { venue: form.venue, date: form.date, startTime: form.startTime, endTime: form.endTime }
  )
})

const hasOccupationConflict = computed(() => occupationConflicts.value.length > 0)

const timeOrderError = computed(() => {
  if (!form.startTime || !form.endTime) return false
  return timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)
})

const canSaveDraft = computed(() => {
  return form.date && form.venue && form.startTime && form.endTime && form.team && form.intensity && !timeOrderError.value
})

const canSubmit = computed(() => canSaveDraft.value && !hasOccupationConflict.value)

watch(() => store.state.editingPlanId, (newId) => {
  if (newId) {
    const plan = store.editingPlan.value
    if (plan) {
      form.date = plan.date
      form.venue = plan.venue
      form.startTime = plan.startTime
      form.endTime = plan.endTime
      form.team = plan.team
      form.headcount = plan.headcount
      form.responsiblePerson = plan.responsiblePerson
      form.intensity = plan.intensity
      form.notes = plan.notes
    }
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => store.state.showForm, (shown) => {
  if (shown && !store.state.editingPlanId) {
    resetForm()
  }
})

function resetForm() {
  form.date = store.state.selectedDate
  form.venue = ''
  form.startTime = ''
  form.endTime = ''
  form.team = ''
  form.headcount = 1
  form.responsiblePerson = ''
  form.intensity = ''
  form.notes = ''
}

function saveDraft() {
  if (!canSaveDraft.value) return
  const planData = {
    date: form.date,
    venue: form.venue,
    startTime: form.startTime,
    endTime: form.endTime,
    team: form.team,
    headcount: form.headcount,
    responsiblePerson: form.responsiblePerson,
    intensity: form.intensity,
    notes: form.notes
  }
  if (isEdit.value) {
    store.updatePlan(store.state.editingPlanId, planData)
  } else {
    store.addPlan({ ...planData, status: PLAN_STATUS.DRAFT })
  }
  store.closeForm()
}

function submitAndApprove() {
  if (!canSubmit.value) return
  const planData = {
    date: form.date,
    venue: form.venue,
    startTime: form.startTime,
    endTime: form.endTime,
    team: form.team,
    headcount: form.headcount,
    responsiblePerson: form.responsiblePerson,
    intensity: form.intensity,
    notes: form.notes
  }
  if (isEdit.value) {
    store.updatePlan(store.state.editingPlanId, planData)
    const result = store.resubmitPlan(store.state.editingPlanId)
    if (!result) {
      const error = store.getTransitionError(store.state.editingPlanId, PLAN_STATUS.REJECTED, PLAN_STATUS.PENDING_APPROVAL)
      alert(error || '重新提交失败')
    }
  } else {
    const plan = store.addPlan({ ...planData, status: PLAN_STATUS.DRAFT })
    const result = store.submitPlan(plan.id)
    if (!result) {
      const error = store.getTransitionError(plan.id, PLAN_STATUS.DRAFT, PLAN_STATUS.PENDING_APPROVAL)
      alert(error || '提交失败')
    }
  }
  store.closeForm()
}

function cancel() {
  store.closeForm()
}
</script>

<style scoped>
.plan-form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.plan-form {
  background: var(--bg-card);
  border-radius: 12px;
  width: 560px;
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

.form-reject-notice {
  margin: 16px 24px 0;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 12px 14px;
}

.reject-notice-title {
  font-size: 13px;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 6px;
}

.reject-notice-reason {
  font-size: 13px;
  color: var(--text-primary);
  margin-bottom: 6px;
  padding: 6px 8px;
  background: rgba(239, 68, 68, 0.06);
  border-radius: 4px;
}

.reject-notice-hint {
  font-size: 12px;
  color: var(--text-secondary);
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

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
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

.conflict-preview {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 12px 14px;
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

.btn-draft {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.btn-draft:hover:not(:disabled) {
  background: rgba(107, 114, 128, 0.3);
  color: var(--text-primary);
}

.occupation-conflict-preview {
  background: rgba(249, 115, 22, 0.08);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 8px;
  padding: 12px 14px;
  margin-top: 12px;
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
</style>
