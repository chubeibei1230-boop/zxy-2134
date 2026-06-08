import { reactive, computed } from 'vue'

const today = new Date().toISOString().split('T')[0]

export const PLAN_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PUBLISHED: 'published'
}

export const STATUS_LABELS = {
  [PLAN_STATUS.DRAFT]: '草稿',
  [PLAN_STATUS.PENDING_APPROVAL]: '待审批',
  [PLAN_STATUS.APPROVED]: '已通过',
  [PLAN_STATUS.REJECTED]: '已驳回',
  [PLAN_STATUS.PUBLISHED]: '已发布'
}

export const STATUS_COLORS = {
  [PLAN_STATUS.DRAFT]: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
  [PLAN_STATUS.PENDING_APPROVAL]: { bg: 'rgba(245,158,11,0.15)', color: '#d97706' },
  [PLAN_STATUS.APPROVED]: { bg: 'rgba(34,197,94,0.15)', color: '#16a34a' },
  [PLAN_STATUS.REJECTED]: { bg: 'rgba(239,68,68,0.15)', color: '#dc2626' },
  [PLAN_STATUS.PUBLISHED]: { bg: 'rgba(99,102,241,0.15)', color: '#6366f1' }
}

export const OCCUPATION_TYPE = {
  MAINTENANCE: 'maintenance',
  CLEARANCE: 'clearance',
  INSPECTION: 'inspection',
  OTHER: 'other'
}

export const OCCUPATION_TYPE_LABELS = {
  [OCCUPATION_TYPE.MAINTENANCE]: '设备维护',
  [OCCUPATION_TYPE.CLEARANCE]: '清场',
  [OCCUPATION_TYPE.INSPECTION]: '设备检修',
  [OCCUPATION_TYPE.OTHER]: '其他占用'
}

export const OCCUPATION_TYPE_COLORS = {
  [OCCUPATION_TYPE.MAINTENANCE]: { bg: 'rgba(249,115,22,0.15)', color: '#ea580c' },
  [OCCUPATION_TYPE.CLEARANCE]: { bg: 'rgba(168,85,247,0.15)', color: '#9333ea' },
  [OCCUPATION_TYPE.INSPECTION]: { bg: 'rgba(6,182,212,0.15)', color: '#0891b2' },
  [OCCUPATION_TYPE.OTHER]: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' }
}

export const CHANGE_REQUEST_STATUS = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'cr_approved',
  REJECTED: 'cr_rejected',
  CONFIRMED: 'confirmed'
}

export const CHANGE_REQUEST_STATUS_LABELS = {
  [CHANGE_REQUEST_STATUS.PENDING_REVIEW]: '待审核',
  [CHANGE_REQUEST_STATUS.APPROVED]: '已通过',
  [CHANGE_REQUEST_STATUS.REJECTED]: '已驳回',
  [CHANGE_REQUEST_STATUS.CONFIRMED]: '已完成'
}

export const CHANGE_REQUEST_STATUS_COLORS = {
  [CHANGE_REQUEST_STATUS.PENDING_REVIEW]: { bg: 'rgba(245,158,11,0.15)', color: '#d97706' },
  [CHANGE_REQUEST_STATUS.APPROVED]: { bg: 'rgba(34,197,94,0.15)', color: '#16a34a' },
  [CHANGE_REQUEST_STATUS.REJECTED]: { bg: 'rgba(239,68,68,0.15)', color: '#dc2626' },
  [CHANGE_REQUEST_STATUS.CONFIRMED]: { bg: 'rgba(99,102,241,0.15)', color: '#6366f1' }
}

export const CHANGE_TYPE = {
  CHANGE_TIME: 'change_time',
  CHANGE_VENUE: 'change_venue',
  CANCEL: 'cancel'
}

export const CHANGE_TYPE_LABELS = {
  [CHANGE_TYPE.CHANGE_TIME]: '改时段',
  [CHANGE_TYPE.CHANGE_VENUE]: '改场地',
  [CHANGE_TYPE.CANCEL]: '取消计划'
}

export const CHANGE_TYPE_COLORS = {
  [CHANGE_TYPE.CHANGE_TIME]: { bg: 'rgba(245,158,11,0.15)', color: '#d97706' },
  [CHANGE_TYPE.CHANGE_VENUE]: { bg: 'rgba(168,85,247,0.15)', color: '#9333ea' },
  [CHANGE_TYPE.CANCEL]: { bg: 'rgba(239,68,68,0.15)', color: '#dc2626' }
}

let nextId = 1
let nextOccupationId = 1
let nextChangeRequestId = 1
let nextBatchId = 1
const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

function generateId() {
  return `plan_${nextId++}_${Date.now()}`
}

function generateOccupationId() {
  return `occ_${nextOccupationId++}_${Date.now()}`
}

function generateChangeRequestId() {
  return `cr_${nextChangeRequestId++}_${Date.now()}`
}

function generateBatchId() {
  return `batch_${nextBatchId++}_${Date.now()}`
}

function makePlan(overrides) {
  return {
    id: generateId(),
    date: today,
    venue: '',
    startTime: '',
    endTime: '',
    team: '',
    headcount: 0,
    responsiblePerson: '',
    intensity: '',
    notes: '',
    hasConflict: false,
    conflictWith: [],
    occupationConflicts: [],
    affectedByOccupation: false,
    status: PLAN_STATUS.DRAFT,
    rejectReason: '',
    approvalComment: '',
    submittedAt: '',
    approvedAt: '',
    publishedAt: '',
    createdBy: 'executor',
    actionSessionId: '',
    batchId: '',
    ...overrides
  }
}

function makeOccupation(overrides) {
  return {
    id: generateOccupationId(),
    date: today,
    venue: '',
    startTime: '',
    endTime: '',
    type: OCCUPATION_TYPE.MAINTENANCE,
    reason: '',
    notes: '',
    createdBy: 'organizer',
    createdAt: new Date().toISOString(),
    cancelledAt: '',
    cancelled: false,
    ...overrides
  }
}

function makeChangeRequest(overrides) {
  return {
    id: generateChangeRequestId(),
    originalPlanId: '',
    changeType: CHANGE_TYPE.CHANGE_TIME,
    reason: '',
    targetDate: today,
    targetVenue: '',
    targetStartTime: '',
    targetEndTime: '',
    status: CHANGE_REQUEST_STATUS.PENDING_REVIEW,
    submittedAt: '',
    reviewedAt: '',
    reviewedBy: '',
    reviewComment: '',
    rejectReason: '',
    confirmedAt: '',
    confirmedBy: '',
    createdBy: 'executor',
    actionSessionId: '',
    hasConflict: false,
    conflictWith: [],
    occupationConflicts: [],
    affectedByOccupation: false,
    ...overrides
  }
}

