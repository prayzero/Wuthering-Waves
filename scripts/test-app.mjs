import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.hidden = false;
    this.open = false;
    this.style = {};
    this.dataset = {};
    this.listeners = {};
    this.focusCount = 0;
    this.classList = { add() {}, remove() {}, toggle() {} };
  }
  addEventListener(type, handler) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }
  focus() { this.focusCount += 1; documentStub.activeElement = this; }
  removeAttribute() {}
  setAttribute() {}
  querySelector() { return new FakeElement(); }
  querySelectorAll() { return []; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 720, height: 300 }; }
}

const elements = new Map();
const documentStub = {
  activeElement: null,
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, new FakeElement(id));
    return elements.get(id);
  },
  querySelectorAll() { return []; },
  addEventListener() {},
};

const storage = new Map();
const localStorageStub = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
};

const RealDate = Date;
class FixedDate extends RealDate {
  constructor(...args) {
    super(...(args.length ? args : ['2026-07-16T12:00:00+09:00']));
  }
  static now() { return new RealDate('2026-07-16T12:00:00+09:00').getTime(); }
}

const context = vm.createContext({
  console,
  Date: FixedDate,
  document: documentStub,
  localStorage: localStorageStub,
  navigator: {},
  window: { addEventListener() {}, scrollTo() {}, innerWidth: 1280, innerHeight: 720 },
  confirm: () => true,
  setTimeout: () => 1,
  clearTimeout() {},
});

const dataSource = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
vm.runInContext(`${dataSource}\n${appSource}\n;globalThis.__qa = {
  normalizeStateData: (value, options) => normalizeStateData(JSON.parse(JSON.stringify(value)), options),
  scheduleGoalPlan, calculatorPullsForSchedule, purchasePlanTotals,
  lunitePurchasePrice, lunitePurchaseAmount, addSelectedLunitePurchase, renderPityCalc, calculatorResultMarkup,
  applyRecordSideEffects, revertRecordSideEffects, rebaseRecordEffectsForDeletion, esc,
  getState: () => state, setState: value => { state = value; }
};`, context, { filename: 'app-bundle.js' });

const app = context.__qa;

const goals = {
  '명함': 160,
  '1돌': 320,
  '6돌': 1120,
  '명함+전무': 240,
  '전무만': 80,
};
for (const [goal, expected] of Object.entries(goals)) {
  assert.equal(app.scheduleGoalPlan(goal).total, expected, `${goal} 목표 뽑기 수`);
}

const legacy = app.normalizeStateData({
  parties: [],
  pity: { charCount: 37, charGuaranteed: true, weaponCount: 21 },
});
assert.equal(legacy.pity.charGroups['char-event'].count, 37, 'v1 캐릭터 천장 마이그레이션');
assert.equal(legacy.pity.charGroups['char-event'].guaranteed, true, 'v1 확정 상태 마이그레이션');
assert.equal(legacy.pity.weaponGroups['weapon-event'].count, 21, 'v1 전무 천장 마이그레이션');

const xssInput = {
  parties: [],
  contents: [{
    id: 'tower',
    icon: '<img src=x onerror=alert(1)>',
    name: '<img src=x onerror=alert(1)>',
    start: '2026-07-01',
    period: 14,
    rules: '규칙',
    buff: '버프',
    stages: [],
  }],
};
const normalizedXss = app.normalizeStateData(xssInput);
assert.equal(normalizedXss.contents[0].icon, '🗼', '가져온 컨텐츠 아이콘 무시');
assert.match(app.esc(normalizedXss.contents[0].name), /^&lt;img src=x onerror=alert/, '동적 텍스트 이스케이프');
assert.throws(() => app.normalizeStateData(xssInput, { strict: true }), /아이콘/, '변조 아이콘 백업 거부');
assert.throws(() => app.normalizeStateData({ parties: 'bad' }, { strict: true }), /최상위 구조/, '잘못된 중첩 타입 거부');
assert.throws(() => app.normalizeStateData({
  parties: [], customChars: [{ id: 'constructor', name: '위험 키', rarity: 5, element: 'fusion' }],
}, { strict: true }), /커스텀 캐릭터 ID/, '프로토타입 위험 ID 거부');

