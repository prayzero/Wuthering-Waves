/* ================================================================
   WuWa 픽업 플래너 — 정적 데이터
   캐릭터 로스터 / 역대 픽업 배너 / 확률 모델 상수
   기준일: 2026-07-10 (버전 3.5 전반 진행 중)
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
  broadblade: '대검', sword: '직검', pistols: '권총', gauntlets: '권갑', rectifier: '증폭기',
};

// 캐릭터 아이콘 (wuthering.gg 공개 위키 CDN — 차단 시 이니셜 타일로 자동 대체)
const WG = n => `https://wuthering.gg/_ipx/q_70&s_100x100/images/iconrolehead150/T_IconRoleHead150_${n}.png`;
const TOPUP = f => `https://cdn.topuplive.com/cdn-cgi/image/quality=low,format=webp/uploads/images/goods/20260709/${f}.webp`;

// group: 'limited'(한정 5성) | 'standard'(상시 5성) | 'four'(4성)
const CHARACTERS = [
  // ---- 한정 5성 (출시순) ----
  { id: 'jiyan',       name: '기염',       rarity: 5, element: 'aero',    group: 'limited', ver: '1.0', weapon: 'broadblade', role: '딜러',            img: WG('11') },
  { id: 'yinlin',      name: '음림',       rarity: 5, element: 'electro', group: 'limited', ver: '1.0', weapon: 'rectifier',  role: '서브딜러',        img: WG('17') },
  { id: 'jinhsi',      name: '금희',       rarity: 5, element: 'spectro', group: 'limited', ver: '1.1', weapon: 'broadblade', role: '딜러',            img: WG('24_UI') },
  { id: 'changli',     name: '장리',       rarity: 5, element: 'fusion',  group: 'limited', ver: '1.1', weapon: 'sword',      role: '서브딜러',        img: WG('26_UI') },
  { id: 'zhezhi',      name: '절지',       rarity: 5, element: 'glacio',  group: 'limited', ver: '1.2', weapon: 'rectifier',  role: '서브딜러',        img: WG('27_UI') },
  { id: 'xiangliyao',  name: '상리요',     rarity: 5, element: 'electro', group: 'limited', ver: '1.2', weapon: 'gauntlets',  role: '딜러',            img: WG('25_UI') },
  { id: 'shorekeeper', name: '파수인',     rarity: 5, element: 'spectro', group: 'limited', ver: '1.3', weapon: 'rectifier',  role: '힐러/서포터',     img: WG('28_UI') },
  { id: 'camellya',    name: '카멜리아',   rarity: 5, element: 'havoc',   group: 'limited', ver: '1.4', weapon: 'sword',      role: '딜러',            img: WG('29_UI') },
  { id: 'carlotta',    name: '카를로타',   rarity: 5, element: 'glacio',  group: 'limited', ver: '2.0', weapon: 'pistols',    role: '딜러',            img: WG('32_UI') },
  { id: 'roccia',      name: '로치아',     rarity: 5, element: 'havoc',   group: 'limited', ver: '2.0', weapon: 'gauntlets',  role: '서포터',          img: WG('33_UI') },
  { id: 'phoebe',      name: '피비',       rarity: 5, element: 'spectro', group: 'limited', ver: '2.1', weapon: 'rectifier',  role: '딜러/서포터',     img: WG('45_UI') },
  { id: 'brant',       name: '브란트',     rarity: 5, element: 'fusion',  group: 'limited', ver: '2.1', weapon: 'sword',      role: '딜러/힐러',       img: WG('44_UI') },
  { id: 'cantarella',  name: '칸타렐라',   rarity: 5, element: 'havoc',   group: 'limited', ver: '2.2', weapon: 'rectifier',  role: '서브딜러/힐러',   img: WG('34_UI') },
  { id: 'zani',        name: '자니',       rarity: 5, element: 'spectro', group: 'limited', ver: '2.3', weapon: 'gauntlets',  role: '딜러',            img: WG('38_UI') },
  { id: 'ciaccona',    name: '샤코나',     rarity: 5, element: 'aero',    group: 'limited', ver: '2.3', weapon: 'pistols',    role: '서포터/서브딜러', img: WG('37_UI') },
  { id: 'cartethyia',  name: '카르티시아', rarity: 5, element: 'aero',    group: 'limited', ver: '2.4', weapon: 'sword',      role: '딜러',            img: WG('40_UI') },
  { id: 'lupa',        name: '루파',       rarity: 5, element: 'fusion',  group: 'limited', ver: '2.4', weapon: 'broadblade', role: '서포터/서브딜러', img: WG('46_UI') },
  { id: 'phrolova',    name: '프롤로바',   rarity: 5, element: 'havoc',   group: 'limited', ver: '2.5', weapon: 'rectifier',  role: '오프필드 딜러',   img: WG('41_UI') },
  { id: 'augusta',     name: '아우구스타', rarity: 5, element: 'electro', group: 'limited', ver: '2.6', weapon: 'broadblade', role: '딜러',            img: WG('51_UI') },
  { id: 'iuno',        name: '유노',       rarity: 5, element: 'aero',    group: 'limited', ver: '2.6', weapon: 'gauntlets',  role: '힐러/서브딜러',   img: WG('48_UI') },
  { id: 'galbrena',    name: '갈브레나',   rarity: 5, element: 'fusion',  group: 'limited', ver: '2.7', weapon: 'pistols',    role: '딜러',            img: WG('55_UI') },
  { id: 'qiuyuan',     name: '추원',       rarity: 5, element: 'aero',    group: 'limited', ver: '2.7', weapon: 'sword',      role: '서브딜러/서포터', img: WG('56_UI') },
  { id: 'chisa',       name: '치사',       rarity: 5, element: 'havoc',   group: 'limited', ver: '2.8', weapon: 'broadblade', role: '서포터',          img: WG('57_UI') },
  { id: 'lynae',       name: '리네',       rarity: 5, element: 'spectro', group: 'limited', ver: '3.0', weapon: 'pistols',    role: '버퍼/서포터',     img: WG('60_UI') },
  { id: 'mornye',      name: '모르네',     rarity: 5, element: 'fusion',  group: 'limited', ver: '3.0', weapon: 'broadblade', role: '서포터/서브딜러', img: WG('61_UI') },
  { id: 'aemeath',     name: '에메스',     rarity: 5, element: 'fusion',  group: 'limited', ver: '3.1', weapon: 'sword',      role: '딜러',            img: WG('53_UI') },
  { id: 'luukherssen', name: '루크 헤르센', rarity: 5, element: 'spectro', group: 'limited', ver: '3.1', weapon: 'gauntlets', role: '딜러',            img: WG('54_UI') },
  { id: 'sigrika',     name: '시그리카',   rarity: 5, element: 'aero',    group: 'limited', ver: '3.2', weapon: 'gauntlets',  role: '딜러',            img: WG('65_UI') },
  { id: 'hiyuki',      name: '히유키',     rarity: 5, element: 'glacio',  group: 'limited', ver: '3.3', weapon: 'sword',      role: '딜러',            img: WG('67_UI') },
  { id: 'denia',       name: '데니아',     rarity: 5, element: 'fusion',  group: 'limited', ver: '3.3', weapon: 'rectifier',  role: '딜러',            img: WG('64_UI') },
  { id: 'lucy',        name: '루시',       rarity: 5, element: 'spectro', group: 'limited', ver: '3.4', weapon: 'pistols',    role: '딜러 (콜라보 한정)', img: WG('68_UI') },
  { id: 'lucilla',     name: '루실라',     rarity: 5, element: 'glacio',  group: 'limited', ver: '3.4', weapon: 'rectifier',  role: '서브딜러',        img: WG('66_UI') },
  { id: 'rebecca',     name: '레베카',     rarity: 5, element: 'electro', group: 'limited', ver: '3.4', weapon: 'pistols',    role: '버스트 딜러 (콜라보 무료)', img: WG('69_UI') },
  { id: 'xuanling',    name: '현령',       rarity: 5, element: 'havoc',   group: 'limited', ver: '3.5', weapon: 'sword',      role: '딜러 (양양 SP)',  img: TOPUP('1783586929_0ZcueR8hIW') },
  { id: 'suisui',      name: '수수',       rarity: 5, element: 'glacio',  group: 'limited', ver: '3.5', weapon: 'rectifier',  role: '서브딜러',        img: TOPUP('1783586993_DtAuOuxMBY') },
  // ---- 상시 5성 ----
  { id: 'rover',       name: '방랑자',     rarity: 5, element: 'spectro', group: 'standard', weapon: 'sword',      role: '주인공 (회절/인멸/기류)', img: WG('5') },
  { id: 'calcharo',    name: '카카루',     rarity: 5, element: 'electro', group: 'standard', weapon: 'broadblade', role: '딜러',            img: WG('18') },
  { id: 'lingyang',    name: '능양',       rarity: 5, element: 'glacio',  group: 'standard', weapon: 'gauntlets',  role: '딜러',            img: WG('14') },
  { id: 'jianxin',     name: '감심',       rarity: 5, element: 'aero',    group: 'standard', weapon: 'gauntlets',  role: '서포터(실드/힐)', img: WG('23_UI') },
  { id: 'encore',      name: '앙코',       rarity: 5, element: 'fusion',  group: 'standard', weapon: 'rectifier',  role: '딜러',            img: WG('8') },
  { id: 'verina',      name: '버리나',     rarity: 5, element: 'spectro', group: 'standard', weapon: 'rectifier',  role: '힐러/버퍼',       img: WG('3') },
  // ---- 4성 ----
  { id: 'yangyang',    name: '양양',       rarity: 4, element: 'aero',    group: 'four', weapon: 'sword',      role: '서포터',       img: WG('1') },
  { id: 'chixia',      name: '치샤',       rarity: 4, element: 'fusion',  group: 'four', weapon: 'pistols',    role: '딜러',         img: WG('2') },
  { id: 'baizhi',      name: '백지',       rarity: 4, element: 'glacio',  group: 'four', weapon: 'rectifier',  role: '힐러',         img: WG('6') },
  { id: 'sanhua',      name: '산화',       rarity: 4, element: 'glacio',  group: 'four', weapon: 'sword',      role: '서브딜러/버퍼', img: WG('7') },
  { id: 'taoqi',       name: '도기',       rarity: 4, element: 'havoc',   group: 'four', weapon: 'broadblade', role: '탱커/서포터',  img: WG('9') },
  { id: 'danjin',      name: '단근',       rarity: 4, element: 'havoc',   group: 'four', weapon: 'sword',      role: '딜러',         img: WG('10') },
  { id: 'aalto',       name: '알토',       rarity: 4, element: 'aero',    group: 'four', weapon: 'pistols',    role: '서브딜러',     img: WG('12') },
  { id: 'mortefi',     name: '모르테피',   rarity: 4, element: 'fusion',  group: 'four', weapon: 'pistols',    role: '서브딜러(협주)', img: WG('13') },
  { id: 'yuanwu',      name: '위안우',     rarity: 4, element: 'electro', group: 'four', weapon: 'gauntlets',  role: '서포터',       img: WG('15') },
  { id: 'lumi',        name: '루미',       rarity: 4, element: 'electro', group: 'four', weapon: 'broadblade', role: '서브딜러/버퍼', img: WG('30_UI') },
  { id: 'youhu',       name: '유호',       rarity: 4, element: 'glacio',  group: 'four', weapon: 'gauntlets',  role: '힐러/버퍼',    img: WG('31_UI') },
  { id: 'buling',      name: '복령',       rarity: 4, element: 'electro', group: 'four', weapon: 'rectifier',  role: '서포터',       img: WG('58_UI') },
];

/* ---- 역대 픽업 배너 (1.0 ~ 3.5, 복각 포함, 페이즈 단위) ----
   pickup: 신규 픽업 캐릭터 id / rerun: 복각 캐릭터 id */
