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
    this.classList = { add() {}, remove() {}, toggle() {} };
  }
  addEventListener() {}
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
  scheduleGoalPlan, calculatorPullsForSchedule,
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

console.log('앱 회귀 테스트 통과: 마이그레이션, 가져오기, 목표 계산, 천장·일정 효과');
