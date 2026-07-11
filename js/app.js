/* ================================================================
   WuWa 픽업 플래너 — 앱 로직
   ================================================================ */

const STORE_KEY = 'wuwa-planner-v1';

const defaultState = () => ({
  owned: {},            // charId -> true
  customChars: [],      // {id, name, rarity, element, group}
  schedules: [],        // {id, charId, name, start, end, saved, goal, memo}
  parties: [{ id: uid(), name: '파티 1', members: [null, null, null], tag: '' }],
  records: [],          // {id, season, type, charId, weaponName, copy, pulls, lost}
  contents: JSON.parse(JSON.stringify(CONTENT_DEFAULTS)), // 탑/해역/매트릭스 로테이션
  matOverrides: {},     // charId -> {forge, drop, weekly}
  pity: { charCount: 0, charGuaranteed: false, weaponCount: 0 },
  calc: { astrite: 0, lunite: 0, charTickets: 0, weaponTickets: 0 },
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
    const merged = Object.assign(defaultState(), s);
    // 중첩 객체는 기본값 위에 병합 (구버전 백업 호환)
    merged.pity = Object.assign(defaultState().pity, s.pity || {});
    merged.calc = Object.assign(defaultState().calc, s.calc || {});
    // 컨텐츠: 사용자가 버프를 입력하지 않은 항목은 최신 기본값으로 자동 갱신
    merged.contents = CONTENT_DEFAULTS.map(def => {
      const cur = (s.contents || []).find(x => x.id === def.id);
      if (!cur || !cur.buff || cur.buff.includes('입력하세요')) return JSON.parse(JSON.stringify(def));
      return Object.assign({ rules: def.rules }, cur);
    });
    return merged;
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
  const title = `${char.name} · ${el.name} ${char.rarity}성${char.role ? ' · ' + char.role : ''}`;
  const photo = char.img
    ? `<img src="${esc(char.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`
    : '';
  return `<span class="${cls}" style="--el:${el.color}" title="${esc(title)}">${esc(initial)}${photo}<span class="el-dot"></span></span>`;
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
    save(); renderSchedules(); renderPityCalc(); toast('일정을 삭제했어요');
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
  save(); renderSchedules(); renderPityCalc();
  document.getElementById('schedule-modal').close();
  toast('픽업 일정을 저장했어요');
});

/* ================================================================
   1.5 천장 현황 & 재화 계산기
   ================================================================ */