const calcState = app.normalizeStateData({
  parties: [],
  calc: { astrite: 1600, lunite: 0, charTickets: 5, weaponTickets: 7 },
});
app.setState(calcState);
assert.equal(app.calculatorPullsForSchedule({ goal: '명함' }), 15, '캐릭터 목표 티켓 합산');
assert.equal(app.calculatorPullsForSchedule({ goal: '전무만' }), 17, '전무 목표 티켓 합산');
assert.equal(app.calculatorPullsForSchedule({ goal: '명함+전무' }), 22, '복합 목표 티켓 합산');

const legacyCalc = app.normalizeStateData({ parties: [], calc: { astrite: 160 } });
assert.equal(JSON.stringify(legacyCalc.calc.purchases), '[]', '기존 백업은 빈 충전 계획으로 마이그레이션');
assert.equal(legacyCalc.calc.legacyLuniteReview, false, '달빛이 없는 기존 백업은 확인 안내 생략');
const ambiguousLegacyCalc = app.normalizeStateData({ schemaVersion: 2, parties: [], calc: { lunite: 8080 } });
assert.equal(ambiguousLegacyCalc.calc.lunite, 8080, '기존 달빛 값은 임의로 삭제하지 않음');
assert.equal(ambiguousLegacyCalc.calc.legacyLuniteReview, true, '기존 달빛 출처 확인 안내 표시');
const currentCalc = app.normalizeStateData({ schemaVersion: 3, parties: [], calc: { lunite: 8080 } });
assert.equal(currentCalc.calc.legacyLuniteReview, false, '현재 버전 보유 달빛은 재확인하지 않음');

const kuroRegular = { base: 6480, platform: 'kuro', first: false };
const kuroFirst = { base: 6480, platform: 'kuro', first: true };
const psFirst = { base: 6480, platform: 'ps5', first: true };
assert.equal(app.lunitePurchasePrice(kuroRegular), 119000, '쿠로 공식 6480 팩 가격');
assert.equal(app.lunitePurchasePrice(psFirst), 130900, 'PS5 6480 팩 가격');
assert.equal(app.lunitePurchaseAmount(kuroRegular), 8080, '6480 팩 이후 구매 지급량');
assert.equal(app.lunitePurchaseAmount(kuroFirst), 12960, '6480 팩 첫 충전 지급량');
assert.equal(app.lunitePurchaseAmount({ base: 60, platform: 'kuro', first: false }), 60, '60 팩 이후 구매 보너스 없음');

const firstPlan = app.normalizeStateData({
  parties: [], calc: {
    purchasePlatform: 'kuro', purchasePack: 6480, purchaseFirst: true, purchases: [],
  },
});
let purchaseResult = app.addSelectedLunitePurchase(firstPlan.calc);
assert.equal(purchaseResult.ok, true, '첫 충전 계획 추가');
assert.equal(app.purchasePlanTotals(firstPlan.calc).won, 119000, '첫 충전 예상 결제액');
assert.equal(app.purchasePlanTotals(firstPlan.calc).lunite, 12960, '첫 충전 계획 달빛 합계');
assert.equal(app.calculatorPullsForSchedule({ goal: '명함' }, firstPlan.calc), 81, '첫 충전 계획을 뽑기 수에 합산');

firstPlan.calc.purchaseFirst = true;
purchaseResult = app.addSelectedLunitePurchase(firstPlan.calc);
assert.equal(purchaseResult.ok, false, '같은 팩 첫 충전 중복 차단');
assert.equal(purchaseResult.reason, 'first-used', '첫 충전 중복 사유');
assert.equal(firstPlan.calc.purchases.length, 1, '중복 차단 시 구매 계획 유지');

firstPlan.calc.purchaseFirst = false;
purchaseResult = app.addSelectedLunitePurchase(firstPlan.calc);
assert.equal(purchaseResult.ok, true, '같은 팩 이후 구매는 반복 허용');
assert.equal(app.purchasePlanTotals(firstPlan.calc).won, 238000, '첫 충전과 이후 구매 지출 합산');
assert.equal(app.purchasePlanTotals(firstPlan.calc).lunite, 21040, '첫 충전과 이후 구매 달빛 합산');

firstPlan.calc.purchasePack = 3280;
firstPlan.calc.purchaseFirst = true;
assert.equal(app.addSelectedLunitePurchase(firstPlan.calc).ok, true, '다른 팩 첫 충전은 별도 허용');
assert.throws(() => app.normalizeStateData({
  parties: [], calc: { purchases: [kuroFirst, kuroFirst] },
}, { strict: true }), /한 번만/, '가져오기에서도 첫 충전 중복 거부');

