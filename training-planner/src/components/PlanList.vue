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
      <select v-model="store.state.filters.status" class="filter-select">
        <option value="">全部状态</option>
        <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
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
      <span class="col-plan-status">状态</span>
      <span class="col-conflict">冲突</span>
      <span class="col-actions">操作</span>
    </div>

    <div class="list-body" v-if="store.filteredPlans.value.length > 0">
      <div
        v-for="plan in store.filteredPlans.value"
        :key="plan.id"
        class="list-row"
        :class="{
          'has-conflict': plan.hasConflict,
          'is-rejected': plan.status === PLAN_STATUS.REJECTED,
          'is-pending': plan.status === PLAN_STATUS.PENDING_APPROVAL,
          'is-draft': plan.status === PLAN_STATUS.DRAFT,
          'affected-by-occupation': plan.affectedByOccupation
        }"
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
        <span class="col-plan-status">
          <span
            class="plan-status-badge"
            :style="{ background: STATUS_COLORS[plan.status].bg, color: STATUS_COLORS[plan.status].color }"
          >
            {{ STATUS_LABELS[plan.status] }}
          </span>
        </span>
        <span class="col-conflict">
          <span class="conflict-badge" :class="plan.hasConflict ? 'conflict' : 'ok'">
            {{ plan.hasConflict ? (plan.affectedByOccupation ? '占用' : '冲突') : '正常' }}
          </span>
        </span>
        <span class="col-actions">
          <template v-if="isExecutor">
            <button
              v-if="plan.status === PLAN_STATUS.DRAFT"
              class="action-btn edit"
              @click="store.startEdit(plan)"
              title="编辑"
            >✎</button>
            <button
              v-if="plan.status === PLAN_STATUS.DRAFT"
              class="action-btn submit"
              @click="handleSubmit(plan)"
              title="提交审批"
            >📤</button>
            <button
              v-if="plan.status === PLAN_STATUS.REJECTED"
              class="action-btn edit"
              @click="store.startEdit(plan)"
              title="修改"
            >✎</button>
            <button
              v-if="plan.status === PLAN_STATUS.REJECTED"
              class="action-btn resubmit"
              @click="handleResubmit(plan)"
              title="重新提交"
            >🔄</button>
            <button
              v-if="plan.status === PLAN_STATUS.DRAFT || plan.status === PLAN_STATUS.REJECTED"
              class="action-btn delete"
              @click="handleDelete(plan)"
              title="删除"
            >🗑</button>
          </template>
          <template v-if="isSupervisor && plan.status === PLAN_STATUS.PENDING_APPROVAL">
            <button class="action-btn approve" @click="openApprovalDialog(plan, 'approve')" title="通过">✓</button>
            <button class="action-btn reject" @click="openApprovalDialog(plan, 'reject')" title="驳回">✕</button>
          </template>
          <template v-if="isOrganizer && plan.status === PLAN_STATUS.APPROVED">
            <button class="action-btn publish" @click="handlePublish(plan)" title="发布">📢</button>
          </template>
          <template v-if="isExecutor && plan.status === PLAN_STATUS.PUBLISHED">
            <button class="action-btn end-early" @click="handleEndEarly(plan)" title="提前结束">⏹</button>
            <button class="action-btn extend" @click="handleExtend(plan)" title="临时延长">⏩</button>
          </template>
          <template v-if="isExecutor && (plan.status === PLAN_STATUS.APPROVED || plan.status === PLAN_STATUS.PUBLISHED)">
            <button class="action-btn change" @click="handleStartChangeRequest(plan)" title="发起变更申请">📝</button>
          </template>
          <button
            v-if="plan.status === PLAN_STATUS.REJECTED"
            class="action-btn info"
            @click="showRejectReason(plan)"
            title="查看驳回原因"
          >ℹ</button>
        </span>
        <div class="row-reject-reason" v-if="plan.status === PLAN_STATUS.REJECTED && plan.rejectReason">
          <span class="reject-label">驳回原因：</span>{{ plan.rejectReason }}
        </div>
        <div class="row-approval-comment" v-if="(plan.status === PLAN_STATUS.APPROVED || plan.status === PLAN_STATUS.PUBLISHED) && plan.approvalComment">
          <span class="approve-label">审批意见：</span>{{ plan.approvalComment }}
        </div>
        <div class="row-occupation-conflict" v-if="plan.affectedByOccupation && plan.occupationConflicts && plan.occupationConflicts.length > 0">
          <span class="occ-label">🔧 场地占用冲突：</span>
          <span class="occ-detail" v-for="occId in plan.occupationConflicts" :key="occId">
            {{ getOccupationLabel(occId) }}
          </span>
        </div>
        <div class="row-change-request" v-if="getActiveChangeRequest(plan)">
          <span class="cr-label">📝 变更申请中：</span>
          <span
            class="cr-type-badge"
            :style="{ background: CHANGE_TYPE_COLORS[getActiveChangeRequest(plan).changeType].bg, color: CHANGE_TYPE_COLORS[getActiveChangeRequest(plan).changeType].color }"
          >{{ CHANGE_TYPE_LABELS[getActiveChangeRequest(plan).changeType] }}</span>
          <span
            class="cr-status-badge"
            :style="{ background: CHANGE_REQUEST_STATUS_COLORS[getActiveChangeRequest(plan).status].bg, color: CHANGE_REQUEST_STATUS_COLORS[getActiveChangeRequest(plan).status].color }"
          >{{ CHANGE_REQUEST_STATUS_LABELS[getActiveChangeRequest(plan).status] }}</span>
        </div>
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
        <div class="adjust-error" v-if="adjustTimeError">
          ✕ 新结束时间必须晚于开始时间 {{ adjustingPlan.startTime }}
        </div>
        <div class="adjust-actions">
          <button class="btn btn-secondary" @click="adjustingPlan = null">取消</button>
          <button class="btn btn-primary" @click="confirmAdjust" :disabled="!!adjustTimeError">确认</button>
        </div>
      </div>
    </div>

    <div class="approval-dialog" v-if="approvalDialog.visible">
      <div class="approval-overlay" @click="approvalDialog.visible = false"></div>
      <div class="approval-panel">
        <h4>{{ approvalDialog.mode === 'approve' ? '审批通过' : '驳回计划' }}</h4>
        <p class="approval-info">{{ approvalDialog.plan?.team }} · {{ approvalDialog.plan?.venue }} · {{ approvalDialog.plan?.startTime }}-{{ approvalDialog.plan?.endTime }}</p>
        <div class="approval-field">
          <label>{{ approvalDialog.mode === 'approve' ? '审批意见（选填）' : '驳回原因（必填）' }}</label>
          <textarea
            v-model="approvalDialog.comment"
            :placeholder="approvalDialog.mode === 'approve' ? '填写审批意见...' : '请填写驳回原因...'"
            rows="3"
          ></textarea>
        </div>
        <div class="approval-error" v-if="approvalDialog.error">
          {{ approvalDialog.error }}
        </div>
        <div class="approval-actions">
          <button class="btn btn-secondary" @click="approvalDialog.visible = false">取消</button>
          <button
            class="btn"
            :class="approvalDialog.mode === 'approve' ? 'btn-approve' : 'btn-reject'"
            @click="confirmApproval"
            :disabled="approvalDialog.mode === 'reject' && !approvalDialog.comment.trim()"
          >
            {{ approvalDialog.mode === 'approve' ? '确认通过' : '确认驳回' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { store, timeToMinutes, minutesToTime, PLAN_STATUS, STATUS_LABELS, STATUS_COLORS, OCCUPATION_TYPE_LABELS, OCCUPATION_TYPE_COLORS, CHANGE_REQUEST_STATUS, CHANGE_REQUEST_STATUS_LABELS, CHANGE_REQUEST_STATUS_COLORS, CHANGE_TYPE_LABELS, CHANGE_TYPE_COLORS } from '../store.js'

const isExecutor = computed(() => store.state.currentRole === 'executor')
const isSupervisor = computed(() => store.state.currentRole === 'supervisor')
const isOrganizer = computed(() => store.state.currentRole === 'organizer')

const hasFilters = computed(() => {
  const f = store.state.filters
  return f.venue || f.team || f.intensity || f.conflictOnly || f.status
})

function clearFilters() {
  store.state.filters.venue = ''
  store.state.filters.team = ''
  store.state.filters.intensity = ''
  store.state.filters.conflictOnly = false
  store.state.filters.status = ''
}

function intensityLabel(intensity) {
  const map = { low: '低', medium: '中', high: '高' }
  return map[intensity] || intensity
}

function getOccupationLabel(id) {
  const occ = store.state.occupations.find(o => o.id === id)
  if (!occ) return '(已取消)'
  return `${OCCUPATION_TYPE_LABELS[occ.type]} ${occ.venue} ${occ.startTime}-${occ.endTime}`
}

const adjustingPlan = ref(null)
const adjustMode = ref('early')
const adjustEndTime = ref('')

const adjustTimeError = computed(() => {
  if (!adjustingPlan.value || !adjustEndTime.value) return false
  return timeToMinutes(adjustEndTime.value) <= timeToMinutes(adjustingPlan.value.startTime)
})

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
  if (!adjustingPlan.value || !adjustEndTime.value || adjustTimeError.value) return
  const activeCR = getActiveChangeRequest(adjustingPlan.value)
  if (activeCR) {
    alert('该计划已有进行中的变更申请，不能直接修改。请通过变更申请流程处理。')
    adjustingPlan.value = null
    return
  }
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

function handleSubmit(plan) {
  if (plan.affectedByOccupation) {
    const occLabels = (plan.occupationConflicts || []).map(id => getOccupationLabel(id)).join('、')
    alert(`该计划时段与场地占用冲突（${occLabels}），请调整时段或更换场地后再提交`)
    return
  }
  if (confirm(`确定提交「${plan.team} - ${plan.venue}」的计划进行审批？`)) {
    const result = store.submitPlan(plan.id)
    if (!result) {
      const error = store.getTransitionError(plan.id, PLAN_STATUS.DRAFT, PLAN_STATUS.PENDING_APPROVAL)
      alert(error || '提交失败，只有执行人可以提交草稿状态的计划')
    }
  }
}

function handleResubmit(plan) {
  if (plan.affectedByOccupation) {
    const occLabels = (plan.occupationConflicts || []).map(id => getOccupationLabel(id)).join('、')
    alert(`该计划时段与场地占用冲突（${occLabels}），请调整时段或更换场地后再重新提交`)
    return
  }
  if (confirm(`确定重新提交「${plan.team} - ${plan.venue}」的计划？`)) {
    const result = store.resubmitPlan(plan.id)
    if (!result) {
      const error = store.getTransitionError(plan.id, PLAN_STATUS.REJECTED, PLAN_STATUS.PENDING_APPROVAL)
      alert(error || '重新提交失败，只有执行人可以重新提交已驳回的计划')
    }
  }
}

function handlePublish(plan) {
  if (confirm(`确定发布「${plan.team} - ${plan.venue}」的训练计划？发布后将进入正式排期。`)) {
    const result = store.publishPlan(plan.id)
    if (!result) {
      const error = store.getTransitionError(plan.id, PLAN_STATUS.APPROVED, PLAN_STATUS.PUBLISHED)
      alert(error || '发布失败，只有组织者可以发布已通过的计划')
    }
  }
}

function showRejectReason(plan) {
  alert(`驳回原因：${plan.rejectReason || '未填写'}`)
}

function handleStartChangeRequest(plan) {
  store.startChangeRequest(plan)
}

function getActiveChangeRequest(plan) {
  return store.getActiveChangeRequestForPlan(plan.id)
}

const approvalDialog = reactive({
  visible: false,
  mode: 'approve',
  plan: null,
  comment: '',
  error: ''
})

function openApprovalDialog(plan, mode) {
  approvalDialog.visible = true
  approvalDialog.mode = mode
  approvalDialog.plan = plan
  approvalDialog.comment = ''
  approvalDialog.error = ''
}

function confirmApproval() {
  if (!approvalDialog.plan) return
  if (approvalDialog.mode === 'reject' && !approvalDialog.comment.trim()) {
    approvalDialog.error = '驳回时必须填写驳回原因'
    return
  }
  if (approvalDialog.mode === 'approve') {
    const result = store.approvePlan(approvalDialog.plan.id, approvalDialog.comment)
    if (!result) {
      const error = store.getTransitionError(approvalDialog.plan.id, PLAN_STATUS.PENDING_APPROVAL, PLAN_STATUS.APPROVED)
      approvalDialog.error = error || '审批失败，只有监督人可以审批待审批的计划'
      return
    }
  } else {
    const result = store.rejectPlan(approvalDialog.plan.id, approvalDialog.comment)
    if (!result) {
      const error = store.getTransitionError(approvalDialog.plan.id, PLAN_STATUS.PENDING_APPROVAL, PLAN_STATUS.REJECTED)
      approvalDialog.error = error || '驳回失败，只有监督人可以驳回待审批的计划'
      return
    }
  }
  approvalDialog.visible = false
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
  flex-wrap: wrap;
}

.list-row:hover {
  background: var(--bg-hover);
}

.list-row.has-conflict {
  border-left: 3px solid #ef4444;
}

.list-row.is-rejected {
  background: rgba(239, 68, 68, 0.04);
  border-left: 3px solid #ef4444;
}

.list-row.is-pending {
  background: rgba(245, 158, 11, 0.03);
  border-left: 3px solid #d97706;
}

.list-row.is-draft {
  border-left: 3px solid #6b7280;
}

.list-row.affected-by-occupation {
  background: rgba(249, 115, 22, 0.04);
  border-left: 3px solid #ea580c;
}

.col-date { width: 90px; }
.col-venue { width: 100px; }
.col-time { width: 110px; font-variant-numeric: tabular-nums; }
.col-team { width: 100px; }
.col-person { width: 80px; }
.col-count { width: 50px; text-align: center; }
.col-intensity { width: 60px; }
.col-plan-status { width: 72px; }
.col-conflict { width: 60px; }
.col-actions { flex: 1; display: flex; gap: 4px; flex-wrap: wrap; }

.row-reject-reason,
.row-approval-comment {
  width: 100%;
  margin-top: 6px;
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 6px;
}

.row-reject-reason {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

.row-occupation-conflict {
  width: 100%;
  margin-top: 6px;
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 6px;
  background: rgba(249, 115, 22, 0.08);
  color: #ea580c;
}

.row-occupation-conflict .occ-label {
  font-weight: 600;
}

.row-occupation-conflict .occ-detail {
  margin-right: 8px;
}

.row-approval-comment {
  background: rgba(34, 197, 94, 0.08);
  color: #16a34a;
}

.reject-label,
.approve-label {
  font-weight: 600;
}

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

.plan-status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.conflict-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.conflict-badge.ok { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
.conflict-badge.conflict { background: rgba(239, 68, 68, 0.15); color: #dc2626; }

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

.action-btn.submit:hover {
  border-color: #d97706;
  background: rgba(245, 158, 11, 0.1);
}

.action-btn.resubmit:hover {
  border-color: #d97706;
  background: rgba(245, 158, 11, 0.1);
}

.action-btn.approve {
  border-color: #16a34a;
  color: #16a34a;
}

.action-btn.approve:hover {
  background: rgba(34, 197, 94, 0.15);
}

.action-btn.reject {
  border-color: #dc2626;
  color: #dc2626;
}

.action-btn.reject:hover {
  background: rgba(239, 68, 68, 0.15);
}

.action-btn.publish:hover {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

.action-btn.change {
  border-color: #9333ea;
  color: #9333ea;
}

.action-btn.change:hover {
  background: rgba(168, 85, 247, 0.15);
}

.row-change-request {
  width: 100%;
  margin-top: 6px;
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 6px;
  background: rgba(168, 85, 247, 0.08);
  color: #9333ea;
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-change-request .cr-label {
  font-weight: 600;
}

.cr-type-badge,
.cr-status-badge {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
}

.action-btn.delete:hover {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.action-btn.info {
  border-color: #6366f1;
  color: #6366f1;
}

.action-btn.info:hover {
  background: rgba(99, 102, 241, 0.1);
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

.quick-adjust-overlay,
.approval-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 150;
}

.quick-adjust-panel,
.approval-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  width: 380px;
  z-index: 151;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
}

.quick-adjust-panel h4,
.approval-panel h4 {
  margin: 0 0 8px;
  font-size: 16px;
  color: var(--text-primary);
}

.adjust-info,
.approval-info {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 16px;
}

.adjust-time,
.approval-field {
  margin-bottom: 16px;
}

.adjust-time label,
.approval-field label {
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

.approval-field textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  resize: vertical;
  font-family: inherit;
}

.approval-field textarea:focus {
  border-color: var(--accent);
}

.adjust-error,
.approval-error {
  font-size: 12px;
  color: #dc2626;
  margin-bottom: 12px;
}

.adjust-actions,
.approval-actions {
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary { background: var(--accent); color: white; }
.btn-secondary { background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border); }
.btn-approve { background: #16a34a; color: white; }
.btn-approve:hover:not(:disabled) { background: #15803d; }
.btn-reject { background: #dc2626; color: white; }
.btn-reject:hover:not(:disabled) { background: #b91c1c; }
</style>