const _seedPlans = [
  makePlan({ venue: '主训练场', startTime: '08:00', endTime: '10:00', team: '猎鹰突击队', headcount: 20, responsiblePerson: '张指挥', intensity: 'high', notes: '综合战术演练', status: PLAN_STATUS.PUBLISHED, createdBy: 'executor', submittedAt: '2026-06-07T09:00:00', approvedAt: '2026-06-07T10:30:00', publishedAt: '2026-06-07T14:00:00', actionSessionId: 'seed' }),
  makePlan({ venue: '主训练场', startTime: '10:30', endTime: '12:00', team: '雷霆特战队', headcount: 15, responsiblePerson: '李教官', intensity: 'medium', notes: '射击训练', status: PLAN_STATUS.APPROVED, createdBy: 'executor', submittedAt: '2026-06-07T11:00:00', approvedAt: '2026-06-07T15:00:00', actionSessionId: 'seed' }),
  makePlan({ venue: '主训练场', startTime: '09:30', endTime: '11:30', team: '利刃先锋队', headcount: 12, responsiblePerson: '刘副官', intensity: 'medium', notes: '障碍突破（冲突项）', status: PLAN_STATUS.PENDING_APPROVAL, createdBy: 'executor', submittedAt: '2026-06-08T08:00:00', actionSessionId: 'seed' }),
  makePlan({ venue: '副训练场', startTime: '09:00', endTime: '11:00', team: '钢铁卫士队', headcount: 25, responsiblePerson: '王队长', intensity: 'low', notes: '体能拉练', status: PLAN_STATUS.DRAFT, createdBy: 'executor' }),
  makePlan({ venue: '体能训练馆', startTime: '14:00', endTime: '16:00', team: '利刃先锋队', headcount: 18, responsiblePerson: '赵教练', intensity: 'high', notes: '力量训练', status: PLAN_STATUS.REJECTED, rejectReason: '该时段体能训练馆已有设备维护安排，请调整至15:00之后或更换场地', createdBy: 'executor', submittedAt: '2026-06-07T14:00:00', actionSessionId: 'seed' }),
  makePlan({ venue: '战术模拟室', startTime: '11:00', endTime: '14:00', team: '猎鹰突击队', headcount: 10, responsiblePerson: '张指挥', intensity: 'medium', notes: '跨午休模拟演练', status: PLAN_STATUS.DRAFT, createdBy: 'executor' })
]

const _seedOccupations = [
  makeOccupation({ venue: '体能训练馆', startTime: '13:00', endTime: '15:00', type: OCCUPATION_TYPE.INSPECTION, reason: '力量器械年检', notes: '需提前清场，检修期间暂停使用', createdBy: 'organizer' }),
  makeOccupation({ venue: '主训练场', startTime: '15:00', endTime: '17:00', type: OCCUPATION_TYPE.MAINTENANCE, reason: '草坪养护', notes: '草皮修复及灌溉系统维护', createdBy: 'organizer' })
]

const _seedChangeRequests = [
  makeChangeRequest({ originalPlanId: _seedPlans[0].id, changeType: CHANGE_TYPE.CHANGE_TIME, reason: '临时接到上级通知，需调整训练时段以配合装备检查', targetDate: today, targetVenue: '主训练场', targetStartTime: '14:00', targetEndTime: '16:00', status: CHANGE_REQUEST_STATUS.PENDING_REVIEW, submittedAt: new Date().toISOString(), createdBy: 'executor' }),
  makeChangeRequest({ originalPlanId: _seedPlans[1].id, changeType: CHANGE_TYPE.CHANGE_VENUE, reason: '主训练场临时安排了重要外宾参观活动，需更换场地', targetDate: today, targetVenue: '副训练场', targetStartTime: '10:30', targetEndTime: '12:00', status: CHANGE_REQUEST_STATUS.APPROVED, submittedAt: '2026-06-07T16:00:00', reviewedAt: '2026-06-07T17:00:00', reviewedBy: 'supervisor', reviewComment: '同意更换，请组织者确认新场地可用', createdBy: 'executor' })
]

const state = reactive({
  plans: _seedPlans,
  occupations: _seedOccupations,
  changeRequests: _seedChangeRequests,
  venues: ['主训练场', '副训练场', '体能训练馆', '战术模拟室'],
  teams: ['猎鹰突击队', '雷霆特战队', '钢铁卫士队', '利刃先锋队'],
  currentRole: 'organizer',
  selectedDate: today,
  middayBreak: { start: '12:00', end: '13:30' },
  editingPlanId: null,
  showForm: false,
  showChangeRequestForm: false,
  changeRequestTargetPlanId: null,
  filters: {
    venue: '',
    team: '',
    intensity: '',
    conflictOnly: false,
    status: ''
  },
  changeRequestFilters: {
    status: '',
    changeType: ''
  },
  batchFilters: {
    batchId: ''
  },
  showBatchScheduleForm: false,
  showBatchPreview: false,
  batchPreviewItems: [],
  batchScheduleConfig: null
})

export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function timesOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1), e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2), e2 = timeToMinutes(end2)
  return s1 < e2 && s2 < e1
}

export function getEffectiveSegments(startTime, endTime, middayBreak) {
  const s = timeToMinutes(startTime)
  const e = timeToMinutes(endTime)
  const bs = timeToMinutes(middayBreak.start)
  const be = timeToMinutes(middayBreak.end)

  if (s >= be || e <= bs || bs >= be) {
    return [{ start: startTime, end: endTime }]
  }

  const segments = []
  if (s < bs) {
    segments.push({ start: startTime, end: middayBreak.start })
  }
  if (e > be) {
    segments.push({ start: middayBreak.end, end: endTime })
  }
  return segments.length > 0 ? segments : [{ start: startTime, end: endTime }]
}

export function spansMiddayBreak(startTime, endTime, middayBreak) {
  const s = timeToMinutes(startTime)
  const e = timeToMinutes(endTime)
  const bs = timeToMinutes(middayBreak.start)
  const be = timeToMinutes(middayBreak.end)
  return s < bs && e > be
}

