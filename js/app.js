/* ================================================================
   WuWa 픽업 플래너 — 앱 로직
   ================================================================ */

const STORE_KEY = 'wuwa-planner-v1';

const defaultState = () => ({
  owned: {},            // charId -> true
  customChars: [],      // {id, name, rarity, element, group}
  schedules: [],        // {id, charId, name, start, end, saved, goal, memo}
  parties: [{ id: uid(), name: '파티 1', members: [null, null, null] }],
  records: [],          // {id, season, type, charId, weaponName, copy, pulls, lost}
  contents: JSON.parse(JSON.stringify(CONTENT_DEFAULTS)), // 탑/해역/매트릭스 로테이션
  matOverrides: {},     // charId -> {forge, drop, weekly}
});

let state = loadState();

function uid() {
  return 'id' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    return Object.assign(defaultState(), s);
  } catch {
    return defaultState();
  }
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

/* ---------------- 공통 헬퍼 ---------------- */

function allChars() {
  return CHARACTERS.concat(state.customChars);
}

function charById(id) {
  return allChars().find(c => c.id === id) || null;
}

function isOwned(id) {
  return !!state.owned[id];
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]));
}

function avatarHTML(char, { small = false, gray = false } = {}) {
  const el = ELEMENTS[char.element] || { name: '?', color: '#888' };
  const initial = char.name.slice(0, 2);
  const cls = ['avatar', small ? 'small' : '', char.rarity === 5 ? 'r5' : '', gray ? 'gray' : ''].join(' ');
  return `<span class="${cls}" style="--el:${el.color}" title="${esc(char.name)} · ${el.name} ${char.rarity}성">${esc(initial)}<span class="el-dot"></span></span>`;
}

let toastTimer = null;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function fmtDate(d) {
  return d ? d.replaceAll('-', '.') : '';
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ---------------- 탭 ---------------- */

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
  window.scrollTo({ top: 0 });
}

document.getElementById('tabs').addEventListener('click', e => {
  const btn = e.target.closest('.tab-btn');
  if (btn) switchTab(btn.dataset.tab);
});
document.getElementById('goto-roster').addEventListener('click', () => switchTab('roster'));

/* ================================================================
   1. 픽업 일정
   ================================================================ */

function scheduleStatus(s) {
  const t = today();
  if (s.start <= t && t <= s.end) return 'ongoing';
  if (s.start > t) return 'upcoming';
  return 'past';
}

function dday(s) {
  const t = new Date(today());
  const status = scheduleStatus(s);
  const target = new Date(status === 'upcoming' ? s.start : s.end);
  const diff = Math.round((target - t) / 86400000);
  if (status === 'ongoing') return diff === 0 ? '오늘 종료!' : `종료까지 D-${diff}`;
  if (status === 'upcoming') return diff === 0 ? '오늘 시작!' : `시작까지 D-${diff}`;
  return '종료됨';
}

function renderSchedules() {
  const wrap = document.getElementById('schedule-list');
  const order = { ongoing: 0, upcoming: 1, past: 2 };
  const list = [...state.schedules].sort((a, b) => {
    const d = order[scheduleStatus(a)] - order[scheduleStatus(b)];
    if (d !== 0) return d;
    return a.start.localeCompare(b.start);
  });

  if (!list.length) {
    wrap.innerHTML = `<div class="empty-note">아직 등록된 픽업 일정이 없어요. [+ 일정 추가]로 뽑을 캐릭터의 픽업 계획을 세워보세요!</div>`;
    return;
  }

  wrap.innerHTML = list.map(s => {
    const ch = charById(s.charId);
    const status = scheduleStatus(s);
    const badge = status === 'ongoing' ? '<span class="badge live">진행 중</span>'
      : status === 'upcoming' ? '<span class="badge soon">예정</span>'
      : '<span class="badge done-b">종료</span>';
    const saved = Math.max(0, +s.saved || 0);
    const pct = Math.min(100, saved / GACHA.CHAR_MAX * 100);
    const halfPct = GACHA.HARD / GACHA.CHAR_MAX * 100;
    return `
    <div class="schedule-card ${status}">
      ${ch ? avatarHTML(ch) : ''}
      <div class="info">
        <div class="schedule-title">
          ${esc(ch ? ch.name : '?')} 픽업 ${badge}
          <span class="badge">목표: ${esc(s.goal)}</span>
        </div>
        <div class="schedule-meta">${esc(s.name || '')}${s.name ? ' · ' : ''}${fmtDate(s.start)} ~ ${fmtDate(s.end)} · <b>${dday(s)}</b></div>
        <div class="gauge-wrap">
          <div class="gauge-label"><span>모아둔 뽑기</span><b>${saved} / ${GACHA.CHAR_MAX}뽑</b></div>
          <div class="gauge">
            <div class="fill" style="width:${pct}%"></div>
            <div class="mark half" style="left:${halfPct}%" title="반천장 80뽑"></div>
            <div class="mark" style="left:100%;margin-left:-2px" title="천장 160뽑"></div>
          </div>
          <div class="gauge-legend">
            <span><span class="k" style="background:var(--ink-2)"></span>반천장 80뽑 (픽뚫 가능)</span>
            <span><span class="k" style="background:var(--accent)"></span>천장 160뽑 (확정)</span>
          </div>
        </div>
        ${s.memo ? `<div class="schedule-memo">${esc(s.memo)}</div>` : ''}
      </div>
      <div class="schedule-actions">
        <button class="icon-btn" data-edit-schedule="${s.id}">수정</button>
        <button class="icon-btn danger-btn" data-del-schedule="${s.id}">삭제</button>
      </div>
    </div>`;
  }).join('');
}

