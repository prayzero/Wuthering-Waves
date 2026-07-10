/* ================================================================
   WuWa 픽업 플래너 — 정적 데이터
   캐릭터 로스터 / 역대 픽업 배너 / 확률 모델 상수
   ================================================================ */

// 속성 정의 (게임 내 고유 색상)
const ELEMENTS = {
  fusion:  { name: '용융', color: '#e8543f' },
  glacio:  { name: '응결', color: '#41aefb' },
  electro: { name: '전도', color: '#b45bff' },
  aero:    { name: '기류', color: '#3fd6a0' },
  spectro: { name: '회절', color: '#f0d060' },
  havoc:   { name: '인멸', color: '#e64fa0' },
};

// 무기 타입
const WEAPONS = {
  broadblade: '대검', sword: '한손검', pistols: '권총', gauntlets: '너클', rectifier: '증폭기',
};

// group: 'limited'(한정 5성) | 'standard'(상시 5성) | 'four'(4성)
const CHARACTERS = [
  // ---- 한정 5성 (출시순) ----
  { id: 'jiyan',       name: '기염',       rarity: 5, element: 'aero',    group: 'limited', ver: '1.0', weapon: 'broadblade' },
  { id: 'yinlin',      name: '음림',       rarity: 5, element: 'electro', group: 'limited', ver: '1.0', weapon: 'rectifier' },
  { id: 'jinhsi',      name: '금희',       rarity: 5, element: 'spectro', group: 'limited', ver: '1.1', weapon: 'broadblade' },
  { id: 'changli',     name: '장리',       rarity: 5, element: 'fusion',  group: 'limited', ver: '1.1', weapon: 'sword' },
  { id: 'zhezhi',      name: '절지',       rarity: 5, element: 'glacio',  group: 'limited', ver: '1.2', weapon: 'rectifier' },
  { id: 'xiangliyao',  name: '상리요',     rarity: 5, element: 'electro', group: 'limited', ver: '1.2', weapon: 'gauntlets' },
  { id: 'shorekeeper', name: '파수인',     rarity: 5, element: 'spectro', group: 'limited', ver: '1.3', weapon: 'rectifier' },
  { id: 'camellya',    name: '카멜리아',   rarity: 5, element: 'havoc',   group: 'limited', ver: '1.4', weapon: 'sword' },
  { id: 'carlotta',    name: '카를로타',   rarity: 5, element: 'glacio',  group: 'limited', ver: '2.0', weapon: 'pistols' },
  { id: 'roccia',      name: '로치아',     rarity: 5, element: 'havoc',   group: 'limited', ver: '2.0', weapon: 'gauntlets' },
  { id: 'phoebe',      name: '피비',       rarity: 5, element: 'spectro', group: 'limited', ver: '2.1', weapon: 'rectifier' },
  { id: 'brant',       name: '브란트',     rarity: 5, element: 'fusion',  group: 'limited', ver: '2.1', weapon: 'sword' },
  { id: 'cantarella',  name: '칸타렐라',   rarity: 5, element: 'havoc',   group: 'limited', ver: '2.2', weapon: 'rectifier' },
  { id: 'zani',        name: '자니',       rarity: 5, element: 'spectro', group: 'limited', ver: '2.3', weapon: 'gauntlets' },
  { id: 'ciaccona',    name: '시아코나',   rarity: 5, element: 'aero',    group: 'limited', ver: '2.3', weapon: 'pistols' },
  { id: 'cartethyia',  name: '카르테시아', rarity: 5, element: 'aero',    group: 'limited', ver: '2.4', weapon: 'sword' },
  { id: 'lupa',        name: '루파',       rarity: 5, element: 'fusion',  group: 'limited', ver: '2.4', weapon: 'broadblade' },
  { id: 'phrolova',    name: '프롤로바',   rarity: 5, element: 'havoc',   group: 'limited', ver: '2.5', weapon: 'rectifier' },
  { id: 'augusta',     name: '아우구스타', rarity: 5, element: 'electro', group: 'limited', ver: '2.6', weapon: 'broadblade' },
  { id: 'iuno',        name: '유노',       rarity: 5, element: 'aero',    group: 'limited', ver: '2.7', weapon: 'gauntlets' },
  { id: 'galbrena',    name: '갈브레나',   rarity: 5, element: 'fusion',  group: 'limited', ver: '2.7', weapon: 'rectifier' },
  // ---- 상시 5성 ----
  { id: 'rover',       name: '방랑자',     rarity: 5, element: 'spectro', group: 'standard', weapon: 'sword' },
  { id: 'calcharo',    name: '카카로',     rarity: 5, element: 'electro', group: 'standard', weapon: 'broadblade' },
  { id: 'lingyang',    name: '능양',       rarity: 5, element: 'glacio',  group: 'standard', weapon: 'gauntlets' },
  { id: 'jianxin',     name: '감심',       rarity: 5, element: 'aero',    group: 'standard', weapon: 'gauntlets' },
  { id: 'encore',      name: '앙코',       rarity: 5, element: 'fusion',  group: 'standard', weapon: 'rectifier' },
  { id: 'verina',      name: '버디나',     rarity: 5, element: 'spectro', group: 'standard', weapon: 'rectifier' },
  // ---- 4성 ----
  { id: 'chixia',      name: '치샤',       rarity: 4, element: 'fusion',  group: 'four', weapon: 'pistols' },
  { id: 'sanhua',      name: '산화',       rarity: 4, element: 'glacio',  group: 'four', weapon: 'sword' },
  { id: 'baizhi',      name: '백지',       rarity: 4, element: 'glacio',  group: 'four', weapon: 'rectifier' },
  { id: 'yangyang',    name: '양양',       rarity: 4, element: 'aero',    group: 'four', weapon: 'sword' },
  { id: 'taoqi',       name: '도기',       rarity: 4, element: 'havoc',   group: 'four', weapon: 'broadblade' },
  { id: 'danjin',      name: '단진',       rarity: 4, element: 'havoc',   group: 'four', weapon: 'sword' },
  { id: 'mortefi',     name: '모르테피',   rarity: 4, element: 'fusion',  group: 'four', weapon: 'pistols' },
  { id: 'aalto',       name: '아토',       rarity: 4, element: 'aero',    group: 'four', weapon: 'pistols' },
  { id: 'yuanwu',      name: '원무',       rarity: 4, element: 'electro', group: 'four', weapon: 'gauntlets' },
  { id: 'youhu',       name: '유호',       rarity: 4, element: 'glacio',  group: 'four', weapon: 'rectifier' },
  { id: 'lumi',        name: '루미',       rarity: 4, element: 'electro', group: 'four', weapon: 'broadblade' },
];