function checkConflictsForPlan(plan) {
  return state.plans.filter(other => {
    if (other.id === plan.id) return false
    if (other.venue !== plan.venue) return false
    if (other.date !== plan.date) return false
    if (other.status === PLAN_STATUS.REJECTED) return false
    const planSegments = getEffectiveSegments(plan.startTime, plan.endTime, state.middayBreak)
    const otherSegments = getEffectiveSegments(other.startTime, other.endTime, state.middayBreak)
    return planSegments.some(ps =>
      otherSegments.some(os => timesOverlap(ps.start, ps.end, os.start, os.end))
    )
  })
}

function checkOccupationConflictsForPlan(plan) {
  return state.occupations.filter(occ => {
    if (occ.cancelled) return false
    if (occ.venue !== plan.venue) return false
    if (occ.date !== plan.date) return false
    if (!plan.startTime || !plan.endTime) return false
    const planSegments = getEffectiveSegments(plan.startTime, plan.endTime, state.middayBreak)
    const occSegments = getEffectiveSegments(occ.startTime, occ.endTime, state.middayBreak)
    return planSegments.some(ps =>
      occSegments.some(os => timesOverlap(ps.start, ps.end, os.start, os.end))
    )
  })
}

function checkOccupationConflictsForPreview(planData, excludeId) {
  return state.occupations.filter(occ => {
    if (occ.cancelled) return false
    if (occ.venue !== planData.venue) return false
    if (occ.date !== planData.date) return false
    if (!planData.startTime || !planData.endTime) return false
    const planSegments = getEffectiveSegments(planData.startTime, planData.endTime, state.middayBreak)
    const occSegments = getEffectiveSegments(occ.startTime, occ.endTime, state.middayBreak)
    return planSegments.some(ps =>
      occSegments.some(os => timesOverlap(ps.start, ps.end, os.start, os.end))
    )
  })
}

function plansAffectedByOccupation(occupation) {
  return state.plans.filter(plan => {
    if (plan.status === PLAN_STATUS.REJECTED) return false
    if (plan.venue !== occupation.venue) return false
    if (plan.date !== occupation.date) return false
    if (!plan.startTime || !plan.endTime) return false
    const planSegments = getEffectiveSegments(plan.startTime, plan.endTime, state.middayBreak)
    const occSegments = getEffectiveSegments(occupation.startTime, occupation.endTime, state.middayBreak)
    return planSegments.some(ps =>
      occSegments.some(os => timesOverlap(ps.start, ps.end, os.start, os.end))
    )
  })
}

function plansAffectedByOccupationVisible(occupation) {
  const visible = getVisiblePlans()
  const visibleIds = new Set(visible.map(p => p.id))
  return plansAffectedByOccupation(occupation).filter(p => visibleIds.has(p.id))
}

export function checkConflictsForPreview(planData, excludeId) {
  return state.plans.filter(other => {
    if (other.id === excludeId) return false
    if (other.venue !== planData.venue) return false
    if (other.date !== planData.date) return false
    if (!planData.startTime || !planData.endTime) return false
    if (other.status === PLAN_STATUS.REJECTED) return false
    const planSegments = getEffectiveSegments(planData.startTime, planData.endTime, state.middayBreak)
    const otherSegments = getEffectiveSegments(other.startTime, other.endTime, state.middayBreak)
    return planSegments.some(ps =>
      otherSegments.some(os => timesOverlap(ps.start, ps.end, os.start, os.end))
    )
  })
}

function recalculateAllConflicts() {
  state.plans.forEach(plan => {
    const conflicts = checkConflictsForPlan(plan)
    const occConflicts = checkOccupationConflictsForPlan(plan)
    plan.hasConflict = conflicts.length > 0 || occConflicts.length > 0
    plan.conflictWith = conflicts.map(c => c.id)
    plan.occupationConflicts = occConflicts.map(o => o.id)
    plan.affectedByOccupation = occConflicts.length > 0
  })
}

function canTransition(planId, fromStatus, toStatus) {
  const plan = state.plans.find(p => p.id === planId)
  if (!plan) return false
  if (plan.status !== fromStatus) return false
  const role = state.currentRole
  const allowed = {
    [`${PLAN_STATUS.DRAFT}->${PLAN_STATUS.PENDING_APPROVAL}`]: ['executor'],
    [`${PLAN_STATUS.PENDING_APPROVAL}->${PLAN_STATUS.APPROVED}`]: ['supervisor'],
    [`${PLAN_STATUS.PENDING_APPROVAL}->${PLAN_STATUS.REJECTED}`]: ['supervisor'],
    [`${PLAN_STATUS.REJECTED}->${PLAN_STATUS.PENDING_APPROVAL}`]: ['executor'],
    [`${PLAN_STATUS.APPROVED}->${PLAN_STATUS.PUBLISHED}`]: ['organizer']
  }
  const key = `${fromStatus}->${toStatus}`
  if (!allowed[key] || !allowed[key].includes(role)) return false
  if (toStatus === PLAN_STATUS.APPROVED || toStatus === PLAN_STATUS.REJECTED) {
    if (plan.actionSessionId === sessionId) return false
  }
  if (toStatus === PLAN_STATUS.PUBLISHED) {
    if (plan.actionSessionId === sessionId) return false
  }
  return true
}

function getTransitionError(planId, fromStatus, toStatus) {
  const plan = state.plans.find(p => p.id === planId)
  if (!plan) return '计划不存在'
  if (plan.status !== fromStatus) return '计划状态已变更'
  const role = state.currentRole
  const allowed = {
    [`${PLAN_STATUS.DRAFT}->${PLAN_STATUS.PENDING_APPROVAL}`]: ['executor'],
    [`${PLAN_STATUS.PENDING_APPROVAL}->${PLAN_STATUS.APPROVED}`]: ['supervisor'],
    [`${PLAN_STATUS.PENDING_APPROVAL}->${PLAN_STATUS.REJECTED}`]: ['supervisor'],
    [`${PLAN_STATUS.REJECTED}->${PLAN_STATUS.PENDING_APPROVAL}`]: ['executor'],
    [`${PLAN_STATUS.APPROVED}->${PLAN_STATUS.PUBLISHED}`]: ['organizer']
  }
  const key = `${fromStatus}->${toStatus}`
  if (!allowed[key] || !allowed[key].includes(role)) {
    const roleLabels = { executor: '执行人', supervisor: '监督人', organizer: '组织者' }
    const actionLabels = {
      [`${PLAN_STATUS.DRAFT}->${PLAN_STATUS.PENDING_APPROVAL}`]: '提交审批',
      [`${PLAN_STATUS.PENDING_APPROVAL}->${PLAN_STATUS.APPROVED}`]: '审批通过',
      [`${PLAN_STATUS.PENDING_APPROVAL}->${PLAN_STATUS.REJECTED}`]: '驳回计划',
      [`${PLAN_STATUS.REJECTED}->${PLAN_STATUS.PENDING_APPROVAL}`]: '重新提交',
      [`${PLAN_STATUS.APPROVED}->${PLAN_STATUS.PUBLISHED}`]: '发布计划'
    }
    const allowedRoles = (allowed[key] || []).map(r => roleLabels[r]).join('、')
    return `"${actionLabels[key] || '此操作'}"仅限${allowedRoles}执行，当前角色为${roleLabels[role]}`
  }
  if ((toStatus === PLAN_STATUS.APPROVED || toStatus === PLAN_STATUS.REJECTED || toStatus === PLAN_STATUS.PUBLISHED) && plan.actionSessionId === sessionId) {
    const actionLabels = {
      [PLAN_STATUS.APPROVED]: '审批',
      [PLAN_STATUS.REJECTED]: '审批',
      [PLAN_STATUS.PUBLISHED]: '发布'
    }
    return `同一会话中不能${actionLabels[toStatus]}自己提交的计划，请交由其他人员处理`
  }
  return ''
}

