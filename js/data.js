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
  { id: 'qiuyuan',     name: '구원',       rarity: 5, element: 'aero',    group: 'limited', ver: '2.7', weapon: 'sword',      role: '서브딜러/서포터', img: WG('56_UI') },
  { id: 'chisa',       name: '치사',       rarity: 5, element: 'havoc',   group: 'limited', ver: '2.8', weapon: 'broadblade', role: '서포터',          img: WG('57_UI') },
  { id: 'lynae',       name: '린네',       rarity: 5, element: 'spectro', group: 'limited', ver: '3.0', weapon: 'pistols',    role: '버퍼/서포터',     img: WG('60_UI') },
  { id: 'mornye',      name: '모니에',     rarity: 5, element: 'fusion',  group: 'limited', ver: '3.0', weapon: 'broadblade', role: '서포터/서브딜러', img: WG('61_UI') },
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
    leakNames: ['청초', '경연'], note: '이름·외형은 2026-06-15 공식 공개. 실장 버전·등급·속성·무기는 미발표 (유출·추정 단계)' },
];

// 캐릭터명 변경 전 기록과의 호환용 (구 표기 → 현 표기)
const OLD_NAME_ALIASES = {
  '샤코나': '시아코나', '구원': '추원', '모니에': '모르네', '린네': '리네', '카르티시아': '카르테시아', '카카루': '카카로',
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
   재료명은 한국어 정식 명칭 (wuthering.gg KR DB 대조, 2026-07-11) — 미확인분만 영어 유지
   ================================================================ */

// 단조(합성) 재료 세트 — 4단계 등급, 한국어 정식 명칭 (wuthering.gg KR DB 대조, 2026-07-11)
const FORGE_FAMILIES = {
  drip:       { name: '금속 액적 — 직검 (Metallic Drip)',            tiers: ['비활성 금속 액적', '활성 금속 액적', '분극 금속 액적', '이성질화 금속 액적'] },
  residue:    { name: '비명 이상 키메라 — 대검 (Waveworn Residue)',  tiers: ['비명 이상 키메라 210', '비명 이상 키메라 226', '비명 이상 키메라 235', '비명 이상 키메라 239'] },
  phlogiston: { name: '결정화 연소 — 권총 (Phlogiston)',             tiers: ['헤테로 결정화 연소', '조추출 결정화 연소', '정류 결정화 연소', '고순도 결정화 연소'] },
  cadence:    { name: '음률 — 권갑 (Cadence)',                       tiers: ['음률의 배주', '음률의 새싹', '음률의 새잎', '음률의 꽃망울'] },
  helix:      { name: '와전류 — 증폭기 (Helix)',                     tiers: ['렌토 와전류', '아다지오 와전류', '안단테 와전류', '프레스토 와전류'] },
  polarizer:  { name: '날개 편광체 — 직검·3.x (Polarizer)',          tiers: ['손상 날개 편광체', '한쪽 날개 편광체', '여러 날개 편광체', '중첩 날개 편광체'] },
  crystal:    { name: '절단된 결정 — 대검·3.x (Carved Crystal)',     tiers: ['저주파수 절단된 결정', '중주파수 절단된 결정', '고주파수 절단된 결정', '전주파수 절단된 결정'] },
  combustor:  { name: '응집 연소체 — 권총·3.x (Combustor)',          tiers: ['결손 응집 연소체', '잔음 응집 연소체', '잔향 응집 연소체', '울림 응집 연소체'] },
  shard:      { name: '비명 이상 결정 조각 — 권갑·3.x (Waveworn Shard)', tiers: ['저주파수 비명 이상 결정 조각', '중주파수 비명 이상 결정 조각', '고주파수 비명 이상 결정 조각', '전주파수 비명 이상 결정 조각'] },
  string:     { name: '현 — 증폭기·3.x (String)',                    tiers: ['긁어모은 현', '끊어진 현', '응고된 현', '노래하는 현'] },
};

// 무기 타입 → 단조 세트 (황룡/검은 해안/리나시타 계열 — 직접 추가한 캐릭터의 기본값)
const WEAPON_FORGE = {
  sword: 'drip',
  broadblade: 'residue',
  pistols: 'phlogiston',
  gauntlets: 'cadence',
  rectifier: 'helix',
};

// 일반 몹 드랍 계열 — 4단계 등급, 한국어 정식 명칭 (wuthering.gg KR DB 대조, 2026-07-11)
const DROP_FAMILIES = {
  whisperin:  { name: '의음 성핵 (Whisperin Core)',      tiers: ['저주파수 의음 성핵', '중주파수 의음 성핵', '고주파수 의음 성핵', '전주파수 의음 성핵'] },
  howler:     { name: '포효 성핵 (Howler Core)',         tiers: ['저주파수 포효 성핵', '중주파수 포효 성핵', '고주파수 포효 성핵', '전주파수 포효 성핵'] },
  ring:       { name: '구속팔찌 — 추방자 드랍 (Ring)',    tiers: ['낡은 구속팔찌', '보통 구속팔찌', '개량 구속팔찌', '특제 구속팔찌'] },
  polygon:    { name: '취합 성핵 (Polygon Core)',        tiers: ['저주파수 취합 성핵', '중주파수 취합 성핵', '고주파수 취합 성핵', '전주파수 취합 성핵'] },
  tidal:      { name: '침식 선형 구조물 (Tidal Residuum)', tiers: ['저주파수 침식 선형 구조물', '중주파수 침식 선형 구조물', '고주파수 침식 선형 구조물', '전주파수 침식 선형 구조물'] },
  exoswarm:   { name: '엑소스웜 성핵 (Exoswarm Core)',   tiers: ['저주파수 엑소스웜 성핵', '중주파수 엑소스웜 성핵', '고주파수 엑소스웜 성핵', '전주파수 엑소스웜 성핵'] },
  mech:       { name: '메카 성핵 (Mech Core)',           tiers: ['저주파수 메카 성핵', '중주파수 메카 성핵', '고주파수 메카 성핵', '전주파수 메카 성핵'] },
  pendant:    { name: '엑소스웜 펜던트 (Exoswarm Pendant)', tiers: ['파손된 엑소스웜 펜던트', '허름한 엑소스웜 펜던트', '흠집이 있는 엑소스웜 펜던트', '완전한 엑소스웜 펜던트'] },
  autopuppet: { name: '기관 인형 중추 핵심 (Autopuppet Kernel)', tiers: ['저주파수 기관 인형 중추 핵심', '중주파수 기관 인형 중추 핵심', '고주파수 기관 인형 중추 핵심', '전주파수 기관 인형 중추 핵심'] }, // 인게임 한글 정식 명칭
};

// 주간 보스 재료 → 드랍 보스 (한국어 정식 명칭 — wuthering.gg KR DB 대조, 2026-07-11)
const WEEKLY_BOSS_MATS = {
  '끊임없는 파괴 (Unending Destruction)':      '스카 (1.0 황룡)',
  '무망의 깃털 (Dreamless Feather)':           '무망자 · Dreamless (1.0 황룡)',
  '비문 고종 (Monument Bell)':                 '타종 거북이 (1.0 황룡)',
  "사계의 단검 (Sentinel's Dagger)":           '수호자 각 · Jué (1.1 황룡)',
  '파도의 장창 (Wave-Cutting Tooth)':          '미실장 — 데이터상 회유의 고래 드랍 예정',
  "저편 세계의 눈빛 (The Netherworld's Stare)": '헤카테 (2.0 리나시타)',
  '붓꽃이 만발하던 날 (When Irises Bloom)':    '플뢰르 드 리스 (2.2 리나시타)',
  '심해의 저주 (Curse of the Abyss)':          '명식 · 레비아탄 (2.7)',
  '기억 속 금빛 (Gold in Memory)':             '시길룸 (3.1 라하이로이)',
  '되묻는 우리 (We Who Question)':             '주간 보스 데니아 (3.3)',
  '하늘길 유리의 마음 (Skyward Glazed Heart)': '천괴중루 (3.5)',
};

// 캐릭터별 스킬 재료 [단조 세트, 몹 드랍, 주간 보스 재료] — Game8 검증 데이터
const CHAR_MATS = {
  jiyan:       ['residue',    'howler',     '비문 고종 (Monument Bell)'],
  yinlin:      ['helix',      'whisperin',  '무망의 깃털 (Dreamless Feather)'],
  jinhsi:      ['residue',    'howler',     "사계의 단검 (Sentinel's Dagger)"],
  changli:     ['drip',       'ring',       "사계의 단검 (Sentinel's Dagger)"],
  zhezhi:      ['helix',      'howler',     '비문 고종 (Monument Bell)'],
  xiangliyao:  ['cadence',    'whisperin',  '끊임없는 파괴 (Unending Destruction)'],
  shorekeeper: ['helix',      'whisperin',  "사계의 단검 (Sentinel's Dagger)"],
  camellya:    ['drip',       'whisperin',  '무망의 깃털 (Dreamless Feather)'],
  carlotta:    ['phlogiston', 'polygon',    "저편 세계의 눈빛 (The Netherworld's Stare)"],
  roccia:      ['cadence',    'tidal',      "저편 세계의 눈빛 (The Netherworld's Stare)"],
  phoebe:      ['helix',      'whisperin',  "사계의 단검 (Sentinel's Dagger)"],
  brant:       ['drip',       'tidal',      "저편 세계의 눈빛 (The Netherworld's Stare)"],
  cantarella:  ['helix',      'polygon',    '붓꽃이 만발하던 날 (When Irises Bloom)'],
  zani:        ['cadence',    'polygon',    "저편 세계의 눈빛 (The Netherworld's Stare)"],
  ciaccona:    ['phlogiston', 'tidal',      '붓꽃이 만발하던 날 (When Irises Bloom)'],
  cartethyia:  ['drip',       'tidal',      '붓꽃이 만발하던 날 (When Irises Bloom)'],
  lupa:        ['residue',    'howler',     "저편 세계의 눈빛 (The Netherworld's Stare)"],
  phrolova:    ['helix',      'polygon',    "저편 세계의 눈빛 (The Netherworld's Stare)"],
  augusta:     ['residue',    'tidal',      '붓꽃이 만발하던 날 (When Irises Bloom)'],
  iuno:        ['cadence',    'polygon',    "저편 세계의 눈빛 (The Netherworld's Stare)"],
  galbrena:    ['phlogiston', 'tidal',      '심해의 저주 (Curse of the Abyss)'],
  qiuyuan:     ['drip',       'whisperin',  '심해의 저주 (Curse of the Abyss)'],
  chisa:       ['residue',    'polygon',    '붓꽃이 만발하던 날 (When Irises Bloom)'],
  lynae:       ['combustor',  'exoswarm',   '무망의 깃털 (Dreamless Feather)'],
  mornye:      ['crystal',    'mech',       "저편 세계의 눈빛 (The Netherworld's Stare)"],
  aemeath:     ['polarizer',  'exoswarm',   '기억 속 금빛 (Gold in Memory)'],
  luukherssen: ['shard',      'pendant',    '기억 속 금빛 (Gold in Memory)'],
  sigrika:     ['shard',      'pendant',    '기억 속 금빛 (Gold in Memory)'],
  hiyuki:      ['polarizer',  'exoswarm',   '되묻는 우리 (We Who Question)'],
  denia:       ['string',     'mech',       '되묻는 우리 (We Who Question)'],
  lucy:        ['combustor',  'exoswarm',   '기억 속 금빛 (Gold in Memory)'],
  rebecca:     ['combustor',  'mech',       '되묻는 우리 (We Who Question)'], // 인게임 확인 (스킬 1개 1→10: ×4)
  lucilla:     ['string',     'mech',       '되묻는 우리 (We Who Question)'],
  xuanling:    ['polarizer',  'autopuppet', '하늘길 유리의 마음 (Skyward Glazed Heart)'],
  suisui:      ['string',     'autopuppet', '하늘길 유리의 마음 (Skyward Glazed Heart)'],
  rover:       ['drip',       'whisperin',  '끊임없는 파괴 (Unending Destruction)'], // 회절 기준 (인멸: Dreamless Feather, 기류: When Irises Bloom)
  calcharo:    ['residue',    'ring',       '비문 고종 (Monument Bell)'],
  lingyang:    ['cadence',    'whisperin',  '끊임없는 파괴 (Unending Destruction)'],
  jianxin:     ['cadence',    'whisperin',  '끊임없는 파괴 (Unending Destruction)'],
  encore:      ['helix',      'whisperin',  '끊임없는 파괴 (Unending Destruction)'],
  verina:      ['helix',      'howler',     '비문 고종 (Monument Bell)'],
  yangyang:    ['drip',       'ring',       '끊임없는 파괴 (Unending Destruction)'],
  chixia:      ['phlogiston', 'whisperin',  '비문 고종 (Monument Bell)'],
  baizhi:      ['helix',      'howler',     '비문 고종 (Monument Bell)'],
  sanhua:      ['drip',       'whisperin',  '끊임없는 파괴 (Unending Destruction)'],
  taoqi:       ['residue',    'howler',     '무망의 깃털 (Dreamless Feather)'],
  danjin:      ['drip',       'ring',       '무망의 깃털 (Dreamless Feather)'],
  aalto:       ['phlogiston', 'howler',     '비문 고종 (Monument Bell)'],
  mortefi:     ['phlogiston', 'whisperin',  '비문 고종 (Monument Bell)'],
  yuanwu:      ['cadence',    'ring',       '끊임없는 파괴 (Unending Destruction)'],
  lumi:        ['residue',    'howler',     "사계의 단검 (Sentinel's Dagger)"],
  youhu:       ['cadence',    'ring',       '비문 고종 (Monument Bell)'],
  buling:      ['helix',      'whisperin',  '심해의 저주 (Curse of the Abyss)'],
};

// 전용 무기(전무) 이름 — 한국어 정식 명칭 (wuthering.gg KR 무기 목록 대조, 2026-07-11)
// null = 확인 불가. 리네: 기존 'Starfield Calibrator' 표기가 모니에 전무로 정정되어 재확인 필요
const SIG_WEAPONS = {
  jiyan: '청룡의 천장',            // Verdant Summit
  yinlin: '꼭두각시의 손',          // Stringmaster
  jinhsi: '태평성대',              // Ages of Harvest
  changli: '솟아오르는 화염',       // Blazing Brilliance
  zhezhi: '옥수 비단',             // Rime-Draped Sprouts
  xiangliyao: '팔방의 천추',        // Verity's Handle
  shorekeeper: '뭇별의 교향곡',     // Stellar Symphony
  camellya: '날카로운 봄',          // Red Spring
  carlotta: '죽음과 춤',           // The Last Dance
  roccia: '희비극',                // Tragicomedy
  phoebe: '광휘의 찬송가',          // Luminous Hymn
  brant: '흔들리지 않는 용기',      // Unflickering Valor
  cantarella: '바다의 속삭임',      // Whispers of Sirens
  zani: '불빛의 심판',             // Blazing Justice
  ciaccona: '숲속의 아리아',        // Woodland Aria
  cartethyia: '숙명에 맞서는 관',   // Defier's Thorn
  lupa: '불길',                    // Wildfire Mark
  phrolova: '잊혀진 피안의 슬픈 악장', // Lethean Elegy
  augusta: '천둥벼락을 다스리는 권능', // Thunderflare Dominion
  iuno: '세상 만물의 진리',         // Moongazer's Sigil
  galbrena: '얽혀진 빛과 그림자',   // Lux & Umbra
  qiuyuan: '푸른 의지',            // Emerald Sentence
  chisa: '쿠모키리',               // Kumokiri (曇斬)
  lynae: '스펙트럼 블래스터',       // Spectrum Blaster (3.0 공식 공지·위키 확인)
  mornye: '별하늘 연산 측정기',     // Starfield Calibrator
  aemeath: '영원한 샛별',          // Everbright Polestar
  luukherssen: '한낮의 의지',      // Daybreaker's Spine
  sigrika: '솔스원의 해석',        // Solsworn Ciphers
  hiyuki: '서린 불꽃',             // Frostburn
  denia: '위조된 작은별',          // Forged Dwarf Star
  lucy: '스펙트럴 트리거',         // Spectral Trigger
  rebecca: '스컬 스래셔',          // Skull Thrasher
  lucilla: '프리즈 프레임',        // Freeze Frame (기존 Forged Dwarf Star 표기는 데니아 전무로 정정)
  xuanling: '아득히 푸른 하늘',    // Azure Oath
  suisui: '노을에 깃든 이슬',      // Firstlight's Herald
};

// 돌파(레벨업) 재료 [지역 특산물, 필드 보스 드랍] — 몹 드랍은 스킬과 같은 계열, null = 확인 불가
const ASC_MATS = {
  jiyan:       ['공작화', '울부짖는 바위주먹'],
  yinlin:      ['구름버섯', '악의 이종 성핵'],
  jinhsi:      ['클레로덴드론', '애가의 성핵'],
  changli:     ['작령 열매', '분노의 성핵'],
  zhezhi:      ['등롱초', '음향의 성핵'],
  xiangliyao:  ['보라색 산호', '벼락의 성핵'],
  shorekeeper: ['신성', '고요한 위상'],
  camellya:    ['신성', '고요한 위상'],
  carlotta:    ['검창포꽃', '백금 기계의 심장'],
  roccia:      ['폭죽 봉선화', '속죄의 소라'],
  phoebe:      ['폭죽 봉선화', '속죄의 소라'],
  brant:       ['「황금 양모」', '화염의 용뼈'],
  cantarella:  ['부유 바다꽃', '속죄의 소라'],
  zani:        ['검창포꽃', '백금 기계의 심장'],
  ciaccona:    ['「황금 양모」', '화염의 용뼈'],
  cartethyia:  ['아이리스', '불후의 영광'],
  lupa:        ['블러드 바이버넘', '불후의 영광'],
  phrolova:    ['「다음 생」', '잠언과 거짓말'],
  augusta:     ['빛나는 금잔', '오염된 꼭두각시 왕관'],
  iuno:        ['달맞이꽃', '심해에 남은 침식물'],
  galbrena:    ['돌장미', '오염된 꼭두각시 왕관'],
  qiuyuan:     ['인동국화', '잠언과 거짓말'],
  chisa:       ['영원한 여름', '심해에 남은 침식물'],
  lynae:       ['서리꽃', '태양을 노리는 손끝'],
  mornye:      ['쌍둥이 포자', '꺼지지 않는 심판'],
  aemeath:     ['모스 엠버', '우리의 선택'],
  luukherssen: ['에델슈네', '태양을 노리는 손끝'],
  sigrika:     ['아르티메틱 셸', '우리의 선택'],
  hiyuki:      ['붉은 은방울꽃', '우리의 선택'],
  denia:       ['별의 꿈', '꺼지지 않는 심판'], // Dream of Stars (Stargrail은 사전 명칭으로 추정)
  lucy:        ['지난날의 환상', '악몽의 잔재'],
  rebecca:     ['지난날의 환상', '악몽의 잔재'], // 인게임/DB 확인
  lucilla:     ['물망초', '태양을 노리는 손끝'],
  xuanling:    ['노을빛 구름 깃털', '화염에 새겨진 정의'], // 인게임 확인
  suisui:      ['노을을 헤엄치는 비단 잉어', '화염에 새겨진 정의'],
  rover:       ['공작화', '신비한 암호'], // Mysterious Code
  calcharo:    ['붓꽃', '번개의 성핵'],
  lingyang:    ['구름버섯', '음향의 성핵'],
  jianxin:     ['등롱초', '울부짖는 바위주먹'],
  encore:      ['공작화', '분노의 성핵'],
  verina:      ['개양귀비', '애가의 성핵'],
  yangyang:    ['인동국화', '울부짖는 바위주먹'],
  chixia:      ['개양귀비', '분노의 성핵'],
  baizhi:      ['등롱초', '음향의 성핵'],
  sanhua:      ['인동국화', '음향의 성핵'],
  taoqi:       ['붓꽃', '파괴의 깃털'],
  danjin:      ['개양귀비', '분쟁의 성핵'],
  aalto:       ['인동국화', '울부짖는 바위주먹'],
  mortefi:     ['구름버섯', '분노의 성핵'],
  yuanwu:      ['검은 연꽃', '벼락의 성핵'],
  lumi:        ['검은 연꽃', '번개의 성핵'],
  youhu:       ['보라색 산호', '고요한 위상'],
  buling:      ['공작화', '오염된 꼭두각시 왕관'],
};

// 돌파 공통 수량 (0→6돌파, Lv.90 상한 기준 — 인게임 확인)
const ASC_TOTALS = {
  specialty: 60,
  boss: 46,
  enemy: [4, 12, 12, 4],
  credits: '170,000',            // 순수 돌파 비용
  exp: '특급 공명 촉진제 ×122',   // Lv.90 경험치 (전 캐릭터 공통)
  creditsWithExp: '1,023,300',   // 경험치 포함 총 클램 코인
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
/* 이번 주기 버프·몹은 게임 데이터 추출 DB(encore.moe) 기준, 2026-07-11 확인 */
const CONTENT_DEFAULTS = [
  {
    id: 'tower',
    icon: '🗼',
    name: '역경의 탑 (심경 구역)',
    period: 28,
    start: '2026-06-22', // 37시즌: 2026-06-22 ~ 07-20 (검증 주기 3개의 28일 격자)
    rules: '37시즌. 스테이지·심경 간섭은 28일마다 전면 교체, 도전·보상은 14일마다 초기화(중간 리셋 7/6). 심경 구역 피로도 40, 잔향·울림의 탑 층당 1/2/3/4, 심연의 탑 층당 5.',
    buff: '잔향의 탑: 기류 저항 -10% · 피해 시 방어력 25% 무시 · 이상 효과 보유 적 받는 피해 +20%\n심연의 탑(1~2층): 회절·인멸 저항 -10%, 용융·응결 저항 +10% · 크리 피해 +25% · 변주 시 강공/일반 피해 +40%\n울림의 탑: 전도 저항 -10% · 변주 시 공격력 +20% · 공명 스킬 시 해방 피해 +30%',
    stages: [
      { name: '잔향의 탑', mobs: '1층 페이 이그니스·미스터 매직, 2층 심판하는 전사·심연의 위병, 3층 갈기늑대·암흑·추방자 두목·흑야 기사, 4층 잔성·밀리너·음험한 백로' },
      { name: '심연의 탑', mobs: '1층 반디의 군세, 2층 파트리시우스 귀족·서리의 기생갑·지옥불 기사, 3층 플로라 메카 레인디어·소용돌이 곰·크로나클라우·폭주의 고릴라, 4층 이름없는 탐색자·플뢰르 드 리스' },
      { name: '울림의 탑', mobs: '1층 거대 인형, 2층 거암 투사·오열하는 전사, 3층 유령 인형, 4층 탄식의 고룡' },
    ],
  },
  {
    id: 'sea',
    icon: '🌊',
    name: '해역 (죽음의 노래와 바닷속 폐허)',
    period: 28,
    start: '2026-07-06', // 19시즌: 2026-07-06 05:00 ~ 08-03 04:59 (KR 확정)
    rules: '19시즌 (7/6 05:00 ~ 8/3 04:59 확정). 4주 시즌제, 리셋 시 재생 해역(해곡·급류)만 초기화되고 금기의 해역은 유지. 2파티 동시 편성.',
    buff: '피해·처치로 연소 수치 회복, 최대치에서 타오르는 조수 진입(지속 30초)\n공격 명중한 적 5초간 받는 최종 피해 +60%\n조화 소실 적을 스킬로 명중하면 조화도 파괴 피해 발생',
    stages: [
      { name: '12단계 · 끝 없는 심연', mobs: '적 받는 최종 피해 +30% · 모든 증표 무제한 휴대' },
      { name: '상단', mobs: '칵찰찰, 플로라 메카 레인디어, 오열하는 전사, 유령 인형' },
      { name: '하단', mobs: '파종 호박벌, 초록색 왜가리, 오열하는 전사, 유령 인형' },
    ],
  },
  {
    id: 'matrix',
    icon: '🧩',
    name: '매트릭스 더블 폰스',
    period: 125,
    start: '2026-07-10', // S2 단계1, 종료 표기 3.8 → 11월 중순 추정
    rules: 'S2 단계1 「위험한 경지의 강습」 — 시즌 종료: 3.8 업데이트 시(11월 중순 추정). 안정 프로토콜 최대 3파티 + 특이점 확장 무제한. 출전당 피로도 1(서포터 계열 2), 무기·에코 캐릭터 귀속, 방랑자는 속성 무관 1회.',
    buff: '공용: 적 받는 최종 피해 +20%, 공명 스킬 최종 피해 +20%\n이상 효과: 이상 부여 시 받는 최종 피해 +25%(30초), 암흑 부여 시 내 최종 피해 +30%(15초)\n에코: 에코 어빌리티 최종 피해 +30%, 용융 +20%, 강공격 +20%\n조화도 파괴: 조화 파동 최종 피해 +150%, 조화도·이탈 부여 시 +25%(30초)',
    stages: [
      { name: '등장 몹', mobs: '매트릭스 클러스터, 애곡하는 아익스, 플뢰르 드 리스, 리액터 허스크' },
      { name: '특이점 확장', mobs: '매트릭스 미믹 추가' },
    ],
  },
];

/* ---- 재화 ----
   1뽑 = 아스트라이트 160. 달빛살(Lunite)은 1:1로 아스트라이트 전환.
   팩 가격은 대략적인 KR 스토어 기준 (최고가 팩 11만원은 사용자 확인값). */
const ASTRITE_PER_PULL = 160;
const LUNITE_PACKS = [
  // 쿠로게임즈 한국 공식 공시 가격 (2026-07-11, PS5는 별도: 6,480 = 130,900원)
  { price: 1200,   base: 60,   bonus: 8 },
  { price: 5900,   base: 300,  bonus: 30 },
  { price: 19000,  base: 980,  bonus: 110 },
  { price: 37000,  base: 1980, bonus: 260 },
  { price: 65000,  base: 3280, bonus: 600 },
  { price: 119000, base: 6480, bonus: 1600 },
];

const COPY_LABELS = ['명함', '1돌', '2돌', '3돌', '4돌', '5돌', '6돌'];
const WEAPON_COPY_LABELS = ['1개(1재련)', '2개(2재련)', '3개(3재련)', '4개(4재련)', '5개(5재련)'];