const BANNERS = [
  { ver: '1.0', phase: '전반', start: '2024-05-23', end: '2024-06-13', pickup: ['jiyan'],       rerun: [], note: '출시 버전' },
  { ver: '1.0', phase: '후반', start: '2024-06-06', end: '2024-06-26', pickup: ['yinlin'],      rerun: [], note: '일정이 앞당겨져 기염과 일부 겹침' },
  { ver: '1.1', phase: '전반', start: '2024-06-28', end: '2024-07-22', pickup: ['jinhsi'],      rerun: [] },
  { ver: '1.1', phase: '후반', start: '2024-07-22', end: '2024-08-14', pickup: ['changli'],     rerun: [] },
  { ver: '1.2', phase: '전반', start: '2024-08-15', end: '2024-09-07', pickup: ['zhezhi'],      rerun: [] },
  { ver: '1.2', phase: '후반', start: '2024-09-07', end: '2024-09-29', pickup: ['xiangliyao'],  rerun: [], note: '이벤트 무료 배포 병행' },
  { ver: '1.3', phase: '전반', start: '2024-09-29', end: '2024-10-24', pickup: ['shorekeeper'], rerun: [] },
  { ver: '1.3', phase: '후반', start: '2024-10-24', end: '2024-11-13', pickup: [],              rerun: ['jiyan'], note: '첫 복각' },
  { ver: '1.4', phase: '전반', start: '2024-11-14', end: '2024-12-12', pickup: ['camellya'],    rerun: [] },
  { ver: '1.4', phase: '후반', start: '2024-12-12', end: '2025-01-01', pickup: [],              rerun: ['yinlin', 'xiangliyao'] },
  { ver: '2.0', phase: '전반', start: '2025-01-02', end: '2025-01-23', pickup: ['carlotta'],    rerun: ['zhezhi'], note: '리나시타 오픈' },
  { ver: '2.0', phase: '후반', start: '2025-01-23', end: '2025-02-12', pickup: ['roccia'],      rerun: ['jinhsi'] },
  { ver: '2.1', phase: '전반', start: '2025-02-13', end: '2025-03-06', pickup: ['phoebe'],      rerun: [] },
  { ver: '2.1', phase: '후반', start: '2025-03-06', end: '2025-03-26', pickup: ['brant'],       rerun: ['changli'] },
  { ver: '2.2', phase: '전반', start: '2025-03-27', end: '2025-04-17', pickup: ['cantarella'],  rerun: ['camellya'] },
  { ver: '2.2', phase: '후반', start: '2025-04-17', end: '2025-04-28', pickup: [],              rerun: ['shorekeeper'], note: '단독 복각 (짧은 페이즈)' },
  { ver: '2.3', phase: '전반', start: '2025-04-29', end: '2025-05-22', pickup: ['zani'],        rerun: ['jiyan', 'yinlin', 'zhezhi', 'xiangliyao', 'phoebe'], note: '1주년 대규모 복각' },
  { ver: '2.3', phase: '후반', start: '2025-05-22', end: '2025-06-11', pickup: ['ciaccona'],    rerun: ['jinhsi', 'changli', 'carlotta', 'roccia', 'brant'], note: '1주년 대규모 복각' },
  { ver: '2.4', phase: '전반', start: '2025-06-12', end: '2025-07-03', pickup: ['cartethyia'],  rerun: [] },
  { ver: '2.4', phase: '후반', start: '2025-07-03', end: '2025-07-23', pickup: ['lupa'],        rerun: [] },
  { ver: '2.5', phase: '전반', start: '2025-07-24', end: '2025-08-14', pickup: ['phrolova'],    rerun: ['roccia'] },
  { ver: '2.5', phase: '후반', start: '2025-08-14', end: '2025-08-27', pickup: [],              rerun: ['cantarella', 'brant'] },
  { ver: '2.6', phase: '전반', start: '2025-08-28', end: '2025-09-17', pickup: ['augusta'],     rerun: ['carlotta', 'shorekeeper'] },
  { ver: '2.6', phase: '후반', start: '2025-09-17', end: '2025-10-08', pickup: ['iuno'],        rerun: ['ciaccona'] },
  { ver: '2.7', phase: '전반', start: '2025-10-09', end: '2025-10-30', pickup: ['galbrena'],    rerun: ['lupa'] },
  { ver: '2.7', phase: '후반', start: '2025-10-30', end: '2025-11-19', pickup: ['qiuyuan'],     rerun: ['zani'] },
  { ver: '2.8', phase: '전반', start: '2025-11-20', end: '2025-12-11', pickup: ['chisa'],       rerun: ['phoebe'] },
  { ver: '2.8', phase: '후반', start: '2025-12-11', end: '2025-12-24', pickup: [],              rerun: ['phrolova', 'cantarella'], note: '종료일 추정 (3.0 시작 전일)' },
  { ver: '3.0', phase: '전반', start: '2025-12-25', end: '2026-01-15', pickup: ['lynae'],       rerun: ['cartethyia', 'ciaccona'] },
  { ver: '3.0', phase: '후반', start: '2026-01-15', end: '2026-02-05', pickup: ['mornye'],      rerun: ['augusta', 'iuno'] },
  { ver: '3.1', phase: '전반', start: '2026-02-05', end: '2026-02-26', pickup: ['aemeath'],     rerun: ['chisa', 'lupa'] },
  { ver: '3.1', phase: '후반', start: '2026-02-26', end: '2026-03-18', pickup: ['luukherssen'], rerun: ['galbrena'] },
  { ver: '3.2', phase: '전반', start: '2026-03-19', end: '2026-04-09', pickup: ['sigrika'],     rerun: ['qiuyuan'] },
  { ver: '3.2', phase: '후반', start: '2026-04-09', end: '2026-04-30', pickup: [],              rerun: ['lynae', 'zani', 'phoebe'], note: '신규 없음' },
  { ver: '3.3', phase: '전반', start: '2026-04-30', end: '2026-05-21', pickup: ['hiyuki'],      rerun: ['mornye', 'iuno'], note: '2주년' },
  { ver: '3.3', phase: '후반', start: '2026-05-21', end: '2026-06-08', pickup: ['denia'],       rerun: ['chisa', 'phrolova'], note: '종료일 소스별 상이 (06-07~06-11)' },
  { ver: '3.4', phase: '콜라보', start: '2026-06-08', end: '2026-07-10', pickup: ['lucy'],      rerun: [], note: '사이버펑크: 엣지러너 콜라보 · 별도 슬롯/천장 · 레베카 무료 배포' },
  { ver: '3.4', phase: '일반',  start: '2026-06-13', end: '2026-07-10', pickup: ['lucilla'],    rerun: ['cartethyia'], note: '카르티시아 복각은 06-18부터' },
  { ver: '3.5', phase: '전반', start: '2026-07-10', end: '2026-07-30', pickup: ['xuanling'],    rerun: ['lynae', 'luukherssen'], note: '3.5는 KR 공식 공지 기준 07-10 시작(약 41일) · 최초의 기존 4성(양양) 5성 승격판' },
  { ver: '3.5', phase: '후반', start: '2026-07-30', end: '2026-08-19', pickup: ['suisui'],      rerun: ['aemeath'], note: '공식 일정 공개됨' },
  { ver: '3.5', phase: '선택형', start: '2026-07-10', end: '2026-08-19', pickup: [],            rerun: ['jiyan', 'yinlin', 'jinhsi', 'changli', 'zhezhi', 'xiangliyao'], note: '택1 선택형 복각 배너 · 변경 가능 · 첫 10회 무료 · 천장 별도' },
  { ver: '3.6', phase: '유출', start: null, end: null, pickup: [], rerun: [], leaked: true,
    leakNames: ['청소(칭샤오)', '경연'], note: '2026년 9월경 추정 — 공식 미발표 유출 정보, 변경 가능' },
];