function addPlan(planData) {
  const plan = makePlan({
    date: planData.date || state.selectedDate,
    venue: planData.venue,
    startTime: planData.startTime,
    endTime: planData.endTime,
    team: planData.team,
    headcount: planData.headcount || 0,
    responsiblePerson: planData.responsiblePerson,
    intensity: planData.intensity,
    notes: planData.notes || '',
    status: planData.status || PLAN_STATUS.DRAFT,
    createdBy: state.currentRole === 'executor' ? 'executor' : state.currentRole
  })
  state.plans.push(plan)
  recalculateAllConflicts()
  return plan
}

function updatePlan(id, planData) {
  const index = state.plans.findIndex(p => p.id === id)
  if (index !== -1) {
    const plan = state.plans[index]
    if (plan.status !== PLAN_STATUS.DRAFT && plan.status !== PLAN_STATUS.REJECTED) return
    Object.assign(state.plans[index], planData)
    recalculateAllConflicts()
  }
}

function deletePlan(id) {
  const plan = state.plans.find(p => p.id === id)
  if (!plan) return
  if (plan.status !== PLAN_STATUS.DRAFT && plan.status !== PLAN_STATUS.REJECTED) return
  state.plans = state.plans.filter(p => p.id !== id)
  recalculateAllConflicts()
}

function submitPlan(id) {
  if (!canTransition(id, PLAN_STATUS.DRAFT, PLAN_STATUS.PENDING_APPROVAL)) return false
  const plan = state.plans.find(p => p.id === id)
  if (!plan) return false
  const occConflicts = checkOccupationConflictsForPlan(plan)
  if (occConflicts.length > 0) return false
  plan.status = PLAN_STATUS.PENDING_APPROVAL
  plan.submittedAt = new Date().toISOString()
  plan.rejectReason = ''
  plan.approvalComment = ''
  plan.actionSessionId = sessionId
  recalculateAllConflicts()
  return true
}

function approvePlan(id, comment) {
  if (!canTransition(id, PLAN_STATUS.PENDING_APPROVAL, PLAN_STATUS.APPROVED)) return false
  const plan = state.plans.find(p => p.id === id)
  if (!plan) return false
  plan.status = PLAN_STATUS.APPROVED
  plan.approvedAt = new Date().toISOString()
  plan.approvalComment = comment || ''
  plan.rejectReason = ''
  plan.actionSessionId = sessionId
  recalculateAllConflicts()
  return true
}

function rejectPlan(id, reason) {
  if (!canTransition(id, PLAN_STATUS.PENDING_APPROVAL, PLAN_STATUS.REJECTED)) return false
  const plan = state.plans.find(p => p.id === id)
  if (!plan) return false
  plan.status = PLAN_STATUS.REJECTED
  plan.rejectReason = reason || ''
  plan.approvalComment = ''
  recalculateAllConflicts()
  return true
}

function resubmitPlan(id) {
  if (!canTransition(id, PLAN_STATUS.REJECTED, PLAN_STATUS.PENDING_APPROVAL)) return false
  const plan = state.plans.find(p => p.id === id)
  if (!plan) return false
  const occConflicts = checkOccupationConflictsForPlan(plan)
  if (occConflicts.length > 0) return false
  plan.status = PLAN_STATUS.PENDING_APPROVAL
  plan.submittedAt = new Date().toISOString()
  plan.rejectReason = ''
  plan.actionSessionId = sessionId
  recalculateAllConflicts()
  return true
}

function publishPlan(id) {
  if (!canTransition(id, PLAN_STATUS.APPROVED, PLAN_STATUS.PUBLISHED)) return false
  const plan = state.plans.find(p => p.id === id)
  if (!plan) return false
  plan.status = PLAN_STATUS.PUBLISHED
  plan.publishedAt = new Date().toISOString()
  recalculateAllConflicts()
  return true
}

function endEarly(id, newEndTime) {
  const plan = state.plans.find(p => p.id === id)
  if (!plan) return
  if (plan.status !== PLAN_STATUS.PUBLISHED) return
  if (timeToMinutes(newEndTime) > timeToMinutes(plan.startTime)) {
    plan.endTime = newEndTime
    recalculateAllConflicts()
  }
}

function extendTemporarily(id, newEndTime) {
  const plan = state.plans.find(p => p.id === id)
  if (!plan) return
  if (plan.status !== PLAN_STATUS.PUBLISHED) return
  if (timeToMinutes(newEndTime) > timeToMinutes(plan.startTime)) {
    plan.endTime = newEndTime
    recalculateAllConflicts()
  }
}

function startEdit(plan) {
  if (plan.status !== PLAN_STATUS.DRAFT && plan.status !== PLAN_STATUS.REJECTED) return
  if (state.currentRole !== 'executor') return
  state.editingPlanId = plan.id
  state.showForm = true
}

function startNew() {
  state.editingPlanId = null
  state.showForm = true
}

function addOccupation(occData) {
  const occ = makeOccupation({
    date: occData.date || state.selectedDate,
    venue: occData.venue,
    startTime: occData.startTime,
    endTime: occData.endTime,
    type: occData.type || OCCUPATION_TYPE.MAINTENANCE,
    reason: occData.reason || '',
    notes: occData.notes || '',
    createdBy: state.currentRole
  })
  state.occupations.push(occ)
  recalculateAllConflicts()
  const affected = plansAffectedByOccupation(occ)
  return { occupation: occ, affectedPlans: affected }
}