function renderPityCalc() {
  const wrap = document.getElementById('pity-calc');
  const p = state.pity;
  const c = state.calc;

  const charLeft5 = GACHA.HARD - Math.min(p.charCount, GACHA.HARD - 1);
  const charLeftPickup = p.charGuaranteed ? charLeft5 : charLeft5 + GACHA.HARD;
  const weaponLeft = GACHA.WEAPON_MAX - Math.min(p.weaponCount, GACHA.WEAPON_MAX - 1);

  const pool = Math.max(0, +c.astrite || 0) + Math.max(0, +c.lunite || 0);
  const poolPulls = Math.floor(pool / ASTRITE_PER_PULL);
  const poolRemain = pool % ASTRITE_PER_PULL;
  const charPulls = poolPulls + Math.max(0, +c.charTickets || 0);
  const weaponPulls = poolPulls + Math.max(0, +c.weaponTickets || 0);

  const schedOpts = state.schedules.map(s => {
    const ch = charById(s.charId);
    return `<option value="${s.id}">${esc(s.name || (ch ? ch.name + ' 픽업' : '일정'))}</option>`;
  }).join('');

  const topPack = LUNITE_PACKS[LUNITE_PACKS.length - 1];
  const topTotal = topPack.base + topPack.bonus;

  wrap.innerHTML = `
  <div class="card pity-card">
    <h3>🎯 캐릭터 배너 천장</h3>
    <div class="pity-count">
      <input type="number" id="pity-char-count" min="0" max="${GACHA.HARD - 1}" value="${p.charCount}">
      <span class="max">/ ${GACHA.HARD}</span>
    </div>
    <button class="chip ${p.charGuaranteed ? 'active' : ''}" id="pity-guaranteed">
      ${p.charGuaranteed ? '★ 픽업 확정 상태 (픽뚫 이후)' : '반반 상태 (픽뚫 가능)'}
    </button>
    <div class="pity-info">
      다음 5성까지 최대 <b>${charLeft5}뽑</b><br>
      픽업 확보까지 최대 <b>${charLeftPickup}뽑</b> ${p.charGuaranteed ? '(확정)' : '(픽뚫 시 기준)'}
    </div>
    <div class="pity-btns">
      <button class="ghost-btn" data-pity="char:1">+1</button>
      <button class="ghost-btn" data-pity="char:10">+10</button>
      <button class="ghost-btn danger-btn" data-pity="char:reset">초기화</button>
    </div>
    <p class="pity-note">픽업 기록 저장 시 자동으로 리셋돼요.</p>
  </div>

  <div class="card pity-card">
    <h3>⚔ 전무 배너 천장</h3>
    <div class="pity-count">
      <input type="number" id="pity-weapon-count" min="0" max="${GACHA.WEAPON_MAX - 1}" value="${p.weaponCount}">
      <span class="max">/ ${GACHA.WEAPON_MAX}</span>
    </div>
    <div class="pity-info">
      픽업 전무 확보까지 최대 <b>${weaponLeft}뽑</b> (픽뚫 없음 · 확정)
    </div>
    <div class="pity-btns">
      <button class="ghost-btn" data-pity="weapon:1">+1</button>
      <button class="ghost-btn" data-pity="weapon:10">+10</button>
      <button class="ghost-btn danger-btn" data-pity="weapon:reset">초기화</button>
    </div>
    <p class="pity-note">전무 기록 저장 시 자동으로 리셋돼요.</p>
  </div>

  <div class="card calc-card">
    <h3>💎 재화 계산기</h3>
    <div class="calc-rows">
      <label>아스트라이트 <input type="number" id="calc-astrite" min="0" value="${c.astrite}"></label>
      <label>달빛살 (루나이트) <input type="number" id="calc-lunite" min="0" value="${c.lunite}"></label>
      <label>한정 캐릭터 뽑기권 <input type="number" id="calc-chart" min="0" value="${c.charTickets}"></label>
      <label>전무 뽑기권 <input type="number" id="calc-weapont" min="0" value="${c.weaponTickets}"></label>
    </div>
    <div class="calc-quick">
      <button class="ghost-btn" data-addlunite="${topTotal}">+₩${topPack.price.toLocaleString()} 팩 (${topTotal.toLocaleString()})</button>
      <button class="ghost-btn" data-addlunite="${topPack.base * 2}">+첫구매 2배 (${(topPack.base * 2).toLocaleString()})</button>
    </div>
    <div class="calc-result">
      <div>캐릭터 뽑기 가능: <b>${charPulls}뽑</b> <small>(석 ${poolPulls}뽑 + 뽑기권 ${Math.max(0, +c.charTickets || 0)} · 잔여 ${poolRemain}석)</small></div>
      <div>전무 뽑기 가능: <b>${weaponPulls}뽑</b> <small>(석은 캐릭터와 공용)</small></div>
    </div>
    ${state.schedules.length ? `
    <div class="calc-apply">
      <select id="calc-schedule">${schedOpts}</select>
      <button class="ghost-btn" id="calc-apply-btn">일정에 반영</button>
    </div>` : '<p class="pity-note">픽업 일정을 추가하면 계산 결과를 일정 게이지에 바로 반영할 수 있어요.</p>'}
    <details class="pack-details">
      <summary>달빛살 팩 → 뽑 환산표</summary>
      <table class="banner-table">
        <tr><th>가격(대략)</th><th>달빛살</th><th>환산</th><th>뽑당 가격</th></tr>
        ${LUNITE_PACKS.map(pk => {
          const total = pk.base + pk.bonus;
          const pulls = total / ASTRITE_PER_PULL;
          return `<tr>
            <td>₩${pk.price.toLocaleString()}</td>
            <td>${pk.base.toLocaleString()} +${pk.bonus.toLocaleString()}</td>
            <td>${pulls.toFixed(1)}뽑</td>
            <td>₩${Math.round(pk.price / pulls).toLocaleString()}</td>
          </tr>`;
        }).join('')}
      </table>
      <p class="pity-note">첫 구매는 보너스 대신 기본량 2배 (₩119,000 팩 = 12,960 = 81뽑). 쿠로게임즈 KR 공식 공시 가격 기준 (PS5는 별도: 6,480 = ₩130,900).</p>
    </details>
  </div>`;
}