document.getElementById('schedule-list').addEventListener('click', e => {
  const editBtn = e.target.closest('[data-edit-schedule]');
  const delBtn = e.target.closest('[data-del-schedule]');
  if (editBtn) openScheduleModal(editBtn.dataset.editSchedule);
  if (delBtn) {
    state.schedules = state.schedules.filter(s => s.id !== delBtn.dataset.delSchedule);
    save(); renderSchedules(); toast('일정을 삭제했어요');
  }
});

let editingScheduleId = null;

function openScheduleModal(id = null) {
  editingScheduleId = id;
  const modal = document.getElementById('schedule-modal');
  const sel = document.getElementById('sch-char');
  const fives = allChars().filter(c => c.rarity === 5 && c.group !== 'standard');
  sel.innerHTML = fives.map(c => `<option value="${c.id}">${esc(c.name)}${c.ver ? ` (${c.ver})` : ''}</option>`).join('');

  const s = id ? state.schedules.find(x => x.id === id) : null;
  document.getElementById('schedule-modal-title').textContent = s ? '픽업 일정 수정' : '픽업 일정 추가';
  sel.value = s ? s.charId : fives[fives.length - 1].id;
  document.getElementById('sch-name').value = s ? s.name : '';
  document.getElementById('sch-start').value = s ? s.start : today();
  document.getElementById('sch-end').value = s ? s.end : '';
  document.getElementById('sch-saved').value = s ? s.saved : 0;
  document.getElementById('sch-goal').value = s ? s.goal : '명함';
  document.getElementById('sch-memo').value = s ? s.memo : '';
  modal.showModal();
}

document.getElementById('add-schedule-btn').addEventListener('click', () => openScheduleModal());

document.getElementById('schedule-form').addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    charId: document.getElementById('sch-char').value,
    name: document.getElementById('sch-name').value.trim(),
    start: document.getElementById('sch-start').value,
    end: document.getElementById('sch-end').value,
    saved: Math.max(0, +document.getElementById('sch-saved').value || 0),
    goal: document.getElementById('sch-goal').value,
    memo: document.getElementById('sch-memo').value.trim(),
  };
  if (!data.start || !data.end) { toast('시작일과 종료일을 입력해주세요'); return; }
  if (data.end < data.start) { toast('종료일이 시작일보다 빠를 수 없어요'); return; }
  if (editingScheduleId) {
    Object.assign(state.schedules.find(s => s.id === editingScheduleId), data);
  } else {
    state.schedules.push(Object.assign({ id: uid() }, data));
  }
  save(); renderSchedules();
  document.getElementById('schedule-modal').close();
  toast('픽업 일정을 저장했어요');
});

/* ================================================================
   2. 파티 편성 (드래그 & 드롭)
   ================================================================ */

function renderRosterStrip() {
  const strip = document.getElementById('roster-strip');
  const owned = allChars().filter(c => isOwned(c.id));
  if (!owned.length) {
    strip.innerHTML = `<div class="empty-note" style="border:none;width:100%">보유 캐릭터가 없어요. [보유 캐릭터] 탭에서 캐릭터를 클릭해 등록해 주세요.</div>`;
    return;
  }
  strip.innerHTML = owned.map(c => `
    <div class="roster-chip" draggable="true" data-drag-char="${c.id}">
      ${avatarHTML(c)}
      <span class="nm">${esc(c.name)}</span>
    </div>`).join('');
}

function renderParties() {
  const wrap = document.getElementById('party-list');
  if (!state.parties.length) {
    wrap.innerHTML = `<div class="empty-note">파티가 없어요. [+ 파티 추가]로 새 파티를 만들어 보세요.</div>`;
    return;
  }
  wrap.innerHTML = state.parties.map(p => `
    <div class="party-card" data-party="${p.id}">
      <div class="party-head">
        <input class="party-name" value="${esc(p.name)}" maxlength="16" data-party-name="${p.id}">
        <button class="icon-btn danger-btn" data-del-party="${p.id}" title="파티 삭제">✕</button>
      </div>
      <div class="party-slots">
        ${p.members.map((m, i) => {
          const ch = m ? charById(m) : null;
          if (ch) {
            return `<div class="party-slot filled" draggable="true" data-slot data-party-id="${p.id}" data-idx="${i}" data-drag-char="${ch.id}">
              ${avatarHTML(ch)}
              <span class="nm">${esc(ch.name)}</span>
              <button class="slot-remove" data-remove-member title="빼기">✕</button>
            </div>`;
          }
          return `<div class="party-slot" data-slot data-party-id="${p.id}" data-idx="${i}">
            <span class="plus">＋</span><span>클릭 또는<br>드래그로 추가</span>
          </div>`;
        }).join('')}
      </div>
    </div>`).join('');
}

document.getElementById('add-party-btn').addEventListener('click', () => {
  state.parties.push({ id: uid(), name: `파티 ${state.parties.length + 1}`, members: [null, null, null] });
  save(); renderParties();
});

const partyList = document.getElementById('party-list');

partyList.addEventListener('click', e => {
  const del = e.target.closest('[data-del-party]');
  if (del) {
    state.parties = state.parties.filter(p => p.id !== del.dataset.delParty);
    save(); renderParties();
    return;
  }
  const rm = e.target.closest('[data-remove-member]');
  if (rm) {
    const slot = rm.closest('[data-slot]');
    setMember(slot.dataset.partyId, +slot.dataset.idx, null);
    return;
  }
  const slot = e.target.closest('[data-slot]');
  if (slot && !slot.classList.contains('filled')) {
    openPicker(slot.dataset.partyId, +slot.dataset.idx);
  }
});