function cancelOccupation(id) {
  const occ = state.occupations.find(o => o.id === id)
  if (!occ || occ.cancelled) return
  occ.cancelled = true
  occ.cancelledAt = new Date().toISOString()
  recalculateAllConflicts()
}

function getOccupationsForDate(date) {
  return state.occupations.filter(occ => occ.date === date && !occ.cancelled)
}

function getOccupationsForDateVenue(date, venue) {
  return state.occupations.filter(occ => occ.date === date && occ.venue === venue && !occ.cancelled)
}

function getVisibleOccupations() {
  const role = state.currentRole
  return state.occupations.filter(occ => {
    if (occ.cancelled) return false
    if (role === 'organizer') return true
    if (role === 'supervisor') {
      return state.plans.some(p => {
        if (p.status === PLAN_STATUS.DRAFT || p.status === PLAN_STATUS.REJECTED) return false
        if (p.venue !== occ.venue || p.date !== occ.date) return false
        if (!p.startTime || !p.endTime) return false
        const planSegs = getEffectiveSegments(p.startTime, p.endTime, state.middayBreak)
        const occSegs = getEffectiveSegments(occ.startTime, occ.endTime, state.middayBreak)
        return planSegs.some(ps => occSegs.some(os => timesOverlap(ps.start, ps.end, os.start, os.end)))
      })
    }
    if (role === 'executor') {
      return state.plans.some(p => {
        if (p.venue !== occ.venue || p.date !== occ.date) return false
        if (!p.startTime || !p.endTime) return false
        const planSegs = getEffectiveSegments(p.startTime, p.endTime, state.middayBreak)
        const occSegs = getEffectiveSegments(occ.startTime, occ.endTime, state.middayBreak)
        return planSegs.some(ps => occSegs.some(os => timesOverlap(ps.start, ps.end, os.start, os.end)))
      })
    }
    return false
  })
}

const occupationsForDate = computed(() => {
  return getVisibleOccupations().filter(occ => occ.date === state.selectedDate)
})

const allOccupationConflicts = computed(() => {
  const visible = getVisiblePlans()
  return visible.filter(plan => plan.occupationConflicts && plan.occupationConflicts.length > 0)
})

function closeForm() {
  state.editingPlanId = null
  state.showForm = false
}

function getVisiblePlans() {
  const role = state.currentRole
  return state.plans.filter(plan => {
    if (role === 'executor') return true
    if (role === 'supervisor') {
      return plan.status !== PLAN_STATUS.DRAFT
    }
    if (role === 'organizer') {
      return plan.status === PLAN_STATUS.APPROVED || plan.status === PLAN_STATUS.PUBLISHED
    }
    return false
  })
}

const filteredPlans = computed(() => {
  return getVisiblePlans().filter(plan => {
    if (state.filters.venue && plan.venue !== state.filters.venue) return false
    if (state.filters.team && plan.team !== state.filters.team) return false
    if (state.filters.intensity && plan.intensity !== state.filters.intensity) return false
    if (state.filters.conflictOnly && !plan.hasConflict) return false
    if (state.filters.status && plan.status !== state.filters.status) return false
    if (state.batchFilters.batchId && plan.batchId !== state.batchFilters.batchId) return false
    return true
  })
})

const plansForDate = computed(() => {
  return getVisiblePlans().filter(plan => plan.date === state.selectedDate)
})

const allConflicts = computed(() => {
  const visible = getVisiblePlans()
  const visibleIds = new Set(visible.map(p => p.id))
  return visible.filter(plan => {
    const filteredConflicts = plan.conflictWith.filter(cid => visibleIds.has(cid))
    return filteredConflicts.length > 0
  }).map(plan => ({
    ...plan,
    conflictWith: plan.conflictWith.filter(cid => visibleIds.has(cid))
  }))
})

const pendingApprovalPlans = computed(() => {
  return state.plans.filter(p => p.status === PLAN_STATUS.PENDING_APPROVAL)
})

const editingPlan = computed(() => {
  if (!state.editingPlanId) return null
  return state.plans.find(p => p.id === state.editingPlanId) || null
})

function addVenue(name) {
  if (name && !state.venues.includes(name)) {
    state.venues.push(name)
  }
}

function removeVenue(name) {
  const plansInVenue = state.plans.filter(p => p.venue === name)
  const protectedPlans = plansInVenue.filter(p =>
    p.status === PLAN_STATUS.APPROVED || p.status === PLAN_STATUS.PUBLISHED
  )
  if (protectedPlans.length > 0) return { success: false, protectedCount: protectedPlans.length, totalPlans: plansInVenue.length }
  state.venues = state.venues.filter(v => v !== name)
  state.plans = state.plans.filter(p => p.venue !== name)
  recalculateAllConflicts()
  return { success: true, removedCount: plansInVenue.length }
}

function addTeam(name) {
  if (name && !state.teams.includes(name)) {
    state.teams.push(name)
  }
}

function removeTeam(name) {
  state.teams = state.teams.filter(t => t !== name)
}

function getOriginalPlan(changeRequest) {
  if (!changeRequest || !changeRequest.originalPlanId) return null
  return state.plans.find(p => p.id === changeRequest.originalPlanId) || null
}

function checkConflictsForChangeRequest(cr) {
  if (cr.changeType === CHANGE_TYPE.CANCEL) return { plans: [], occupations: [] }
  const targetData = {
    venue: cr.targetVenue,
    date: cr.targetDate,
    startTime: cr.targetStartTime,
    endTime: cr.targetEndTime
  }
  const planConflicts = checkConflictsForPreview(targetData, cr.originalPlanId)
  const occConflicts = checkOccupationConflictsForPreview(targetData)
  return { plans: planConflicts, occupations: occConflicts }
}

function recalculateChangeRequestConflicts(cr) {
  const { plans, occupations } = checkConflictsForChangeRequest(cr)
  cr.hasConflict = plans.length > 0 || occupations.length > 0
  cr.conflictWith = plans.map(p => p.id)
  cr.occupationConflicts = occupations.map(o => o.id)
  cr.affectedByOccupation = occupations.length > 0
}

function startChangeRequest(plan) {
  if (plan.status !== PLAN_STATUS.APPROVED && plan.status !== PLAN_STATUS.PUBLISHED) return
  if (state.currentRole !== 'executor') return
  const existingPending = state.changeRequests.find(
    cr => cr.originalPlanId === plan.id && cr.status === CHANGE_REQUEST_STATUS.PENDING_REVIEW
  )
  if (existingPending) {
    alert('该计划已有一条待审核的变更申请，请等待审核后再提交新申请')
    return
  }
  state.changeRequestTargetPlanId = plan.id
  state.showChangeRequestForm = true
}

