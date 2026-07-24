/* ================================================================
   WuWa 픽업 플래너 — 앱 로직
   ================================================================ */

const STORE_KEY = 'wuwa-planner-v1';
const STATE_SCHEMA_VERSION = 3;
const DEFAULT_CHAR_PITY_GROUP = 'char-event';
const DEFAULT_WEAPON_PITY_GROUP = 'weapon-event';
const SAFE_ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
const UNSAFE_ID_KEYS = new Set(Object.getOwnPropertyNames(Object.prototype));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SCHEDULE_GOALS = new Set(['명함', '1돌', '2돌', '3돌', '4돌', '5돌', '6돌', '명함+전무', '전무만']);
const LUNITE_PACK_BASES = new Set(LUNITE_PACKS.map(pack => pack.base));
const LUNITE_PLATFORM_IDS = new Set(Object.keys(LUNITE_PLATFORMS));
const PARTY_ROLE_GROUPS = Object.freeze([
  { id: 'dealer', label: '딜러', icon: '⚔' },
  { id: 'subdealer', label: '서브딜러', icon: '✦' },
  { id: 'healer', label: '힐러', icon: '✚' },
]);
const PARTY_ROLE_LABELS = new Set(PARTY_ROLE_GROUPS.map(group => group.label));

const defaultPity = () => ({
  selectedCharGroup: DEFAULT_CHAR_PITY_GROUP,
  selectedWeaponGroup: DEFAULT_WEAPON_PITY_GROUP,
  charGroups: { [DEFAULT_CHAR_PITY_GROUP]: { count: 0, guaranteed: false, effectOwner: null } },
  weaponGroups: { [DEFAULT_WEAPON_PITY_GROUP]: { count: 0, effectOwner: null } },
});

const defaultState = () => ({
  schemaVersion: STATE_SCHEMA_VERSION,
  owned: Object.create(null), // charId -> true
  customChars: [],      // {id, name, rarity, element, group}
  schedules: [],        // {id, charId, name, start, end, saved, goal, memo}
  parties: [{ id: uid(), name: '파티 1', members: [null, null, null], tag: '' }],
  records: [],          // {id, season, type, charId, weaponName, copy, pulls, lost}
  contents: JSON.parse(JSON.stringify(CONTENT_DEFAULTS)), // 탑/해역/매트릭스 로테이션
  matOverrides: Object.create(null), // charId -> {forge, drop, weekly}
  pity: defaultPity(),
  calc: {
    astrite: 0, lunite: 0, charTickets: 0, weaponTickets: 0,
    purchasePlatform: 'kuro', purchasePack: 6480, purchaseFirst: false, purchases: [],
    legacyLuniteReview: false,
  },
});

let state = loadState();

