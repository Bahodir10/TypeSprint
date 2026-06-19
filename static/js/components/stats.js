import { api } from '../api/client.js';
import { state } from '../core/state.js';

const statsModal = document.getElementById('statsModal');
const statsModalClose = document.getElementById('statsModalClose');
const statsContent = document.getElementById('statsContent');
const statsUsernameEl = document.getElementById('statsUsername');

let _calendarData  = null;
let _calendarYear  = null;
let _calendarMonth = null;
let _selectedDate  = null;
let _allStats      = null;
let _calendarOpen  = false;

export function setupStatsModal() {
    document.getElementById('statsBtn').addEventListener('click', openStatsModal);
    statsModalClose.addEventListener('click', closeStatsModal);
    statsModal.addEventListener('click', e => { if (e.target === statsModal) closeStatsModal(); });
}

function closeStatsModal() {
    statsModal.classList.add('hidden');
    _selectedDate = null;
    _calendarData = null;
    _allStats     = null;
    _calendarOpen = false;
}

async function openStatsModal() {
    statsModal.classList.remove('hidden');
    statsUsernameEl.textContent = state.currentUser;
    statsContent.innerHTML = '<div class="stats-loading">Loading your stats…</div>';

    try {
        const [stats, calData] = await Promise.all([
            api.getStats(),
            api.getCalendarDays()
        ]);
        _allStats     = stats;
        _calendarData = calData;

        const now = new Date();
        _calendarYear  = now.getFullYear();
        _calendarMonth = now.getMonth();
        _selectedDate  = null;
        _calendarOpen  = false;

        renderStatsModal(stats);
    } catch {
        statsContent.innerHTML = '<div class="stats-loading">Network error.</div>';
    }
}

// ─── Main render ──────────────────────────────────────────────────────────────

function renderStatsModal(s) {
    if (!s || s.tests_completed === 0) {
        statsContent.innerHTML = `
          <div class="stats-empty">
            <div class="stats-empty-icon">⌨️</div>
            <p>No tests yet! Complete a typing test to see your stats here.</p>
          </div>`;
        return;
    }

    const totalMin    = Math.floor((s.total_time_seconds || 0) / 60);
    const improvSign  = s.improvement >= 0 ? '+' : '';
    const improvColor = s.improvement >= 0 ? 'var(--accent)' : 'var(--error)';
    const wpmData     = s.wpm_history || [];
    const accData     = s.acc_history || [];

    statsContent.innerHTML = `
      <!-- ── Summary cards ── -->
      <div class="sm-grid">
        <div class="sm-card sm-card--accent">
          <div class="sm-card-label">Best WPM</div>
          <div class="sm-card-value">${s.best_wpm}</div>
        </div>
        <div class="sm-card">
          <div class="sm-card-label">Avg WPM</div>
          <div class="sm-card-value">${s.avg_wpm}</div>
        </div>
        <div class="sm-card">
          <div class="sm-card-label">Best Accuracy</div>
          <div class="sm-card-value">${s.best_accuracy ? s.best_accuracy.toFixed(1) + '%' : '—'}</div>
        </div>
        <div class="sm-card">
          <div class="sm-card-label">Avg Accuracy</div>
          <div class="sm-card-value">${s.avg_accuracy}%</div>
        </div>
        <div class="sm-card">
          <div class="sm-card-label">Tests Done</div>
          <div class="sm-card-value">${s.tests_completed}</div>
        </div>
        <div class="sm-card">
          <div class="sm-card-label">Avg Errors</div>
          <div class="sm-card-value">${s.avg_errors}</div>
        </div>
        <div class="sm-card">
          <div class="sm-card-label">Time Practiced</div>
          <div class="sm-card-value">${totalMin}<span class="sm-unit">min</span></div>
        </div>
        <div class="sm-card">
          <div class="sm-card-label">Improvement</div>
          <div class="sm-card-value" style="color:${improvColor}">${improvSign}${s.improvement}<span class="sm-unit">wpm</span></div>
        </div>
      </div>

      <!-- ── Sparklines ── -->
      ${wpmData.length > 1 ? `
      <div class="sm-chart-section">
        <div class="sm-chart-title">WPM over last ${wpmData.length} tests</div>
        <canvas id="wpmChart" class="sm-canvas"></canvas>
      </div>
      <div class="sm-chart-section">
        <div class="sm-chart-title">Accuracy over last ${accData.length} tests</div>
        <canvas id="accChart" class="sm-canvas"></canvas>
      </div>
      ` : ''}

      <!-- ── Calendar toggle button ── -->
      <div class="sm-cal-toggle-row">
        <button class="sm-cal-toggle-btn" id="calToggleBtn">
          📅 Activity Calendar
        </button>
      </div>

      <!-- ── Calendar panel (hidden by default) ── -->
      <div class="sm-calendar-section hidden" id="calendarSection">
        <div class="sm-calendar-header">
          <div class="sm-cal-nav">
            <button class="sm-cal-arrow" id="calPrev">‹</button>
            <span id="calMonthLabel" class="sm-cal-month-label"></span>
            <button class="sm-cal-arrow" id="calNext">›</button>
          </div>
        </div>
        <div id="calGrid" class="sm-cal-grid"></div>
      </div>

      <!-- ── Recent tests / day detail ── -->
      <div id="sm-day-detail" class="sm-history-section"></div>
    `;

    if (wpmData.length > 1) {
        drawLineChart('wpmChart', wpmData, 'var(--accent)');
        drawLineChart('accChart', accData, 'var(--caret)', true);
    }

    // Toggle button
    document.getElementById('calToggleBtn').addEventListener('click', () => {
        _calendarOpen = !_calendarOpen;
        const section = document.getElementById('calendarSection');
        const btn     = document.getElementById('calToggleBtn');
        section.classList.toggle('hidden', !_calendarOpen);
        btn.classList.toggle('sm-cal-toggle-btn--active', _calendarOpen);
        btn.textContent = _calendarOpen ? '📅 Activity Calendar ▲' : '📅 Activity Calendar';
        if (_calendarOpen) renderCalendar();
    });

    // Calendar nav
    document.getElementById('calPrev').addEventListener('click', () => {
        _calendarMonth--;
        if (_calendarMonth < 0) { _calendarMonth = 11; _calendarYear--; }
        renderCalendar();
    });
    document.getElementById('calNext').addEventListener('click', () => {
        _calendarMonth++;
        if (_calendarMonth > 11) { _calendarMonth = 0; _calendarYear++; }
        renderCalendar();
    });

    renderDayDetail(null);
}