function closeChangeRequestForm() {
  state.changeRequestTargetPlanId = null
  state.showChangeRequestForm = false
}

function addChangeRequest(crData) {
  const plan = state.plans.find(p => p.id === crData.originalPlanId)
  if (!plan) return null
  if (plan.status !== PLAN_STATUS.APPROVED && plan.status !== PLAN_STATUS.PUBLISHED) return null

  const cr = makeChangeRequest({
    originalPlanId: crData.originalPlanId,
    changeType: crData.changeType,
    reason: crData.reason,
    targetDate: crData.targetDate || plan.date,
    targetVenue: crData.targetVenue || plan.venue,
    targetStartTime: crData.targetStartTime || plan.startTime,
    targetEndTime: crData.targetEndTime || plan.endTime,
    status: CHANGE_REQUEST_STATUS.PENDING_REVIEW,
    submittedAt: new Date().toISOString(),
    createdBy: state.currentRole,
    actionSessionId: sessionId
  })

  recalculateChangeRequestConflicts(cr)
  state.changeRequests.push(cr)
  return cr
}

function approveChangeRequest(id, comment) {
  const cr = state.changeRequests.find(c => c.id === id)
  if (!cr) return false
  if (cr.status !== CHANGE_REQUEST_STATUS.PENDING_REVIEW) return false
  if (state.currentRole !== 'supervisor') return false
  cr.status = CHANGE_REQUEST_STATUS.APPROVED
  cr.reviewedAt = new Date().toISOString()
  cr.reviewedBy = 'supervisor'
  cr.reviewComment = comment || ''
  cr.rejectReason = ''
  return true
}

function rejectChangeRequest(id, reason) {
  const cr = state.changeRequests.find(c => c.id === id)
  if (!cr) return false
  if (cr.status !== CHANGE_REQUEST_STATUS.PENDING_REVIEW) return false
  if (state.currentRole !== 'supervisor') return false
  cr.status = CHANGE_REQUEST_STATUS.REJECTED
  cr.reviewedAt = new Date().toISOString()
  cr.reviewedBy = 'supervisor'
  cr.rejectReason = reason || ''
  cr.reviewComment = ''
  return true
}

function confirmChangeRequest(id) {
  const cr = state.changeRequests.find(c => c.id === id)
  if (!cr) return false
  if (cr.status !== CHANGE_REQUEST_STATUS.APPROVED) return false
  if (state.currentRole !== 'organizer') return false

  const plan = state.plans.find(p => p.id === cr.originalPlanId)
  if (!plan) return false

  if (cr.changeType === CHANGE_TYPE.CANCEL) {
    plan.status = PLAN_STATUS.REJECTED
    plan.rejectReason = `计划变更申请（取消）：${cr.reason}`
    plan.actionSessionId = sessionId
  } else {
    plan.date = cr.targetDate
    plan.venue = cr.targetVenue
    plan.startTime = cr.targetStartTime
    plan.endTime = cr.targetEndTime
    recalculateAllConflicts()
  }

  cr.status = CHANGE_REQUEST_STATUS.CONFIRMED
  cr.confirmedAt = new Date().toISOString()
  cr.confirmedBy = 'organizer'
  return true
}

function resubmitChangeRequest(id) {
  const cr = state.changeRequests.find(c => c.id === id)
  if (!cr) return false
  if (cr.status !== CHANGE_REQUEST_STATUS.REJECTED) return false
  if (state.currentRole !== 'executor') return false
  if (cr.changeType !== CHANGE_TYPE.CANCEL) {
    const targetData = {
      venue: cr.targetVenue,
      date: cr.targetDate,
      startTime: cr.targetStartTime,
      endTime: cr.targetEndTime
    }
    const occConflicts = checkOccupationConflictsForPreview(targetData)
    if (occConflicts.length > 0) return false
  }
  cr.status = CHANGE_REQUEST_STATUS.PENDING_REVIEW
  cr.submittedAt = new Date().toISOString()
  cr.reviewedAt = ''
  cr.reviewedBy = ''
  cr.reviewComment = ''
  cr.rejectReason = ''
  cr.actionSessionId = sessionId
  recalculateChangeRequestConflicts(cr)
  return true
}

function getChangeRequestsForPlan(planId) {
  return state.changeRequests.filter(cr => cr.originalPlanId === planId)
}

function getActiveChangeRequestForPlan(planId) {
  return state.changeRequests.find(
    cr => cr.originalPlanId === planId &&
      (cr.status === CHANGE_REQUEST_STATUS.PENDING_REVIEW || cr.status === CHANGE_REQUEST_STATUS.APPROVED)
  ) || null
}

function getVisibleChangeRequests() {
  const role = state.currentRole
  return state.changeRequests.filter(cr => {
    if (role === 'executor') return cr.createdBy === 'executor'
    if (role === 'supervisor') {
      return cr.status !== CHANGE_REQUEST_STATUS.CONFIRMED || cr.createdBy === 'executor'
    }
    if (role === 'organizer') return true
    return false
  })
}

const filteredChangeRequests = computed(() => {
  return getVisibleChangeRequests().filter(cr => {
    if (state.changeRequestFilters.status && cr.status !== state.changeRequestFilters.status) return false
    if (state.changeRequestFilters.changeType && cr.changeType !== state.changeRequestFilters.changeType) return false
    return true
  })
})

const pendingReviewChangeRequests = computed(() => {
  return state.changeRequests.filter(cr => cr.status === CHANGE_REQUEST_STATUS.PENDING_REVIEW)
})

const approvedChangeRequests = computed(() => {
  return state.changeRequests.filter(cr => cr.status === CHANGE_REQUEST_STATUS.APPROVED)
})

const changeRequestTargetPlan = computed(() => {
  if (!state.changeRequestTargetPlanId) return null
  return state.plans.find(p => p.id === state.changeRequestTargetPlanId) || null
})

function generateBatchDates(config) {
  const dates = []
  const startDate = new Date(config.startDate)
  const endDate = new Date(config.endDate)
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return dates
  if (startDate > endDate) return dates

  if (config.repeatMode === 'daily') {
    const current = new Date(startDate)
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + (config.repeatInterval || 1))
    }
  } else if (config.repeatMode === 'weekly') {
    const weekdays = config.weekdays || []
    const current = new Date(startDate)
    while (current <= endDate) {
      const dayOfWeek = current.getDay()
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek
      if (weekdays.includes(adjustedDay)) {
        dates.push(current.toISOString().split('T')[0])
      }
      current.setDate(current.getDate() + 1)
    }
  } else if (config.repeatMode === 'consecutive') {
    const totalDays = config.totalDays || 1
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      dates.push(d.toISOString().split('T')[0])
    }
  }
  return dates
}

