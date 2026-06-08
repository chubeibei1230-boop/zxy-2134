<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">训练场预约计划</h1>
        <div class="role-switcher">
          <button
            v-for="role in roles"
            :key="role.key"
            class="role-btn"
            :class="{ active: store.state.currentRole === role.key }"
            @click="switchRole(role.key)"
          >
            {{ role.icon }} {{ role.label }}
          </button>
        </div>
        <div class="role-hint" v-if="roleHint">
          {{ roleHint }}
        </div>
      </div>
      <div class="header-center">
        <label class="date-picker">
          <span class="date-label">选择日期</span>
          <input type="date" v-model="store.state.selectedDate" />
        </label>
      </div>
      <div class="header-right">
        <div class="pending-badge" v-if="isSupervisor && pendingCount > 0" @click="setStatusFilter('pending_approval')">
          <span class="badge-icon">🔔</span>
          <span class="badge-text">{{ pendingCount }} 条待审批</span>
        </div>
        <div class="publish-badge" v-if="isOrganizer && approvedCount > 0" @click="setStatusFilter('approved')">
          <span class="badge-icon">📋</span>
          <span class="badge-text">{{ approvedCount }} 条待发布</span>
        </div>
        <button class="header-btn" @click="store.exportData()" title="导出计划">
          📤 导出
        </button>
        <label class="header-btn import-btn" title="导入计划" v-if="isExecutor">
          📥 导入
          <input type="file" accept=".json" @change="handleImport" ref="fileInput" />
        </label>
        <button
          class="header-btn primary"
          @click="store.startNew()"
          v-if="isExecutor"
        >
          + 新建计划
        </button>
      </div>
    </header>

    <div class="app-body">
      <aside class="sidebar">
        <div class="sidebar-section">
          <div class="section-header">
            <h3>场地管理</h3>
            <button
              class="section-add"
              v-if="isOrganizer"
              @click="showAddVenue = true"
            >+</button>
          </div>
          <div class="venue-list">
            <div class="venue-item" v-for="v in store.state.venues" :key="v">
              <span>{{ v }}</span>
              <button
                class="item-remove"
                v-if="isOrganizer"
                @click="handleRemoveVenue(v)"
              >✕</button>
            </div>
          </div>
          <div class="add-form" v-if="showAddVenue">
            <input
              v-model="newVenueName"
              placeholder="场地名称"
              @keyup.enter="addVenue"
              ref="venueInput"
            />
            <button @click="addVenue">添加</button>
            <button @click="showAddVenue = false; newVenueName = ''">取消</button>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="section-header">
            <h3>队伍管理</h3>
            <button
              class="section-add"
              v-if="isExecutor"
              @click="showAddTeam = true"
            >+</button>
          </div>
          <div class="team-list">
            <div class="team-item" v-for="t in store.state.teams" :key="t">
              <span>{{ t }}</span>
              <button
                class="item-remove"
                v-if="isExecutor"
                @click="store.removeTeam(t)"
              >✕</button>
            </div>
          </div>
          <div class="add-form" v-if="showAddTeam">
            <input
              v-model="newTeamName"
              placeholder="队伍名称"
              @keyup.enter="addTeam"
              ref="teamInput"
            />
            <button @click="addTeam">添加</button>
            <button @click="showAddTeam = false; newTeamName = ''">取消</button>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="section-header">
            <h3>午休时段</h3>
          </div>
          <div class="break-config">
            <div class="break-row">
              <label>开始</label>
              <input type="time" v-model="store.state.middayBreak.start" step="900" />
            </div>
            <div class="break-row">
              <label>结束</label>
              <input type="time" v-model="store.state.middayBreak.end" step="900" />
            </div>
            <button class="break-apply" @click="store.recalculateAllConflicts()">
              重新计算冲突
            </button>
          </div>
        </div>

        <div class="sidebar-section" v-if="isExecutor">
          <div class="section-header">
            <h3>我的待处理</h3>
          </div>
          <div class="todo-list" v-if="executorTodoItems.length > 0">
            <div class="todo-item" v-for="item in executorTodoItems" :key="item.id" @click="store.startEdit(item)">
              <span class="todo-badge rejected">已驳回</span>
              <span class="todo-text">{{ item.team }} · {{ item.venue }}</span>
            </div>
          </div>
          <div class="todo-empty" v-else>暂无待处理事项</div>
        </div>

        <div class="sidebar-section" v-if="isSupervisor">
          <div class="section-header">
            <h3>待审批</h3>
          </div>
          <div class="todo-list" v-if="supervisorTodoItems.length > 0">
            <div class="todo-item" v-for="item in supervisorTodoItems" :key="item.id">
              <span class="todo-badge pending">待审批</span>
              <span class="todo-text">{{ item.team }} · {{ item.venue }} · {{ item.startTime }}-{{ item.endTime }}</span>
            </div>
          </div>
          <div class="todo-empty" v-else>暂无待审批事项</div>
        </div>

        <div class="sidebar-section" v-if="isOrganizer">
          <div class="section-header">
            <h3>待发布</h3>
          </div>
          <div class="todo-list" v-if="organizerTodoItems.length > 0">
            <div class="todo-item" v-for="item in organizerTodoItems" :key="item.id">
              <span class="todo-badge approved">已通过</span>
              <span class="todo-text">{{ item.team }} · {{ item.venue }} · {{ item.startTime }}-{{ item.endTime }}</span>
            </div>
          </div>
          <div class="todo-empty" v-else>暂无待发布事项</div>
        </div>

        <ConflictPanel />
      </aside>

      <main class="main-content">
        <div class="tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'list' }"
            @click="activeTab = 'list'"
          >📋 计划列表</button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'timeline' }"
            @click="activeTab = 'timeline'"
          >🕐 时间预览</button>
        </div>
        <div class="tab-content">
          <PlanList v-if="activeTab === 'list'" />
          <TimelinePreview v-if="activeTab === 'timeline'" />
        </div>
      </main>
    </div>

    <PlanForm />
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { store, PLAN_STATUS } from './store.js'
import PlanForm from './components/PlanForm.vue'
import PlanList from './components/PlanList.vue'
import TimelinePreview from './components/TimelinePreview.vue'
import ConflictPanel from './components/ConflictPanel.vue'