// 캐릭터명 변경 전 기록과의 호환용 (구 표기 → 현 표기)
const OLD_NAME_ALIASES = {
  '샤코나': '시아코나', '카르티시아': '카르테시아', '카카루': '카카로',
  '버리나': '버디나', '알토': '아토', '위안우': '원무', '단근': '단진', '파수인': '수안인',
};

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
   스킬(포르테) 육성 재료 — 검증 데이터 (Game8 전 캐릭터 표 기준, 2026-07-10)
   재료명은 영어 공식 명칭 사용 (한국어 게임 내 명칭 미확인분 임의 번역 방지)
   ================================================================ */

// 단조(합성) 재료 세트 — 4단계 등급 (무기 종류 × 출신 지역별 세트)
const FORGE_FAMILIES = {
  drip:       { name: 'Metallic Drip (직검)',       tiers: ['Inert Metallic Drip', 'Reactive Metallic Drip', 'Polarized Metallic Drip', 'Heterized Metallic Drip'] },
  residue:    { name: 'Waveworn Residue (대검)',    tiers: ['Waveworn Residue 210', 'Waveworn Residue 226', 'Waveworn Residue 235', 'Waveworn Residue 239'] },
  phlogiston: { name: 'Phlogiston (권총)',          tiers: ['Impure Phlogiston', 'Extracted Phlogiston', 'Refined Phlogiston', 'Flawless Phlogiston'] },
  cadence:    { name: 'Cadence (권갑)',             tiers: ['Cadence Seed', 'Cadence Bud', 'Cadence Leaf', 'Cadence Blossom'] },
  helix:      { name: 'Helix (증폭기)',             tiers: ['Lento Helix', 'Adagio Helix', 'Andante Helix', 'Presto Helix'] },
  polarizer:  { name: 'Polarizer (직검·3.x)',       tiers: ['Broken Wing Polarizer', 'Monowing Polarizer', 'Polywing Polarizer', 'Layered Wing Polarizer'] },
  crystal:    { name: 'Carved Crystal (대검·3.x)',  tiers: ['LF Carved Crystal', 'MF Carved Crystal', 'HF Carved Crystal', 'FF Carved Crystal'] },
  combustor:  { name: 'Combustor (권총·3.x)',       tiers: ['Incomplete Combustor', 'Aftertune Combustor', 'Remnant Combustor', 'Reverb Combustor'] },
  shard:      { name: 'Waveworn Shard (권갑·3.x)',  tiers: ['LF Waveworn Shard', 'MF Waveworn Shard', 'HF Waveworn Shard', 'FF Waveworn Shard'] },
  string:     { name: 'String (증폭기·3.x)',        tiers: ['Spliced String', 'Broken String', 'Solidified String', 'Melodic String'] },
};