app.setState(firstPlan);
app.renderPityCalc();
const calculatorHtml = elements.get('pity-calc').innerHTML;
assert.match(calculatorHtml, /예상 결제액/, '원화 지출 요약 렌더링');
assert.match(calculatorHtml, /role="region" tabindex="0" aria-label="플랫폼별 달빛 팩 가격과 보너스 비교표"/, '모바일 가격표 키보드 접근 가능');
assert.match(calculatorHtml, /PlayStation 5 \(KR\)/, '플랫폼 선택 렌더링');
assert.match(calculatorHtml, /공용 재화 .*두 배너에 동시에 사용할 수 없습니다/, '공용 재화 중복 사용 경고');
assert.match(calculatorHtml, /별의 소리 \(Astrite\)/, '공식 재화명 렌더링');
assert.doesNotMatch(calculatorHtml, /data-addlunite|첫구매 2배|달빛살/, '오해를 부르는 기존 빠른 버튼 제거');

const calcRoot = elements.get('pity-calc');
const calcClick = calcRoot.listeners.click?.[0];
const calcInput = calcRoot.listeners.input?.[0];
const calcChange = calcRoot.listeners.change?.[0];
assert.equal(typeof calcClick, 'function', '계산기 클릭 이벤트 연결');
assert.equal(typeof calcInput, 'function', '계산기 입력 이벤트 연결');
assert.equal(typeof calcChange, 'function', '계산기 변경 이벤트 연결');
const calcTarget = ({ id = '', value = '', checked = false, dataSelector = '', dataset = {} } = {}) => ({
  id, value, checked, dataset,
  closest(selector) {
    if (id && selector === `#${id}`) return this;
    if (dataSelector && selector === dataSelector) return this;
    return null;
  },
});

const eventState = app.normalizeStateData({ schemaVersion: 3, parties: [], calc: {} });
app.setState(eventState);
app.renderPityCalc();
documentStub.getElementById('calc-platform').focusCount = 0;
calcChange({ target: calcTarget({ id: 'calc-platform', value: 'ps5' }) });
assert.equal(eventState.calc.purchasePlatform, 'ps5', '플랫폼 변경 이벤트 반영');
assert.equal(elements.get('calc-platform').focusCount, 1, '플랫폼 변경 후 키보드 포커스 복원');

calcChange({ target: calcTarget({ id: 'calc-first', checked: true }) });
assert.equal(eventState.calc.purchaseFirst, true, '첫 충전 선택 이벤트 반영');
calcChange({ target: calcTarget({ id: 'calc-pack', value: '3280' }) });
assert.equal(eventState.calc.purchasePack, 3280, '팩 변경 이벤트 반영');
assert.equal(eventState.calc.purchaseFirst, false, '팩 변경 시 첫 충전 선택 초기화');
calcChange({ target: calcTarget({ id: 'calc-first', checked: true }) });
documentStub.getElementById('calc-add-purchase').focusCount = 0;
calcClick({ target: calcTarget({ id: 'calc-add-purchase' }) });
assert.equal(eventState.calc.purchases.length, 1, '구매 계획 추가 이벤트 반영');
assert.equal(app.purchasePlanTotals(eventState.calc).won, 71500, 'PS5 3280 팩 지출 이벤트 합산');
assert.equal(elements.get('calc-add-purchase').focusCount, 1, '구매 계획 추가 후 버튼 포커스 복원');

elements.get('calc-add-purchase').focusCount = 0;
calcClick({ target: calcTarget({ dataSelector: '[data-remove-purchase]', dataset: { removePurchase: '0' } }) });
assert.equal(eventState.calc.purchases.length, 0, '구매 계획 개별 삭제 이벤트 반영');
assert.equal(elements.get('calc-add-purchase').focusCount, 1, '마지막 계획 삭제 후 추가 버튼으로 포커스 이동');
calcClick({ target: calcTarget({ id: 'calc-add-purchase' }) });
assert.equal(eventState.calc.purchases.length, 1, '이후 구매 계획 다시 추가');
elements.get('calc-add-purchase').focusCount = 0;
calcClick({ target: calcTarget({ id: 'calc-clear-purchases' }) });
assert.equal(eventState.calc.purchases.length, 0, '구매 계획 전체 삭제 이벤트 반영');
assert.equal(elements.get('calc-add-purchase').focusCount, 1, '전체 삭제 후 추가 버튼으로 포커스 이동');