function uid() {
  return 'id' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function cleanString(value, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanId(value) {
  return typeof value === 'string' && SAFE_ID_RE.test(value) && !UNSAFE_ID_KEYS.has(value) ? value : '';
}

function cleanInt(value, min, max, fallback = min) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : fallback;
}

function lunitePack(base) {
  return LUNITE_PACKS.find(pack => pack.base === Number(base)) || null;
}

function lunitePurchasePrice(purchase) {
  const pack = lunitePack(purchase?.base);
  const platform = LUNITE_PLATFORMS[purchase?.platform] || LUNITE_PLATFORMS.kuro;
  return pack ? pack[platform.priceKey] : 0;
}

function lunitePurchaseAmount(purchase) {
  const pack = lunitePack(purchase?.base);
  return pack ? pack.base + (purchase?.first === true ? pack.base : pack.bonus) : 0;
}

function purchasePlanTotals(calc = state.calc) {
  return (Array.isArray(calc?.purchases) ? calc.purchases : []).reduce((totals, purchase) => ({
    won: totals.won + lunitePurchasePrice(purchase),
    lunite: totals.lunite + lunitePurchaseAmount(purchase),
  }), { won: 0, lunite: 0 });
}

function normalizePurchases(value, { strict = false } = {}) {
  const firstUsed = new Set();
  return (Array.isArray(value) ? value : []).slice(0, 100).flatMap(item => {
    if (!isPlainObject(item)) {
      if (strict) throw new Error('충전 계획 항목이 올바르지 않습니다.');
      return [];
    }
    const base = cleanInt(item.base, 0, 100000, 0);
    const platform = LUNITE_PLATFORM_IDS.has(item.platform) ? item.platform : 'kuro';
    if (!LUNITE_PACK_BASES.has(base) || (strict && !LUNITE_PLATFORM_IDS.has(item.platform))) {
      if (strict) throw new Error('충전 계획의 팩 또는 플랫폼이 올바르지 않습니다.');
      return [];
    }
    let first = item.first === true;
    if (first && firstUsed.has(base)) {
      if (strict) throw new Error('같은 팩의 첫 충전 보너스는 한 번만 적용할 수 있습니다.');
      first = false;
    }
    if (first) firstUsed.add(base);
    return [{ base, platform, first }];
  });
}

function addSelectedLunitePurchase(calc = state.calc) {
  if (!Array.isArray(calc.purchases)) calc.purchases = [];
  if (calc.purchases.length >= 100) return { ok: false, reason: 'limit' };
  const base = LUNITE_PACK_BASES.has(Number(calc.purchasePack)) ? Number(calc.purchasePack) : 6480;
  const platform = LUNITE_PLATFORM_IDS.has(calc.purchasePlatform) ? calc.purchasePlatform : 'kuro';
  const firstUsed = calc.purchases.some(purchase => purchase.first && purchase.base === base);
  if (calc.purchaseFirst === true && firstUsed) {
    calc.purchaseFirst = false;
    return { ok: false, reason: 'first-used' };
  }
  const purchase = { base, platform, first: calc.purchaseFirst === true };
  calc.purchases.push(purchase);
  calc.purchaseFirst = false;
  return { ok: true, purchase };
}

function validDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function pityGroupIds(kind) {
  const field = kind === 'char' ? 'charPityGroup' : 'weaponPityGroup';
  const base = kind === 'char' ? DEFAULT_CHAR_PITY_GROUP : DEFAULT_WEAPON_PITY_GROUP;
  return [base, ...BANNERS.map(b => cleanId(b[field])).filter(Boolean)]
    .filter((id, i, list) => list.indexOf(id) === i);
}

function normalizePity(raw) {
  const result = defaultPity();
  if (!isPlainObject(raw)) return result;

  // v1의 단일 천장 값을 일반 이벤트 그룹으로 마이그레이션합니다.
  if (hasOwn(raw, 'charCount') || hasOwn(raw, 'charGuaranteed')) {
    result.charGroups[DEFAULT_CHAR_PITY_GROUP] = {
      count: cleanInt(raw.charCount, 0, GACHA.HARD - 1, 0),
      guaranteed: raw.charGuaranteed === true,
      effectOwner: null,
    };
  }
  if (hasOwn(raw, 'weaponCount')) {
    result.weaponGroups[DEFAULT_WEAPON_PITY_GROUP] = {
      count: cleanInt(raw.weaponCount, 0, GACHA.WEAPON_MAX - 1, 0),
      effectOwner: null,
    };
  }

  const charIds = pityGroupIds('char');
  const weaponIds = pityGroupIds('weapon');
  if (isPlainObject(raw.charGroups)) {
    charIds.forEach(id => {
      const group = raw.charGroups[id];
      if (!isPlainObject(group)) return;
      result.charGroups[id] = {
        count: cleanInt(group.count, 0, GACHA.HARD - 1, 0),
        guaranteed: group.guaranteed === true,
        effectOwner: cleanId(group.effectOwner) || null,
      };
    });
  }
  if (isPlainObject(raw.weaponGroups)) {
    weaponIds.forEach(id => {
      const group = raw.weaponGroups[id];
      if (!isPlainObject(group)) return;
      result.weaponGroups[id] = {
        count: cleanInt(group.count, 0, GACHA.WEAPON_MAX - 1, 0),
        effectOwner: cleanId(group.effectOwner) || null,
      };
    });
  }
  result.selectedCharGroup = charIds.includes(raw.selectedCharGroup)
    ? raw.selectedCharGroup : DEFAULT_CHAR_PITY_GROUP;
  result.selectedWeaponGroup = weaponIds.includes(raw.selectedWeaponGroup)
    ? raw.selectedWeaponGroup : DEFAULT_WEAPON_PITY_GROUP;
  return result;
}

function assertImportShape(data) {
  if (!isPlainObject(data) || !Array.isArray(data.parties)) throw new Error('백업 최상위 구조가 올바르지 않습니다.');
  ['customChars', 'schedules', 'parties', 'records', 'contents'].forEach(key => {
    if (hasOwn(data, key) && !Array.isArray(data[key])) throw new Error(`${key} 항목은 배열이어야 합니다.`);
    if (Array.isArray(data[key]) && data[key].some(item => !isPlainObject(item))) {
      throw new Error(`${key} 배열에 잘못된 항목이 있습니다.`);
    }
  });
  ['owned', 'matOverrides', 'pity', 'calc'].forEach(key => {
    if (hasOwn(data, key) && !isPlainObject(data[key])) throw new Error(`${key} 항목이 올바르지 않습니다.`);
  });
  if (hasOwn(data.calc || {}, 'purchases') &&
      (!Array.isArray(data.calc.purchases) || data.calc.purchases.some(item => !isPlainObject(item)))) {
    throw new Error('충전 계획은 배열이어야 합니다.');
  }
  if ((data.customChars?.length || 0) > 300 || (data.schedules?.length || 0) > 500 ||
      data.parties.length > 100 || (data.records?.length || 0) > 5000 || (data.calc?.purchases?.length || 0) > 100) {
    throw new Error('백업 데이터가 허용 범위를 초과했습니다.');
  }
  (data.contents || []).forEach(item => {
    const def = CONTENT_DEFAULTS.find(c => c.id === item.id);
    if (!def) throw new Error('알 수 없는 컨텐츠 ID가 있습니다.');
    if (hasOwn(item, 'icon') && item.icon !== def.icon) throw new Error('컨텐츠 아이콘은 변경할 수 없습니다.');
    if (hasOwn(item, 'stages') && (!Array.isArray(item.stages) || item.stages.some(s => !isPlainObject(s)))) {
      throw new Error('컨텐츠 단계 정보가 올바르지 않습니다.');
    }
  });
}

function normalizeRecordEffects(raw, scheduleIds) {
  if (!isPlainObject(raw)) return undefined;
  const effects = {};
  if (isPlainObject(raw.pity)) {
    const type = raw.pity.type === 'weapon' ? 'weapon' : raw.pity.type === 'char' ? 'char' : '';
    const validGroups = type ? pityGroupIds(type) : [];
    const groupId = cleanId(raw.pity.groupId);
    if (type && validGroups.includes(groupId) && isPlainObject(raw.pity.before) && isPlainObject(raw.pity.after)) {
      const max = type === 'char' ? GACHA.HARD - 1 : GACHA.WEAPON_MAX - 1;
      effects.pity = {
        type,
        groupId,
        before: {
          count: cleanInt(raw.pity.before.count, 0, max, 0),
          guaranteed: type === 'char' && raw.pity.before.guaranteed === true,
          effectOwner: cleanId(raw.pity.before.effectOwner) || null,
        },
        after: {
          count: cleanInt(raw.pity.after.count, 0, max, 0),
          guaranteed: type === 'char' && raw.pity.after.guaranteed === true,
        },
      };
    }
  }
  if (isPlainObject(raw.schedule) && scheduleIds.has(raw.schedule.id) &&
      isPlainObject(raw.schedule.before) && isPlainObject(raw.schedule.after)) {
    effects.schedule = {
      id: raw.schedule.id,
      before: {
        saved: cleanInt(raw.schedule.before.saved, 0, 9999, 0),
        effectOwner: cleanId(raw.schedule.before.effectOwner) || null,
      },
      after: { saved: cleanInt(raw.schedule.after.saved, 0, 9999, 0) },
    };
  }
  return Object.keys(effects).length ? effects : undefined;
}

function normalizeStateData(input, { strict = false } = {}) {
  if (strict) assertImportShape(input);
  const raw = isPlainObject(input) ? input : {};
  const result = defaultState();

  const builtInIds = new Set(CHARACTERS.map(c => c.id));
  const customIds = new Set();
  result.customChars = (Array.isArray(raw.customChars) ? raw.customChars : []).slice(0, 300).flatMap(item => {
    if (!isPlainObject(item)) return [];
    const id = cleanId(item.id);
    const name = cleanString(item.name, 24);
    if (!id || !name || builtInIds.has(id) || customIds.has(id)) {
      if (strict) throw new Error('커스텀 캐릭터 ID 또는 이름이 올바르지 않습니다.');
      return [];
    }
    customIds.add(id);
    const rarity = Number(item.rarity) === 4 ? 4 : 5;
    const element = hasOwn(ELEMENTS, item.element) ? item.element : 'fusion';
    const weapon = hasOwn(WEAPONS, item.weapon) ? item.weapon : undefined;
    const role = PARTY_ROLE_LABELS.has(item.role) ? item.role : '딜러';
    return [{ id, name, rarity, element, role, group: rarity === 5 ? 'limited' : 'four', ...(weapon ? { weapon } : {}) }];
  });

  const charIds = new Set([...builtInIds, ...customIds]);
  result.owned = Object.create(null);
  if (isPlainObject(raw.owned)) {
    Object.entries(raw.owned).forEach(([id, owned]) => {
      if (owned === true && charIds.has(id)) result.owned[id] = true;
    });
  }

  const scheduleIds = new Set();
  result.schedules = (Array.isArray(raw.schedules) ? raw.schedules : []).slice(0, 500).flatMap(item => {
    if (!isPlainObject(item)) return [];
    const id = cleanId(item.id);
    const charId = cleanId(item.charId);
    const start = item.start;
    const end = item.end;
    if (!id || scheduleIds.has(id) || !charIds.has(charId) || !validDate(start) || !validDate(end) || end < start) {
      if (strict) throw new Error('일정 데이터가 올바르지 않습니다.');
      return [];
    }
    scheduleIds.add(id);
    return [{
      id,
      charId,
      name: cleanString(item.name, 80),
      start,
      end,
      saved: cleanInt(item.saved, 0, 9999, 0),
      goal: SCHEDULE_GOALS.has(item.goal) ? item.goal : '명함',
      memo: cleanString(item.memo, 500),
      effectOwner: cleanId(item.effectOwner) || null,
    }];
  });

  const contentIds = new Set(CONTENT_DEFAULTS.map(c => c.id));
  const partyIds = new Set();
  result.parties = (Array.isArray(raw.parties) ? raw.parties : result.parties).slice(0, 100).flatMap(item => {
    if (!isPlainObject(item)) return [];
    const id = cleanId(item.id);
    if (!id || partyIds.has(id)) {
      if (strict) throw new Error('파티 ID가 올바르지 않습니다.');
      return [];
    }
    partyIds.add(id);
    const seen = new Set();
    const sourceMembers = Array.isArray(item.members) ? item.members.slice(0, 3) : [];
    const members = [0, 1, 2].map(i => {
      const member = cleanId(sourceMembers[i]);
      if (!member || !charIds.has(member) || seen.has(member)) return null;
      seen.add(member);
      return member;
    });
    return [{
      id,
      name: cleanString(item.name, 16) || `파티 ${partyIds.size}`,
      members,
      tag: contentIds.has(item.tag) ? item.tag : '',
    }];
  });

  const rawContents = Array.isArray(raw.contents) ? raw.contents : [];
  result.contents = CONTENT_DEFAULTS.map(def => {
    const item = rawContents.find(c => isPlainObject(c) && c.id === def.id);
    if (!item) return clone(def);
    const stages = Array.isArray(item.stages) ? item.stages.slice(0, 50).flatMap(stage => {
      if (!isPlainObject(stage)) return [];
      const name = cleanString(stage.name, 80);
      const mobs = cleanString(stage.mobs, 1000);
      return name || mobs ? [{ name: name || '단계', mobs }] : [];
    }) : clone(def.stages || []);
    return {
      id: def.id,
      icon: def.icon,
      name: cleanString(item.name, 24) || def.name,
      period: cleanInt(item.period, 1, 999, def.period),
      start: validDate(item.start) ? item.start : def.start,
      rules: cleanString(item.rules, 2000) || def.rules,
      buff: cleanString(item.buff, 3000) || def.buff,
      stages,
    };
  });

  result.matOverrides = Object.create(null);
  if (isPlainObject(raw.matOverrides)) {
    Object.entries(raw.matOverrides).forEach(([id, item]) => {
      if (!charIds.has(id) || !isPlainObject(item)) return;
      result.matOverrides[id] = {
        forge: hasOwn(FORGE_FAMILIES, item.forge) ? item.forge : (CHAR_MATS[id]?.[0] || 'drip'),
        drop: hasOwn(DROP_FAMILIES, item.drop) ? item.drop : (CHAR_MATS[id]?.[1] || 'whisperin'),
        weekly: cleanString(item.weekly, 80),
      };
    });
  }

  result.pity = normalizePity(raw.pity);
  const purchases = normalizePurchases(raw.calc?.purchases, { strict });
  const purchasePack = LUNITE_PACK_BASES.has(Number(raw.calc?.purchasePack))
    ? Number(raw.calc.purchasePack) : 6480;
  const purchaseFirstUsed = purchases.some(purchase => purchase.first && purchase.base === purchasePack);
  const lunite = cleanInt(raw.calc?.lunite, 0, 1000000000, 0);
  const sourceSchemaVersion = cleanInt(raw.schemaVersion, 0, STATE_SCHEMA_VERSION, 0);
  result.calc = {
    astrite: cleanInt(raw.calc?.astrite, 0, 1000000000, 0),
    lunite,
    charTickets: cleanInt(raw.calc?.charTickets, 0, 1000000, 0),
    weaponTickets: cleanInt(raw.calc?.weaponTickets, 0, 1000000, 0),
    purchasePlatform: LUNITE_PLATFORM_IDS.has(raw.calc?.purchasePlatform) ? raw.calc.purchasePlatform : 'kuro',
    purchasePack,
    purchaseFirst: raw.calc?.purchaseFirst === true && !purchaseFirstUsed,
    purchases,
    // v2의 빠른 팩 버튼은 구매 계획과 실제 보유 달빛을 구분하지 않았습니다.
    // 출처를 추측해 값을 버리지 않고, 사용자가 한 번 확인하도록 표시합니다.
    legacyLuniteReview: raw.calc?.legacyLuniteReview === true || (sourceSchemaVersion < 3 && lunite > 0),
  };

  const recordIds = new Set();
  result.records = (Array.isArray(raw.records) ? raw.records : []).slice(0, 5000).flatMap(item => {
    if (!isPlainObject(item)) return [];
    const id = cleanId(item.id);
    const type = item.type === 'weapon' ? 'weapon' : item.type === 'char' ? 'char' : '';
    const season = cleanString(item.season, 120);
    const maxPulls = type === 'weapon' ? GACHA.WEAPON_MAX : GACHA.CHAR_MAX;
    const pulls = cleanInt(item.pulls, 1, maxPulls, 0);
    const charId = cleanId(item.charId);
    if (!id || recordIds.has(id) || !type || !season || !pulls || (type === 'char' && !charIds.has(charId))) {
      if (strict) throw new Error('뽑기 기록 데이터가 올바르지 않습니다.');
      return [];
    }
    recordIds.add(id);
    const maxCopy = type === 'char' ? COPY_LABELS.length - 1 : WEAPON_COPY_LABELS.length - 1;
    const record = {
      id,
      season,
      type,
      copy: cleanInt(item.copy, 0, maxCopy, 0),
      pulls,
      lost: type === 'char' && item.lost === true,
      ...(type === 'char' ? { charId } : {
        weaponName: cleanString(item.weaponName, 120) || '픽업 전무',
        ...(charIds.has(charId) ? { charId } : {}),
      }),
    };
    const scheduleId = cleanId(item.scheduleId);
    if (scheduleIds.has(scheduleId)) record.scheduleId = scheduleId;
    const effects = normalizeRecordEffects(item.effects, scheduleIds);
    if (effects) record.effects = effects;
    return [record];
  });

  // 삭제된 기록을 가리키는 구버전 effectOwner는 자동 복원 근거로 사용하지 않습니다.
  const normalizedRecordIds = new Set(result.records.map(record => record.id));
  result.records.forEach(record => {
    const pityEffect = record.effects?.pity;
    if (pityEffect?.before.effectOwner && !normalizedRecordIds.has(pityEffect.before.effectOwner)) {
      delete record.effects.pity;
    }
    const scheduleEffect = record.effects?.schedule;
    if (scheduleEffect?.before.effectOwner && !normalizedRecordIds.has(scheduleEffect.before.effectOwner)) {
      delete record.effects.schedule;
    }
    if (record.effects && !Object.keys(record.effects).length) delete record.effects;
  });
  const recordsById = new Map(result.records.map(record => [record.id, record]));
  Object.entries(result.pity.charGroups).forEach(([groupId, group]) => {
    const effect = recordsById.get(group.effectOwner)?.effects?.pity;
    if (!effect || effect.type !== 'char' || effect.groupId !== groupId) group.effectOwner = null;
  });
  Object.entries(result.pity.weaponGroups).forEach(([groupId, group]) => {
    const effect = recordsById.get(group.effectOwner)?.effects?.pity;
    if (!effect || effect.type !== 'weapon' || effect.groupId !== groupId) group.effectOwner = null;
  });
  result.schedules.forEach(schedule => {
    const effect = recordsById.get(schedule.effectOwner)?.effects?.schedule;
    if (!effect || effect.id !== schedule.id) schedule.effectOwner = null;
  });

  result.schemaVersion = STATE_SCHEMA_VERSION;
  return result;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    return normalizeStateData(JSON.parse(raw));
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
  return hasOwn(state.owned, id) && state.owned[id] === true;
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

function scheduleGoalPlan(goal) {
  if (goal === '전무만') return { char: 0, weapon: GACHA.WEAPON_MAX, total: GACHA.WEAPON_MAX };
  if (goal === '명함+전무') {
    return { char: GACHA.CHAR_MAX, weapon: GACHA.WEAPON_MAX, total: GACHA.CHAR_MAX + GACHA.WEAPON_MAX };
  }
  const match = /^([1-6])돌$/.exec(goal);
  const copies = match ? Number(match[1]) + 1 : 1;
  const char = copies * GACHA.CHAR_MAX;
  return { char, weapon: 0, total: char };
}

function goalIncludesType(goal, type) {
  const plan = scheduleGoalPlan(goal);
  return type === 'weapon' ? plan.weapon > 0 : plan.char > 0;
}

function calculatorPullsForSchedule(schedule, calc = state.calc) {
  const plan = scheduleGoalPlan(schedule.goal);
  const planned = purchasePlanTotals(calc);
  const pool = Math.max(0, +calc.astrite || 0) + Math.max(0, +calc.lunite || 0) + planned.lunite;
  const poolPulls = Math.floor(pool / ASTRITE_PER_PULL);
  return poolPulls +
    (plan.char ? Math.max(0, +calc.charTickets || 0) : 0) +
    (plan.weapon ? Math.max(0, +calc.weaponTickets || 0) : 0);
}

function pullBreakdown(amount) {
  const safe = Math.max(0, Number(amount) || 0);
  const pulls = Math.floor(safe / ASTRITE_PER_PULL);
  const remain = safe % ASTRITE_PER_PULL;
  return `${pulls}뽑${remain ? ` + ${remain.toLocaleString()} 잔여` : ''}`;
}

function bannerPityGroup(banner, type) {
  if (!banner) return type === 'char' ? DEFAULT_CHAR_PITY_GROUP : DEFAULT_WEAPON_PITY_GROUP;
  const field = type === 'char' ? 'charPityGroup' : 'weaponPityGroup';
  return cleanId(banner[field]) || (type === 'char' ? DEFAULT_CHAR_PITY_GROUP : DEFAULT_WEAPON_PITY_GROUP);
}

function pityGroupLabel(type, id) {
  const defaultId = type === 'char' ? DEFAULT_CHAR_PITY_GROUP : DEFAULT_WEAPON_PITY_GROUP;
  if (id === defaultId) return type === 'char' ? '일반 캐릭터 이벤트' : '일반 전무 이벤트';
  const field = type === 'char' ? 'charPityGroup' : 'weaponPityGroup';
  const banner = BANNERS.find(b => b[field] === id);
  return banner ? `Ver ${banner.ver} ${banner.phase}` : id;
}

function ensurePityGroup(type, id) {
  const map = type === 'char' ? state.pity.charGroups : state.pity.weaponGroups;
  if (!map[id]) map[id] = type === 'char'
    ? { count: 0, guaranteed: false, effectOwner: null }
    : { count: 0, effectOwner: null };
  return map[id];
}

function findBannerBySeason(season) {
  return BANNERS.find(b => !b.leaked && bannerSeasonNames(b).includes(season)) || null;
}

function bannerIsActive(banner) {
  const t = today();
  return !!banner && banner.start <= t && t <= banner.end;
}

function bannerContainsRecordTarget(banner, rec) {
  if (!rec.charId || rec.lost) return true;
  return [...(banner.pickup || []), ...(banner.rerun || [])].includes(rec.charId);
}

function resolveActiveBannerForRecord(rec, schedule = null) {
  const overlapsSchedule = banner => !schedule ||
    (scheduleStatus(schedule) === 'ongoing' && schedule.start <= banner.end && banner.start <= schedule.end);
  const exact = findBannerBySeason(rec.season);
  if (bannerIsActive(exact) && bannerContainsRecordTarget(exact, rec) && overlapsSchedule(exact)) return exact;
  if (!schedule && !bannerIsActive(exact)) return null;
  const matches = BANNERS.filter(b => !b.leaked && bannerIsActive(b) &&
    bannerContainsRecordTarget(b, rec) && overlapsSchedule(b));
  return matches.length === 1 ? matches[0] : null;
}

/* ---------------- 탭 ---------------- */

function switchTab(name, { scroll = true, focus = false } = {}) {
  let activeButton = null;
  document.querySelectorAll('.tab-btn').forEach(b => {
    const active = b.dataset.tab === name;
    b.classList.toggle('active', active);
    if (active) {
      b.setAttribute('aria-current', 'page');
      activeButton = b;
    }
    else b.removeAttribute('aria-current');
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    const active = p.id === 'tab-' + name;
    p.classList.toggle('active', active);
    p.hidden = !active;
  });
  if (scroll) window.scrollTo({ top: 0 });
  if (focus) activeButton?.focus();
}

document.getElementById('tabs').addEventListener('click', e => {
  const btn = e.target.closest('.tab-btn');
  if (btn) switchTab(btn.dataset.tab);
});
document.getElementById('goto-roster').addEventListener('click', () => switchTab('roster', { focus: true }));

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
    const plan = scheduleGoalPlan(s.goal);
    const pct = Math.min(100, saved / plan.total * 100);
    const milestones = [];
    for (let n = GACHA.CHAR_MAX; n < plan.char; n += GACHA.CHAR_MAX) milestones.push(n);
    if (plan.char > 0 && plan.weapon > 0) milestones.push(plan.char);
    const milestoneMarks = milestones.map(n =>
      `<div class="mark half" style="left:${(n / plan.total * 100).toFixed(2)}%" title="${n}뽑 지점"></div>`
    ).join('');
    const goalSummary = plan.char && plan.weapon
      ? `캐릭터 ${plan.char} + 전무 ${plan.weapon}`
      : plan.weapon ? `전무 ${plan.weapon}` : `캐릭터 ${plan.char}`;
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
          <div class="gauge-label"><span>모아둔 뽑기</span><b>${saved} / ${plan.total}뽑</b></div>
          <div class="gauge">
            <div class="fill" style="width:${pct}%"></div>
            ${milestoneMarks}
            <div class="mark" style="left:100%;margin-left:-2px" title="목표 ${plan.total}뽑"></div>
          </div>
          <div class="gauge-legend">
            <span><span class="k" style="background:var(--ink-2)"></span>${goalSummary}</span>
            <span><span class="k" style="background:var(--accent)"></span>목표 최악 기준 ${plan.total}뽑</span>
          </div>
        </div>
        ${s.memo ? `<div class="schedule-memo">${esc(s.memo)}</div>` : ''}
      </div>
      <div class="schedule-actions">
        <button class="icon-btn" data-edit-schedule="${s.id}" aria-label="${esc(ch ? ch.name : '픽업')} 일정 수정">수정</button>
        <button class="icon-btn danger-btn" data-del-schedule="${s.id}" aria-label="${esc(ch ? ch.name : '픽업')} 일정 삭제">삭제</button>
      </div>
    </div>`;
  }).join('');
}

document.getElementById('schedule-list').addEventListener('click', e => {
  const editBtn = e.target.closest('[data-edit-schedule]');
  const delBtn = e.target.closest('[data-del-schedule]');
  if (editBtn) openScheduleModal(editBtn.dataset.editSchedule);
  if (delBtn) {
    const target = state.schedules.find(s => s.id === delBtn.dataset.delSchedule);
    if (!target || !confirm(`"${charById(target.charId)?.name || '픽업'}" 일정을 삭제할까요?`)) return;
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
    Object.assign(state.schedules.find(s => s.id === editingScheduleId), data, { effectOwner: null });
  } else {
    state.schedules.push(Object.assign({ id: uid(), effectOwner: null }, data));
  }
  save(); renderSchedules(); renderPityCalc();
  document.getElementById('schedule-modal').close();
  toast('픽업 일정을 저장했어요');
});

/* ================================================================
   1.5 천장 현황 & 재화 계산기
   ================================================================ */

function calculatorResultMarkup(calc = state.calc) {
  const purchaseTotals = purchasePlanTotals(calc);
  const pool = Math.max(0, +calc.astrite || 0) + Math.max(0, +calc.lunite || 0) + purchaseTotals.lunite;
  const poolPulls = Math.floor(pool / ASTRITE_PER_PULL);
  const poolRemain = pool % ASTRITE_PER_PULL;
  const charTickets = Math.max(0, +calc.charTickets || 0);
  const weaponTickets = Math.max(0, +calc.weaponTickets || 0);
  return `
    <div class="calc-total">공용 재화 <b>${pool.toLocaleString()}</b> = <b>${poolPulls}뽑</b> <small>(잔여 ${poolRemain.toLocaleString()})</small></div>
    <div>캐릭터 배너: <b>${poolPulls + charTickets}뽑</b> <small>(공용 ${poolPulls} + 캐릭터권 ${charTickets})</small></div>
    <div>전무 배너: <b>${poolPulls + weaponTickets}뽑</b> <small>(공용 ${poolPulls} + 전무권 ${weaponTickets})</small></div>
    <p class="calc-warning">공용 재화 ${poolPulls}뽑은 두 배너에 동시에 사용할 수 없습니다.</p>`;
}

function updateCalculatorResult() {
  const result = document.getElementById('calc-result');
  if (result) result.innerHTML = calculatorResultMarkup();
}

const CALC_VALUE_INPUTS = {
  'calc-astrite': ['astrite', 1000000000],
  'calc-lunite': ['lunite', 1000000000],
  'calc-chart': ['charTickets', 1000000],
  'calc-weapont': ['weaponTickets', 1000000],
};

function updateCalcValueInput(target, { commit = false } = {}) {
  const config = hasOwn(CALC_VALUE_INPUTS, target?.id) ? CALC_VALUE_INPUTS[target.id] : null;
  if (!config) return false;
  const [field, max] = config;
  const value = cleanInt(target.value, 0, max, 0);
  state.calc[field] = value;
  if (commit) target.value = String(value);
  save(); updateCalculatorResult();
  return true;
}

function renderPityCalc(focusId = '') {
  const wrap = document.getElementById('pity-calc');
  const p = state.pity;
  const c = state.calc;

  const charGroupId = p.selectedCharGroup;
  const weaponGroupId = p.selectedWeaponGroup;
  const charGroup = ensurePityGroup('char', charGroupId);
  const weaponGroup = ensurePityGroup('weapon', weaponGroupId);

  const charLeft5 = GACHA.HARD - Math.min(charGroup.count, GACHA.HARD - 1);
  const charLeftPickup = charGroup.guaranteed ? charLeft5 : charLeft5 + GACHA.HARD;
  const weaponLeft = GACHA.WEAPON_MAX - Math.min(weaponGroup.count, GACHA.WEAPON_MAX - 1);

  const purchaseTotals = purchasePlanTotals(c);

  const schedOpts = state.schedules.map(s => {
    const ch = charById(s.charId);
    return `<option value="${s.id}">${esc(s.name || (ch ? ch.name + ' 픽업' : '일정'))}</option>`;
  }).join('');

  const selectedPack = lunitePack(c.purchasePack) || LUNITE_PACKS[LUNITE_PACKS.length - 1];
  const selectedPlatform = LUNITE_PLATFORMS[c.purchasePlatform] || LUNITE_PLATFORMS.kuro;
  const selectedPrice = selectedPack[selectedPlatform.priceKey];
  const selectedFirstUsed = c.purchases.some(purchase => purchase.first && purchase.base === selectedPack.base);
  const selectedFirst = c.purchaseFirst === true && !selectedFirstUsed;
  const selectedAmount = selectedPack.base + (selectedFirst ? selectedPack.base : selectedPack.bonus);
  const platformOptions = Object.entries(LUNITE_PLATFORMS).map(([id, platform]) =>
    `<option value="${id}" ${id === c.purchasePlatform ? 'selected' : ''}>${esc(platform.label)}</option>`
  ).join('');
  const packOptions = LUNITE_PACKS.map(pack => {
    const price = pack[selectedPlatform.priceKey];
    return `<option value="${pack.base}" ${pack.base === selectedPack.base ? 'selected' : ''}>${pack.base.toLocaleString()} 달빛 · ₩${price.toLocaleString()}</option>`;
  }).join('');
  const purchaseRows = c.purchases.map((purchase, index) => {
    const pack = lunitePack(purchase.base);
    const platform = LUNITE_PLATFORMS[purchase.platform] || LUNITE_PLATFORMS.kuro;
    const price = lunitePurchasePrice(purchase);
    const amount = lunitePurchaseAmount(purchase);
    return `<li>
      <span>${esc(platform.label)} · ${pack.base.toLocaleString()} 팩${purchase.first ? ' · 첫 충전' : ''}</span>
      <b>₩${price.toLocaleString()} → +${amount.toLocaleString()} 달빛</b>
      <button type="button" class="link-btn danger-text" id="calc-remove-purchase-${index}" data-remove-purchase="${index}" aria-label="${index + 1}번째 충전 계획 삭제">삭제</button>
    </li>`;
  }).join('');
  const groupOptions = (type, selected) => pityGroupIds(type).map(id =>
    `<option value="${id}" ${id === selected ? 'selected' : ''}>${esc(pityGroupLabel(type, id))}</option>`
  ).join('');

  wrap.innerHTML = `
  <div class="card pity-card">
    <h3>🎯 캐릭터 배너 천장</h3>
    <label class="pity-group-label" for="pity-char-group">천장 그룹</label>
    <select class="pity-group-select" id="pity-char-group">${groupOptions('char', charGroupId)}</select>
    <div class="pity-count">
      <label class="sr-only" for="pity-char-count">캐릭터 천장 카운트</label>
      <input type="number" id="pity-char-count" min="0" max="${GACHA.HARD - 1}" value="${charGroup.count}" aria-label="캐릭터 천장 카운트">
      <span class="max">/ ${GACHA.HARD}</span>
    </div>
    <button class="chip ${charGroup.guaranteed ? 'active' : ''}" id="pity-guaranteed" aria-pressed="${charGroup.guaranteed}">
      ${charGroup.guaranteed ? '★ 픽업 확정 상태 (픽뚫 이후)' : '반반 상태 (픽뚫 가능)'}
    </button>
    <div class="pity-info">
      다음 5성까지 최대 <b>${charLeft5}뽑</b><br>
      픽업 확보까지 최대 <b>${charLeftPickup}뽑</b> ${charGroup.guaranteed ? '(확정)' : '(픽뚫 시 기준)'}
    </div>
    <div class="pity-btns">
      <button class="ghost-btn" data-pity="char:1" aria-label="캐릭터 천장 1 증가">+1</button>
      <button class="ghost-btn" data-pity="char:10" aria-label="캐릭터 천장 10 증가">+10</button>
      <button class="ghost-btn danger-btn" data-pity="char:reset" aria-label="캐릭터 천장 초기화">초기화</button>
    </div>
    <p class="pity-note">픽업 기록 저장 시 자동으로 리셋돼요.</p>
  </div>

  <div class="card pity-card">
    <h3>⚔ 전무 배너 천장</h3>
    <label class="pity-group-label" for="pity-weapon-group">천장 그룹</label>
    <select class="pity-group-select" id="pity-weapon-group">${groupOptions('weapon', weaponGroupId)}</select>
    <div class="pity-count">
      <label class="sr-only" for="pity-weapon-count">전무 천장 카운트</label>
      <input type="number" id="pity-weapon-count" min="0" max="${GACHA.WEAPON_MAX - 1}" value="${weaponGroup.count}" aria-label="전무 천장 카운트">
      <span class="max">/ ${GACHA.WEAPON_MAX}</span>
    </div>
    <div class="pity-info">
      픽업 전무 확보까지 최대 <b>${weaponLeft}뽑</b> (픽뚫 없음 · 확정)
    </div>
    <div class="pity-btns">
      <button class="ghost-btn" data-pity="weapon:1" aria-label="전무 천장 1 증가">+1</button>
      <button class="ghost-btn" data-pity="weapon:10" aria-label="전무 천장 10 증가">+10</button>
      <button class="ghost-btn danger-btn" data-pity="weapon:reset" aria-label="전무 천장 초기화">초기화</button>
    </div>
    <p class="pity-note">전무 기록 저장 시 자동으로 리셋돼요.</p>
  </div>

  <div class="card calc-card">
    <h3>💎 재화·충전 계산기</h3>
    <fieldset class="calc-section">
      <legend>보유 재화</legend>
      <div class="calc-rows">
        <label>별의 소리 (Astrite) <input type="number" id="calc-astrite" min="0" step="1" inputmode="numeric" value="${c.astrite}"></label>
        <label>달빛 (Lunite) <input type="number" id="calc-lunite" min="0" step="1" inputmode="numeric" value="${c.lunite}"></label>
        <label>한정 캐릭터 뽑기권 <input type="number" id="calc-chart" min="0" step="1" inputmode="numeric" value="${c.charTickets}"></label>
        <label>전무 뽑기권 <input type="number" id="calc-weapont" min="0" step="1" inputmode="numeric" value="${c.weaponTickets}"></label>
      </div>
      ${c.legacyLuniteReview ? `
      <div class="legacy-calc-warning" role="note" aria-label="기존 달빛 값 확인">
        <p><b>기존 달빛 값을 확인해 주세요.</b> 이전 버전의 빠른 팩 버튼으로 더한 값과 직접 입력한 보유량을 구분할 수 없어 그대로 보존했습니다.</p>
        <div>
          <button type="button" class="ghost-btn" id="calc-legacy-keep">현재 보유값으로 확인</button>
          <button type="button" class="ghost-btn danger-btn" id="calc-legacy-clear">달빛 0으로 초기화</button>
        </div>
      </div>` : ''}
    </fieldset>

    <fieldset class="calc-section purchase-planner" aria-describedby="purchase-source">
      <legend>충전 계획</legend>
      <p class="pity-note purchase-source" id="purchase-source">한국 공식 가격 · ${LUNITE_PRICE_CHECKED.replaceAll('-', '.')} 확인. 플랫폼에 따라 결제액이 다릅니다.</p>
      <div class="purchase-controls">
        <label for="calc-platform">가격 기준
          <select id="calc-platform">${platformOptions}</select>
        </label>
        <label for="calc-pack">달빛 팩
          <select id="calc-pack">${packOptions}</select>
        </label>
      </div>
      <label class="purchase-first" for="calc-first">
        <input type="checkbox" id="calc-first" ${selectedFirst ? 'checked' : ''} ${selectedFirstUsed ? 'disabled' : ''} aria-describedby="purchase-first-note">
        <span>이 팩의 첫 충전 보너스 적용</span>
      </label>
      <p class="pity-note" id="purchase-first-note">${selectedFirstUsed ? '이 계획에서 이미 한 번 적용했습니다.' : '계정에 해당 팩의 보너스가 남아 있을 때만 선택하세요. 팩별 1회입니다.'}</p>
      <div class="purchase-preview" aria-live="polite">
        <span>${selectedFirst ? '첫 충전' : '이후 구매'}</span>
        <b>₩${selectedPrice.toLocaleString()} → ${selectedAmount.toLocaleString()} 달빛 → ${pullBreakdown(selectedAmount)}</b>
      </div>
      <button type="button" class="ghost-btn purchase-add" id="calc-add-purchase">구매 계획에 추가</button>

      <div class="purchase-summary" role="status" aria-live="polite">
        <div><span>예상 결제액</span><b>₩${purchaseTotals.won.toLocaleString()}</b></div>
        <div><span>충전으로 추가</span><b>${purchaseTotals.lunite.toLocaleString()} 달빛</b></div>
      </div>
      ${c.purchases.length ? `
      <ol class="purchase-list">${purchaseRows}</ol>
      <button type="button" class="link-btn danger-text purchase-clear" id="calc-clear-purchases">충전 계획 전체 삭제</button>` : '<p class="pity-note purchase-empty">아직 추가한 구매 계획이 없습니다.</p>'}
    </fieldset>

    <div class="calc-result" id="calc-result" role="status" aria-live="polite">${calculatorResultMarkup(c)}</div>
    ${state.schedules.length ? `
    <div class="calc-apply">
      <select id="calc-schedule" aria-label="계산 결과를 반영할 일정">${schedOpts}</select>
      <button class="ghost-btn" id="calc-apply-btn">일정에 반영</button>
    </div>` : '<p class="pity-note">픽업 일정을 추가하면 계산 결과를 일정 게이지에 바로 반영할 수 있어요.</p>'}
    <details class="pack-details">
      <summary>팩 가격·보너스 비교</summary>
      <div class="pack-table-wrap" role="region" tabindex="0" aria-label="플랫폼별 달빛 팩 가격과 보너스 비교표">
        <table class="banner-table">
          <caption class="sr-only">플랫폼별 달빛 팩 가격과 일반·첫 충전 지급량</caption>
          <thead><tr><th scope="col">팩</th><th scope="col">쿠로 공시</th><th scope="col">PS5</th><th scope="col">이후 구매</th><th scope="col">첫 충전</th></tr></thead>
          <tbody>${LUNITE_PACKS.map(pack => {
            const regular = pack.base + pack.bonus;
            const first = pack.base * 2;
            return `<tr>
              <td>${pack.base.toLocaleString()}</td>
              <td>₩${pack.price.toLocaleString()}</td>
              <td>₩${pack.psPrice.toLocaleString()}</td>
              <td>${regular.toLocaleString()} <small>${pullBreakdown(regular)}</small></td>
              <td>${first.toLocaleString()} <small>${pullBreakdown(first)}</small></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
      <p class="pity-note">가격·보너스는 쿠로게임즈 한국 상품 정보와 PlayStation 한국 스토어 기준입니다. 실제 결제 전 게임 또는 스토어 결제 화면의 금액과 보너스를 최종 확인하세요.</p>
    </details>
  </div>`;
  if (focusId) document.getElementById(focusId)?.focus?.();
}

document.getElementById('pity-calc').addEventListener('click', e => {
  const pityBtn = e.target.closest('[data-pity]');
  if (pityBtn) {
    const [kind, act] = pityBtn.dataset.pity.split(':');
    const groupId = kind === 'char' ? state.pity.selectedCharGroup : state.pity.selectedWeaponGroup;
    const group = ensurePityGroup(kind, groupId);
    group.effectOwner = null;
    if (kind === 'char') {
      if (act === 'reset') { group.count = 0; group.guaranteed = false; }
      else group.count = Math.min(GACHA.HARD - 1, group.count + +act);
    } else {
      group.count = act === 'reset' ? 0 : Math.min(GACHA.WEAPON_MAX - 1, group.count + +act);
    }
    save(); renderPityCalc();
    return;
  }
  if (e.target.closest('#pity-guaranteed')) {
    const group = ensurePityGroup('char', state.pity.selectedCharGroup);
    group.guaranteed = !group.guaranteed;
    group.effectOwner = null;
    save(); renderPityCalc();
    return;
  }
  if (e.target.closest('#calc-add-purchase')) {
    const result = addSelectedLunitePurchase();
    if (!result.ok) {
      if (result.reason === 'limit') toast('충전 계획은 최대 100개까지 추가할 수 있어요');
      else toast('같은 팩의 첫 충전 보너스는 한 번만 적용할 수 있어요');
      save(); renderPityCalc('calc-add-purchase');
      return;
    }
    save(); renderPityCalc('calc-add-purchase');
    toast(`₩${lunitePurchasePrice(result.purchase).toLocaleString()} 구매 계획을 추가했어요`);
    return;
  }
  const removePurchase = e.target.closest('[data-remove-purchase]');
  if (removePurchase) {
    const index = Number(removePurchase.dataset.removePurchase);
    if (Number.isInteger(index) && index >= 0 && index < state.calc.purchases.length) {
      state.calc.purchases.splice(index, 1);
      state.calc.purchaseFirst = false;
      const nextIndex = Math.min(index, state.calc.purchases.length - 1);
      const nextFocus = nextIndex >= 0 ? `calc-remove-purchase-${nextIndex}` : 'calc-add-purchase';
      save(); renderPityCalc(nextFocus);
    }
    return;
  }
  if (e.target.closest('#calc-clear-purchases')) {
    state.calc.purchases = [];
    state.calc.purchaseFirst = false;
    save(); renderPityCalc('calc-add-purchase');
    return;
  }
  if (e.target.closest('#calc-legacy-keep')) {
    state.calc.legacyLuniteReview = false;
    save(); renderPityCalc('calc-lunite');
    toast('현재 달빛을 보유값으로 확인했어요');
    return;
  }
  if (e.target.closest('#calc-legacy-clear')) {
    if (!confirm('기존 달빛 값을 0으로 초기화할까요?')) return;
    state.calc.lunite = 0;
    state.calc.legacyLuniteReview = false;
    save(); renderPityCalc('calc-lunite');
    toast('기존 달빛 값을 0으로 초기화했어요');
    return;
  }
  if (e.target.closest('#calc-apply-btn')) {
    const sel = document.getElementById('calc-schedule');
    const s = state.schedules.find(x => x.id === sel.value);
    if (!s) return;
    const pulls = calculatorPullsForSchedule(s);
    s.saved = pulls;
    s.effectOwner = null;
    save(); renderSchedules(); renderPityCalc();
    toast(`일정의 모아둔 뽑기를 ${pulls}뽑으로 반영했어요`);
  }
});

document.getElementById('pity-calc').addEventListener('input', e => {
  updateCalcValueInput(e.target);
});

document.getElementById('pity-calc').addEventListener('change', e => {
  const id = e.target.id;
  const v = Math.max(0, +e.target.value || 0);
  if (updateCalcValueInput(e.target, { commit: true })) return;
  if (id === 'pity-char-group' && pityGroupIds('char').includes(e.target.value)) {
    state.pity.selectedCharGroup = e.target.value;
  } else if (id === 'pity-weapon-group' && pityGroupIds('weapon').includes(e.target.value)) {
    state.pity.selectedWeaponGroup = e.target.value;
  } else if (id === 'pity-char-count') {
    const group = ensurePityGroup('char', state.pity.selectedCharGroup);
    group.count = Math.min(GACHA.HARD - 1, v);
    group.effectOwner = null;
  } else if (id === 'pity-weapon-count') {
    const group = ensurePityGroup('weapon', state.pity.selectedWeaponGroup);
    group.count = Math.min(GACHA.WEAPON_MAX - 1, v);
    group.effectOwner = null;
  }
  else if (id === 'calc-platform' && LUNITE_PLATFORM_IDS.has(e.target.value)) {
    state.calc.purchasePlatform = e.target.value;
  }
  else if (id === 'calc-pack' && LUNITE_PACK_BASES.has(Number(e.target.value))) {
    state.calc.purchasePack = Number(e.target.value);
    state.calc.purchaseFirst = false;
  }
  else if (id === 'calc-first') {
    const firstUsed = state.calc.purchases.some(purchase => purchase.first && purchase.base === state.calc.purchasePack);
    state.calc.purchaseFirst = e.target.checked === true && !firstUsed;
  }
  else return;
  const restoreFocus = ['calc-platform', 'calc-pack', 'calc-first'].includes(id) ? id : '';
  save(); renderPityCalc(restoreFocus);
});

// 진행 중인 배너 기록만 해당 천장 그룹과 겹치는 일정을 갱신합니다.
function applyRecordSideEffects(rec) {
  const explicitSchedule = rec.scheduleId
    ? state.schedules.find(s => s.id === rec.scheduleId) : null;
  const referencedBanner = findBannerBySeason(rec.season);
  const banner = resolveActiveBannerForRecord(rec, explicitSchedule);
  if (!banner) {
    return referencedBanner && !bannerIsActive(referencedBanner)
      ? ' (과거·예정 배너라 현재 천장과 일정은 유지)'
      : ' (현재 배너와 기록 대상을 확인할 수 없어 천장과 일정은 유지)';
  }

  const notes = [];
  const groupId = bannerPityGroup(banner, rec.type);
  const group = ensurePityGroup(rec.type, groupId);
  const beforePity = {
    count: group.count,
    guaranteed: rec.type === 'char' && group.guaranteed === true,
    effectOwner: group.effectOwner || null,
  };
  const afterPity = {
    count: 0,
    guaranteed: rec.type === 'char' && rec.lost === true,
  };
  rec.effects = {
    pity: { type: rec.type, groupId, before: beforePity, after: afterPity },
  };
  group.count = afterPity.count;
  if (rec.type === 'char') group.guaranteed = afterPity.guaranteed;
  group.effectOwner = rec.id;
  if (beforePity.count > 0 || beforePity.guaranteed !== afterPity.guaranteed) {
    notes.push(`${pityGroupLabel(rec.type, groupId)} 천장 갱신`);
  }
  if (rec.type === 'char') state.pity.selectedCharGroup = groupId;
  else state.pity.selectedWeaponGroup = groupId;

  if (rec.charId) {
    const schedules = state.schedules.filter(s =>
      s.charId === rec.charId &&
      scheduleStatus(s) === 'ongoing' &&
      s.start <= banner.end && banner.start <= s.end &&
      goalIncludesType(s.goal, rec.type) &&
      (!rec.scheduleId || s.id === rec.scheduleId)
    );
    if (schedules.length === 1 && schedules[0].saved > 0) {
      const sched = schedules[0];
      const before = sched.saved;
      sched.saved = Math.max(0, sched.saved - rec.pulls);
      rec.effects.schedule = {
        id: sched.id,
        before: { saved: before, effectOwner: sched.effectOwner || null },
        after: { saved: sched.saved },
      };
      sched.effectOwner = rec.id;
      notes.push(`일정 뽑기 ${before} → ${sched.saved}`);
    }
  }
  renderSchedules(); renderPityCalc();
  return notes.length ? ` (${notes.join(' · ')})` : '';
}

function revertRecordSideEffects(rec) {
  const notes = [];
  const pityEffect = rec.effects?.pity;
  if (pityEffect) {
    const group = ensurePityGroup(pityEffect.type, pityEffect.groupId);
    const unchanged = group.effectOwner === rec.id &&
      group.count === pityEffect.after.count &&
      (pityEffect.type !== 'char' || group.guaranteed === pityEffect.after.guaranteed);
    if (unchanged) {
      group.count = pityEffect.before.count;
      if (pityEffect.type === 'char') group.guaranteed = pityEffect.before.guaranteed;
      group.effectOwner = pityEffect.before.effectOwner;
      notes.push('천장 복원');
    } else {
      notes.push('이후 변경된 천장은 유지');
    }
  }
  const scheduleEffect = rec.effects?.schedule;
  if (scheduleEffect) {
    const schedule = state.schedules.find(s => s.id === scheduleEffect.id);
    if (schedule && schedule.effectOwner === rec.id && schedule.saved === scheduleEffect.after.saved) {
      schedule.saved = scheduleEffect.before.saved;
      schedule.effectOwner = scheduleEffect.before.effectOwner;
      notes.push('일정 뽑기 복원');
    } else {
      notes.push('이후 변경된 일정은 유지');
    }
  }
  return notes.length ? ` (${notes.join(' · ')})` : '';
}

// 오래된 기록을 먼저 삭제해도 최신 기록의 복원 체인이 끊기지 않게 이전 상태를 넘겨줍니다.
function rebaseRecordEffectsForDeletion(rec) {
  const sourcePity = rec.effects?.pity;
  const sourceSchedule = rec.effects?.schedule;
  state.records.forEach(other => {
    if (other.id === rec.id) return;
    const targetPity = other.effects?.pity;
    if (sourcePity && targetPity && targetPity.before.effectOwner === rec.id &&
        targetPity.type === sourcePity.type && targetPity.groupId === sourcePity.groupId) {
      targetPity.before = clone(sourcePity.before);
    }
    const targetSchedule = other.effects?.schedule;
    if (sourceSchedule && targetSchedule && targetSchedule.before.effectOwner === rec.id &&
        targetSchedule.id === sourceSchedule.id) {
      targetSchedule.before = clone(sourceSchedule.before);
    }
  });
}

/* ================================================================
   2. 파티 편성 (드래그 & 드롭)
   ================================================================ */

function partyRoleKey(character) {
  const role = String(character?.role || '');
  if (role.startsWith('힐러')) return 'healer';
  if (role.startsWith('서브딜러') || role.startsWith('오프필드')) return 'subdealer';
  if (role.startsWith('딜러') || role.startsWith('버스트 딜러') || role.startsWith('주인공')) return 'dealer';
  if (role.includes('힐') || role.includes('회복')) return 'healer';
  if (['서브딜러', '서포터', '버퍼', '탱커', '오프필드'].some(keyword => role.includes(keyword))) {
    return 'subdealer';
  }
  return 'dealer';
}

function partyRoleGroup(character) {
  return PARTY_ROLE_GROUPS.find(group => group.id === partyRoleKey(character)) || PARTY_ROLE_GROUPS[0];
}

function ignoredPartySlot(ignoreSlots, partyId, idx) {
  return ignoreSlots.some(slot => slot.partyId === partyId && slot.idx === idx);
}

function memberPlacementIssue(partyId, idx, charId, { ignoreSlots = [] } = {}) {
  if (!charId) return null;
  const party = state.parties.find(item => item.id === partyId);
  if (!party) return { code: 'missing-party', message: '파티를 찾을 수 없어요' };

  const sameParty = party.members.some((member, memberIdx) =>
    member === charId &&
    memberIdx !== idx &&
    !ignoredPartySlot(ignoreSlots, party.id, memberIdx));
  if (sameParty) {
    return { code: 'same-party', party, message: '현재 파티에 편성 중' };
  }

  if (!party.tag) {
    const otherParty = state.parties.find(item =>
      item.id !== party.id &&
      item.members.some((member, memberIdx) =>
        member === charId && !ignoredPartySlot(ignoreSlots, item.id, memberIdx)));
    if (otherParty) {
      return {
        code: 'other-party',
        party: otherParty,
        message: `${otherParty.name} 편성 중`,
      };
    }
  }
  return null;
}

function generalModeConflicts(party) {
  if (!party) return [];
  return [...new Set(party.members.filter(Boolean))].filter(charId =>
    state.parties.some(item =>
      item.id !== party.id &&
      item.members.includes(charId)));
}

function existingGeneralPartyConflicts(party) {
  if (!party || party.tag) return [];
  return [...new Set(party.members.filter(Boolean))].filter(charId =>
    state.parties.some(item =>
      item.id !== party.id &&
      !item.tag &&
      item.members.includes(charId)));
}

function placementToast(issue) {
  if (!issue) return '';
  if (issue.code === 'same-party') return '이미 이 파티에 있는 캐릭터예요';
  if (issue.code === 'other-party') {
    return `일반 파티에서는 "${issue.party.name}"과 같은 캐릭터를 쓸 수 없어요`;
  }
  return issue.message;
}

function renderRosterStrip() {
  const strip = document.getElementById('roster-strip');
  const owned = allChars().filter(c => isOwned(c.id));
  if (!owned.length) {
    strip.innerHTML = `<div class="empty-note" style="border:none;width:100%">보유 캐릭터가 없어요. [보유 캐릭터] 탭에서 캐릭터를 클릭해 등록해 주세요.</div>`;
    return;
  }
  strip.innerHTML = PARTY_ROLE_GROUPS.map(group => {
    const characters = owned.filter(character => partyRoleKey(character) === group.id);
    return `
      <section class="roster-role-group" aria-labelledby="roster-role-${group.id}">
        <h3 id="roster-role-${group.id}">
          <span aria-hidden="true">${group.icon}</span> ${group.label}
          <span class="role-count">${characters.length}</span>
        </h3>
        <div class="roster-role-list">
          ${characters.length ? characters.map(character => `
            <div class="roster-chip" draggable="true" data-drag-char="${character.id}" title="${esc(character.role || group.label)}">
              ${avatarHTML(character)}
              <span class="nm">${esc(character.name)}</span>
            </div>`).join('') : '<span class="role-empty">보유 캐릭터 없음</span>'}
        </div>
      </section>`;
  }).join('');
}

function renderParties() {
  const wrap = document.getElementById('party-list');
  if (!state.parties.length) {
    wrap.innerHTML = `<div class="empty-note">파티가 없어요. [+ 파티 추가]로 새 파티를 만들어 보세요.</div>`;
    return;
  }
  wrap.innerHTML = state.parties.map(p => {
    const conflicts = existingGeneralPartyConflicts(p);
    const modeText = p.tag
      ? '콘텐츠 파티 · 다른 파티와 캐릭터 중복 가능'
      : conflicts.length
        ? '일반 파티 · 기존 중복 캐릭터를 빼 주세요'
        : '일반 파티 · 다른 모든 파티와 캐릭터 중복 불가';
    return `
    <div class="party-card ${conflicts.length ? 'has-conflict' : ''}" data-party="${p.id}">
      <div class="party-head">
        <input class="party-name" value="${esc(p.name)}" maxlength="16" data-party-name="${p.id}" aria-label="${esc(p.name)} 이름">
        <select class="party-tag" data-party-tag="${p.id}" title="콘텐츠를 선택하면 다른 파티와 캐릭터를 중복 편성할 수 있어요" aria-label="${esc(p.name)} 콘텐츠 선택">
          <option value="">일반 파티</option>
          ${state.contents.map(c => `<option value="${c.id}" ${p.tag === c.id ? 'selected' : ''}>${esc(c.icon || '')} ${esc(c.name)}</option>`).join('')}
        </select>
        <button class="icon-btn danger-btn" data-del-party="${p.id}" title="파티 삭제" aria-label="${esc(p.name)} 삭제">✕</button>
      </div>
      <p class="party-mode-note ${conflicts.length ? 'conflict' : p.tag ? 'content-mode' : ''}">
        <span aria-hidden="true">${p.tag ? '↻' : conflicts.length ? '!' : '🔒'}</span> ${modeText}
      </p>
      <div class="party-slots">
        ${p.members.map((m, i) => {
          const ch = m ? charById(m) : null;
          if (ch) {
            return `<div class="party-slot filled" draggable="true" data-slot data-party-id="${p.id}" data-idx="${i}" data-drag-char="${ch.id}" role="group" aria-label="${esc(p.name)} ${i + 1}번 슬롯, ${esc(ch.name)}">
              ${avatarHTML(ch)}
              <span class="nm">${esc(ch.name)}</span>
              <button class="slot-remove" data-remove-member title="빼기" aria-label="${esc(p.name)}에서 ${esc(ch.name)} 빼기">✕</button>
            </div>`;
          }
          return `<button type="button" class="party-slot" data-slot data-party-id="${p.id}" data-idx="${i}" aria-label="${esc(p.name)} ${i + 1}번 빈 슬롯에 캐릭터 추가">
            <span class="plus">＋</span><span>클릭 또는<br>드래그로 추가</span>
          </button>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

document.getElementById('add-party-btn').addEventListener('click', () => {
  state.parties.push({ id: uid(), name: `파티 ${state.parties.length + 1}`, members: [null, null, null], tag: '' });
  save(); renderParties();
});

const partyList = document.getElementById('party-list');

partyList.addEventListener('click', e => {
  const del = e.target.closest('[data-del-party]');
  if (del) {
    const target = state.parties.find(p => p.id === del.dataset.delParty);
    if (!target || !confirm(`"${target.name}" 파티를 삭제할까요?`)) return;
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
    save(); renderContents(); renderParties();
    return;
  }
  const tagSel = e.target.closest('[data-party-tag]');
  if (tagSel) {
    const p = state.parties.find(x => x.id === tagSel.dataset.partyTag);
    if (!p) return;
    const nextTag = tagSel.value;
    if (!nextTag && p.tag && generalModeConflicts(p).length) {
      const names = generalModeConflicts(p)
        .map(charId => charById(charId)?.name)
        .filter(Boolean)
        .join(', ');
      tagSel.value = p.tag;
      toast(`${names || '중복 캐릭터'}를 다른 일반 파티에서 먼저 빼 주세요`);
      return;
    }
    p.tag = nextTag;
    save(); renderContents(); renderParties();
    const ct = state.contents.find(c => c.id === nextTag);
    if (ct) toast(`"${p.name}" 파티를 ${ct.name}에 연결했어요`);
    else toast(`"${p.name}" 파티를 일반 파티로 변경했어요`);
  }
});

function setMember(partyId, idx, charId, { silent = false } = {}) {
  const p = state.parties.find(x => x.id === partyId);
  if (!p) return false;
  const issue = memberPlacementIssue(partyId, idx, charId);
  if (issue) {
    if (!silent) toast(placementToast(issue));
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
    if (pFrom.members[fromIdx] !== charId) return;
    if (fromParty === toParty) {
      pTo.members[fromIdx] = displaced ?? null;
      pTo.members[toIdx] = charId;
    } else {
      const ignoreSource = [{ partyId: fromParty, idx: fromIdx }];
      const targetIssue = memberPlacementIssue(toParty, toIdx, charId, { ignoreSlots: ignoreSource });
      if (targetIssue) {
        toast(placementToast(targetIssue));
        return;
      }
      const sourceIssue = displaced
        ? memberPlacementIssue(fromParty, fromIdx, displaced, {
          ignoreSlots: [{ partyId: toParty, idx: toIdx }],
        })
        : null;
      if (sourceIssue) {
        toast(`교환할 수 없어요: ${placementToast(sourceIssue)}`);
        return;
      }
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
  if (!party) return;
  const grid = document.getElementById('picker-grid');
  const owned = allChars().filter(c => isOwned(c.id));
  const cell = character => {
    const issue = memberPlacementIssue(partyId, idx, character.id);
    const group = partyRoleGroup(character);
    const ariaLabel = issue
      ? `${character.name}, 선택 불가: ${issue.message}`
      : `${character.name}, ${group.label}로 선택`;
    return `
      <button type="button" class="picker-cell" data-pick="${character.id}" ${issue ? 'disabled' : ''}
        aria-label="${esc(ariaLabel)}"
        title="${esc(issue?.message || character.role || group.label)}">
        ${avatarHTML(character, { small: false, gray: Boolean(issue) })}
        <span class="nm">${esc(character.name)}</span>
        ${issue ? `<span class="picker-state">${esc(issue.message)}</span>` : ''}
      </button>`;
  };
  grid.innerHTML = owned.length
    ? PARTY_ROLE_GROUPS.map(group => {
      const characters = owned.filter(character => partyRoleKey(character) === group.id);
      return `
        <section class="picker-role-group" aria-labelledby="picker-role-${group.id}">
          <div class="picker-role-head">
            <h4 id="picker-role-${group.id}"><span aria-hidden="true">${group.icon}</span> ${group.label}</h4>
            <span>${characters.length}명</span>
          </div>
          <div class="picker-role-list">
            ${characters.length ? characters.map(cell).join('') : '<p class="picker-role-empty">보유 캐릭터가 없어요.</p>'}
          </div>
        </section>`;
    }).join('')
    : '<div class="empty-note">보유 캐릭터가 없어요. 보유 캐릭터 탭에서 먼저 등록해 주세요.</div>';
  document.getElementById('picker-modal-title').textContent = `${party.name} · ${idx + 1}번 슬롯`;
  document.getElementById('picker-note').textContent = party.tag
    ? '콘텐츠 파티는 다른 파티에서 사용 중인 캐릭터도 선택할 수 있어요. 같은 파티 안에서는 중복할 수 없습니다.'
    : '일반 파티는 다른 모든 파티에서 사용 중인 캐릭터를 선택할 수 없습니다. 콘텐츠를 선택한 파티만 중복 편성이 가능합니다.';
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
        <div class="char-cell-wrap">
          <button type="button" class="char-cell ${isOwned(c.id) ? 'owned' : ''}" data-toggle-own="${c.id}" aria-pressed="${isOwned(c.id)}" aria-label="${esc(c.name)} 보유 상태 ${isOwned(c.id) ? '해제' : '등록'}">
            ${avatarHTML(c, { gray: !isOwned(c.id) })}
            <span class="nm">${esc(c.name)}</span>
            <span class="tag">${ELEMENTS[c.element]?.name ?? ''}${c.ver ? ' · ' + c.ver : ''}</span>
            <span class="owned-check">✔ 보유</span>
          </button>
          ${state.customChars.some(x => x.id === c.id)
            ? `<button type="button" class="custom-char-delete" data-del-custom="${c.id}" aria-label="${esc(c.name)} 커스텀 캐릭터 삭제">삭제</button>` : ''}
        </div>`).join('')}
      </div>`;
  }).join('') || `<div class="empty-note">조건에 맞는 캐릭터가 없어요.</div>`;

  const total = chars.length;
  const ownedN = chars.filter(c => isOwned(c.id)).length;
  document.getElementById('own-summary').textContent =
    `보유 ${ownedN} / ${total} — 클릭하면 보유 상태가 토글됩니다.`;
}

document.getElementById('roster-grid').addEventListener('click', e => {
  const customDelete = e.target.closest('[data-del-custom]');
  if (customDelete) {
    const id = customDelete.dataset.delCustom;
    const character = state.customChars.find(c => c.id === id);
    if (!character || !confirm(`"${character.name}" 커스텀 캐릭터와 연결된 일정·기록을 모두 삭제할까요?`)) return;
    state.customChars = state.customChars.filter(c => c.id !== id);
    delete state.owned[id];
    delete state.matOverrides[id];
    state.schedules = state.schedules.filter(s => s.charId !== id);
    state.records = state.records.filter(r => r.charId !== id);
    state.parties.forEach(p => { p.members = p.members.map(m => m === id ? null : m); });
    save(); renderAll(); toast(`${character.name} 캐릭터를 삭제했어요`);
    return;
  }
  const cell = e.target.closest('[data-toggle-own]');
  if (!cell) return;
  const id = cell.dataset.toggleOwn;
  if (isOwned(id)) {
    const inParty = state.parties.some(p => p.members.includes(id));
    if (inParty && !confirm('보유를 해제하면 편성된 모든 파티에서도 빠집니다. 계속할까요?')) return;
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
  document.querySelectorAll('#roster-filter .chip').forEach(c => {
    const active = c === chip;
    c.classList.toggle('active', active);
    c.setAttribute('aria-pressed', String(active));
  });
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
    role: document.getElementById('cus-role').value,
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
  [...(b.pickup || []), ...(b.rerun || [])].forEach(id => {
    const c = charById(id);
    if (!c) return;
    [c.name, ...(OLD_NAME_ALIASES[c.name] || [])]
      .forEach(name => names.push(`${name} 픽업`));
  });
  return [...new Set(names)];
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
    <button class="record-del" data-del-record="${r.id}" title="삭제" aria-label="${esc(r.type === 'char' ? (charById(r.charId)?.name || '캐릭터') : (r.weaponName || '전무'))} 기록 삭제">✕</button>
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
        <select class="bc-target" aria-label="${esc(label)} 기록 대상">${targetOpts}</select>
        <select class="bc-copy" aria-label="${esc(label)} 획득 회차"></select>
        <input class="bc-pulls" type="number" min="1" max="${GACHA.CHAR_MAX}" placeholder="몇 뽑?" aria-label="${esc(label)} 소모한 뽑기 수">
        <label class="bc-lost"><input type="checkbox" class="bc-lost-chk"> 픽뚫</label>
        <button class="bc-save primary-btn" aria-label="${esc(label)} 뽑기 기록 저장">기록</button>
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
    if (!rec.lost && !isOwned(charId)) {
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
    const freePulls = BANNERS.reduce((sum, banner) => {
      if (!banner.freePulls) return sum;
      const seasons = new Set(bannerSeasonNames(banner));
      const used = recs.filter(r => r.type === 'char' && seasons.has(r.season))
        .reduce((n, r) => n + r.pulls, 0);
      return sum + Math.min(banner.freePulls, used);
    }, 0);
    const paidPulls = Math.max(0, totalPulls - freePulls);
    const avgLuck = recs.reduce((a, r) => a + recordLuck(r), 0) / recs.length;
    const grade = luckGrade(avgLuck);
    const charRecs = recs.filter(r => r.type === 'char');
    const weaponRecs = recs.filter(r => r.type === 'weapon');
    stats.innerHTML = `
      <div class="stat-tile"><div class="lbl">총 소모 뽑기</div><div class="val">${totalPulls.toLocaleString()}뽑</div><div class="sub">약 ${(paidPulls * ASTRITE_PER_PULL).toLocaleString()} 별의 소리${freePulls ? ` · 무료 ${freePulls}뽑 제외` : ''}</div></div>
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
      <button class="record-del" data-del-record="${r.id}" title="기록 삭제" aria-label="${esc(r.type === 'char' ? (ch?.name || '캐릭터') : (r.weaponName || '전무'))} 기록 삭제">✕</button>
    </div>`;
  }).join('');
}

// 기록 삭제 — 배너 카드와 기타 목록 양쪽에서 동작
document.addEventListener('click', e => {
  const del = e.target.closest('[data-del-record]');
  if (!del) return;
  const record = state.records.find(r => r.id === del.dataset.delRecord);
  if (!record || !confirm('이 뽑기 기록을 삭제할까요? 자동 반영된 천장·일정도 가능한 범위에서 복원됩니다.')) return;
  rebaseRecordEffectsForDeletion(record);
  const extra = revertRecordSideEffects(record);
  state.records = state.records.filter(r => r.id !== del.dataset.delRecord);
  save(); renderRecords(); renderSchedules(); renderPityCalc(); toast(`기록을 삭제했어요${extra}`);
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
    return `<option value="schedule:${s.id}">내 일정 · ${esc(label)}</option>`;
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

function syncRecordScheduleCharacter(value = document.getElementById('rec-banner').value) {
  document.getElementById('rec-banner-custom-row').hidden = value !== '__custom__';
  if (!value.startsWith('schedule:')) return;
  const schedule = state.schedules.find(s => s.id === value.slice('schedule:'.length));
  if (schedule) document.getElementById('rec-char').value = schedule.charId;
}

document.getElementById('rec-banner').addEventListener('change', e => {
  syncRecordScheduleCharacter(e.target.value);
});

document.getElementById('add-record-btn').addEventListener('click', () => {
  refreshRecordFormOptions();
  refreshCopyOptions();
  document.getElementById('record-form').reset();
  refreshCopyOptions();
  syncRecordScheduleCharacter();
  document.getElementById('record-modal').showModal();
});

document.getElementById('record-form').addEventListener('submit', e => {
  e.preventDefault();
  const type = document.getElementById('rec-type').value;
  let season = document.getElementById('rec-banner').value;
  let scheduleId = null;
  let linkedSchedule = null;
  if (season.startsWith('schedule:')) {
    scheduleId = season.slice('schedule:'.length);
    linkedSchedule = state.schedules.find(s => s.id === scheduleId);
    if (!linkedSchedule) { toast('연결된 일정을 찾을 수 없어요'); return; }
    season = linkedSchedule.name || `${charById(linkedSchedule.charId)?.name || '픽업'} 일정`;
  }
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
  if (scheduleId) rec.scheduleId = scheduleId;
  if (type === 'char') {
    rec.charId = linkedSchedule?.charId || document.getElementById('rec-char').value;
    // 기록한 캐릭터는 자동으로 보유 처리
    if (!isOwned(rec.charId)) {
      state.owned[rec.charId] = true;
      renderRoster(); renderRosterStrip();
    }
  } else {
    rec.weaponName = document.getElementById('rec-weapon-name').value.trim() || '픽업 전무';
    if (linkedSchedule) rec.charId = linkedSchedule.charId;
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
        <span class="ct-icon">${esc(c.icon || '📌')}</span>
        <div class="t">
          <b>${esc(c.name)}</b>
          <small>${cleanInt(c.period, 1, 999, 1)}일 주기 · 이번 주기 ${fmtShort(new Date(new Date(info.next).getTime() - cleanInt(c.period, 1, 999, 1) * 86400000))} ~ ${fmtShort(new Date(info.next))}</small>
        </div>
        <button class="icon-btn" data-edit-content="${c.id}" aria-label="${esc(c.name)} 정보 수정">수정</button>
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
  c.period = cleanInt(document.getElementById('ct-period').value, 1, 999, c.period);
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
    <button class="mat-char ${selectedMatChar === c.id ? 'selected' : ''}" data-mat-char="${c.id}" aria-pressed="${selectedMatChar === c.id}">
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
    <p class="mat-note">※ 수량은 포르테 풀강(전 노드) / 돌파(0→6돌파, Lv.90 상한) 기준 공통 수치. 주간 재료는 스킬 1개 1→10에 ×4씩. Lv.90 경험치까지 포함하면 ${esc(ASC_TOTALS.exp)} + 클램 코인 총 ${ASC_TOTALS.creditsWithExp}이 추가로 들어요. 재료명은 한국어 정식 명칭(2026-07-11 DB 대조) 기준.</p>
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

  // 포인터(마우스·터치)와 키보드 툴팁
  const tip = document.getElementById('chart-tip');
  const status = document.getElementById('chart-status');
  const dotC = svg.querySelector('#hover-dot-c');
  const dotW = svg.querySelector('#hover-dot-w');
  const hline = svg.querySelector('#hover-line');
  let activeN = GACHA.HARD;

  function showTipAt(n, clientX, clientY, announce = false) {
    n = Math.max(1, Math.min(maxX, Math.round(n)));
    activeN = n;
    const cp = charCdf[n];
    const wp = n <= GACHA.WEAPON_MAX ? wpCdf[n] : null;
    hline.setAttribute('x1', x(n)); hline.setAttribute('x2', x(n));
    hline.style.display = '';
    dotC.setAttribute('cx', x(n)); dotC.setAttribute('cy', y(cp));
    dotC.style.display = '';
    let wpText = '';
    if (wp !== null) {
      dotW.setAttribute('cx', x(n)); dotW.setAttribute('cy', y(wp));
      dotW.style.display = '';
      wpText = `<br>전무: <b>${(wp * 100).toFixed(1)}%</b>`;
    } else {
      dotW.style.display = 'none';
    }
    tip.innerHTML = `<b>${n}뽑</b> 이내 획득 확률<br>픽업 캐릭터: <b>${(cp * 100).toFixed(1)}%</b>${wpText}`;
    tip.style.display = 'block';
    const rect = svg.getBoundingClientRect();
    const px = Number.isFinite(clientX) ? clientX : rect.left + rect.width / 2;
    const py = Number.isFinite(clientY) ? clientY : rect.top + rect.height / 2;
    tip.style.left = Math.max(8, Math.min(window.innerWidth - 180, px + 14)) + 'px';
    tip.style.top = Math.max(8, Math.min(window.innerHeight - 90, py + 14)) + 'px';
    if (announce) {
      status.textContent = `${n}뽑 이내 픽업 캐릭터 획득 확률 ${(cp * 100).toFixed(1)}%` +
        (wp !== null ? `, 전무 획득 확률 ${(wp * 100).toFixed(1)}%` : '');
    }
  }

  function showTipFromPointer(e, announce = false) {
    const rect = svg.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width * W;
    const n = Math.round((relX - L) / pw * maxX);
    if (n < 1 || n > maxX) { hideTip(); return; }
    showTipAt(n, e.clientX, e.clientY, announce);
  }

  function hideTip() {
    tip.style.display = 'none';
    dotC.style.display = 'none';
    dotW.style.display = 'none';
    hline.style.display = 'none';
  }
  svg.addEventListener('pointermove', e => showTipFromPointer(e));
  svg.addEventListener('pointerdown', e => showTipFromPointer(e, true));
  svg.addEventListener('pointerleave', () => {
    if (document.activeElement !== svg) hideTip();
  });
  svg.addEventListener('focus', () => showTipAt(activeN, undefined, undefined, true));
  svg.addEventListener('blur', hideTip);
  svg.addEventListener('keydown', e => {
    const changes = {
      ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1,
      PageDown: -10, PageUp: 10,
    };
    if (e.key === 'Home') activeN = 1;
    else if (e.key === 'End') activeN = maxX;
    else if (hasOwn(changes, e.key)) activeN += changes[e.key];
    else return;
    e.preventDefault();
    showTipAt(activeN, undefined, undefined, true);
  });

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
  if (file.size > 5 * 1024 * 1024) {
    toast('백업 파일은 5MB 이하여야 해요');
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const nextState = normalizeStateData(data, { strict: true });
      if (!confirm('현재 데이터를 백업 내용으로 교체할까요?')) return;
      const previousState = state;
      state = nextState;
      try {
        renderAll();
        save();
      } catch (error) {
        state = previousState;
        renderAll();
        throw error;
      }
      toast('백업을 불러왔어요');
    } catch (error) {
      toast(`백업을 불러오지 못했어요: ${cleanString(error?.message, 80) || '형식 오류'}`);
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
  toast('설치 완료! 홈 화면에서 명조 도구를 실행하세요');
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

switchTab('planner', { scroll: false });
renderAll();
renderChart();