// 무기 타입 → 단조 세트 (황룡/검은 해안/리나시타 계열 — 직접 추가한 캐릭터의 기본값)
const WEAPON_FORGE = {
  sword: 'drip',
  broadblade: 'residue',
  pistols: 'phlogiston',
  gauntlets: 'cadence',
  rectifier: 'helix',
};

// 일반 몹 드랍 계열 — 4단계 등급 (등급명 미확인 세트는 I~IV 표기)
const DROP_FAMILIES = {
  whisperin:  { name: 'Whisperin Core',   tiers: ['LF Whisperin Core', 'MF Whisperin Core', 'HF Whisperin Core', 'FF Whisperin Core'] },
  howler:     { name: 'Howler Core',      tiers: ['LF Howler Core', 'MF Howler Core', 'HF Howler Core', 'FF Howler Core'] },
  ring:       { name: 'Ring (유배자 드랍)', tiers: ['Crude Ring', 'Basic Ring', 'Improved Ring', 'Tailored Ring'] },
  polygon:    { name: 'Polygon Core',     tiers: ['LF Polygon Core', 'MF Polygon Core', 'HF Polygon Core', 'FF Polygon Core'] },
  tidal:      { name: 'Tidal Residuum',   tiers: ['Tidal Residuum I', 'Tidal Residuum II', 'Tidal Residuum III', 'Tidal Residuum IV'] },
  exoswarm:   { name: 'Exoswarm Core',    tiers: ['Exoswarm Core I', 'Exoswarm Core II', 'Exoswarm Core III', 'Exoswarm Core IV'] },
  mech:       { name: 'Mech Core',        tiers: ['Mech Core I', 'Mech Core II', 'Mech Core III', 'Mech Core IV'] },
  pendant:    { name: 'Exoswarm Pendant', tiers: ['Exoswarm Pendant I', 'Exoswarm Pendant II', 'Exoswarm Pendant III', 'Exoswarm Pendant IV'] },
  autopuppet: { name: 'Autopuppet Kernel', tiers: ['Autopuppet Kernel I', 'Autopuppet Kernel II', 'Autopuppet Kernel III', 'Autopuppet Kernel IV'] },
};

