<template>
  <div class="occ-form-overlay" v-if="visible" @click.self="cancel">
    <div class="occ-form">
      <div class="form-header">
        <h3>登记场地占用</h3>
        <button class="btn-icon" @click="cancel">✕</button>
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

        <div class="time-error-notice" v-if="timeOrderError">
          ✕ 结束时间必须晚于开始时间
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>占用类型</label>
            <select v-model="form.type">
              <option v-for="(label, key) in OCCUPATION_TYPE_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
        </div>

        <div class="form-group full-width">
          <label>占用原因</label>
          <input type="text" v-model="form.reason" placeholder="填写占用原因（如：设备检修、场地养护等）" />
        </div>

        <div class="form-group full-width">
          <label>备注</label>
          <textarea v-model="form.notes" rows="2" placeholder="补充说明（选填）"></textarea>
        </div>

        <div class="affected-preview" v-if="affectedPlans.length > 0">
          <div class="affected-title">⚠ 该时段存在 {{ affectedPlans.length }} 条训练计划受影响</div>
          <div class="affected-item" v-for="plan in affectedPlans" :key="plan.id">
            <span class="affected-team">{{ plan.team }}</span>
            <span class="affected-time">{{ plan.startTime }}-{{ plan.endTime }}</span>
            <span
              class="affected-status"
              :style="{ background: STATUS_COLORS[plan.status].bg, color: STATUS_COLORS[plan.status].color }"
            >{{ STATUS_LABELS[plan.status] }}</span>
          </div>
          <div class="affected-hint">登记后，这些计划将被标记为占用冲突，执行人无法直接提交</div>
        </div>

        <div class="overlap-warning" v-if="overlappingOccupations.length > 0">
          <div class="overlap-title">⚠ 该时段已有其他占用</div>
          <div class="overlap-item" v-for="occ in overlappingOccupations" :key="occ.id">
            <span
              class="overlap-type"
              :style="{ background: OCCUPATION_TYPE_COLORS[occ.type].bg, color: OCCUPATION_TYPE_COLORS[occ.type].color }"
            >{{ OCCUPATION_TYPE_LABELS[occ.type] }}</span>
            <span class="overlap-time">{{ occ.startTime }}-{{ occ.endTime }}</span>
            <span class="overlap-reason">{{ occ.reason }}</span>
          </div>
        </div>
      </div>

      <div class="form-footer">
        <button class="btn btn-secondary" @click="cancel">取消</button>
        <button class="btn btn-primary" @click="confirm" :disabled="!canSave">
          确认登记
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { store, timeToMinutes, OCCUPATION_TYPE_LABELS, OCCUPATION_TYPE_COLORS, STATUS_LABELS, STATUS_COLORS, getEffectiveSegments } from '../store.js'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'confirmed'])

const form = reactive({
  date: store.state.selectedDate,
  venue: '',
  startTime: '',
  endTime: '',
  type: 'maintenance',
  reason: '',
  notes: ''
})

const timeOrderError = computed(() => {
  if (!form.startTime || !form.endTime) return false
  return timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)
})

const affectedPlans = computed(() => {
  if (!form.venue || !form.date || !form.startTime || !form.endTime || timeOrderError.value) return []
  const visible = store.getVisiblePlans()
  const visibleIds = new Set(visible.map(p => p.id))
  const occSegments = getEffectiveSegments(form.startTime, form.endTime, store.state.middayBreak)
  return store.state.plans.filter(plan => {
    if (plan.status === 'rejected') return false
    if (plan.venue !== form.venue) return false
    if (plan.date !== form.date) return false
    if (!plan.startTime || !plan.endTime) return false
    if (!visibleIds.has(plan.id)) return false
    const planSegments = getEffectiveSegments(plan.startTime, plan.endTime, store.state.middayBreak)
    return planSegments.some(ps =>
      occSegments.some(os => {
        const psS = timeToMinutes(ps.start), psE = timeToMinutes(ps.end)
        const osS = timeToMinutes(os.start), osE = timeToMinutes(os.end)
        return psS < osE && osS < psE
      })
    )
  })
})

const overlappingOccupations = computed(() => {
  if (!form.venue || !form.date || !form.startTime || !form.endTime || timeOrderError.value) return []
  const newOccSegs = getEffectiveSegments(form.startTime, form.endTime, store.state.middayBreak)
  return store.state.occupations.filter(occ => {
    if (occ.cancelled) return false
    if (occ.venue !== form.venue) return false
    if (occ.date !== form.date) return false
    const existOccSegs = getEffectiveSegments(occ.startTime, occ.endTime, store.state.middayBreak)
    return newOccSegs.some(ns =>
      existOccSegs.some(es => {
        const nsS = timeToMinutes(ns.start), nsE = timeToMinutes(ns.end)
        const esS = timeToMinutes(es.start), esE = timeToMinutes(es.end)
        return nsS < esE && esS < nsE
      })
    )
  })
})

const canSave = computed(() => {
  return form.date && form.venue && form.startTime && form.endTime && form.type && form.reason.trim() && !timeOrderError.value
})

watch(() => props.visible, (val) => {
  if (val) {
    form.date = store.state.selectedDate
    form.venue = ''
    form.startTime = ''
    form.endTime = ''
    form.type = 'maintenance'
    form.reason = ''
    form.notes = ''
  }
})

function cancel() {
  emit('close')
}

function confirm() {
  if (!canSave.value) return
  const result = store.addOccupation({
    date: form.date,
    venue: form.venue,
    startTime: form.startTime,
    endTime: form.endTime,
    type: form.type,
    reason: form.reason,
    notes: form.notes
  })
  const visibleAffected = result.affectedPlans.filter(p => {
    const visible = store.getVisiblePlans()
    return visible.some(vp => vp.id === p.id)
  })
  if (visibleAffected.length > 0) {
    const names = visibleAffected
      .map(p => `${p.team}(${p.startTime}-${p.endTime})`)
      .join('、')
    alert(`占用已登记！\n\n⚠ 以下计划受到影响：${names}\n这些计划已被标记为占用冲突，相关执行人需调整时段。`)
  }
  emit('confirmed')
  emit('close')
}
</script>

<style scoped>
.occ-form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.occ-form {
  background: var(--bg-card);
  border-radius: 12px;
  width: 520px;
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

.time-error-notice {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #dc2626;
  margin-bottom: 16px;
}

.affected-preview {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.affected-title {
  font-size: 13px;
  font-weight: 600;
  color: #d97706;
  margin-bottom: 8px;
}

.affected-item {
  display: flex;
  gap: 10px;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 3px 0;
  align-items: center;
}

.affected-team {
  color: var(--text-primary);
  font-weight: 500;
}

.affected-time {
  color: #d97706;
  font-variant-numeric: tabular-nums;
}

.affected-status {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.affected-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(245, 158, 11, 0.15);
}

.overlap-warning {
  background: rgba(249, 115, 22, 0.08);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 8px;
  padding: 12px 14px;
}

.overlap-title {
  font-size: 13px;
  font-weight: 600;
  color: #ea580c;
  margin-bottom: 8px;
}

.overlap-item {
  display: flex;
  gap: 10px;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 3px 0;
  align-items: center;
}

.overlap-type {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.overlap-time {
  color: #ea580c;
  font-variant-numeric: tabular-nums;
}

.overlap-reason {
  color: var(--text-primary);
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
