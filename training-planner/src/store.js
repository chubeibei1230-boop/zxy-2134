import { reactive, computed } from 'vue'

const today = new Date().toISOString().split('T')[0]

let nextId = 1

function generateId() {
  return `plan_${nextId++}_${Date.now()}`
}

const _seedPlans = [
  { id: generateId(), date: today, venue: '主训练场', startTime: '08:00', endTime: '10:00', team: '猎鹰突击队', headcount: 20, responsiblePerson: '张指挥', intensity: 'high', notes: '综合战术演练', hasConflict: false, conflictWith: [] },
  { id: generateId(), date: today, venue: '主训练场', startTime: '10:30', endTime: '12:00', team: '雷霆特战队', headcount: 15, responsiblePerson: '李教官', intensity: 'medium', notes: '射击训练', hasConflict: false, conflictWith: [] },
  { id: generateId(), date: today, venue: '主训练场', startTime: '09:30', endTime: '11:30', team: '利刃先锋队', headcount: 12, responsiblePerson: '刘副官', intensity: 'medium', notes: '障碍突破（冲突项）', hasConflict: false, conflictWith: [] },
  { id: generateId(), date: today, venue: '副训练场', startTime: '09:00', endTime: '11:00', team: '钢铁卫士队', headcount: 25, responsiblePerson: '王队长', intensity: 'low', notes: '体能拉练', hasConflict: false, conflictWith: [] },
  { id: generateId(), date: today, venue: '体能训练馆', startTime: '14:00', endTime: '16:00', team: '利刃先锋队', headcount: 18, responsiblePerson: '赵教练', intensity: 'high', notes: '力量训练', hasConflict: false, conflictWith: [] },
  { id: generateId(), date: today, venue: '战术模拟室', startTime: '11:00', endTime: '14:00', team: '猎鹰突击队', headcount: 10, responsiblePerson: '张指挥', intensity: 'medium', notes: '跨午休模拟演练', hasConflict: false, conflictWith: [] }
]

const state = reactive({
  plans: _seedPlans,
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
    conflictOnly: false
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
    const planSegments = getEffectiveSegments(plan.startTime, plan.endTime, state.middayBreak)
    const otherSegments = getEffectiveSegments(other.startTime, other.endTime, state.middayBreak)
    return planSegments.some(ps =>
      otherSegments.some(os => timesOverlap(ps.start, ps.end, os.start, os.end))
    )
  })
}

export function checkConflictsForPreview(planData, excludeId) {
  return state.plans.filter(other => {
    if (other.id === excludeId) return false
    if (other.venue !== planData.venue) return false
    if (other.date !== planData.date) return false
    if (!planData.startTime || !planData.endTime) return false
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
    plan.hasConflict = conflicts.length > 0
    plan.conflictWith = conflicts.map(c => c.id)
  })
}

function addPlan(planData) {
  const plan = {
    id: generateId(),
    date: planData.date || state.selectedDate,
    venue: planData.venue,
    startTime: planData.startTime,
    endTime: planData.endTime,
    team: planData.team,
    headcount: planData.headcount || 0,
    responsiblePerson: planData.responsiblePerson,
    intensity: planData.intensity,
    notes: planData.notes || '',
    hasConflict: false,
    conflictWith: []
  }
  state.plans.push(plan)
  recalculateAllConflicts()
  return plan
}

function updatePlan(id, planData) {
  const index = state.plans.findIndex(p => p.id === id)
  if (index !== -1) {
    Object.assign(state.plans[index], planData)
    recalculateAllConflicts()
  }
}

function deletePlan(id) {
  state.plans = state.plans.filter(p => p.id !== id)
  recalculateAllConflicts()
}

function endEarly(id, newEndTime) {
  const plan = state.plans.find(p => p.id === id)
  if (plan && timeToMinutes(newEndTime) > timeToMinutes(plan.startTime)) {
    plan.endTime = newEndTime
    recalculateAllConflicts()
  }
}

function extendTemporarily(id, newEndTime) {
  const plan = state.plans.find(p => p.id === id)
  if (plan) {
    plan.endTime = newEndTime
    recalculateAllConflicts()
  }
}

function startEdit(plan) {
  state.editingPlanId = plan.id
  state.showForm = true
}

function startNew() {
  state.editingPlanId = null
  state.showForm = true
}

function closeForm() {
  state.editingPlanId = null
  state.showForm = false
}

const filteredPlans = computed(() => {
  return state.plans.filter(plan => {
    if (state.filters.venue && plan.venue !== state.filters.venue) return false
    if (state.filters.team && plan.team !== state.filters.team) return false
    if (state.filters.intensity && plan.intensity !== state.filters.intensity) return false
    if (state.filters.conflictOnly && !plan.hasConflict) return false
    return true
  })
})

const plansForDate = computed(() => {
  return state.plans.filter(plan => plan.date === state.selectedDate)
})

const allConflicts = computed(() => {
  return state.plans.filter(plan => plan.hasConflict)
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
  state.venues = state.venues.filter(v => v !== name)
  state.plans = state.plans.filter(p => p.venue !== name)
  recalculateAllConflicts()
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
    version: 1,
    exportDate: new Date().toISOString(),
    venues: [...state.venues],
    teams: [...state.teams],
    middayBreak: { ...state.middayBreak },
    plans: state.plans.map(p => ({ ...p }))
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
      state.plans = data.plans
      const maxNum = state.plans.reduce((max, p) => {
        const num = parseInt(p.id.split('_')[1]) || 0
        return num > max ? num : max
      }, 0)
      nextId = maxNum + 1
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
  checkConflictsForPreview,
  recalculateAllConflicts,
  filteredPlans,
  plansForDate,
  allConflicts,
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