// 주간 보스 재료 → 드랍 보스 (등장 시기)
const WEEKLY_BOSS_MATS = {
  'Unending Destruction':   '스카 (1.0 황룡)',
  'Dreamless Feather':      '무명 · Dreamless (1.0 황룡)',
  'Monument Bell':          '종배 거북 (1.0 황룡)',
  "Sentinel's Dagger":      '수호자 각 · Jué (1.1 황룡)',
  "The Netherworld's Stare": '리나시타 주간 보스 (2.0)',
  'When Irises Bloom':      '리나시타 주간 보스 (2.2)',
  'Curse of the Abyss':     'Threnodian: Leviathan (2.7)',
  'Gold in Memory':         'Sigillum (3.1 라하이로이)',
  'We Who Question':        'Denia 주간 보스판 (3.3)',
  'Skyward Glazed Heart':   'Thousand-Puppet Pavilion (3.5)',
};

// 캐릭터별 스킬 재료 [단조 세트, 몹 드랍, 주간 보스 재료] — Game8 검증 데이터
const CHAR_MATS = {
  jiyan:       ['residue',    'howler',     'Monument Bell'],
  yinlin:      ['helix',      'whisperin',  'Dreamless Feather'],
  jinhsi:      ['residue',    'howler',     "Sentinel's Dagger"],
  changli:     ['drip',       'ring',       "Sentinel's Dagger"],
  zhezhi:      ['helix',      'howler',     'Monument Bell'],
  xiangliyao:  ['cadence',    'whisperin',  'Unending Destruction'],
  shorekeeper: ['helix',      'whisperin',  "Sentinel's Dagger"],
  camellya:    ['drip',       'whisperin',  'Dreamless Feather'],
  carlotta:    ['phlogiston', 'polygon',    "The Netherworld's Stare"],
  roccia:      ['cadence',    'tidal',      "The Netherworld's Stare"],
  phoebe:      ['helix',      'whisperin',  "Sentinel's Dagger"],
  brant:       ['drip',       'tidal',      "The Netherworld's Stare"],
  cantarella:  ['helix',      'polygon',    'When Irises Bloom'],
  zani:        ['cadence',    'polygon',    "The Netherworld's Stare"],
  ciaccona:    ['phlogiston', 'tidal',      'When Irises Bloom'],
  cartethyia:  ['drip',       'tidal',      'When Irises Bloom'],
  lupa:        ['residue',    'howler',     "The Netherworld's Stare"],
  phrolova:    ['helix',      'polygon',    "The Netherworld's Stare"],
  augusta:     ['residue',    'tidal',      'When Irises Bloom'],
  iuno:        ['cadence',    'polygon',    "The Netherworld's Stare"],
  galbrena:    ['phlogiston', 'tidal',      'Curse of the Abyss'],
  qiuyuan:     ['drip',       'whisperin',  'Curse of the Abyss'],
  chisa:       ['residue',    'polygon',    'When Irises Bloom'],
  lynae:       ['combustor',  'exoswarm',   'Dreamless Feather'],
  mornye:      ['crystal',    'mech',       "The Netherworld's Stare"],
  aemeath:     ['polarizer',  'exoswarm',   'Gold in Memory'],
  luukherssen: ['shard',      'pendant',    'Gold in Memory'],
  sigrika:     ['shard',      'pendant',    'Gold in Memory'],
  hiyuki:      ['polarizer',  'exoswarm',   'We Who Question'],
  denia:       ['string',     'mech',       'We Who Question'],
  lucy:        ['combustor',  'exoswarm',   'Gold in Memory'],
  rebecca:     ['combustor',  'mech',       ''],  // 위클리 재료 확인 불가
  lucilla:     ['string',     'mech',       'We Who Question'],
  xuanling:    ['polarizer',  'autopuppet', 'Skyward Glazed Heart'],
  suisui:      ['string',     'autopuppet', 'Skyward Glazed Heart'],
  rover:       ['drip',       'whisperin',  'Unending Destruction'], // 회절 기준 (인멸: Dreamless Feather, 기류: When Irises Bloom)
  calcharo:    ['residue',    'ring',       'Monument Bell'],
  lingyang:    ['cadence',    'whisperin',  'Unending Destruction'],
  jianxin:     ['cadence',    'whisperin',  'Unending Destruction'],
  encore:      ['helix',      'whisperin',  'Unending Destruction'],
  verina:      ['helix',      'howler',     'Monument Bell'],
  yangyang:    ['drip',       'ring',       'Unending Destruction'],
  chixia:      ['phlogiston', 'whisperin',  'Monument Bell'],
  baizhi:      ['helix',      'howler',     'Monument Bell'],
  sanhua:      ['drip',       'whisperin',  'Unending Destruction'],
  taoqi:       ['residue',    'howler',     'Dreamless Feather'],
  danjin:      ['drip',       'ring',       'Dreamless Feather'],
  aalto:       ['phlogiston', 'howler',     'Monument Bell'],
  mortefi:     ['phlogiston', 'whisperin',  'Monument Bell'],
  yuanwu:      ['cadence',    'ring',       'Unending Destruction'],
  lumi:        ['residue',    'howler',     "Sentinel's Dagger"],
  youhu:       ['cadence',    'ring',       'Monument Bell'],
  buling:      ['helix',      'whisperin',  'Curse of the Abyss'],
};