document.getElementById('pity-calc').addEventListener('click', e => {
  const pityBtn = e.target.closest('[data-pity]');
  if (pityBtn) {
    const [kind, act] = pityBtn.dataset.pity.split(':');
    if (kind === 'char') {
      if (act === 'reset') { state.pity.charCount = 0; state.pity.charGuaranteed = false; }
      else state.pity.charCount = Math.min(GACHA.HARD - 1, state.pity.charCount + +act);
    } else {
      state.pity.weaponCount = act === 'reset' ? 0 : Math.min(GACHA.WEAPON_MAX - 1, state.pity.weaponCount + +act);
    }
    save(); renderPityCalc();
    return;
  }
  if (e.target.closest('#pity-guaranteed')) {
    state.pity.charGuaranteed = !state.pity.charGuaranteed;
    save(); renderPityCalc();
    return;
  }
  const addBtn = e.target.closest('[data-addlunite]');
  if (addBtn) {
    state.calc.lunite = Math.max(0, +state.calc.lunite || 0) + +addBtn.dataset.addlunite;
    save(); renderPityCalc();
    return;
  }
  if (e.target.closest('#calc-apply-btn')) {
    const sel = document.getElementById('calc-schedule');
    const s = state.schedules.find(x => x.id === sel.value);
    if (!s) return;
    const pool = Math.max(0, +state.calc.astrite || 0) + Math.max(0, +state.calc.lunite || 0);
    const pulls = Math.floor(pool / ASTRITE_PER_PULL) + Math.max(0, +state.calc.charTickets || 0);
    s.saved = pulls;
    save(); renderSchedules(); renderPityCalc();
    toast(`일정의 모아둔 뽑기를 ${pulls}뽑으로 반영했어요`);
  }
});

document.getElementById('pity-calc').addEventListener('change', e => {
  const id = e.target.id;
  const v = Math.max(0, +e.target.value || 0);
  if (id === 'pity-char-count') state.pity.charCount = Math.min(GACHA.HARD - 1, v);
  else if (id === 'pity-weapon-count') state.pity.weaponCount = Math.min(GACHA.WEAPON_MAX - 1, v);
  else if (id === 'calc-astrite') state.calc.astrite = v;
  else if (id === 'calc-lunite') state.calc.lunite = v;
  else if (id === 'calc-chart') state.calc.charTickets = v;
  else if (id === 'calc-weapont') state.calc.weaponTickets = v;
  else return;
  save(); renderPityCalc();
});