// 역대 픽업 배너 (신규 캐릭터 기준, 날짜는 대략적인 글로벌 서버 기준)
const BANNERS = [
  { ver: '1.0', name: '기염 픽업',       charId: 'jiyan',       start: '2024-05-23', end: '2024-06-13' },
  { ver: '1.0', name: '음림 픽업',       charId: 'yinlin',      start: '2024-06-06', end: '2024-06-26' },
  { ver: '1.1', name: '금희 픽업',       charId: 'jinhsi',      start: '2024-06-28', end: '2024-07-21' },
  { ver: '1.1', name: '장리 픽업',       charId: 'changli',     start: '2024-07-22', end: '2024-08-14' },
  { ver: '1.2', name: '절지 픽업',       charId: 'zhezhi',      start: '2024-08-15', end: '2024-09-06' },
  { ver: '1.2', name: '상리요 픽업',     charId: 'xiangliyao',  start: '2024-09-07', end: '2024-09-28' },
  { ver: '1.3', name: '파수인 픽업',     charId: 'shorekeeper', start: '2024-09-29', end: '2024-10-23' },
  { ver: '1.4', name: '카멜리아 픽업',   charId: 'camellya',    start: '2024-11-14', end: '2024-12-11' },
  { ver: '2.0', name: '카를로타 픽업',   charId: 'carlotta',    start: '2025-01-02', end: '2025-01-22' },
  { ver: '2.0', name: '로치아 픽업',     charId: 'roccia',      start: '2025-01-23', end: '2025-02-12' },
  { ver: '2.1', name: '피비 픽업',       charId: 'phoebe',      start: '2025-02-13', end: '2025-03-05' },
  { ver: '2.1', name: '브란트 픽업',     charId: 'brant',       start: '2025-03-06', end: '2025-03-26' },
  { ver: '2.2', name: '칸타렐라 픽업',   charId: 'cantarella',  start: '2025-03-27', end: '2025-04-28' },
  { ver: '2.3', name: '자니 픽업',       charId: 'zani',        start: '2025-04-29', end: '2025-05-21' },
  { ver: '2.3', name: '시아코나 픽업',   charId: 'ciaccona',    start: '2025-04-29', end: '2025-05-21' },
  { ver: '2.4', name: '카르테시아 픽업', charId: 'cartethyia',  start: '2025-06-12', end: '2025-07-02' },
  { ver: '2.4', name: '루파 픽업',       charId: 'lupa',        start: '2025-07-03', end: '2025-07-23' },
  { ver: '2.5', name: '프롤로바 픽업',   charId: 'phrolova',    start: '2025-07-24', end: '2025-08-13' },
  { ver: '2.6', name: '아우구스타 픽업', charId: 'augusta',     start: '2025-09-04', end: '2025-09-24' },
  { ver: '2.7', name: '유노 픽업',       charId: 'iuno',        start: '2025-10-16', end: '2025-11-05' },
  { ver: '2.7', name: '갈브레나 픽업',   charId: 'galbrena',    start: '2025-11-06', end: '2025-11-26' },
];