partyList.addEventListener('change', e => {
  const input = e.target.closest('[data-party-name]');
  if (input) {
    const p = state.parties.find(x => x.id === input.dataset.partyName);
    p.name = input.value.trim() || p.name;
    save();
  }
});

function setMember(partyId, idx, charId, { silent = false } = {}) {
  const p = state.parties.find(x => x.id === partyId);
  if (!p) return false;
  if (charId && p.members.includes(charId) && p.members[idx] !== charId) {
    if (!silent) toast('이미 이 파티에 있는 캐릭터예요');
    return false;
  }
  p.members[idx] = charId;
  save(); renderParties();
  return true;
}

/* ----- 드래그 & 드롭 ----- */

let dragData = null; // {charId, fromParty, fromIdx}

document.addEventListener('dragstart', e => {
  const el = e.target.closest('[data-drag-char]');
  if (!el) return;
  dragData = {
    charId: el.dataset.dragChar,
    fromParty: el.dataset.partyId || null,
    fromIdx: el.dataset.idx != null ? +el.dataset.idx : null,
  };
  e.dataTransfer.setData('text/plain', el.dataset.dragChar);
  e.dataTransfer.effectAllowed = 'move';
});

document.addEventListener('dragover', e => {
  const slot = e.target.closest('[data-slot]');
  if (slot && dragData) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    slot.classList.add('drag-over');
  }
});

document.addEventListener('dragleave', e => {
  const slot = e.target.closest('[data-slot]');
  if (slot) slot.classList.remove('drag-over');
});

document.addEventListener('drop', e => {
  const slot = e.target.closest('[data-slot]');
  if (!slot || !dragData) return;
  e.preventDefault();
  slot.classList.remove('drag-over');

  const toParty = slot.dataset.partyId;
  const toIdx = +slot.dataset.idx;
  const { charId, fromParty, fromIdx } = dragData;
  dragData = null;

  const pTo = state.parties.find(x => x.id === toParty);
  if (!pTo) return;

  // 같은 슬롯이면 무시
  if (fromParty === toParty && fromIdx === toIdx) return;

  const displaced = pTo.members[toIdx]; // 대상 슬롯에 있던 캐릭터

  if (fromParty) {
    // 파티 내/파티 간 이동: 스왑 처리
    const pFrom = state.parties.find(x => x.id === fromParty);
    if (!pFrom) return;
    if (fromParty === toParty) {
      pTo.members[fromIdx] = displaced ?? null;
      pTo.members[toIdx] = charId;
    } else {
      if (pTo.members.includes(charId)) { toast('이미 이 파티에 있는 캐릭터예요'); return; }
      if (displaced && pFrom.members.includes(displaced) && displaced !== charId) { /* 스왑 검사 */ }
      pFrom.members[fromIdx] = displaced ?? null;
      pTo.members[toIdx] = charId;
    }
    save(); renderParties();
  } else {
    // 로스터에서 추가
    setMember(toParty, toIdx, charId);
  }
});

/* ----- 클릭으로 추가 (모달 피커) ----- */

let pickerTarget = null;

function openPicker(partyId, idx) {
  pickerTarget = { partyId, idx };
  const party = state.parties.find(p => p.id === partyId);
  const grid = document.getElementById('picker-grid');
  const chars = allChars();
  const owned = chars.filter(c => isOwned(c.id));
  const unowned = chars.filter(c => !isOwned(c.id));
  const cell = (c, disabled) => `
    <button class="picker-cell" data-pick="${c.id}" ${disabled ? 'disabled' : ''}>
      ${avatarHTML(c, { small: false, gray: disabled })}
      <span class="nm">${esc(c.name)}</span>
    </button>`;
  grid.innerHTML =
    owned.map(c => cell(c, party.members.includes(c.id))).join('') +
    unowned.map(c => cell(c, true)).join('');
  document.getElementById('picker-modal').showModal();
}

document.getElementById('picker-grid').addEventListener('click', e => {
  const btn = e.target.closest('[data-pick]');
  if (!btn || !pickerTarget) return;
  if (setMember(pickerTarget.partyId, pickerTarget.idx, btn.dataset.pick)) {
    document.getElementById('picker-modal').close();
  }
});

/* ================================================================
   3. 보유 캐릭터
   ================================================================ */

let rosterFilter = 'all';

function renderRoster() {
  const grid = document.getElementById('roster-grid');
  const chars = allChars();
  const groups = [
    { key: 'limited', title: '한정 5성' },
    { key: 'standard', title: '상시 5성' },
    { key: 'four', title: '4성' },
  ];

  const matches = c =>
    rosterFilter === 'all' ? true :
    rosterFilter === 'owned' ? isOwned(c.id) :
    c.group === rosterFilter;

  grid.innerHTML = groups.map(g => {
    const list = chars.filter(c => c.group === g.key && matches(c));
    if (!list.length) return '';
    return `<div class="group-title">${g.title}</div>
      <div class="char-grid">${list.map(c => `
        <div class="char-cell ${isOwned(c.id) ? 'owned' : ''}" data-toggle-own="${c.id}">
          ${avatarHTML(c, { gray: !isOwned(c.id) })}
          <span class="nm">${esc(c.name)}</span>
          <span class="tag">${ELEMENTS[c.element]?.name ?? ''}${c.ver ? ' · ' + c.ver : ''}</span>
          <span class="owned-check">✔ 보유</span>
        </div>`).join('')}
      </div>`;
  }).join('') || `<div class="empty-note">조건에 맞는 캐릭터가 없어요.</div>`;

  const total = chars.length;
  const ownedN = chars.filter(c => isOwned(c.id)).length;
  document.getElementById('own-summary').textContent =
    `보유 ${ownedN} / ${total} — 클릭하면 보유 상태가 토글됩니다.`;
}