// 전용 무기(전무) 이름 — 영어 공식명, null = 확인 불가 (2026-07-10 조사 기준)
const SIG_WEAPONS = {
  jiyan: 'Verdant Summit', yinlin: 'Stringmaster', jinhsi: 'Ages of Harvest',
  changli: 'Blazing Brilliance', zhezhi: 'Rime-Draped Sprouts', xiangliyao: "Verity's Handle",
  shorekeeper: 'Stellar Symphony', camellya: 'Red Spring', carlotta: 'The Last Dance',
  roccia: 'Tragicomedy', phoebe: 'Luminous Hymn', brant: 'Unflickering Valor',
  cantarella: 'Whispers of Sirens', zani: 'Blazing Justice', ciaccona: 'Woodland Aria',
  cartethyia: "Defier's Thorn", lupa: 'Wildfire Mark', phrolova: 'Lethean Elegy',
  augusta: 'Thunderflare Dominion', iuno: "Moongazer's Sigil", galbrena: null,
  qiuyuan: null, chisa: 'Kumokiri', lynae: 'Starfield Calibrator', mornye: null,
  aemeath: 'Everbright Polestar', luukherssen: null, sigrika: null,
  hiyuki: 'Frostburn', denia: null, lucy: null, rebecca: null,
  lucilla: 'Forged Dwarf Star', xuanling: 'Azure Oath', suisui: "Firstlight's Herald",
};