/* ---- 확률 모델 ----
   공식 공개 수치: 5성 기본 0.8%, 종합(천장 포함) 1.8%, 80회 내 확정.
   66회부터 확률이 상승하는 소프트 천장 곡선은 공식 미공개 → 커뮤니티 추정 모델 사용. */
const GACHA = {
  BASE5: 0.008,          // 5성 기본 확률
  SOFT_START: 66,        // 소프트 천장 시작 (66뽑째부터 상승)
  SOFT_STEP: 0.06,       // 소프트 천장 구간 회당 상승폭 (추정)
  HARD: 80,              // 하드 천장 (80뽑 내 5성 확정)
  CHAR_PICKUP_RATE: 0.5, // 캐릭터 5성 획득 시 픽업일 확률 (반천장, 픽뚫 가능)
  CHAR_MAX: 160,         // 캐릭터 픽업 확정 천장
  WEAPON_MAX: 80,        // 무기(전무) 픽업 확정 천장 (픽뚫 없음)
  BASE4: 0.06,           // 4성 기본 확률
};

// n뽑째의 5성 등장 확률 (천장 카운트 기준)
function rateAt(n) {
  if (n >= GACHA.HARD) return 1;
  if (n < GACHA.SOFT_START) return GACHA.BASE5;
  return Math.min(1, GACHA.BASE5 + (n - GACHA.SOFT_START + 1) * GACHA.SOFT_STEP);
}

// 천장 0에서 시작해 k뽑째에 5성이 나올 확률 분포 (index 1..80)
function fiveStarPmf() {
  const pmf = new Array(GACHA.HARD + 1).fill(0);
  let survive = 1;
  for (let k = 1; k <= GACHA.HARD; k++) {
    const r = rateAt(k);
    pmf[k] = survive * r;
    survive *= (1 - r);
  }
  return pmf;
}

// 픽업 캐릭터 확보까지의 뽑기 수 분포 (50% 픽업 + 픽뚫 시 다음 5성 확정, index 1..160)
function charPickupPmf() {
  const p1 = fiveStarPmf();
  const pmf = new Array(GACHA.CHAR_MAX + 1).fill(0);
  for (let a = 1; a <= GACHA.HARD; a++) {
    pmf[a] += GACHA.CHAR_PICKUP_RATE * p1[a];
    for (let b = 1; b <= GACHA.HARD; b++) {
      pmf[a + b] += (1 - GACHA.CHAR_PICKUP_RATE) * p1[a] * p1[b];
    }
  }
  return pmf;
}

// 전무(무기) 확보까지의 분포 — 픽업 100%, 80 확정 (index 1..80)
function weaponPickupPmf() {
  return fiveStarPmf();
}

// N뽑으로 획득했을 때 "상위 몇 %의 운"인지 (낮을수록 운이 좋음)
function luckTopPercent(pulls, pmf) {
  const maxN = pmf.length - 1;
  const n = Math.max(1, Math.min(pulls, maxN));
  let below = 0;
  for (let k = 1; k < n; k++) below += pmf[k];
  const at = pmf[n] || 0;
  return Math.min(100, Math.max(0, (below + at * 0.5) * 100));
}

function expectedPulls(pmf) {
  let e = 0;
  for (let k = 1; k < pmf.length; k++) e += k * pmf[k];
  return e;
}

function luckGrade(top) {
  if (top < 10)  return { label: '대박 운', cls: 'luck-great' };
  if (top < 30)  return { label: '운 좋음', cls: 'luck-good' };
  if (top < 60)  return { label: '평범',    cls: 'luck-avg' };
  if (top < 85)  return { label: '아쉬움',  cls: 'luck-bad' };
  return { label: '눈물의 천장', cls: 'luck-worst' };
}

/* ================================================================
   스킬(포르테) 육성 재료
   기본 매칭은 무기 타입 기반 추정치 — 캐릭터 상세에서 직접 수정 가능
   ================================================================ */