document.getElementById('roster-grid').addEventListener('click', e => {
  const cell = e.target.closest('[data-toggle-own]');
  if (!cell) return;
  const id = cell.dataset.toggleOwn;
  if (isOwned(id)) {
    delete state.owned[id];
    // 파티에서도 제거
    state.parties.forEach(p => {
      p.members = p.members.map(m => (m === id ? null : m));
    });
  } else {
    state.owned[id] = true;
  }
  save(); renderRoster(); renderRosterStrip(); renderParties();
});

document.getElementById('roster-filter').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  rosterFilter = chip.dataset.filter;
  document.querySelectorAll('#roster-filter .chip').forEach(c => c.classList.toggle('active', c === chip));
  renderRoster();
});

/* ----- 커스텀 캐릭터 ----- */

document.getElementById('add-custom-btn').addEventListener('click', () => {
  document.getElementById('custom-form').reset();
  document.getElementById('custom-modal').showModal();
});

document.getElementById('custom-form').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('cus-name').value.trim();
  if (!name) return;
  const rarity = +document.getElementById('cus-rarity').value;
  state.customChars.push({
    id: uid(),
    name,
    rarity,
    element: document.getElementById('cus-element').value,
    group: rarity === 5 ? 'limited' : 'four',
  });
  save(); renderRoster(); renderRosterStrip();
  document.getElementById('custom-modal').close();
  toast(`${name} 캐릭터를 추가했어요`);
});

/* ================================================================
   4. 픽업 기록
   ================================================================ */

function renderBannerTable() {
  const tbl = document.getElementById('banner-table');
  tbl.innerHTML = `
    <tr><th>버전</th><th>배너</th><th>캐릭터</th><th>속성</th><th>기간 (대략)</th></tr>
    ${BANNERS.map(b => {
      const c = charById(b.charId);
      return `<tr>
        <td>${b.ver}</td>
        <td>${esc(b.name)}</td>
        <td class="cname"><span class="cname">${esc(c ? c.name : '?')}</span></td>
        <td>${c ? ELEMENTS[c.element].name : ''}</td>
        <td>${fmtDate(b.start)} ~ ${fmtDate(b.end)}</td>
      </tr>`;
    }).join('')}`;
}

const CHAR_PMF = charPickupPmf();
const WEAPON_PMF = weaponPickupPmf();

function recordLuck(r) {
  const pmf = r.type === 'weapon' ? WEAPON_PMF : CHAR_PMF;
  return luckTopPercent(r.pulls, pmf);
}

function renderRecords() {
  const wrap = document.getElementById('record-list');
  const stats = document.getElementById('record-stats');
  const recs = state.records;

  if (!recs.length) {
    wrap.innerHTML = `<div class="empty-note">아직 뽑기 기록이 없어요. [+ 기록 추가]로 첫 픽업 결과를 기록해 보세요!</div>`;
    stats.innerHTML = '';
    renderSeasons();
    return;
  }

  // 통계 타일
  const totalPulls = recs.reduce((a, r) => a + r.pulls, 0);
  const avgLuck = recs.reduce((a, r) => a + recordLuck(r), 0) / recs.length;
  const grade = luckGrade(avgLuck);
  const charRecs = recs.filter(r => r.type === 'char');
  const weaponRecs = recs.filter(r => r.type === 'weapon');
  stats.innerHTML = `
    <div class="stat-tile"><div class="lbl">총 소모 뽑기</div><div class="val">${totalPulls.toLocaleString()}뽑</div><div class="sub">약 ${(totalPulls * 160).toLocaleString()} 성운의 조각</div></div>
    <div class="stat-tile"><div class="lbl">획득 기록</div><div class="val">${recs.length}건</div><div class="sub">캐릭터 ${charRecs.length} · 전무 ${weaponRecs.length}</div></div>
    <div class="stat-tile"><div class="lbl">평균 운 (상위 %)</div><div class="val">${avgLuck.toFixed(1)}%</div><div class="sub"><span class="${grade.cls}"><span class="grade">${grade.label}</span></span></div></div>
    <div class="stat-tile"><div class="lbl">픽뚫 횟수</div><div class="val">${charRecs.filter(r => r.lost).length}회</div><div class="sub">캐릭터 기록 기준</div></div>`;

  // 기록 목록 (최신순)
  wrap.innerHTML = [...recs].reverse().map(r => {
    const top = recordLuck(r);
    const g = luckGrade(top);
    const ch = r.type === 'char' ? charById(r.charId) : null;
    const nameHtml = r.type === 'char'
      ? `${esc(ch ? ch.name : '?')} <span class="pill copy">${COPY_LABELS[r.copy] ?? '명함'}</span>${r.lost ? '<span class="pill lost">픽뚫</span>' : ''}`
      : `${esc(r.weaponName || '전무')} <span class="pill weapon">전무 ${WEAPON_COPY_LABELS[r.copy] ?? ''}</span>`;
    return `
    <div class="record-row">
      ${ch ? avatarHTML(ch, { small: true }) : `<span class="avatar small" style="--el:#7db3f0">武</span>`}
      <div class="what">
        <div class="title">${nameHtml}</div>
        <div class="meta">${esc(r.season)} · ${r.pulls}뽑 소모</div>
      </div>
      <div class="luck-badge ${g.cls}">
        <span class="pct">상위 ${top.toFixed(1)}%</span>
        <span class="grade">${g.label}</span>
      </div>
      <button class="record-del" data-del-record="${r.id}" title="기록 삭제">✕</button>
    </div>`;
  }).join('');

  renderSeasons();
}