function generateBatchPreview(config) {
  const dates = generateBatchDates(config)
  const items = dates.map(date => {
    const planData = {
      date,
      venue: config.venue,
      startTime: config.startTime,
      endTime: config.endTime,
      team: config.team,
      headcount: config.headcount || 0,
      responsiblePerson: config.responsiblePerson,
      intensity: config.intensity,
      notes: config.notes || ''
    }
    const planConflicts = checkConflictsForPreview(
      { venue: planData.venue, date: planData.date, startTime: planData.startTime, endTime: planData.endTime }
    )
    const occConflicts = checkOccupationConflictsForPreview(
      { venue: planData.venue, date: planData.date, startTime: planData.startTime, endTime: planData.endTime }
    )
    const crossesBreak = spansMiddayBreak(planData.startTime, planData.endTime, state.middayBreak)
    return {
      ...planData,
      date,
      planConflicts,
      occupationConflicts: occConflicts,
      spansMiddayBreak: crossesBreak,
      hasConflict: planConflicts.length > 0,
      hasOccupationConflict: occConflicts.length > 0,
      action: 'submit'
    }
  })
  return items
}

function startBatchSchedule() {
  state.showBatchScheduleForm = true
}

function closeBatchScheduleForm() {
  state.showBatchScheduleForm = false
  state.batchScheduleConfig = null
}

function submitBatchSchedule(config) {
  const items = generateBatchPreview(config)
  state.batchPreviewItems = items
  state.batchScheduleConfig = config
  state.showBatchScheduleForm = false
  state.showBatchPreview = true
}

function closeBatchPreview() {
  state.showBatchPreview = false
  state.batchPreviewItems = []
  state.batchScheduleConfig = null
}

function updateBatchPreviewItemAction(index, action) {
  if (index >= 0 && index < state.batchPreviewItems.length) {
    state.batchPreviewItems[index].action = action
  }
}

function confirmBatchSchedule() {
  const batchId = generateBatchId()
  const config = state.batchScheduleConfig
  const items = state.batchPreviewItems
  const createdPlans = []

  items.forEach(item => {
    if (item.action === 'skip') return

    let status = PLAN_STATUS.DRAFT
    if (item.action === 'submit') {
      if (item.hasOccupationConflict) {
        status = PLAN_STATUS.DRAFT
      } else if (item.hasConflict) {
        status = PLAN_STATUS.DRAFT
      } else {
        status = PLAN_STATUS.DRAFT
      }
    }

    const plan = makePlan({
      date: item.date,
      venue: item.venue,
      startTime: item.startTime,
      endTime: item.endTime,
      team: item.team,
      headcount: item.headcount || 0,
      responsiblePerson: item.responsiblePerson,
      intensity: item.intensity,
      notes: item.notes || '',
      status,
      batchId,
      createdBy: state.currentRole === 'executor' ? 'executor' : state.currentRole
    })
    state.plans.push(plan)
    createdPlans.push(plan)

    if (item.action === 'submit' && !item.hasOccupationConflict && !item.hasConflict) {
      plan.actionSessionId = sessionId
      plan.status = PLAN_STATUS.PENDING_APPROVAL
      plan.submittedAt = new Date().toISOString()
    }
  })

  recalculateAllConflicts()
  state.showBatchPreview = false
  state.batchPreviewItems = []
  state.batchScheduleConfig = null
  return { batchId, plans: createdPlans }
}

function getPlansByBatchId(batchId) {
  if (!batchId) return []
  return state.plans.filter(p => p.batchId === batchId)
}

function getBatchList() {
  const batchMap = {}
  state.plans.forEach(plan => {
    if (!plan.batchId) return
    if (!batchMap[plan.batchId]) {
      batchMap[plan.batchId] = {
        batchId: plan.batchId,
        team: plan.team,
        venue: plan.venue,
        startTime: plan.startTime,
        endTime: plan.endTime,
        plans: [],
        createdAt: ''
      }
    }
    batchMap[plan.batchId].plans.push(plan)
    if (!batchMap[plan.batchId].createdAt || plan.id < batchMap[plan.batchId].createdAt) {
      batchMap[plan.batchId].createdAt = plan.id
    }
  })
  return Object.values(batchMap).map(batch => ({
    ...batch,
    totalCount: batch.plans.length,
    statusSummary: {
      draft: batch.plans.filter(p => p.status === PLAN_STATUS.DRAFT).length,
      pending_approval: batch.plans.filter(p => p.status === PLAN_STATUS.PENDING_APPROVAL).length,
      approved: batch.plans.filter(p => p.status === PLAN_STATUS.APPROVED).length,
      rejected: batch.plans.filter(p => p.status === PLAN_STATUS.REJECTED).length,
      published: batch.plans.filter(p => p.status === PLAN_STATUS.PUBLISHED).length
    }
  }))
}

const batchList = computed(() => getBatchList())

function batchApprove(batchId, comment) {
  if (state.currentRole !== 'supervisor') return { success: false, error: '只有监督人可以批量审批' }
  const plans = getPlansByBatchId(batchId)
  let approved = 0
  let skipped = 0
  plans.forEach(plan => {
    if (plan.status !== PLAN_STATUS.PENDING_APPROVAL) { skipped++; return }
    if (plan.actionSessionId === sessionId) { skipped++; return }
    if (plan.hasConflict || plan.affectedByOccupation) { skipped++; return }
    plan.status = PLAN_STATUS.APPROVED
    plan.approvedAt = new Date().toISOString()
    plan.approvalComment = comment || ''
    plan.rejectReason = ''
    plan.actionSessionId = sessionId
    approved++
  })
  recalculateAllConflicts()
  return { success: true, approved, skipped }
}

function batchReject(batchId, reason) {
  if (state.currentRole !== 'supervisor') return { success: false, error: '只有监督人可以批量驳回' }
  if (!reason || !reason.trim()) return { success: false, error: '批量驳回时必须填写驳回原因' }
  const plans = getPlansByBatchId(batchId)
  let rejected = 0
  let skipped = 0
  plans.forEach(plan => {
    if (plan.status !== PLAN_STATUS.PENDING_APPROVAL) { skipped++; return }
    if (plan.actionSessionId === sessionId) { skipped++; return }
    plan.status = PLAN_STATUS.REJECTED
    plan.rejectReason = reason
    plan.approvalComment = ''
    rejected++
  })
  recalculateAllConflicts()
  return { success: true, rejected, skipped }
}