// 돌파(레벨업) 재료 [지역 특산물, 필드 보스 드랍] — 몹 드랍은 스킬과 같은 계열, null = 확인 불가
const ASC_MATS = {
  jiyan:       ['Pecok Flower', 'Roaring Rock Fist'],
  yinlin:      ['Coriolus', 'Group Abomination Tacet Core'],
  jinhsi:      ["Loong's Pearl", 'Elegy Tacet Core'],
  changli:     ['Pavo Plum', 'Rage Tacet Core'],
  zhezhi:      ['Lanternberry', 'Sound-Keeping Tacet Core'],
  xiangliyao:  ['Violet Coral', 'Hidden Thunder Tacet Core'],
  shorekeeper: ['Nova', 'Topological Confinement'],
  camellya:    ['Nova', 'Topological Confinement'],
  carlotta:    ['Sword Acorus', 'Platinum Core'],
  roccia:      ['Firecracker Jewelweed', 'Cleansing Conch'],
  phoebe:      ['Firecracker Jewelweed', 'Cleansing Conch'],
  brant:       ['Golden Fleece', 'Blazing Bone'],
  cantarella:  ['Seaside Cendrelis', 'Cleansing Conch'],
  zani:        ['Sword Acorus', 'Platinum Core'],
  ciaccona:    ['Golden Fleece', 'Blazing Bone'],
  cartethyia:  ['Bamboo Iris', 'Unfading Glory'],
  lupa:        ['Bloodleaf Viburnum', 'Unfading Glory'],
  phrolova:    ['Afterlife', 'Truth in Lies'],
  augusta:     ['Luminous Calendula', 'Blighted Crown of Puppet King'],
  iuno:        ['Sliverglow Bloom', 'Abyssal Husk'],
  galbrena:    ['Stone Rose', 'Blighted Crown of Puppet King'],
  qiuyuan:     ['Wintry Bell', 'Truth in Lies'],
  chisa:       ['Summer Flower', 'Abyssal Husk'],
  lynae:       ['Rimewisp', "Suncoveter's Reach"],
  mornye:      ['Gemini Spore', 'Burning Judgment'],
  aemeath:     ['Moss Amber', 'Our Choice'],
  luukherssen: ['Edelschnee', "Suncoveter's Reach"],
  sigrika:     ['Arithmetic Shell', 'Our Choice'],
  hiyuki:      ['Redbell', 'Our Choice'],
  denia:       ['Stargrail', 'Burning Judgment'],
  lucy:        ['Past Reveries', 'Nightmare Flashdrive'],
  rebecca:     [null, null],
  lucilla:     ['Forget-Me-Not', "Suncoveter's Reach"],
  xuanling:    [null, null], // 3.5 멍저우 신규 특산물/보스 — 확인 불가
  suisui:      ['Flowborne Dream', "Solidarity's Loneflame"],
  rover:       ['Pecok Flower', 'Mysterious Code'],
  calcharo:    ['Iris', 'Thundering Tacet Core'],
  lingyang:    ['Coriolus', 'Sound-Keeping Tacet Core'],
  jianxin:     ['Lanternberry', 'Roaring Rock Fist'],
  encore:      ['Pecok Flower', 'Rage Tacet Core'],
  verina:      ['Belle Poppy', 'Elegy Tacet Core'],
  yangyang:    ['Wintry Bell', 'Roaring Rock Fist'],
  chixia:      ['Belle Poppy', 'Rage Tacet Core'],
  baizhi:      ['Lanternberry', 'Sound-Keeping Tacet Core'],
  sanhua:      ['Wintry Bell', 'Sound-Keeping Tacet Core'],
  taoqi:       ['Iris', 'Gold-Dissolving Feather'],
  danjin:      ['Belle Poppy', 'Strife Tacet Core'],
  aalto:       ['Wintry Bell', 'Roaring Rock Fist'],
  mortefi:     ['Coriolus', 'Rage Tacet Core'],
  yuanwu:      ['Terraspawn Fungus', 'Hidden Thunder Tacet Core'],
  lumi:        ['Terraspawn Fungus', 'Thundering Tacet Core'],
  youhu:       ['Violet Coral', 'Topological Confinement'],
  buling:      ['Pecok Flower', 'Blighted Crown of Puppet King'],
};