function renderSeasons() {
  const wrap = document.getElementById('season-list');
  const recs = state.records;
  if (!recs.length) {
    wrap.innerHTML = `<div class="empty-note">기록을 추가하면 시즌별 운 통계가 표시돼요.</div>`;
    return;
  }
  const bySeason = new Map();
  recs.forEach(r => {
    if (!bySeason.has(r.season)) bySeason.set(r.season, []);
    bySeason.get(r.season).push(r);
  });
  wrap.innerHTML = [...bySeason.entries()].map(([season, list]) => {
    const avg = list.reduce((a, r) => a + recordLuck(r), 0) / list.length;
    const g = luckGrade(avg);
    const pulls = list.reduce((a, r) => a + r.pulls, 0);
    const score = 100 - avg; // 막대: 길수록 운이 좋음
    return `
    <div class="season-row">
      <div class="top">
        <b>${esc(season)}</b>
        <span class="r">${list.length}건 · ${pulls}뽑 · <span class="${g.cls}"><span class="grade">평균 상위 ${avg.toFixed(1)}% (${g.label})</span></span></span>
      </div>
      <div class="luck-bar"><div class="fill" style="width:${score.toFixed(1)}%"></div></div>
      <div class="luck-bar-lbl">운 지수 ${score.toFixed(1)} / 100 (100에 가까울수록 행운)</div>
    </div>`;
  }).join('');
}

document.getElementById('record-list').addEventListener('click', e => {
  const del = e.target.closest('[data-del-record]');
  if (!del) return;
  state.records = state.records.filter(r => r.id !== del.dataset.delRecord);
  save(); renderRecords(); toast('기록을 삭제했어요');
});

/* ----- 기록 추가 모달 ----- */

function refreshRecordFormOptions() {
  const bannerSel = document.getElementById('rec-banner');
  const opts = [...BANNERS].reverse().map(b => `<option value="${esc(b.name)}">${b.ver} · ${esc(b.name)}</option>`);
  const scheduleOpts = state.schedules.map(s => {
    const c = charById(s.charId);
    const label = s.name || `${c ? c.name : '?'} 픽업`;
    return `<option value="${esc(label)}">내 일정 · ${esc(label)}</option>`;
  });
  bannerSel.innerHTML =
    scheduleOpts.join('') + opts.join('') +
    `<option value="__custom__">직접 입력...</option>`;

  const charSel = document.getElementById('rec-char');
  const fives = allChars().filter(c => c.rarity === 5);
  charSel.innerHTML = fives.map(c => `<option value="${c.id}">${esc(c.name)}${c.group === 'standard' ? ' (상시)' : ''}</option>`).join('');
}

function refreshCopyOptions() {
  const type = document.getElementById('rec-type').value;
  const copySel = document.getElementById('rec-copy');
  const labels = type === 'weapon' ? WEAPON_COPY_LABELS : COPY_LABELS;
  copySel.innerHTML = labels.map((l, i) => `<option value="${i}">${l}</option>`).join('');
  document.getElementById('rec-char-row').hidden = type === 'weapon';
  document.getElementById('rec-weapon-row').hidden = type !== 'weapon';
  document.getElementById('rec-lost-row').style.display = type === 'weapon' ? 'none' : '';
  document.getElementById('rec-pulls').max = type === 'weapon' ? GACHA.WEAPON_MAX : GACHA.CHAR_MAX;
}

document.getElementById('rec-type').addEventListener('change', refreshCopyOptions);

document.getElementById('rec-banner').addEventListener('change', e => {
  document.getElementById('rec-banner-custom-row').hidden = e.target.value !== '__custom__';
});

document.getElementById('add-record-btn').addEventListener('click', () => {
  refreshRecordFormOptions();
  refreshCopyOptions();
  document.getElementById('record-form').reset();
  refreshCopyOptions();
  document.getElementById('rec-banner-custom-row').hidden = true;
  document.getElementById('record-modal').showModal();
});

document.getElementById('record-form').addEventListener('submit', e => {
  e.preventDefault();
  const type = document.getElementById('rec-type').value;
  let season = document.getElementById('rec-banner').value;
  if (season === '__custom__') {
    season = document.getElementById('rec-banner-custom').value.trim();
    if (!season) { toast('시즌 이름을 입력해주세요'); return; }
  }
  const pulls = +document.getElementById('rec-pulls').value;
  const maxP = type === 'weapon' ? GACHA.WEAPON_MAX : GACHA.CHAR_MAX;
  if (!pulls || pulls < 1 || pulls > maxP) {
    toast(`뽑기 수는 1~${maxP} 사이여야 해요 (천장 ${maxP}뽑)`);
    return;
  }
  const rec = {
    id: uid(),
    season,
    type,
    copy: +document.getElementById('rec-copy').value,
    pulls,
    lost: type === 'char' && document.getElementById('rec-lost').checked,
  };
  if (type === 'char') {
    rec.charId = document.getElementById('rec-char').value;
    // 기록한 캐릭터는 자동으로 보유 처리
    if (!isOwned(rec.charId)) {
      state.owned[rec.charId] = true;
      renderRoster(); renderRosterStrip();
    }
  } else {
    rec.weaponName = document.getElementById('rec-weapon-name').value.trim() || '픽업 전무';
  }
  state.records.push(rec);
  save(); renderRecords();
  document.getElementById('record-modal').close();
  const top = recordLuck(rec);
  toast(`기록 완료! 이번 뽑기는 상위 ${top.toFixed(1)}%의 운이었어요`);
});