documentStub.getElementById('calc-lunite').focusCount = 0;
calcInput({ target: calcTarget({ id: 'calc-lunite', value: '160' }) });
assert.equal(eventState.calc.lunite, 160, '보유 달빛 입력 이벤트 반영');
assert.equal(elements.get('calc-lunite').focusCount, 0, '숫자 입력 변경 후 같은 칸에 포커스를 가두지 않음');
assert.match(elements.get('calc-result').innerHTML, /공용 재화 <b>160<\/b> = <b>1뽑<\/b>/, '숫자 입력 시 결과 영역만 갱신');
calcClick({ target: calcTarget({ id: 'calc-add-purchase' }) });
assert.equal(eventState.calc.lunite, 160, '재화 입력 직후 구매 버튼을 눌러도 보유값 유지');
const negativeLuniteTarget = calcTarget({ id: 'calc-lunite', value: '-160' });
calcChange({ target: negativeLuniteTarget });
assert.equal(eventState.calc.lunite, 0, '음수 보유 달빛을 0으로 정규화');
assert.equal(negativeLuniteTarget.value, '0', '정규화한 숫자를 입력칸에도 반영');

const legacyEventState = app.normalizeStateData({ schemaVersion: 2, parties: [], calc: { lunite: 8080 } });
app.setState(legacyEventState);
app.renderPityCalc();
assert.match(elements.get('pity-calc').innerHTML, /기존 달빛 값을 확인해 주세요/, '기존 모의 충전값 확인 안내 렌더링');
documentStub.getElementById('calc-lunite').focusCount = 0;
calcClick({ target: calcTarget({ id: 'calc-legacy-clear' }) });
assert.equal(legacyEventState.calc.lunite, 0, '기존 달빛 초기화 이벤트 반영');
assert.equal(legacyEventState.calc.legacyLuniteReview, false, '초기화 후 확인 안내 해제');
assert.equal(elements.get('calc-lunite').focusCount, 1, '기존값 처리 후 달빛 입력으로 포커스 이동');

function activeState({ charId = 'xuanling', saved = 100, count = 30, guaranteed = false } = {}) {
  return app.normalizeStateData({
    parties: [],
    schedules: [{
      id: 'schedule-active', charId, name: '진행 일정', start: '2026-07-10', end: '2026-07-30',
      saved, goal: '명함', memo: '',
    }],
    pity: {
      selectedCharGroup: 'char-event',
      selectedWeaponGroup: 'weapon-event',
      charGroups: {
        'char-event': { count, guaranteed },
        'char-select-35': { count: 44, guaranteed: false },
      },
      weaponGroups: { 'weapon-event': { count: 0 } },
    },
  });
}

let effectState = activeState();
app.setState(effectState);
const activeRecord = { id: 'record-active', season: '3.5-전반', type: 'char', charId: 'xuanling', copy: 0, pulls: 70, lost: false };
app.applyRecordSideEffects(activeRecord);
assert.equal(effectState.pity.charGroups['char-event'].count, 0, '현재 배너 천장 초기화');
assert.equal(effectState.schedules[0].saved, 30, '현재 배너 일정 뽑기 차감');
app.revertRecordSideEffects(activeRecord);
assert.equal(effectState.pity.charGroups['char-event'].count, 30, '기록 삭제 시 천장 복원');
assert.equal(effectState.schedules[0].saved, 100, '기록 삭제 시 일정 복원');

effectState = activeState();
app.setState(effectState);
const pastRecord = { id: 'record-past', season: '1.0-전반', type: 'char', charId: 'jiyan', copy: 0, pulls: 70, lost: false };
app.applyRecordSideEffects(pastRecord);
assert.equal(effectState.pity.charGroups['char-event'].count, 30, '과거 기록이 현재 천장을 건드리지 않음');
assert.equal(effectState.schedules[0].saved, 100, '과거 기록이 현재 일정을 건드리지 않음');
assert.equal(pastRecord.effects, undefined, '과거 기록에 복원 효과를 저장하지 않음');