const roles = [
  { key: 'organizer', label: '组织者', icon: '🏗' },
  { key: 'executor', label: '执行人', icon: '✍' },
  { key: 'supervisor', label: '监督人', icon: '👁' }
]

const roleDescriptions = {
  organizer: '组织者：可查看已通过/已发布计划并统筹发布，不可查看草稿和待审批',
  executor: '执行人：可创建/编辑/提交训练计划，处理被驳回的修改',
  supervisor: '监督人：可审批或驳回待审批计划，不可查看草稿'
}

const roleHint = ref('')

const isOrganizer = computed(() => store.state.currentRole === 'organizer')
const isExecutor = computed(() => store.state.currentRole === 'executor')
const isSupervisor = computed(() => store.state.currentRole === 'supervisor')

function switchRole(roleKey) {
  store.state.currentRole = roleKey
  roleHint.value = roleDescriptions[roleKey]
  setTimeout(() => { roleHint.value = '' }, 4000)
}

const activeTab = ref('list')

const showAddVenue = ref(false)
const newVenueName = ref('')
const venueInput = ref(null)

const showAddTeam = ref(false)
const newTeamName = ref('')
const teamInput = ref(null)

const pendingCount = computed(() => store.pendingApprovalPlans.value.length)
const approvedCount = computed(() => store.state.plans.filter(p => p.status === PLAN_STATUS.APPROVED).length)

const executorTodoItems = computed(() =>
  store.state.plans.filter(p => p.status === PLAN_STATUS.REJECTED)
)

const supervisorTodoItems = computed(() =>
  store.pendingApprovalPlans.value
)

const organizerTodoItems = computed(() =>
  store.state.plans.filter(p => p.status === PLAN_STATUS.APPROVED)
)

function setStatusFilter(status) {
  store.state.filters.status = status
}

function addVenue() {
  if (newVenueName.value.trim()) {
    store.addVenue(newVenueName.value.trim())
    newVenueName.value = ''
    showAddVenue.value = false
  }
}

function addTeam() {
  if (newTeamName.value.trim()) {
    store.addTeam(newTeamName.value.trim())
    newTeamName.value = ''
    showAddTeam.value = false
  }
}