/* ================================================================
   4.5 엔드 컨텐츠 (탑 / 해역 / 매트릭스)
   ================================================================ */

// 이번 주기의 시작일·리셋일 계산 (start를 기준으로 period일마다 반복)
function cycleInfo(c) {
  const t = new Date(today());
  const start = new Date(c.start);
  const period = Math.max(1, +c.period || 1);
  const dayMs = 86400000;
  let cycleStart;
  if (t < start) {
    cycleStart = start; // 아직 첫 주기 전 — 시작일까지 카운트
    return { next: start, left: Math.round((start - t) / dayMs), progress: 0, upcoming: true };
  }
  const elapsed = Math.floor((t - start) / dayMs);
  const into = elapsed % period;
  cycleStart = new Date(start.getTime() + (elapsed - into) * dayMs);
  const next = new Date(cycleStart.getTime() + period * dayMs);
  return { next, left: period - into, progress: into / period, upcoming: false };
}

function fmtShort(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function renderContents() {
  const grid = document.getElementById('content-grid');
  grid.innerHTML = state.contents.map(c => {
    const info = cycleInfo(c);
    const stages = (c.stages || []).map(s => `
      <div class="stage-row">
        <span class="sn">${esc(s.name)}</span>
        <span class="mobs">${s.mobs.split(',').map(m => m.trim()).filter(Boolean)
          .map(m => `<span class="mob-chip">${esc(m)}</span>`).join('')}</span>
      </div>`).join('');
    return `
    <div class="content-card">
      <div class="content-head">
        <span class="ct-icon">${c.icon || '📌'}</span>
        <div class="t">
          <b>${esc(c.name)}</b>
          <small>${c.period}일 주기 · 이번 주기 ${fmtShort(new Date(new Date(info.next).getTime() - c.period * 86400000))} ~ ${fmtShort(new Date(info.next))}</small>
        </div>
        <button class="icon-btn" data-edit-content="${c.id}">수정</button>
      </div>
      <div class="reset-badge">
        <div class="dd ${info.left <= 3 ? 'soon-reset' : ''}">${info.upcoming ? '시작까지' : '리셋까지'} D-${info.left}</div>
        <div class="sub">${fmtShort(new Date(info.next))} 리셋</div>
        <div class="reset-bar"><div class="fill" style="width:${(info.progress * 100).toFixed(1)}%"></div></div>
      </div>
      <div class="ct-block">
        <h4>✨ 이번 주기 버프</h4>
        <div class="ct-buff">${esc(c.buff || '버프 미입력')}</div>
      </div>
      <div class="ct-block">
        <h4>👹 등장 몹</h4>
        ${stages || '<div class="empty-note" style="padding:14px">단계를 추가해 주세요</div>'}
      </div>
    </div>`;
  }).join('');
}

let editingContentId = null;

document.getElementById('content-grid').addEventListener('click', e => {
  const btn = e.target.closest('[data-edit-content]');
  if (!btn) return;
  editingContentId = btn.dataset.editContent;
  const c = state.contents.find(x => x.id === editingContentId);
  document.getElementById('content-modal-title').textContent = `${c.name} — 정보 수정`;
  document.getElementById('ct-name').value = c.name;
  document.getElementById('ct-start').value = c.start;
  document.getElementById('ct-period').value = c.period;
  document.getElementById('ct-buff').value = c.buff || '';
  document.getElementById('ct-stages').value = (c.stages || []).map(s => `${s.name}: ${s.mobs}`).join('\n');
  document.getElementById('content-modal').showModal();
});

document.getElementById('content-form').addEventListener('submit', e => {
  e.preventDefault();
  const c = state.contents.find(x => x.id === editingContentId);
  if (!c) return;
  c.name = document.getElementById('ct-name').value.trim() || c.name;
  c.start = document.getElementById('ct-start').value;
  c.period = Math.max(1, +document.getElementById('ct-period').value || c.period);
  c.buff = document.getElementById('ct-buff').value.trim();
  c.stages = document.getElementById('ct-stages').value.split('\n')
    .map(line => line.trim()).filter(Boolean)
    .map(line => {
      const i = line.indexOf(':');
      return i === -1
        ? { name: '단계', mobs: line }
        : { name: line.slice(0, i).trim(), mobs: line.slice(i + 1).trim() };
    });
  save(); renderContents();
  document.getElementById('content-modal').close();
  toast('컨텐츠 정보를 저장했어요');
});

/* ================================================================
   4.6 캐릭터별 스킬 재료
   ================================================================ */

let selectedMatChar = null;

// 캐릭터의 재료 구성 (기본값 + 사용자 수정 병합)
function charMats(c) {
  const ov = state.matOverrides[c.id] || {};
  const forge = ov.forge || WEAPON_FORGE[c.weapon] || 'cadence';
  const isRinascita = c.ver && parseFloat(c.ver) >= 2.0;
  const drop = ov.drop || (isRinascita ? 'polygon' : 'whisperin');
  const weekly = ov.weekly || '';
  return { forge, drop, weekly };
}

function renderMatStrip() {
  const strip = document.getElementById('mat-char-strip');
  strip.innerHTML = allChars().map(c => `
    <button class="mat-char ${selectedMatChar === c.id ? 'selected' : ''}" data-mat-char="${c.id}">
      ${avatarHTML(c, { small: true })}
      <span class="nm">${esc(c.name)}</span>
    </button>`).join('');
}

function renderMatDetail() {
  const wrap = document.getElementById('mat-detail');
  const c = selectedMatChar ? charById(selectedMatChar) : null;
  if (!c) {
    wrap.innerHTML = `<div class="empty-note mat-empty">위에서 캐릭터를 선택하면 스킬(포르테) 육성 재료가 표시돼요.</div>`;
    return;
  }
  const m = charMats(c);
  const forgeFam = FORGE_FAMILIES[m.forge];
  const dropFam = DROP_FAMILIES[m.drop];
  const tierRow = (label, i, cnt) => `
    <div class="mat-row">
      <span class="tier-dot" style="background:${TIER_COLORS[i]}">T${i + 1}</span>
      <span class="mn">${esc(label)}</span>
      <span class="cnt">×${cnt}</span>
    </div>`;
  wrap.innerHTML = `
  <div class="mat-detail-card">
    <div class="mat-detail-head">
      ${avatarHTML(c)}
      <div class="who">
        <b>${esc(c.name)}</b>
        <div class="chips">
          <span class="pill">${ELEMENTS[c.element]?.name ?? '?'}</span>
          <span class="pill">${WEAPONS[c.weapon] ?? '무기 미지정'}</span>
          <span class="pill copy">${c.rarity}성</span>
          ${c.ver ? `<span class="pill">Ver ${c.ver}</span>` : ''}
        </div>
      </div>
      <button class="ghost-btn" id="edit-mats-btn">재료 수정</button>
    </div>
    <div class="mat-section">
      <h4>🔨 포지 재료 — ${esc(forgeFam.name)} 계열</h4>
      <div class="mat-rows">${forgeFam.tiers.map((t, i) => tierRow(t, i, FORTE_TOTALS.forge[i])).join('')}</div>
    </div>
    <div class="mat-section">
      <h4>👹 일반 몹 드랍 — ${esc(dropFam.name)} 계열</h4>
      <div class="mat-rows">${dropFam.tiers.map((t, i) => tierRow(t, i, FORTE_TOTALS.drop[i])).join('')}</div>
    </div>
    <div class="mat-section">
      <h4>🗓 주간 보스 & 기타</h4>
      <div class="mat-rows">
        <div class="mat-row">
          <span class="tier-dot" style="background:${TIER_COLORS[3]}">주간</span>
          <span class="mn">${m.weekly ? esc(m.weekly) : '<i>미입력 — [재료 수정]에서 입력</i>'}</span>
          <span class="cnt">×${FORTE_TOTALS.weekly}</span>
        </div>
        <div class="mat-row">
          <span class="tier-dot" style="background:#8f8d85">💰</span>
          <span class="mn">쉘 크레딧</span>
          <span class="cnt">${FORTE_TOTALS.credits}</span>
        </div>
      </div>
    </div>
    <p class="mat-note">※ 수량은 포르테 트리 풀업(스킬 5종 Lv.10 + 스탯 노드) 기준 근사치입니다. 재료 종류 기본값은 무기 타입 기반 추정이므로 게임과 다르면 [재료 수정]으로 바꿔주세요.</p>
  </div>`;

  document.getElementById('edit-mats-btn').addEventListener('click', () => openMatModal(c));
}

document.getElementById('mat-char-strip').addEventListener('click', e => {
  const btn = e.target.closest('[data-mat-char]');
  if (!btn) return;
  selectedMatChar = btn.dataset.matChar;
  renderMatStrip(); renderMatDetail();
});

function openMatModal(c) {
  const m = charMats(c);
  document.getElementById('mat-modal-title').textContent = `${c.name} — 스킬 재료 수정`;
  document.getElementById('mat-forge').innerHTML = Object.entries(FORGE_FAMILIES)
    .map(([k, f]) => `<option value="${k}" ${k === m.forge ? 'selected' : ''}>${f.name} (${f.tiers[0]} 계열)</option>`).join('');
  document.getElementById('mat-drop').innerHTML = Object.entries(DROP_FAMILIES)
    .map(([k, f]) => `<option value="${k}" ${k === m.drop ? 'selected' : ''}>${f.name}</option>`).join('');
  document.getElementById('mat-weekly').value = m.weekly;
  document.getElementById('mat-modal').showModal();
}

document.getElementById('mat-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!selectedMatChar) return;
  state.matOverrides[selectedMatChar] = {
    forge: document.getElementById('mat-forge').value,
    drop: document.getElementById('mat-drop').value,
    weekly: document.getElementById('mat-weekly').value.trim(),
  };
  save(); renderMatDetail();
  document.getElementById('mat-modal').close();
  toast('재료 정보를 저장했어요');
});