// 포지(합성) 재료 계열 — 4단계 등급
const FORGE_FAMILIES = {
  helix:      { name: '헬릭스',       tiers: ['렌토 헬릭스', '아다지오 헬릭스', '안단테 헬릭스', '프레스토 헬릭스'] },
  cadence:    { name: '카덴스',       tiers: ['카덴스 씨앗', '카덴스 새싹', '카덴스 잎', '카덴스 만개'] },
  drip:       { name: '금속 드립',    tiers: ['불활성 금속 드립', '반응성 금속 드립', '편광 금속 드립', '이질화 금속 드립'] },
  phlogiston: { name: '플로지스톤',   tiers: ['불순한 플로지스톤', '저주파 플로지스톤', '고주파 플로지스톤', '완전한 플로지스톤'] },
  residue:    { name: '물결무늬 잔철', tiers: ['물결무늬 잔철 210', '물결무늬 잔철 226', '물결무늬 잔철 235', '물결무늬 잔철 239'] },
};

// 무기 타입 → 기본 포지 재료 계열 (추정 기본값)
const WEAPON_FORGE = {
  broadblade: 'helix',
  sword: 'cadence',
  pistols: 'drip',
  gauntlets: 'residue',
  rectifier: 'phlogiston',
};

// 일반 몹 드랍 계열 — 4단계 등급
const DROP_FAMILIES = {
  whisperin: { name: '위스퍼링 코어', tiers: ['LF 위스퍼링 코어', 'MF 위스퍼링 코어', 'HF 위스퍼링 코어', 'FF 위스퍼링 코어'] },
  howler:    { name: '하울러 코어',   tiers: ['LF 하울러 코어', 'MF 하울러 코어', 'HF 하울러 코어', 'FF 하울러 코어'] },
  ring:      { name: '링(무리부 병사)', tiers: ['조잡한 링', '기본 링', '개량된 링', '정교한 링'] },
  mask:      { name: '가면(기이한 자)', tiers: ['구속의 가면', '왜곡의 가면', '침식의 가면', '광기의 가면'] },
  polygon:   { name: '폴리곤 코어(리나시타)', tiers: ['LF 폴리곤 코어', 'MF 폴리곤 코어', 'HF 폴리곤 코어', 'FF 폴리곤 코어'] },
};

// 재료 등급 색 (T1~T4: 초록/파랑/보라/금)
const TIER_COLORS = ['#3fae5c', '#3987e5', '#9a6ee8', '#e6c15a'];

// 포르테(스킬) 풀업 기준 총 필요량 — 커뮤니티 정리 수치 기반 근사치
const FORTE_TOTALS = {
  forge: [25, 28, 55, 67],   // 포지 재료 T1~T4
  drop:  [25, 28, 40, 57],   // 몹 드랍 T1~T4
  weekly: 26,                // 주간 보스 재료
  credits: '약 200만',       // 쉘 크레딧
};

/* ================================================================
   엔드 컨텐츠 (탑 / 해역 / 매트릭스) 기본값
   주기·버프·몹은 게임 내 로테이션에 맞춰 직접 수정해서 사용
   ================================================================ */
const CONTENT_DEFAULTS = [
  {
    id: 'tower',
    icon: '🗼',
    name: '탑 (역경의 탑)',
    period: 14,
    start: '2026-06-29',
    buff: '이번 주기 잔향 버프를 입력하세요 (예: 회절 피해 +25%, 스킬 피해 +30%)',
    stages: [
      { name: '안정 구역', mobs: '예시) 무관자, 각성 무리부 병사' },
      { name: '실험 구역', mobs: '예시) 폭풍 메피스, 업화의 라이더' },
      { name: '위험 구역', mobs: '예시) 만가의 용, 무상의 헤론' },
    ],
  },
  {
    id: 'sea',
    icon: '🌊',
    name: '해역',
    period: 28,
    start: '2026-06-16',
    buff: '이번 주기 버프를 입력하세요',
    stages: [
      { name: '1구역', mobs: '등장 몹을 입력하세요' },
      { name: '2구역', mobs: '등장 몹을 입력하세요' },
    ],
  },
  {
    id: 'matrix',
    icon: '🧩',
    name: '매트릭스',
    period: 28,
    start: '2026-06-30',
    buff: '이번 주기 버프를 입력하세요',
    stages: [
      { name: '1단계', mobs: '등장 몹을 입력하세요' },
      { name: '2단계', mobs: '등장 몹을 입력하세요' },
    ],
  },
];

const COPY_LABELS = ['명함', '1돌', '2돌', '3돌', '4돌', '5돌', '6돌'];
const WEAPON_COPY_LABELS = ['1개(1재련)', '2개(2재련)', '3개(3재련)', '4개(4재련)', '5개(5재련)'];