effectState = activeState({ charId: 'jiyan', saved: 90, count: 22 });
effectState.schedules[0].end = '2026-08-19';
app.setState(effectState);
const selectionRecord = { id: 'record-select', season: '3.5-선택형', type: 'char', charId: 'jiyan', copy: 0, pulls: 40, lost: false };
app.applyRecordSideEffects(selectionRecord);
assert.equal(effectState.pity.charGroups['char-event'].count, 22, '일반 천장 그룹 유지');
assert.equal(effectState.pity.charGroups['char-select-35'].count, 0, '선택형 천장 그룹만 초기화');

effectState = activeState({ charId: 'jiyan', saved: 90, count: 22 });
effectState.schedules[0].end = '2026-08-19';
app.setState(effectState);
const aliasRecord = {
  id: 'record-alias', season: '기염 픽업', type: 'char', charId: 'jiyan', copy: 0,
  pulls: 40, lost: false, scheduleId: 'schedule-active',
};
app.applyRecordSideEffects(aliasRecord);
assert.equal(effectState.pity.charGroups['char-event'].count, 22, '종료된 시즌 별칭이 일반 천장을 건드리지 않음');
assert.equal(effectState.pity.charGroups['char-select-35'].count, 0, '연결된 일정으로 현재 선택형 배너를 찾음');
assert.equal(effectState.schedules[0].saved, 50, '별칭 기록도 연결한 일정만 차감');

effectState = activeState({ count: 18 });
app.setState(effectState);
const correctedRecord = {
  id: 'record-corrected', season: '3.5-전반', type: 'char', charId: 'jiyan', copy: 0,
  pulls: 35, lost: false,
};
app.applyRecordSideEffects(correctedRecord);
assert.equal(effectState.pity.charGroups['char-event'].count, 18, '대상과 맞지 않는 현재 시즌의 천장을 유지');
assert.equal(effectState.pity.charGroups['char-select-35'].count, 0, '대상 캐릭터의 유일한 현재 배너로 보정');

effectState = activeState({ guaranteed: false });
app.setState(effectState);
const lostRecord = { id: 'record-lost', season: '3.5-전반', type: 'char', charId: 'xuanling', copy: 0, pulls: 50, lost: true };
app.applyRecordSideEffects(lostRecord);
assert.equal(effectState.pity.charGroups['char-event'].guaranteed, true, '픽뚫 기록 후 확정 상태');

effectState = activeState({ saved: 160, count: 40 });
app.setState(effectState);
const firstRecord = { id: 'record-first', season: '3.5-전반', type: 'char', charId: 'xuanling', copy: 0, pulls: 30, lost: false };
const secondRecord = { id: 'record-second', season: '3.5-전반', type: 'char', charId: 'xuanling', copy: 1, pulls: 30, lost: false };
app.applyRecordSideEffects(firstRecord);
app.applyRecordSideEffects(secondRecord);
effectState.records = [firstRecord, secondRecord];
app.rebaseRecordEffectsForDeletion(firstRecord);
app.revertRecordSideEffects(firstRecord);
effectState.records = effectState.records.filter(record => record.id !== firstRecord.id);
assert.equal(effectState.schedules[0].saved, 100, '이전 기록 삭제가 최신 효과를 덮지 않음');
app.rebaseRecordEffectsForDeletion(secondRecord);
app.revertRecordSideEffects(secondRecord);
effectState.records = effectState.records.filter(record => record.id !== secondRecord.id);
assert.equal(effectState.schedules[0].saved, 160, '오래된 기록부터 삭제해도 일정 완전 복원');
assert.equal(effectState.pity.charGroups['char-event'].count, 40, '오래된 기록부터 삭제해도 천장 완전 복원');
assert.equal(effectState.schedules[0].effectOwner, null, '삭제된 일정 효과 소유자가 남지 않음');
assert.equal(effectState.pity.charGroups['char-event'].effectOwner, null, '삭제된 천장 효과 소유자가 남지 않음');

effectState = activeState({ saved: 100, count: 25 });
app.setState(effectState);
const weaponRecord = { id: 'record-weapon', season: '3.5-전반', type: 'weapon', charId: 'xuanling', copy: 0, pulls: 40, lost: false };
app.applyRecordSideEffects(weaponRecord);
assert.equal(effectState.schedules[0].saved, 100, '전무 기록이 캐릭터 전용 일정을 차감하지 않음');

console.log('앱 회귀 테스트 통과: 마이그레이션, 충전 계획, 가져오기, 목표 계산, 천장·일정 효과');