/* ================================================================
   5. 확률 정보 — 누적 확률 곡선 (SVG)
   ================================================================ */

function cdfOf(pmf) {
  const cdf = [0];
  for (let k = 1; k < pmf.length; k++) cdf[k] = cdf[k - 1] + pmf[k];
  return cdf;
}

function renderChart() {
  const svg = document.getElementById('pity-chart');
  const W = 720, H = 300, L = 46, R = 14, T = 14, B = 34;
  const pw = W - L - R, ph = H - T - B;
  const charCdf = cdfOf(CHAR_PMF);   // 1..160
  const wpCdf = cdfOf(WEAPON_PMF);   // 1..80
  const maxX = GACHA.CHAR_MAX;

  const x = n => L + (n / maxX) * pw;
  const y = p => T + (1 - p) * ph;

  const path = (cdf, maxN) => {
    let d = '';
    for (let n = 1; n <= maxN; n++) {
      d += (n === 1 ? 'M' : 'L') + x(n).toFixed(1) + ' ' + y(cdf[n]).toFixed(1);
    }
    return d;
  };

  const gridY = [0, 0.25, 0.5, 0.75, 1];
  const gridX = [40, 80, 120, 160];

  svg.innerHTML = `
    ${gridY.map(p => `
      <line x1="${L}" y1="${y(p)}" x2="${W - R}" y2="${y(p)}" stroke="#2c2c2a" stroke-width="1"/>
      <text x="${L - 8}" y="${y(p) + 4}" fill="#898781" font-size="11" text-anchor="end">${p * 100}%</text>`).join('')}
    ${gridX.map(n => `
      <line x1="${x(n)}" y1="${T}" x2="${x(n)}" y2="${T + ph}" stroke="#2c2c2a" stroke-width="1" stroke-dasharray="${n === 80 || n === 160 ? '4 3' : 'none'}"/>
      <text x="${x(n)}" y="${H - B + 16}" fill="#898781" font-size="11" text-anchor="middle">${n}뽑</text>`).join('')}
    <line x1="${L}" y1="${T + ph}" x2="${W - R}" y2="${T + ph}" stroke="#383835" stroke-width="1"/>
    <path d="${path(wpCdf, GACHA.WEAPON_MAX)}" fill="none" stroke="#c98500" stroke-width="2" stroke-linejoin="round"/>
    <path d="${path(charCdf, GACHA.CHAR_MAX)}" fill="none" stroke="#3987e5" stroke-width="2" stroke-linejoin="round"/>
    <text x="${x(76)}" y="${y(wpCdf[70]) - 8}" fill="#c98500" font-size="11" text-anchor="end">전무</text>
    <text x="${x(120)}" y="${y(charCdf[120]) - 8}" fill="#3987e5" font-size="11" text-anchor="middle">픽업 캐릭터</text>
    <circle id="hover-dot-c" r="4" fill="#3987e5" stroke="#1a1a19" stroke-width="2" style="display:none"/>
    <circle id="hover-dot-w" r="4" fill="#c98500" stroke="#1a1a19" stroke-width="2" style="display:none"/>
    <line id="hover-line" y1="${T}" y2="${T + ph}" stroke="#52514e" stroke-width="1" style="display:none"/>
  `;

  // 호버 툴팁
  const tip = document.getElementById('chart-tip');
  const dotC = svg.querySelector('#hover-dot-c');
  const dotW = svg.querySelector('#hover-dot-w');
  const hline = svg.querySelector('#hover-line');

  svg.addEventListener('mousemove', e => {
    const rect = svg.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width * W;
    const n = Math.round((relX - L) / pw * maxX);
    if (n < 1 || n > maxX) { hideTip(); return; }
    const cp = charCdf[Math.min(n, GACHA.CHAR_MAX)];
    hline.setAttribute('x1', x(n)); hline.setAttribute('x2', x(n));
    hline.style.display = '';
    dotC.setAttribute('cx', x(n)); dotC.setAttribute('cy', y(cp));
    dotC.style.display = '';
    let wpText = '';
    if (n <= GACHA.WEAPON_MAX) {
      const wp = wpCdf[n];
      dotW.setAttribute('cx', x(n)); dotW.setAttribute('cy', y(wp));
      dotW.style.display = '';
      wpText = `<br>전무: <b>${(wp * 100).toFixed(1)}%</b>`;
    } else {
      dotW.style.display = 'none';
    }
    tip.innerHTML = `<b>${n}뽑</b> 이내 획득 확률<br>픽업 캐릭터: <b>${(cp * 100).toFixed(1)}%</b>${wpText}`;
    tip.style.display = 'block';
    tip.style.left = Math.min(window.innerWidth - 180, e.clientX + 14) + 'px';
    tip.style.top = (e.clientY + 14) + 'px';
  });

  function hideTip() {
    tip.style.display = 'none';
    dotC.style.display = 'none';
    dotW.style.display = 'none';
    hline.style.display = 'none';
  }
  svg.addEventListener('mouseleave', hideTip);

  document.getElementById('exp-char').textContent = Math.round(expectedPulls(CHAR_PMF));
  document.getElementById('exp-weapon').textContent = Math.round(expectedPulls(WEAPON_PMF));
}