function batchPublish(batchId) {
  if (state.currentRole !== 'organizer') return { success: false, error: '只有组织者可以批量发布' }
  const plans = getPlansByBatchId(batchId)
  let published = 0
  let skipped = 0
  plans.forEach(plan => {
    if (plan.status !== PLAN_STATUS.APPROVED) { skipped++; return }
    if (plan.actionSessionId === sessionId) { skipped++; return }
    plan.status = PLAN_STATUS.PUBLISHED
    plan.publishedAt = new Date().toISOString()
    published++
  })
  recalculateAllConflicts()
  return { success: true, published, skipped }
}

function getBatchStatusImpact(batchId) {
  const plans = getPlansByBatchId(batchId)
  if (plans.length === 0) return null
  const statusGroups = {}
  plans.forEach(p => {
    if (!statusGroups[p.status]) statusGroups[p.status] = []
    statusGroups[p.status].push(p)
  })
  const rejectedPlans = statusGroups[PLAN_STATUS.REJECTED] || []
  const cancelledCRs = state.changeRequests.filter(cr =>
    cr.changeType === CHANGE_TYPE.CANCEL &&
    rejectedPlans.some(rp => rp.id === cr.originalPlanId)
  )
  const changedPlans = plans.filter(p => {
    const activeCR = getActiveChangeRequestForPlan(p.id)
    return activeCR !== null
  })
  return {
    total: plans.length,
    statusGroups,
    rejectedCount: rejectedPlans.length,
    changedCount: changedPlans.length,
    cancelledByCR: cancelledCRs.length,
    rejectedPlans: rejectedPlans.map(p => ({
      id: p.id,
      date: p.date,
      rejectReason: p.rejectReason
    })),
    changedPlans: changedPlans.map(p => {
      const cr = getActiveChangeRequestForPlan(p.id)
      return {
        id: p.id,
        date: p.date,
        changeType: cr ? cr.changeType : '',
        changeReason: cr ? cr.reason : ''
      }
    })
  }
}

function exportData() {
  const data = {
    version: 5,
    exportDate: new Date().toISOString(),
    venues: [...state.venues],
    teams: [...state.teams],
    middayBreak: { ...state.middayBreak },
    plans: state.plans.map(p => ({ ...p })),
    occupations: state.occupations.map(o => ({ ...o })),
    changeRequests: state.changeRequests.map(cr => ({ ...cr }))
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `training-plans-${state.selectedDate}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (data.version && data.plans) {
      state.venues = data.venues || state.venues
      state.teams = data.teams || state.teams
      if (data.middayBreak) {
        state.middayBreak = data.middayBreak
      }
      state.plans = data.plans.map(p => ({
        ...makePlan(),
        ...p,
        status: Object.values(PLAN_STATUS).includes(p.status) ? p.status : PLAN_STATUS.DRAFT,
        rejectReason: p.rejectReason || '',
        approvalComment: p.approvalComment || '',
        submittedAt: p.submittedAt || '',
        approvedAt: p.approvedAt || '',
        publishedAt: p.publishedAt || '',
        createdBy: p.createdBy || 'executor',
        actionSessionId: p.actionSessionId || '',
        occupationConflicts: p.occupationConflicts || [],
        affectedByOccupation: p.affectedByOccupation || false,
        batchId: p.batchId || ''
      }))
      const maxNum = state.plans.reduce((max, p) => {
        const num = parseInt(p.id.split('_')[1]) || 0
        return num > max ? num : max
      }, 0)
      nextId = maxNum + 1
      if (data.occupations) {
        state.occupations = data.occupations.map(o => ({
          ...makeOccupation(),
          ...o,
          cancelled: o.cancelled || false,
          cancelledAt: o.cancelledAt || ''
        }))
        const maxOccNum = state.occupations.reduce((max, o) => {
          const num = parseInt(o.id.split('_')[1]) || 0
          return num > max ? num : max
        }, 0)
        nextOccupationId = maxOccNum + 1
      }
      if (data.changeRequests) {
        state.changeRequests = data.changeRequests.map(cr => ({
          ...makeChangeRequest(),
          ...cr
        }))
        const maxCrNum = state.changeRequests.reduce((max, cr) => {
          const num = parseInt(cr.id.split('_')[1]) || 0
          return num > max ? num : max
        }, 0)
        nextChangeRequestId = maxCrNum + 1
      } else {
        state.changeRequests = []
      }
      recalculateAllConflicts()
      return true
    }
    return false
  } catch (e) {
    return false
  }
}

recalculateAllConflicts()

export const store = {
  state,
  addPlan,
  updatePlan,
  deletePlan,
  endEarly,
  extendTemporarily,
  startEdit,
  startNew,
  closeForm,
  submitPlan,
  approvePlan,
  rejectPlan,
  resubmitPlan,
  publishPlan,
  checkConflictsForPreview,
  checkOccupationConflictsForPreview,
  checkConflictsForChangeRequest,
  recalculateAllConflicts,
  getTransitionError,
  addOccupation,
  cancelOccupation,
  getOccupationsForDate,
  getOccupationsForDateVenue,
  getVisibleOccupations,
  plansAffectedByOccupation,
  plansAffectedByOccupationVisible,
  getVisiblePlans,
  filteredPlans,
  plansForDate,
  allConflicts,
  allOccupationConflicts,
  occupationsForDate,
  pendingApprovalPlans,
  editingPlan,
  addVenue,
  removeVenue,
  addTeam,
  removeTeam,
  exportData,
  importData,
  spansMiddayBreak,
  timeToMinutes,
  minutesToTime,
  startChangeRequest,
  closeChangeRequestForm,
  addChangeRequest,
  approveChangeRequest,
  rejectChangeRequest,
  confirmChangeRequest,
  resubmitChangeRequest,
  getChangeRequestsForPlan,
  getActiveChangeRequestForPlan,
  getOriginalPlan,
  getVisibleChangeRequests,
  filteredChangeRequests,
  pendingReviewChangeRequests,
  approvedChangeRequests,
  changeRequestTargetPlan,
  startBatchSchedule,
  closeBatchScheduleForm,
  submitBatchSchedule,
  closeBatchPreview,
  updateBatchPreviewItemAction,
  confirmBatchSchedule,
  generateBatchPreview,
  generateBatchDates,
  getPlansByBatchId,
  getBatchList,
  batchList,
  batchApprove,
  batchReject,
  batchPublish,
  getBatchStatusImpact
}
