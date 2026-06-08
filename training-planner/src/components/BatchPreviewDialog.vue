<template>
  <div class="batch-preview-overlay" v-if="store.state.showBatchPreview" @click.self="cancel">
    <div class="batch-preview">
      <div class="preview-header">
        <h3>排期预检查</h3>
        <button class="btn-icon" @click="cancel">✕</button>
      </div>
      <div class="preview-summary">
        <div class="summary-stats">
          <span class="stat-item">
            <span class="stat-value">{{ totalCount }}</span>
            <span class="stat-label">总条目</span>
          </span>
          <span class="stat-item stat-conflict">
            <span class="stat-value">{{ planConflictCount }}</span>
            <span class="stat-label">时间冲突</span>
          </span>
          <span class="stat-item stat-occupation">
            <span class="stat-value">{{ occupationConflictCount }}</span>
            <span class="stat-label">场地占用</span>
          </span>
          <span class="stat-item stat-midday">
            <span class="stat-value">{{ middayBreakCount }}</span>
            <span class="stat-label">跨午休</span>
          </span>
        </div>
        <div class="summary-actions">
          <button class="btn btn-sm btn-primary-outline" @click="setAllSubmitSafe">全部提交无风险项</button>
          <button class="btn btn-sm btn-draft-outline" @click="setAllDraft">全部改为草稿</button>
          <button class="btn btn-sm btn-skip-outline" @click="setAllSkipConflict">全部跳过冲突项</button>
        </div>
      </div>
      <div class="preview-list">
        <div class="preview-list-header">
          <span class="col-idx">#</span>
          <span class="col-date">日期</span>
          <span class="col-venue">场地</span>
          <span class="col-time">时段</span>
          <span class="col-team">队伍</span>
          <span class="col-flags">标记</span>
          <span class="col-action">操作</span>
        </div>
        <div class="preview-list-body">
          <div
            v-for="(item, index) in store.state.batchPreviewItems"
            :key="index"
            class="preview-item"
            :class="{
              'has-occupation-conflict': item.hasOccupationConflict,
              'has-plan-conflict': item.hasConflict && !item.hasOccupationConflict,
              'has-midday-only': item.spansMiddayBreak && !item.hasConflict && !item.hasOccupationConflict,
              'is-skipped': item.action === 'skip'
            }"
          >
            <span class="col-idx">{{ index + 1 }}</span>
            <span class="col-date">{{ item.date }}</span>
            <span class="col-venue">{{ item.venue }}</span>
            <span class="col-time">{{ item.startTime }}-{{ item.endTime }}</span>
            <span class="col-team">{{ item.team }}</span>
            <span class="col-flags">
              <span class="flag-badge flag-conflict" v-if="item.hasConflict">⚠ 时间冲突</span>
              <span class="flag-badge flag-occupation" v-if="item.hasOccupationConflict">🚫 场地占用</span>
              <span class="flag-badge flag-midday" v-if="item.spansMiddayBreak">⏰ 跨午休</span>
            </span>
            <span class="col-action">
              <select
                :value="item.action"
                @change="onActionChange(index, $event)"
                class="action-select"
                :class="{ 'action-conflict': item.action === 'draft', 'action-skip': item.action === 'skip' }"
              >
                <option value="submit" :disabled="item.hasOccupationConflict">提交</option>
                <option value="draft">改为草稿</option>
                <option value="skip">跳过</option>
              </select>
            </span>
            <div class="item-occupation-detail" v-if="item.hasOccupationConflict && item.occupationConflicts.length > 0">
              <span class="detail-label">占用详情：</span>
              <span class="detail-occ" v-for="occ in item.occupationConflicts" :key="occ.id">
                <span
                  class="occ-type-badge"
                  :style="{ background: OCCUPATION_TYPE_COLORS[occ.type].bg, color: OCCUPATION_TYPE_COLORS[occ.type].color }"
                >{{ OCCUPATION_TYPE_LABELS[occ.type] }}</span>
                {{ occ.startTime }}-{{ occ.endTime }}
                <span v-if="occ.reason">（{{ occ.reason }}）</span>
              </span>
            </div>
            <div class="item-conflict-detail" v-if="item.hasConflict && item.planConflicts.length > 0">
              <span class="detail-label">冲突计划：</span>
              <span class="detail-plan" v-for="p in item.planConflicts" :key="p.id">
                {{ p.team }} {{ p.startTime }}-{{ p.endTime }}
                <span
                  class="conflict-status-badge"
                  :style="{ background: STATUS_COLORS[p.status].bg, color: STATUS_COLORS[p.status].color }"
                >{{ STATUS_LABELS[p.status] }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="preview-footer">
        <button class="btn btn-secondary" @click="cancel">取消</button>
        <button class="btn btn-primary" @click="confirm" :disabled="submittableCount === 0">
          确认生成 ({{ submittableCount }} 条)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { store, PLAN_STATUS, STATUS_LABELS, STATUS_COLORS, OCCUPATION_TYPE_LABELS, OCCUPATION_TYPE_COLORS } from '../store.js'

const totalCount = computed(() => store.state.batchPreviewItems.length)

const planConflictCount = computed(() =>
  store.state.batchPreviewItems.filter(i => i.hasConflict).length
)

const occupationConflictCount = computed(() =>
  store.state.batchPreviewItems.filter(i => i.hasOccupationConflict).length
)

const middayBreakCount = computed(() =>
  store.state.batchPreviewItems.filter(i => i.spansMiddayBreak).length
)

const submittableCount = computed(() =>
  store.state.batchPreviewItems.filter(i => i.action !== 'skip').length
)

function onActionChange(index, event) {
  store.updateBatchPreviewItemAction(index, event.target.value)
}

function setAllSubmitSafe() {
  store.state.batchPreviewItems.forEach((item, index) => {
    if (!item.hasOccupationConflict && !item.hasConflict) {
      store.updateBatchPreviewItemAction(index, 'submit')
    }
  })
}

function setAllDraft() {
  store.state.batchPreviewItems.forEach((_, index) => {
    store.updateBatchPreviewItemAction(index, 'draft')
  })
}

function setAllSkipConflict() {
  store.state.batchPreviewItems.forEach((item, index) => {
    if (item.hasConflict || item.hasOccupationConflict) {
      store.updateBatchPreviewItemAction(index, 'skip')
    }
  })
}

function cancel() {
  store.closeBatchPreview()
}

function confirm() {
  store.confirmBatchSchedule()
}
</script>

<style scoped>
.batch-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.batch-preview {
  background: var(--bg-card);
  border-radius: 12px;
  width: 780px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.preview-header h3 {
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

.preview-summary {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.summary-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-conflict .stat-value {
  color: #dc2626;
}

.stat-occupation .stat-value {
  color: #ea580c;
}

.stat-midday .stat-value {
  color: #d97706;
}

.summary-actions {
  display: flex;
  gap: 8px;
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

.btn-sm {
  padding: 5px 12px;
  font-size: 12px;
  border-radius: 6px;
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

.btn-primary-outline {
  background: none;
  border: 1px solid var(--accent);
  color: var(--accent);
}

.btn-primary-outline:hover {
  background: rgba(99, 102, 241, 0.1);
}

.btn-draft-outline {
  background: none;
  border: 1px solid rgba(107, 114, 128, 0.4);
  color: #9ca3af;
}

.btn-draft-outline:hover {
  background: rgba(107, 114, 128, 0.1);
  color: var(--text-primary);
}

.btn-skip-outline {
  background: none;
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #dc2626;
}

.btn-skip-outline:hover {
  background: rgba(239, 68, 68, 0.08);
}

.preview-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-list-header {
  display: flex;
  padding: 10px 24px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  flex-shrink: 0;
}

.preview-list-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.preview-item {
  display: flex;
  flex-wrap: wrap;
  padding: 12px 24px;
  font-size: 13px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
  align-items: center;
  transition: background 0.15s;
}

.preview-item:hover {
  background: var(--bg-hover);
}

.preview-item.has-occupation-conflict {
  border-left: 3px solid #ea580c;
  background: rgba(249, 115, 22, 0.04);
}

.preview-item.has-plan-conflict {
  border-left: 3px solid #dc2626;
  background: rgba(239, 68, 68, 0.04);
}

.preview-item.has-midday-only {
  border-left: 3px solid #d97706;
}

.preview-item.is-skipped {
  opacity: 0.5;
}

.col-idx { width: 30px; text-align: center; color: var(--text-secondary); }
.col-date { width: 100px; }
.col-venue { width: 100px; }
.col-time { width: 120px; font-variant-numeric: tabular-nums; }
.col-team { width: 100px; }
.col-flags { flex: 1; display: flex; gap: 6px; flex-wrap: wrap; }
.col-action { width: 110px; }

.flag-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.flag-conflict {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

.flag-occupation {
  background: rgba(249, 115, 22, 0.15);
  color: #ea580c;
}

.flag-midday {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}

.action-select {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  cursor: pointer;
}

.action-select:focus {
  border-color: var(--accent);
}

.action-select.action-conflict {
  border-color: rgba(107, 114, 128, 0.4);
}

.action-select.action-skip {
  border-color: rgba(239, 68, 68, 0.4);
  color: #dc2626;
}

.item-occupation-detail,
.item-conflict-detail {
  width: 100%;
  margin-top: 6px;
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 6px;
}

.item-occupation-detail {
  background: rgba(249, 115, 22, 0.08);
  color: #ea580c;
}

.item-conflict-detail {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

.detail-label {
  font-weight: 600;
}

.detail-occ,
.detail-plan {
  margin-right: 10px;
}

.occ-type-badge {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
}

.conflict-status-badge {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
}

.preview-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
</style>
