<template>
  <div class="cr-list">
    <div class="filter-bar">
      <select v-model="store.state.changeRequestFilters.status" class="filter-select">
        <option value="">全部状态</option>
        <option v-for="(label, key) in CHANGE_REQUEST_STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>
      <select v-model="store.state.changeRequestFilters.changeType" class="filter-select">
        <option value="">全部类型</option>
        <option v-for="(label, key) in CHANGE_TYPE_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>
      <button class="btn-clear" v-if="hasFilters" @click="clearFilters">清除筛选</button>
      <div class="filter-stats">
        <span
          class="stat-badge"
          v-for="(count, status) in statusCounts"
          :key="status"
          :style="{ background: CHANGE_REQUEST_STATUS_COLORS[status].bg, color: CHANGE_REQUEST_STATUS_COLORS[status].color }"
          @click="store.state.changeRequestFilters.status = status"
        >
          {{ CHANGE_REQUEST_STATUS_LABELS[status] }} {{ count }}
        </span>
      </div>
    </div>

    <div class="list-body" v-if="store.filteredChangeRequests.value.length > 0">
      <div
        v-for="cr in store.filteredChangeRequests.value"
        :key="cr.id"
        class="cr-card"
        :class="{
          'is-pending': cr.status === CHANGE_REQUEST_STATUS.PENDING_REVIEW,
          'is-approved': cr.status === CHANGE_REQUEST_STATUS.APPROVED,
          'is-rejected': cr.status === CHANGE_REQUEST_STATUS.REJECTED,
          'is-confirmed': cr.status === CHANGE_REQUEST_STATUS.CONFIRMED
        }"
      >
        <div class="cr-card-header">
          <div class="cr-type-badge" :style="{ background: CHANGE_TYPE_COLORS[cr.changeType].bg, color: CHANGE_TYPE_COLORS[cr.changeType].color }">
            {{ CHANGE_TYPE_LABELS[cr.changeType] }}
          </div>
          <div class="cr-status-badge" :style="{ background: CHANGE_REQUEST_STATUS_COLORS[cr.status].bg, color: CHANGE_REQUEST_STATUS_COLORS[cr.status].color }">
            {{ CHANGE_REQUEST_STATUS_LABELS[cr.status] }}
          </div>
          <div class="cr-id">{{ cr.id.split('_').slice(0, 2).join('_') }}</div>
        </div>

        <div class="cr-original" v-if="getOriginalPlan(cr)">
          <div class="cr-section-title">📋 原计划</div>
          <div class="cr-plan-info">
            <span class="cr-team">{{ getOriginalPlan(cr).team }}</span>
            <span class="cr-venue">{{ getOriginalPlan(cr).venue }}</span>
            <span class="cr-time">{{ getOriginalPlan(cr).date }} {{ getOriginalPlan(cr).startTime }}-{{ getOriginalPlan(cr).endTime }}</span>
            <span
              class="cr-plan-status"
              :style="{ background: STATUS_COLORS[getOriginalPlan(cr).status].bg, color: STATUS_COLORS[getOriginalPlan(cr).status].color }"
            >{{ STATUS_LABELS[getOriginalPlan(cr).status] }}</span>
          </div>
        </div>

        <div class="cr-target" v-if="cr.changeType !== CHANGE_TYPE.CANCEL && (cr.targetDate || cr.targetVenue || cr.targetStartTime)">
          <div class="cr-section-title">🎯 目标安排</div>
          <div class="cr-plan-info">
            <span class="cr-target-date">{{ cr.targetDate }}</span>
            <span class="cr-target-venue" :class="{ changed: getOriginalPlan(cr) && cr.targetVenue !== getOriginalPlan(cr).venue }">{{ cr.targetVenue }}</span>
            <span class="cr-target-time" :class="{ changed: getOriginalPlan(cr) && (cr.targetStartTime !== getOriginalPlan(cr).startTime || cr.targetEndTime !== getOriginalPlan(cr).endTime) }">{{ cr.targetStartTime }}-{{ cr.targetEndTime }}</span>
          </div>
          <div class="cr-conflict-info" v-if="cr.hasConflict">
            <span class="conflict-badge plan-conflict" v-if="cr.conflictWith.length > 0">⚠ 与{{ cr.conflictWith.length }}条计划冲突</span>
            <span class="conflict-badge occ-conflict" v-if="cr.affectedByOccupation">🚫 场地占用冲突</span>
          </div>
        </div>

        <div class="cr-cancel-info" v-if="cr.changeType === CHANGE_TYPE.CANCEL">
          <div class="cr-section-title">🚫 取消计划</div>
          <div class="cancel-desc">该申请将取消原计划的所有排期安排</div>
        </div>

        <div class="cr-reason">
          <span class="reason-label">变更原因：</span>{{ cr.reason }}
        </div>

        <div class="cr-review-info" v-if="cr.reviewedAt">
          <div class="review-row" v-if="cr.reviewComment">
            <span class="review-label">审核意见：</span>{{ cr.reviewComment }}
          </div>
          <div class="review-row" v-if="cr.rejectReason">
            <span class="review-label reject">驳回原因：</span>{{ cr.rejectReason }}
          </div>
          <div class="review-meta">
            审核人：{{ cr.reviewedBy === 'supervisor' ? '监督人' : cr.reviewedBy }} · {{ formatTime(cr.reviewedAt) }}
          </div>
        </div>

        <div class="cr-confirm-info" v-if="cr.confirmedAt">
          <div class="confirm-meta">
            确认人：{{ cr.confirmedBy === 'organizer' ? '组织者' : cr.confirmedBy }} · {{ formatTime(cr.confirmedAt) }}
          </div>
        </div>

        <div class="cr-meta">
          <span>提交人：{{ cr.createdBy === 'executor' ? '执行人' : cr.createdBy }}</span>
          <span>提交时间：{{ formatTime(cr.submittedAt) }}</span>
        </div>

        <div class="cr-actions">
          <template v-if="isSupervisor && cr.status === CHANGE_REQUEST_STATUS.PENDING_REVIEW">
            <button class="action-btn approve" @click="openReviewDialog(cr, 'approve')" title="通过审核">✓ 通过</button>
            <button class="action-btn reject" @click="openReviewDialog(cr, 'reject')" title="驳回申请">✕ 驳回</button>
          </template>
          <template v-if="isOrganizer && cr.status === CHANGE_REQUEST_STATUS.APPROVED">
            <button class="action-btn confirm" @click="handleConfirm(cr)" title="确认生效">✓ 确认生效</button>
          </template>
          <template v-if="isExecutor && cr.status === CHANGE_REQUEST_STATUS.REJECTED">
            <button class="action-btn edit" @click="handleEdit(cr)" title="编辑修改">✎ 编辑</button>
            <button class="action-btn resubmit" @click="handleResubmit(cr)" title="重新提交">🔄 重新提交</button>
          </template>
          <button class="action-btn detail" @click="viewDetail(cr)" title="查看详情">ℹ 详情</button>
        </div>
      </div>
    </div>

    <div class="list-empty" v-else>
      <div class="empty-icon">📝</div>
      <p>暂无变更申请</p>
      <p class="empty-hint">对已通过或已发布的计划，执行人可发起变更申请</p>
    </div>

    <div class="review-dialog" v-if="reviewDialog.visible">
      <div class="review-overlay" @click="reviewDialog.visible = false"></div>
      <div class="review-panel">
        <h4>{{ reviewDialog.mode === 'approve' ? '审核通过变更申请' : '驳回变更申请' }}</h4>
        <div class="review-cr-info" v-if="reviewDialog.cr">
          <span class="review-type-badge" :style="{ background: CHANGE_TYPE_COLORS[reviewDialog.cr.changeType].bg, color: CHANGE_TYPE_COLORS[reviewDialog.cr.changeType].color }">
            {{ CHANGE_TYPE_LABELS[reviewDialog.cr.changeType] }}
          </span>
          <span class="review-team">{{ getOriginalPlan(reviewDialog.cr)?.team }}</span>
          <span class="review-venue">{{ getOriginalPlan(reviewDialog.cr)?.venue }}</span>
        </div>
        <div class="review-field">
          <label>{{ reviewDialog.mode === 'approve' ? '审核意见（选填）' : '驳回原因（必填）' }}</label>
          <textarea
            v-model="reviewDialog.comment"
            :placeholder="reviewDialog.mode === 'approve' ? '填写审核意见...' : '请填写驳回原因...'"
            rows="3"
          ></textarea>
        </div>
        <div class="review-error" v-if="reviewDialog.error">
          {{ reviewDialog.error }}
        </div>
        <div class="review-actions">
          <button class="btn btn-secondary" @click="reviewDialog.visible = false">取消</button>
          <button
            class="btn"
            :class="reviewDialog.mode === 'approve' ? 'btn-approve' : 'btn-reject'"
            @click="confirmReview"
            :disabled="reviewDialog.mode === 'reject' && !reviewDialog.comment.trim()"
          >
            {{ reviewDialog.mode === 'approve' ? '确认通过' : '确认驳回' }}
          </button>
        </div>
      </div>
    </div>

    <div class="detail-dialog" v-if="detailDialog.visible">
      <div class="detail-overlay" @click="detailDialog.visible = false"></div>
      <div class="detail-panel">
        <div class="detail-header">
          <h4>变更申请详情</h4>
          <button class="btn-icon" @click="detailDialog.visible = false">✕</button>
        </div>
        <div class="detail-body" v-if="detailDialog.cr">
          <div class="detail-section">
            <div class="detail-label">变更类型</div>
            <div class="detail-value">
              <span class="cr-type-badge" :style="{ background: CHANGE_TYPE_COLORS[detailDialog.cr.changeType].bg, color: CHANGE_TYPE_COLORS[detailDialog.cr.changeType].color }">
                {{ CHANGE_TYPE_LABELS[detailDialog.cr.changeType] }}
              </span>
            </div>
          </div>
          <div class="detail-section">
            <div class="detail-label">当前状态</div>
            <div class="detail-value">
              <span class="cr-status-badge" :style="{ background: CHANGE_REQUEST_STATUS_COLORS[detailDialog.cr.status].bg, color: CHANGE_REQUEST_STATUS_COLORS[detailDialog.cr.status].color }">
                {{ CHANGE_REQUEST_STATUS_LABELS[detailDialog.cr.status] }}
              </span>
            </div>
          </div>
          <div class="detail-section" v-if="getOriginalPlan(detailDialog.cr)">
            <div class="detail-label">原计划</div>
            <div class="detail-value">
              {{ getOriginalPlan(detailDialog.cr).team }} · {{ getOriginalPlan(detailDialog.cr).venue }} · {{ getOriginalPlan(detailDialog.cr).date }} {{ getOriginalPlan(detailDialog.cr).startTime }}-{{ getOriginalPlan(detailDialog.cr).endTime }}
            </div>
          </div>
          <div class="detail-section" v-if="detailDialog.cr.changeType !== CHANGE_TYPE.CANCEL">
            <div class="detail-label">目标安排</div>
            <div class="detail-value">
              {{ detailDialog.cr.targetVenue }} · {{ detailDialog.cr.targetDate }} {{ detailDialog.cr.targetStartTime }}-{{ detailDialog.cr.targetEndTime }}
            </div>
          </div>
          <div class="detail-section">
            <div class="detail-label">变更原因</div>
            <div class="detail-value">{{ detailDialog.cr.reason }}</div>
          </div>
          <div class="detail-section" v-if="detailDialog.cr.reviewComment">
            <div class="detail-label">审核意见</div>
            <div class="detail-value">{{ detailDialog.cr.reviewComment }}</div>
          </div>
          <div class="detail-section" v-if="detailDialog.cr.rejectReason">
            <div class="detail-label">驳回原因</div>
            <div class="detail-value reject-reason">{{ detailDialog.cr.rejectReason }}</div>
          </div>
          <div class="detail-timeline">
            <div class="timeline-item">
              <span class="timeline-dot"></span>
              <span class="timeline-text">提交申请 · {{ formatTime(detailDialog.cr.submittedAt) }}</span>
            </div>
            <div class="timeline-item" v-if="detailDialog.cr.reviewedAt">
              <span class="timeline-dot" :class="detailDialog.cr.status === CHANGE_REQUEST_STATUS.REJECTED ? 'rejected' : 'approved'"></span>
              <span class="timeline-text">{{ detailDialog.cr.status === CHANGE_REQUEST_STATUS.REJECTED ? '驳回' : '审核通过' }} · {{ formatTime(detailDialog.cr.reviewedAt) }}</span>
            </div>
            <div class="timeline-item" v-if="detailDialog.cr.confirmedAt">
              <span class="timeline-dot confirmed"></span>
              <span class="timeline-text">确认生效 · {{ formatTime(detailDialog.cr.confirmedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import {
  store, PLAN_STATUS, STATUS_LABELS, STATUS_COLORS, OCCUPATION_TYPE_LABELS,
  CHANGE_REQUEST_STATUS, CHANGE_REQUEST_STATUS_LABELS, CHANGE_REQUEST_STATUS_COLORS,
  CHANGE_TYPE, CHANGE_TYPE_LABELS, CHANGE_TYPE_COLORS
} from '../store.js'

const isExecutor = computed(() => store.state.currentRole === 'executor')
const isSupervisor = computed(() => store.state.currentRole === 'supervisor')
const isOrganizer = computed(() => store.state.currentRole === 'organizer')

const hasFilters = computed(() => {
  const f = store.state.changeRequestFilters
  return f.status || f.changeType
})

function clearFilters() {
  store.state.changeRequestFilters.status = ''
  store.state.changeRequestFilters.changeType = ''
}

const statusCounts = computed(() => {
  const visible = store.getVisibleChangeRequests()
  const counts = {}
  for (const cr of visible) {
    counts[cr.status] = (counts[cr.status] || 0) + 1
  }
  return counts
})

function getOriginalPlan(cr) {
  return store.getOriginalPlan(cr)
}

function formatTime(isoString) {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return isoString
  }
}

const reviewDialog = reactive({
  visible: false,
  mode: 'approve',
  cr: null,
  comment: '',
  error: ''
})

function openReviewDialog(cr, mode) {
  reviewDialog.visible = true
  reviewDialog.mode = mode
  reviewDialog.cr = cr
  reviewDialog.comment = ''
  reviewDialog.error = ''
}

function confirmReview() {
  if (!reviewDialog.cr) return
  if (reviewDialog.mode === 'reject' && !reviewDialog.comment.trim()) {
    reviewDialog.error = '驳回时必须填写驳回原因'
    return
  }
  if (reviewDialog.mode === 'approve') {
    const result = store.approveChangeRequest(reviewDialog.cr.id, reviewDialog.comment)
    if (!result) {
      const cr = store.state.changeRequests.find(c => c.id === reviewDialog.cr.id)
      if (cr && cr.affectedByOccupation) {
        reviewDialog.error = '无法通过：目标时段存在场地占用冲突，请驳回并要求执行人修改目标安排'
      } else {
        reviewDialog.error = '审核失败，只有监督人可以审核变更申请'
      }
      return
    }
  } else {
    const result = store.rejectChangeRequest(reviewDialog.cr.id, reviewDialog.comment)
    if (!result) {
      reviewDialog.error = '驳回失败，只有监督人可以驳回变更申请'
      return
    }
  }
  reviewDialog.visible = false
}

function handleConfirm(cr) {
  const plan = getOriginalPlan(cr)
  if (!plan) return
  const typeLabel = CHANGE_TYPE_LABELS[cr.changeType]
  let msg = `确定确认生效「${plan.team} - ${plan.venue}」的${typeLabel}变更申请？`
  if (cr.changeType === CHANGE_TYPE.CANCEL) {
    msg += '\n\n⚠ 确认后原计划将被取消，此操作不可撤销。'
  } else {
    msg += `\n\n确认后原计划将调整为：${cr.targetVenue} ${cr.targetDate} ${cr.targetStartTime}-${cr.targetEndTime}`
  }
  if (confirm(msg)) {
    const result = store.confirmChangeRequest(cr.id)
    if (!result) {
      const updatedCr = store.state.changeRequests.find(c => c.id === cr.id)
      if (updatedCr && updatedCr.affectedByOccupation) {
        alert('无法确认生效：目标时段存在场地占用冲突，请驳回该变更申请并要求执行人修改目标安排')
      } else {
        alert('确认失败，只有组织者可以确认变更申请')
      }
    }
  }
}

function handleResubmit(cr) {
  if (cr.affectedByOccupation && cr.changeType !== CHANGE_TYPE.CANCEL) {
    alert('目标时段仍存在场地占用冲突，无法重新提交。请先编辑修改目标安排后再重新提交。')
    return
  }
  if (confirm('确定重新提交该变更申请？')) {
    const result = store.resubmitChangeRequest(cr.id)
    if (!result) {
      alert('重新提交失败，只有执行人可以重新提交已驳回的变更申请')
    }
  }
}

function handleEdit(cr) {
  store.startEditChangeRequest(cr.id)
}

const detailDialog = reactive({
  visible: false,
  cr: null
})

function viewDetail(cr) {
  detailDialog.visible = true
  detailDialog.cr = cr
}
</script>

<style scoped>
.cr-list {
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

.filter-stats {
  display: flex;
  gap: 6px;
  margin-left: auto;
  flex-wrap: wrap;
}

.stat-badge {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s;
}

.stat-badge:hover {
  filter: brightness(1.2);
}

.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cr-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  border-left: 4px solid var(--border);
  transition: border-color 0.2s;
}

.cr-card.is-pending {
  border-left-color: #d97706;
  background: rgba(245, 158, 11, 0.02);
}

.cr-card.is-approved {
  border-left-color: #16a34a;
  background: rgba(34, 197, 94, 0.02);
}

.cr-card.is-rejected {
  border-left-color: #dc2626;
  background: rgba(239, 68, 68, 0.02);
}

.cr-card.is-confirmed {
  border-left-color: #6366f1;
  background: rgba(99, 102, 241, 0.02);
}

.cr-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.cr-type-badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.cr-status-badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.cr-id {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.cr-original,
.cr-target,
.cr-cancel-info {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 6px;
}

.cr-original {
  background: rgba(99, 102, 241, 0.06);
  border: 1px solid rgba(99, 102, 241, 0.15);
}

.cr-target {
  background: rgba(168, 85, 247, 0.06);
  border: 1px solid rgba(168, 85, 247, 0.15);
}

.cr-cancel-info {
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.cr-section-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
}

.cr-original .cr-section-title {
  color: var(--accent);
}

.cr-target .cr-section-title {
  color: #9333ea;
}

.cr-cancel-info .cr-section-title {
  color: #dc2626;
}

.cr-plan-info {
  display: flex;
  gap: 10px;
  font-size: 13px;
  flex-wrap: wrap;
  align-items: center;
}

.cr-team {
  font-weight: 600;
  color: var(--text-primary);
}

.cr-venue {
  color: var(--text-secondary);
}

.cr-time {
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.cr-plan-status {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.cr-target-date {
  color: var(--text-secondary);
}

.cr-target-venue.changed,
.cr-target-time.changed {
  color: #9333ea;
  font-weight: 600;
}

.cancel-desc {
  font-size: 13px;
  color: #dc2626;
}

.cr-conflict-info {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.conflict-badge {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.conflict-badge.plan-conflict {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.conflict-badge.occ-conflict {
  background: rgba(249, 115, 22, 0.1);
  color: #ea580c;
}

.cr-reason {
  font-size: 13px;
  color: var(--text-primary);
  padding: 6px 0;
  line-height: 1.5;
}

.reason-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.cr-review-info {
  margin-top: 8px;
  padding: 8px 10px;
  background: rgba(34, 197, 94, 0.04);
  border: 1px solid rgba(34, 197, 94, 0.12);
  border-radius: 6px;
  font-size: 13px;
}

.cr-review-info:has(.review-label.reject) {
  background: rgba(239, 68, 68, 0.04);
  border-color: rgba(239, 68, 68, 0.12);
}

.review-row {
  margin-bottom: 4px;
}

.review-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.review-label.reject {
  color: #dc2626;
}

.review-meta {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.cr-confirm-info {
  margin-top: 8px;
  padding: 6px 10px;
  background: rgba(99, 102, 241, 0.04);
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 6px;
}

.confirm-meta {
  font-size: 11px;
  color: var(--text-secondary);
}

.cr-meta {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.cr-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.action-btn {
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  background: var(--bg-input);
  color: var(--text-primary);
  transition: all 0.15s;
}

.action-btn:hover {
  border-color: var(--accent);
  background: var(--bg-hover);
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

.action-btn.confirm {
  border-color: #6366f1;
  color: #6366f1;
  font-weight: 600;
}

.action-btn.confirm:hover {
  background: rgba(99, 102, 241, 0.15);
}

.action-btn.resubmit {
  border-color: #d97706;
  color: #d97706;
}

.action-btn.resubmit:hover {
  background: rgba(245, 158, 11, 0.15);
}

.action-btn.edit {
  border-color: #9333ea;
  color: #9333ea;
}

.action-btn.edit:hover {
  background: rgba(168, 85, 247, 0.15);
}

.action-btn.detail {
  margin-left: auto;
  color: var(--text-secondary);
}

.action-btn.detail:hover {
  color: var(--accent);
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

.review-overlay,
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 150;
}

.review-panel,
.detail-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 151;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
}

.review-panel h4,
.detail-header h4 {
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--text-primary);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px 8px;
  border-radius: 6px;
}

.btn-icon:hover {
  background: var(--bg-hover);
}

.review-cr-info {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  font-size: 13px;
}

.review-type-badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.review-team {
  font-weight: 600;
  color: var(--text-primary);
}

.review-venue {
  color: var(--text-secondary);
}

.review-field {
  margin-bottom: 16px;
}

.review-field label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.review-field textarea {
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

.review-field textarea:focus {
  border-color: var(--accent);
}

.review-error {
  font-size: 12px;
  color: #dc2626;
  margin-bottom: 12px;
}

.review-actions {
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

.btn-secondary {
  background: var(--bg-hover);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-approve {
  background: #16a34a;
  color: white;
}

.btn-approve:hover:not(:disabled) {
  background: #15803d;
}

.btn-reject {
  background: #dc2626;
  color: white;
}

.btn-reject:hover:not(:disabled) {
  background: #b91c1c;
}

.detail-body {
  margin-top: 12px;
}

.detail-section {
  margin-bottom: 12px;
}

.detail-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}

.reject-reason {
  color: #dc2626;
}

.detail-timeline {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-secondary);
  flex-shrink: 0;
}

.timeline-dot.approved {
  background: #16a34a;
}

.timeline-dot.rejected {
  background: #dc2626;
}

.timeline-dot.confirmed {
  background: #6366f1;
}
</style>