/* ================================================================
   6. 내보내기 / 가져오기
   ================================================================ */

document.getElementById('export-btn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `wuwa-planner-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('백업 파일을 다운로드했어요');
});

document.getElementById('import-btn').addEventListener('click', () => {
  document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || !('parties' in data)) throw new Error('bad');
      state = Object.assign(defaultState(), data);
      save(); renderAll();
      toast('백업을 불러왔어요');
    } catch {
      toast('올바른 백업 파일이 아니에요');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

/* ---------------- 모달 공통 닫기 ---------------- */

document.querySelectorAll('dialog [data-close]').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('dialog').close());
});
document.querySelectorAll('dialog').forEach(d => {
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
});

/* ================================================================
   7. PWA — 서비스 워커 등록 & 앱 설치 버튼
   ================================================================ */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* http 환경 등에서는 무시 */ });
  });
}

let deferredInstall = null;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstall = e;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  const { outcome } = await deferredInstall.userChoice;
  if (outcome === 'accepted') toast('앱이 설치됐어요! 홈 화면에서 실행할 수 있어요');
  deferredInstall = null;
  installBtn.hidden = true;
});

window.addEventListener('appinstalled', () => {
  installBtn.hidden = true;
  toast('설치 완료! 홈 화면에서 WuWa 플래너를 실행하세요');
});

/* ---------------- 초기 렌더 ---------------- */

function renderAll() {
  renderSchedules();
  renderRosterStrip();
  renderParties();
  renderRoster();
  renderBannerTable();
  renderRecords();
  renderContents();
  renderMatStrip();
  renderMatDetail();
}

renderAll();
renderChart();