// ─── Calendar grid ────────────────────────────────────────────────────────────

function renderCalendar() {
    const label = document.getElementById('calMonthLabel');
    const grid  = document.getElementById('calGrid');
    if (!label || !grid) return;

    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    label.textContent = `${monthNames[_calendarMonth]} ${_calendarYear}`;

    const activeDays = new Set();
    const dayInfoMap = {};
    if (_calendarData && _calendarData.days) {
        _calendarData.days.forEach(d => {
            activeDays.add(d.date);
            dayInfoMap[d.date] = d;
        });
    }

    const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let html = '<div class="sm-cal-dow-row">';
    dayLabels.forEach(d => { html += `<div class="sm-cal-dow">${d}</div>`; });
    html += '</div><div class="sm-cal-days">';

    const firstDay    = new Date(_calendarYear, _calendarMonth, 1).getDay();
    const daysInMonth = new Date(_calendarYear, _calendarMonth + 1, 0).getDate();
    const today       = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < firstDay; i++) {
        html += '<div class="sm-cal-cell sm-cal-empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr    = `${_calendarYear}-${String(_calendarMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const isActive   = activeDays.has(dateStr);
        const isSelected = _selectedDate === dateStr;
        const isToday    = dateStr === today;
        const info       = dayInfoMap[dateStr];
        const intensity  = info ? Math.min(info.count, 5) : 0;

        let cls = 'sm-cal-cell';
        if (isActive)   cls += ' sm-cal-active';
        if (isSelected) cls += ' sm-cal-selected';
        if (isToday)    cls += ' sm-cal-today';

        const tooltip = info
            ? `title="${info.count} test${info.count > 1 ? 's' : ''} · Best ${info.best_wpm} WPM · ${info.avg_acc.toFixed(1)}% acc"`
            : '';

        html += `<div class="${cls}" data-date="${dateStr}" ${tooltip} data-intensity="${intensity}">
          <span class="sm-cal-day-num">${day}</span>
          ${isActive ? `<span class="sm-cal-dot" style="--dot-intensity:${intensity}"></span>` : ''}
        </div>`;
    }

    html += '</div>';
    grid.innerHTML = html;

    grid.querySelectorAll('.sm-cal-cell:not(.sm-cal-empty)').forEach(cell => {
        cell.addEventListener('click', () => {
            const date = cell.dataset.date;
            if (_selectedDate === date) {
                _selectedDate = null;
                renderCalendar();
                renderDayDetail(null);
            } else {
                _selectedDate = date;
                renderCalendar();
                if (cell.classList.contains('sm-cal-active')) {
                    loadAndRenderDay(date);
                } else {
                    renderDayDetail(date, null, []);
                }
            }
        });
    });
}