// 돌파 공통 수량 (Lv.1→90 풀돌파)
const ASC_TOTALS = {
  specialty: 60,
  boss: 46,
  enemy: [4, 12, 12, 4],
  credits: '170,000',
};

// 재료 등급 색 (T1~T4: 초록/파랑/보라/금)
const TIER_COLORS = ['#3fae5c', '#3987e5', '#9a6ee8', '#e6c15a'];

// 포르테(스킬) 풀강(전 노드) 기준 총 필요량 — 전 캐릭터 공통 표준 수치
const FORTE_TOTALS = {
  forge: [25, 28, 55, 67],       // 단조 재료 T1~T4
  drop:  [25, 28, 40, 57],       // 몹 드랍 T1~T4 (포르테분, 돌파분 별도)
  weekly: 26,                    // 주간 보스 재료 (주 3회 보상 제한)
  credits: '2,030,000',          // 쉘 크레딧
};

/* ================================================================
   엔드 컨텐츠 (탑 / 해역 / 매트릭스) 기본값
   주기·버프·몹은 게임 내 로테이션에 맞춰 직접 수정해서 사용
   ================================================================ */
/* 주기·규칙은 2026-07-10 조사 데이터 기준.
   탑: 아카라이브 공지 3개 주기로 28일 격자 도출 / 해역: 앵커 1개 기반 추정 / 매트릭스: 버전 단위 */
const CONTENT_DEFAULTS = [
  {
    id: 'tower',
    icon: '🗼',
    name: '역경의 탑 (심경 구역)',
    period: 28,
    start: '2026-06-22', // 검증된 주기 3개(25-10-13, 26-03-30, 26-05-25)의 28일 격자 도출
    rules: '스테이지·심경 간섭은 28일마다 전면 교체, 도전·보상은 14일마다 초기화(중간 리셋 — 이번 주기: 7/6). 심경 구역 피로도 40, 잔향·울림의 탑 층당 1/2/3/4, 심연의 탑 층당 5.',
    buff: '이번 주기(6/22~7/20) 심경 간섭 버프 미확인 — 인게임 확인 후 입력하세요',
    stages: [
      { name: '층별 몹', mobs: '미확인 — 인게임 역경의 탑 화면 확인 후 입력하세요' },
    ],
  },
  {
    id: 'sea',
    icon: '🌊',
    name: '해역 (죽음의 노래와 바닷속 폐허)',
    period: 28,
    start: '2026-07-06', // 2025-03-17 첫 시즌 초기화 앵커의 28일 격자 [추정]
    rules: '4주 시즌제 (일정은 추정 — 인게임 표기로 확인 요망). 시즌 리셋 시 재생 해역(해곡·급류)만 초기화되고 금기의 해역은 유지. 2파티 동시 편성, 시즌마다 버프 세트 교체.',
    buff: '이번 시즌 버프 미확인 — 인게임 확인 후 입력하세요',
    stages: [
      { name: '재생 해역', mobs: '미확인 — 인게임 확인 후 입력하세요' },
    ],
  },
  {
    id: 'matrix',
    icon: '🧩',
    name: '매트릭스 더블 폰스',
    period: 41,
    start: '2026-07-10', // 3.5 업데이트일(KR 공식 공지) — 시즌은 버전 단위(약 41일)
    rules: '시즌이 버전 단위로 운영 (3.5: 7/10 ~ 3.6 업데이트 전). 안정 프로토콜 최대 3파티 + 특이점 확장 무제한. 출전당 피로도 1(서포터 계열 2), 무기·에코는 캐릭터 귀속(돌려쓰기 불가), 방랑자는 속성 무관 1회.',
    buff: '3.5 시즌 캐릭터 강화 목록 미확인 — 인게임 매트릭스 화면 확인 후 입력하세요',
    stages: [
      { name: '보스', mobs: '미확인 — 인게임 확인 후 입력하세요' },
    ],
  },
];

/* ---- 재화 ----
   1뽑 = 아스트라이트 160. 달빛살(Lunite)은 1:1로 아스트라이트 전환.
   팩 가격은 대략적인 KR 스토어 기준 (최고가 팩 11만원은 사용자 확인값). */
const ASTRITE_PER_PULL = 160;
const LUNITE_PACKS = [
  { price: 1500,   base: 60,   bonus: 8 },
  { price: 7500,   base: 300,  bonus: 30 },
  { price: 25000,  base: 980,  bonus: 110 },
  { price: 50000,  base: 1980, bonus: 260 },
  { price: 79000,  base: 3280, bonus: 600 },
  { price: 110000, base: 6480, bonus: 1600 },
];

const COPY_LABELS = ['명함', '1돌', '2돌', '3돌', '4돌', '5돌', '6돌'];
const WEAPON_COPY_LABELS = ['1개(1재련)', '2개(2재련)', '3개(3재련)', '4개(4재련)', '5개(5재련)'];