// 기록 저장 시 공통 후처리: 천장 리셋 + 같은 캐릭터 일정에서 뽑기 차감
function applyRecordSideEffects(rec) {
  const notes = [];
  if (rec.type === 'char') {
    if (state.pity.charCount > 0 || state.pity.charGuaranteed) notes.push('캐릭터 천장 리셋');
    state.pity.charCount = 0;
    state.pity.charGuaranteed = false;
  } else {
    if (state.pity.weaponCount > 0) notes.push('전무 천장 리셋');
    state.pity.weaponCount = 0;
  }
  if (rec.charId) {
    const order = { ongoing: 0, upcoming: 1, past: 2 };
    const sched = state.schedules
      .filter(s => s.charId === rec.charId && s.saved > 0)
      .sort((a, b) => order[scheduleStatus(a)] - order[scheduleStatus(b)])[0];
    if (sched) {
      const before = sched.saved;
      sched.saved = Math.max(0, sched.saved - rec.pulls);
      notes.push(`일정 뽑기 ${before} → ${sched.saved}`);
    }
  }
  renderSchedules(); renderPityCalc();
  return notes.length ? ` (${notes.join(' · ')})` : '';
}

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
        <select class="party-tag" data-party-tag="${p.id}" title="용도 라벨 — 컨텐츠 탭에 연결돼요">
          <option value="">라벨 없음</option>
          ${state.contents.map(c => `<option value="${c.id}" ${p.tag === c.id ? 'selected' : ''}>${c.icon || ''} ${esc(c.name)}</option>`).join('')}
        </select>
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
  state.parties.push({ id: uid(), name: `파티 ${state.parties.length + 1}`, members: [null, null, null], tag: '' });
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
    save(); renderContents();
    return;
  }
  const tagSel = e.target.closest('[data-party-tag]');
  if (tagSel) {
    const p = state.parties.find(x => x.id === tagSel.dataset.partyTag);
    p.tag = tagSel.value;
    save(); renderContents();
    const ct = state.contents.find(c => c.id === tagSel.value);
    if (ct) toast(`"${p.name}" 파티를 ${ct.name}에 연결했어요`);
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

// 배너(페이즈) 식별 키 & 기록 시즌 매칭
function bannerKey(b) {
  return `${b.ver}-${b.phase}`;
}

// 이 배너에 귀속되는 시즌 이름들 (키 + 예전 "OO 픽업" 형식 + 개명 전 이름 호환)
function bannerSeasonNames(b) {
  const names = [bannerKey(b)];
  (b.pickup || []).forEach(id => {
    const c = charById(id);
    if (!c) return;
    names.push(`${c.name} 픽업`);
    if (OLD_NAME_ALIASES[c.name]) names.push(`${OLD_NAME_ALIASES[c.name]} 픽업`);
  });
  return names;
}

const ALL_BANNER_SEASONS = new Set(BANNERS.flatMap(b => (b.leaked ? [] : bannerSeasonNames(b))));

function bcRecordRow(r) {
  const top = recordLuck(r);
  const g = luckGrade(top);
  const label = r.type === 'char'
    ? `<b>${esc(charById(r.charId)?.name ?? '?')}</b> · ${COPY_LABELS[r.copy] ?? '명함'}${r.lost ? ' · <span style="color:var(--serious)">픽뚫</span>' : ''}`
    : `<b>${esc(r.weaponName || '전무')}</b> · ${WEAPON_COPY_LABELS[r.copy] ?? '1개'}`;
  return `
  <div class="bc-rec">
    <span class="what">${label} · ${r.pulls}뽑</span>
    <span class="lk ${g.cls}"><span class="pct">상위 ${top.toFixed(1)}%</span></span>
    <button class="record-del" data-del-record="${r.id}" title="삭제">✕</button>
  </div>`;
}

function renderBannerCards() {
  const wrap = document.getElementById('banner-cards');
  const t = today();
  wrap.innerHTML = [...BANNERS].reverse().map(b => {
    const key = bannerKey(b);
    const label = `Ver ${b.ver} · ${b.phase}`;

    // 유출(미확정) 배너는 정보 카드로만 표시
    if (b.leaked) {
      return `
      <div class="bc-card bc-leak">
        <div class="bc-head">
          <span class="pill lost">${esc(label)}</span>
          <span class="bc-dates">일정 미정</span>
        </div>
        <div class="bc-empty" style="padding:14px 0">${(b.leakNames || []).map(esc).join(' · ')}</div>
        ${b.note ? `<p class="bc-note">⚠ ${esc(b.note)}</p>` : ''}
      </div>`;
    }

    const live = b.start <= t && t <= b.end;
    const pickupChars = (b.pickup || []).map(charById).filter(Boolean);
    const rerunChars = (b.rerun || []).map(charById).filter(Boolean);
    const seasons = new Set(bannerSeasonNames(b));
    const recs = state.records.filter(r => seasons.has(r.season));

    // 대상 선택지: 신규 → 복각 → 전무(신규/복각 순)
    const allChars = [...pickupChars.map(c => ({ c, tag: '신규' })), ...rerunChars.map(c => ({ c, tag: '복각' }))];
    const targetOpts =
      allChars.map(({ c, tag }) => `<option value="char|${c.id}|${key}">${esc(c.name)} (${tag})</option>`).join('') +
      allChars.map(({ c }) => `<option value="weapon|${c.id}|${key}">${esc(c.name)} 전무${SIG_WEAPONS[c.id] ? ` · ${esc(SIG_WEAPONS[c.id])}` : ''}</option>`).join('');

    let luckFoot = `<div class="t"><span>이 시즌 내 운</span><b style="color:var(--muted)">기록 없음</b></div>`;
    if (recs.length) {
      const avg = recs.reduce((a, r) => a + recordLuck(r), 0) / recs.length;
      const g = luckGrade(avg);
      const pulls = recs.reduce((a, r) => a + r.pulls, 0);
      luckFoot = `
        <div class="t">
          <span>이 시즌 내 운 · ${recs.length}건 · ${pulls}뽑</span>
          <b class="${g.cls}"><span class="pct">평균 상위 ${avg.toFixed(1)}% (${g.label})</span></b>
        </div>
        <div class="luck-bar"><div class="fill" style="width:${(100 - avg).toFixed(1)}%"></div></div>`;
    }

    return `
    <div class="bc-card ${live ? 'bc-live' : ''}" data-banner="${key}">
      <div class="bc-head">
        <span class="pill copy">${esc(label)}</span>
        ${live ? '<span class="badge live">진행 중</span>' : ''}
        <span class="bc-dates">${fmtDate(b.start)} ~ ${fmtDate(b.end)}</span>
      </div>
      ${pickupChars.length ? `
      <div class="bc-chars">
        ${pickupChars.map(c => `
        <div class="bc-char">
          ${avatarHTML(c)}
          <span class="nm">${esc(c.name)}</span>
          <span class="el"><span class="dot" style="background:${ELEMENTS[c.element].color}"></span>${ELEMENTS[c.element].name} · ${WEAPONS[c.weapon] ?? ''}</span>
        </div>`).join('')}
      </div>` : ''}
      ${rerunChars.length ? `
      <div class="bc-rerun">
        <span class="bc-rerun-lbl">복각</span>
        ${rerunChars.map(c => `
        <span class="bc-rerun-chip" title="${esc(c.name)}">
          ${avatarHTML(c, { small: true })}
          <span class="rn">${esc(c.name)}</span>
        </span>`).join('')}
      </div>` : ''}
      ${b.note ? `<p class="bc-note">${esc(b.note)}</p>` : ''}
      <div class="bc-records">
        ${recs.length ? recs.map(bcRecordRow).join('') : '<div class="bc-empty">아직 기록이 없어요 — 아래에서 바로 추가!</div>'}
      </div>
      <div class="bc-add">
        <select class="bc-target">${targetOpts}</select>
        <select class="bc-copy"></select>
        <input class="bc-pulls" type="number" min="1" max="${GACHA.CHAR_MAX}" placeholder="몇 뽑?">
        <label class="bc-lost"><input type="checkbox" class="bc-lost-chk"> 픽뚫</label>
        <button class="bc-save primary-btn">기록</button>
      </div>
      <div class="bc-luck">${luckFoot}</div>
    </div>`;
  }).join('');

  // 카드별 획득 회차 선택지 초기화
  wrap.querySelectorAll('.bc-card:not(.bc-leak)').forEach(card => refreshBcCopy(card));
}

function refreshBcCopy(card) {
  const type = card.querySelector('.bc-target').value.split('|')[0];
  const labels = type === 'weapon' ? WEAPON_COPY_LABELS : COPY_LABELS;
  card.querySelector('.bc-copy').innerHTML = labels.map((l, i) => `<option value="${i}">${l}</option>`).join('');
  card.querySelector('.bc-lost').style.display = type === 'weapon' ? 'none' : '';
  card.querySelector('.bc-pulls').max = type === 'weapon' ? GACHA.WEAPON_MAX : GACHA.CHAR_MAX;
}

const bannerCardsEl = document.getElementById('banner-cards');

bannerCardsEl.addEventListener('change', e => {
  if (e.target.classList.contains('bc-target')) refreshBcCopy(e.target.closest('.bc-card'));
});

bannerCardsEl.addEventListener('click', e => {
  const btn = e.target.closest('.bc-save');
  if (!btn) return;
  const card = btn.closest('.bc-card');
  const [type, charId, season] = card.querySelector('.bc-target').value.split('|');
  const pulls = +card.querySelector('.bc-pulls').value;
  const maxP = type === 'weapon' ? GACHA.WEAPON_MAX : GACHA.CHAR_MAX;
  if (!pulls || pulls < 1 || pulls > maxP) {
    toast(`뽑기 수는 1~${maxP} 사이로 입력해주세요 (천장 ${maxP}뽑)`);
    return;
  }
  const rec = {
    id: uid(),
    season,
    type,
    charId,
    copy: +card.querySelector('.bc-copy').value,
    pulls,
    lost: type === 'char' && card.querySelector('.bc-lost-chk').checked,
  };
  if (type === 'char') {
    if (!isOwned(charId)) {
      state.owned[charId] = true;
      renderRoster(); renderRosterStrip();
    }
  } else {
    const cname = charById(charId)?.name ?? '';
    rec.weaponName = SIG_WEAPONS[charId]
      ? `${cname} 전무 (${SIG_WEAPONS[charId]})`
      : `${cname} 전무`.trim();
  }
  state.records.push(rec);
  const extra = applyRecordSideEffects(rec);
  save(); renderRecords();
  const top = recordLuck(rec);
  toast(`기록 완료! 상위 ${top.toFixed(1)}%의 운이었어요${extra}`);
});

const CHAR_PMF = charPickupPmf();
const WEAPON_PMF = weaponPickupPmf();

function recordLuck(r) {
  const pmf = r.type === 'weapon' ? WEAPON_PMF : CHAR_PMF;
  return luckTopPercent(r.pulls, pmf);
}

function renderRecords() {
  const stats = document.getElementById('record-stats');
  const recs = state.records;

  // 통계 타일 (전체 기록 합산)
  if (!recs.length) {
    stats.innerHTML = `<div class="empty-note" style="grid-column:1/-1">아래 픽업 카드에서 첫 뽑기 결과를 기록하면 통계가 표시돼요.</div>`;
  } else {
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
  }

  renderBannerCards();

  // 기타 시즌 기록 (역대 배너 목록에 없는 시즌)
  const wrap = document.getElementById('record-list');
  const customs = recs.filter(r => !ALL_BANNER_SEASONS.has(r.season));
  if (!customs.length) {
    wrap.innerHTML = `<div class="empty-note">목록에 없는 시즌 기록은 [+ 직접 기록 추가]로 등록할 수 있어요.</div>`;
    return;
  }
  wrap.innerHTML = [...customs].reverse().map(r => {
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
}

// 기록 삭제 — 배너 카드와 기타 목록 양쪽에서 동작
document.addEventListener('click', e => {
  const del = e.target.closest('[data-del-record]');
  if (!del) return;
  state.records = state.records.filter(r => r.id !== del.dataset.delRecord);
  save(); renderRecords(); toast('기록을 삭제했어요');
});

/* ----- 기록 추가 모달 ----- */

function refreshRecordFormOptions() {
  const bannerSel = document.getElementById('rec-banner');
  const opts = [...BANNERS].filter(b => !b.leaked).reverse().map(b => {
    const names = (b.pickup || []).map(id => charById(id)?.name).filter(Boolean).join('/') || '복각';
    return `<option value="${esc(bannerKey(b))}">${b.ver} ${b.phase} · ${esc(names)}</option>`;
  });
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
  const extra = applyRecordSideEffects(rec);
  save(); renderRecords();
  document.getElementById('record-modal').close();
  const top = recordLuck(rec);
  toast(`기록 완료! 이번 뽑기는 상위 ${top.toFixed(1)}%의 운이었어요${extra}`);
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
      ${c.rules ? `<p class="ct-rules">${esc(c.rules)}</p>` : ''}
      <div class="ct-block">
        <h4>✨ 이번 주기 버프</h4>
        <div class="ct-buff">${esc(c.buff || '버프 미입력')}</div>
      </div>
      <div class="ct-block">
        <h4>👹 등장 몹</h4>
        ${stages || '<div class="empty-note" style="padding:14px">단계를 추가해 주세요</div>'}
      </div>
      ${(() => {
        const linked = state.parties.filter(p => p.tag === c.id);
        if (!linked.length) return '';
        return `<div class="ct-block">
          <h4>🧑‍🤝‍🧑 연결된 파티</h4>
          ${linked.map(p => `
          <div class="ct-party">
            <span class="ct-party-nm">${esc(p.name)}</span>
            ${p.members.filter(Boolean).map(id => {
              const ch = charById(id);
              return ch ? avatarHTML(ch, { small: true }) : '';
            }).join('') || '<span class="pity-note">멤버 없음</span>'}
          </div>`).join('')}
        </div>`;
      })()}
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
  document.getElementById('ct-rules').value = c.rules || '';
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
  c.rules = document.getElementById('ct-rules').value.trim();
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

// 캐릭터의 재료 구성 (검증 데이터 + 사용자 수정 병합, 커스텀 캐릭터는 무기 기반 기본값)
function charMats(c) {
  const ov = state.matOverrides[c.id] || {};
  const base = CHAR_MATS[c.id] || [WEAPON_FORGE[c.weapon] || 'drip', 'whisperin', ''];
  return {
    forge: ov.forge || base[0],
    drop: ov.drop || base[1],
    weekly: ov.weekly !== undefined && ov.weekly !== '' ? ov.weekly : base[2],
  };
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
  const asc = ASC_MATS[c.id] || [null, null];
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
          ${c.role ? `<span class="pill">${esc(c.role)}</span>` : ''}
          ${c.ver ? `<span class="pill">Ver ${c.ver}</span>` : ''}
          ${SIG_WEAPONS[c.id] !== undefined ? `<span class="pill weapon">전무: ${SIG_WEAPONS[c.id] ? esc(SIG_WEAPONS[c.id]) : '확인 불가'}</span>` : ''}
        </div>
      </div>
      <button class="ghost-btn" id="edit-mats-btn">재료 수정</button>
    </div>
    <div class="mat-section">
      <h4>🔨 단조 재료 — ${esc(forgeFam.name)}</h4>
      <div class="mat-rows">${forgeFam.tiers.map((t, i) => tierRow(t, i, FORTE_TOTALS.forge[i])).join('')}</div>
    </div>
    <div class="mat-section">
      <h4>👹 일반 몹 드랍 — ${esc(dropFam.name)}</h4>
      <div class="mat-rows">${dropFam.tiers.map((t, i) => tierRow(t, i, FORTE_TOTALS.drop[i])).join('')}</div>
    </div>
    <div class="mat-section">
      <h4>🗓 주간 보스 & 기타</h4>
      <div class="mat-rows">
        <div class="mat-row">
          <span class="tier-dot" style="background:${TIER_COLORS[3]}">주간</span>
          <span class="mn">${m.weekly
            ? `${esc(m.weekly)}${WEEKLY_BOSS_MATS[m.weekly] ? ` <small style="color:var(--muted)">— ${esc(WEEKLY_BOSS_MATS[m.weekly])}</small>` : ''}`
            : '<i>확인 불가 — [재료 수정]에서 입력</i>'}</span>
          <span class="cnt">×${FORTE_TOTALS.weekly}</span>
        </div>
        <div class="mat-row">
          <span class="tier-dot" style="background:#8f8d85">💰</span>
          <span class="mn">클램 코인</span>
          <span class="cnt">${FORTE_TOTALS.credits}</span>
        </div>
      </div>
    </div>
    <div class="mat-section">
      <h4>⛰ 돌파 재료 (Lv.1→90 · 스킬 재료와 별도)</h4>
      <div class="mat-rows">
        <div class="mat-row">
          <span class="tier-dot" style="background:${TIER_COLORS[0]}">특산</span>
          <span class="mn">${asc[0] ? esc(asc[0]) : '<i>확인 불가 (3.5 신규 지역)</i>'}</span>
          <span class="cnt">×${ASC_TOTALS.specialty}</span>
        </div>
        <div class="mat-row">
          <span class="tier-dot" style="background:${TIER_COLORS[2]}">보스</span>
          <span class="mn">${asc[1] ? esc(asc[1]) : '<i>확인 불가 (3.5 신규 보스)</i>'}</span>
          <span class="cnt">×${ASC_TOTALS.boss}</span>
        </div>
        <div class="mat-row">
          <span class="tier-dot" style="background:${TIER_COLORS[1]}">몹</span>
          <span class="mn">${esc(dropFam.name)} T1~T4</span>
          <span class="cnt">×${ASC_TOTALS.enemy.join('/')}</span>
        </div>
        <div class="mat-row">
          <span class="tier-dot" style="background:#8f8d85">💰</span>
          <span class="mn">클램 코인</span>
          <span class="cnt">${ASC_TOTALS.credits}</span>
        </div>
      </div>
    </div>
    <p class="mat-note">※ 수량은 포르테 풀강(전 노드) / 돌파(0→6돌파, Lv.90 상한) 기준 공통 수치. 주간 재료는 스킬 1개 1→10에 ×4씩. Lv.90 경험치까지 포함하면 ${esc(ASC_TOTALS.exp)} + 클램 코인 총 ${ASC_TOTALS.creditsWithExp}이 추가로 들어요. 등급명 미확인 몹 드랍 세트는 I~IV로 표기.</p>
  </div>`;

  document.getElementById('edit-mats-btn').addEventListener('click', () => openMatModal(c));
}

// 주간 보스 재료 참고표 & 자동완성 목록
function renderWeeklyTable() {
  document.getElementById('weekly-table').innerHTML =
    `<tr><th>재료</th><th>드랍 보스 (등장 시기)</th></tr>` +
    Object.entries(WEEKLY_BOSS_MATS).map(([mat, boss]) =>
      `<tr><td class="cname">${esc(mat)}</td><td>${esc(boss)}</td></tr>`).join('');
  document.getElementById('weekly-mats').innerHTML =
    Object.keys(WEEKLY_BOSS_MATS).map(m => `<option value="${esc(m)}">`).join('');
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
  renderRecords();
  renderContents();
  renderMatStrip();
  renderMatDetail();
  renderWeeklyTable();
  renderPityCalc();
}

renderAll();
renderChart();