function handleRemoveVenue(name) {
  const plansInVenue = store.state.plans.filter(p => p.venue === name)
  const protectedPlans = plansInVenue.filter(p =>
    p.status === PLAN_STATUS.APPROVED || p.status === PLAN_STATUS.PUBLISHED
  )
  if (protectedPlans.length > 0) {
    alert(
      `无法删除场地「${name}」\n\n` +
      `该场地下有 ${protectedPlans.length} 条已通过或已发布的正式排期计划，` +
      `删除场地会导致正式排期计划丢失。\n\n` +
      `请先将相关计划调整至其他场地，或取消发布后再尝试删除。`
    )
    return
  }
  const deletablePlans = plansInVenue.filter(p =>
    p.status === PLAN_STATUS.DRAFT || p.status === PLAN_STATUS.REJECTED || p.status === PLAN_STATUS.PENDING_APPROVAL
  )
  let message = `确定删除场地「${name}」？`
  if (deletablePlans.length > 0) {
    const statusGroups = {}
    deletablePlans.forEach(p => {
      const label = { draft: '草稿', pending_approval: '待审批', rejected: '已驳回' }[p.status] || p.status
      statusGroups[label] = (statusGroups[label] || 0) + 1
    })
    const details = Object.entries(statusGroups).map(([s, c]) => `${s} ${c} 条`).join('、')
    message = `确定删除场地「${name}」？\n\n⚠ 该场地下共有 ${deletablePlans.length} 条训练计划将被同步删除：\n${details}\n\n此操作不可撤销。`
  }
  if (confirm(message)) {
    store.removeVenue(name)
  }
}

const fileInput = ref(null)

function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (evt) => {
    const success = store.importData(evt.target.result)
    if (success) {
      alert('导入成功！')
    } else {
      alert('导入失败，文件格式不正确。')
    }
    if (fileInput.value) fileInput.value.value = ''
  }
  reader.readAsText(file)
}
</script>

<style>
:root {
  --bg-base: #0f1117;
  --bg-card: #1a1d27;
  --bg-hover: #252836;
  --bg-input: #1e2130;
  --border: #2d3148;
  --text-primary: #e4e6f0;
  --text-secondary: #8b8fa3;
  --accent: #6366f1;
  --accent-hover: #818cf8;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
  line-height: 1.5;
  overflow: hidden;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  gap: 16px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.role-switcher {
  display: flex;
  gap: 4px;
  background: var(--bg-base);
  padding: 3px;
  border-radius: 8px;
}

.role-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.2s;
  white-space: nowrap;
}

.role-btn.active {
  background: var(--accent);
  color: white;
}

.role-btn:hover:not(.active) {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.role-hint {
  font-size: 11px;
  color: var(--text-secondary);
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  padding: 2px 10px;
  border-radius: 6px;
  white-space: nowrap;
  animation: hint-fade 4s ease-out forwards;
}

@keyframes hint-fade {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

.header-center {
  display: flex;
  align-items: center;
}

.date-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.date-picker input {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.date-picker input:focus {
  border-color: var(--accent);
}

.header-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pending-badge,
.publish-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.pending-badge {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.pending-badge:hover {
  background: rgba(245, 158, 11, 0.25);
}

.publish-badge {
  background: rgba(99, 102, 241, 0.15);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.publish-badge:hover {
  background: rgba(99, 102, 241, 0.25);
}

.badge-icon {
  font-size: 14px;
}

.badge-text {
  font-weight: 600;
}

.header-btn {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.header-btn:hover {
  border-color: var(--accent);
  background: var(--bg-hover);
}

.header-btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.header-btn.primary:hover {
  filter: brightness(1.1);
}

.import-btn {
  position: relative;
  overflow: hidden;
}

.import-btn input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 0;
}

.sidebar-section {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-header h3 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-add {
  width: 24px;
  height: 24px;
  border: 1px dashed var(--border);
  border-radius: 6px;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-add:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.venue-item, .team-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  font-size: 13px;
  color: var(--text-primary);
  border-radius: 6px;
}

.venue-item:hover, .team-item:hover {
  background: var(--bg-hover);
}

.item-remove {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.venue-item:hover .item-remove,
.team-item:hover .item-remove {
  opacity: 1;
}

.item-remove:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.add-form {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.add-form input {
  flex: 1;
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
}

.add-form input:focus {
  border-color: var(--accent);
}

.add-form button {
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  background: var(--bg-hover);
  color: var(--text-primary);
}

.add-form button:first-of-type:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.break-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.break-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.break-row label {
  font-size: 12px;
  color: var(--text-secondary);
  width: 36px;
}

.break-row input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
}

.break-row input:focus {
  border-color: var(--accent);
}

.break-apply {
  padding: 6px 12px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.break-apply:hover {
  background: var(--accent);
  color: white;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.todo-item:hover {
  background: var(--bg-hover);
}

.todo-badge {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.todo-badge.rejected {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

.todo-badge.pending {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}

.todo-badge.approved {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}

.todo-text {
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-empty {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 0;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs {
  display: flex;
  gap: 0;
  padding: 0 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
}

.tab-btn {
  padding: 12px 20px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.tab-btn:hover:not(.active) {
  color: var(--text-primary);
}

.tab-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

input[type="time"]::-webkit-calendar-picker-indicator,
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(0.7);
}
</style>