// ─── Day detail panel ─────────────────────────────────────────────────────────

async function loadAndRenderDay(date) {
    const panel = document.getElementById('sm-day-detail');
    panel.innerHTML = '<div class="stats-loading">Loading…</div>';
    try {
        const data = await api.getDayStats(date);
        renderDayDetail(date, data.day_summary, data.day_results || []);
    } catch {
        panel.innerHTML = '<div class="stats-loading">Could not load day data.</div>';
    }
}

function renderDayDetail(date, summary, results) {
    const panel = document.getElementById('sm-day-detail');
    if (!panel) return;

    if (!date) {
        const recent = (_allStats && _allStats.recent_results) || [];
        panel.innerHTML = `
          <div class="sm-chart-title">Recent Tests <span class="sm-cal-clear-hint">${_calendarOpen ? '(click a highlighted day to filter)' : ''}</span></div>
          ${buildResultsTable(recent)}
        `;
        return;
    }

    const friendlyDate = new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const s = summary || {};
    panel.innerHTML = `
      <div class="sm-day-header">
        <div class="sm-chart-title">${friendlyDate}</div>
        <button class="sm-cal-clear-btn" id="clearDayFilter">✕ Show all</button>
      </div>
      ${s.count ? `
      <div class="sm-day-summary-row">
        <div class="sm-day-chip"><span class="sm-day-chip-label">Tests</span><span class="sm-day-chip-val">${s.count}</span></div>
        <div class="sm-day-chip"><span class="sm-day-chip-label">Best WPM</span><span class="sm-day-chip-val sm-chip-accent">${s.best_wpm}</span></div>
        <div class="sm-day-chip"><span class="sm-day-chip-label">Avg WPM</span><span class="sm-day-chip-val">${s.avg_wpm}</span></div>
        <div class="sm-day-chip"><span class="sm-day-chip-label">Avg Acc</span><span class="sm-day-chip-val">${s.avg_acc ? s.avg_acc.toFixed(1) + '%' : '—'}</span></div>
        <div class="sm-day-chip"><span class="sm-day-chip-label">Total Errors</span><span class="sm-day-chip-val sm-chip-err">${s.total_errors}</span></div>
      </div>
      ` : ''}
      <div class="sm-chart-title" style="margin-top:12px">Tests on this day</div>
      ${buildResultsTable(results)}
    `;

    document.getElementById('clearDayFilter').addEventListener('click', () => {
        _selectedDate = null;
        renderCalendar();
        renderDayDetail(null);
    });
}

function buildResultsTable(rows) {
    if (!rows || rows.length === 0) {
        return '<p class="sm-no-results">No tests found.</p>';
    }
    return `
      <div class="sm-table-wrap">
        <table class="sm-table">
          <thead><tr><th>WPM</th><th>Raw</th><th>Acc</th><th>Errors</th><th>Mode</th><th>Time</th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td class="td-wpm">${r.wpm}</td>
                <td class="td-muted">${r.raw_wpm ? Math.round(r.raw_wpm) : '—'}</td>
                <td class="${r.accuracy >= 97 ? 'td-good' : r.accuracy >= 90 ? 'td-ok' : 'td-bad'}">${r.accuracy ? r.accuracy.toFixed(1) + '%' : '—'}</td>
                <td class="td-muted">${r.errors}</td>
                <td class="td-muted">${r.mode} ${r.value}</td>
                <td class="td-muted">${r.client_time ? new Date(r.client_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
}

// ─── Sparkline chart ──────────────────────────────────────────────────────────

function drawLineChart(canvasId, data, color, isPercent = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth || 500;
    const H = 100;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = { t: 10, b: 20, l: 32, r: 10 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;
    const min = Math.max(0, Math.min(...data) - 5);
    const max = Math.max(...data) + 5;

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    [0, 0.5, 1].forEach(frac => {
        const y = pad.t + chartH * (1 - frac);
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + chartW, y); ctx.stroke();
        const val = isPercent ? (min + (max - min) * frac).toFixed(0) + '%' : Math.round(min + (max - min) * frac);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val, pad.l - 4, y + 3);
    });

    const pts = data.map((v, i) => ({
        x: pad.l + (i / (data.length - 1)) * chartW,
        y: pad.t + chartH * (1 - (v - min) / (max - min))
    }));

    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH);
    const stopColor = color.includes('caret') ? 'rgba(99,102,241,0.25)' : 'rgba(34,197,94,0.25)';
    grad.addColorStop(0, stopColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pad.t + chartH);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, pad.t + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}