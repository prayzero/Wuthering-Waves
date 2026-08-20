import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataSource = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const bannerSeasonFunction = appSource.match(/function bannerSeasonNames\(b\) \{[\s\S]*?\n\}/)?.[0];

assert.ok(bannerSeasonFunction, 'bannerSeasonNames 함수를 찾을 수 있어야 함');

const context = vm.createContext({ console });
vm.runInContext(`${dataSource}
const charById = id => CHARACTERS.find(character => character.id === id);
function bannerKey(b) { return \`${'${b.ver}-${b.phase}'}\`; }
${bannerSeasonFunction}
globalThis.__nameAudit = {
  characters: CHARACTERS.map(({ id, name }) => ({ id, name })),
  aliases: OLD_NAME_ALIASES,
  seasons: Object.fromEntries(BANNERS.filter(b => !b.leaked).map(b => [bannerKey(b), bannerSeasonNames(b)])),
};`, context, { filename: 'character-name-audit.js' });

const audit = JSON.parse(JSON.stringify(context.__nameAudit));
const expectedNames = {
  roccia: '로코코',
  phoebe: '페비',
  brant: '브렌트',
  zani: '젠니',
  ciaccona: '샤콘',
  phrolova: '플로로',
  aemeath: '에이메스',
  luukherssen: '루크 · 헤르센',
  xuanling: '양양 · 현령',
  verina: '벨리나',
  baizhi: '설지',
  yuanwu: '연무',
  buling: '복링',
  qingxiao: '청초',
  jingran: '경연',
};

const actualNames = Object.fromEntries(audit.characters.map(character => [character.id, character.name]));
for (const [id, expectedName] of Object.entries(expectedNames)) {
  assert.equal(actualNames[id], expectedName, `${id} 공식 한국어 표기`);
}
assert.equal(new Set(audit.characters.map(character => character.name)).size, audit.characters.length, '캐릭터 이름 중복 없음');

const oldCanonicalNames = ['로치아', '피비', '브란트', '자니', '샤코나', '프롤로바', '에메스', '루크 헤르센', '현령', '버리나', '백지', '위안우', '복령'];
for (const oldName of oldCanonicalNames) {
  assert.ok(!audit.characters.some(character => character.name === oldName), `${oldName}가 현재 캐릭터명으로 남지 않음`);
}

assert.deepEqual(audit.aliases['샤콘'], ['샤코나', '시아코나'], '샤콘의 이전 표기 호환');
assert.deepEqual(audit.aliases['벨리나'], ['버리나', '버디나'], '벨리나의 이전 표기 호환');
assert.deepEqual(audit.aliases['연무'], ['위안우', '원무'], '연무의 이전 표기 호환');
assert.ok(audit.seasons['2.3-후반'].includes('샤콘 픽업'), '샤콘 공식명 시즌 매칭');
assert.ok(audit.seasons['2.3-후반'].includes('샤코나 픽업'), '샤콘 이전 표기 시즌 매칭');
assert.ok(audit.seasons['2.3-후반'].includes('로치아 픽업'), '복각 캐릭터 이전 표기 시즌 매칭');
assert.ok(audit.seasons['3.5-전반'].includes('루크 헤르센 픽업'), '최근 복각 이전 표기 시즌 매칭');
assert.ok(audit.seasons['3.6-전반'].includes('청초 픽업'), '3.6 전반 청초 시즌 매칭');
assert.ok(audit.seasons['3.6-전반'].includes('천초 픽업'), '청초 이전 오기록 시즌 매칭');
assert.ok(audit.seasons['3.6-전반'].includes('데니아 픽업'), '3.6 전반 데니아 복각 시즌 매칭');

console.log(`캐릭터 이름 회귀 테스트 통과: 공식 표기 ${Object.keys(expectedNames).length}개`);
