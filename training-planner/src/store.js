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

let nextId = 1
let nextOccupationId = 1
const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

function generateId() {
  return `plan_${nextId++}_${Date.now()}`
}

function generateOccupationId() {
  return `occ_${nextOccupationId++}_${Date.now()}`
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

const state = reactive({
  plans: _seedPlans,
  occupations: _seedOccupations,
  venues: ['主训练场', '副训练场', '体能训练馆', '战术模拟室'],
  teams: ['猎鹰突击队', '雷霆特战队', '钢铁卫士队', '利刃先锋队'],
  currentRole: 'organizer',
  selectedDate: today,
  middayBreak: { start: '12:00', end: '13:30' },
  editingPlanId: null,
  showForm: false,
  filters: {
    venue: '',
    team: '',
    intensity: '',
    conflictOnly: false,
    status: ''
  }
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
    return planSegments.some(ps =>
      timesOverlap(ps.start, ps.end, occ.startTime, occ.endTime)
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
    return planSegments.some(ps =>
      timesOverlap(ps.start, ps.end, occ.startTime, occ.endTime)
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
    return planSegments.some(ps =>
      timesOverlap(ps.start, ps.end, occupation.startTime, occupation.endTime)
    )
  })
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
    return true
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

function exportData() {
  const data = {
    version: 3,
    exportDate: new Date().toISOString(),
    venues: [...state.venues],
    teams: [...state.teams],
    middayBreak: { ...state.middayBreak },
    plans: state.plans.map(p => ({ ...p })),
    occupations: state.occupations.map(o => ({ ...o }))
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
        affectedByOccupation: p.affectedByOccupation || false
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
  recalculateAllConflicts,
  getTransitionError,
  addOccupation,
  cancelOccupation,
  getOccupationsForDate,
  getOccupationsForDateVenue,
  getVisibleOccupations,
  plansAffectedByOccupation,
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
  minutesToTime
}
