import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'js/optimizer.js'), 'utf8'), context, { filename: 'optimizer.js' });
const optimize = input => JSON.parse(JSON.stringify(context.optimizeOwnedParties(input)));
const entry = (id, members, extra = {}) => ({ id, members, label: id, reason: '시험 조합', ...extra });
const fixture = (ids, recommendations, extra = {}) => ({
  characters: ids.map(id => ({ id, name: id })),
  owned: Object.fromEntries(ids.map(id => [id, true])), progress: {}, recommendations, ...extra,
});
const ids = 'abcdefghi'.split('');
const teamIds = result => result.teams.map(team => team.id);
const build = (ready = 0, sequence = null, signatureWeapon = null) => ({
  level90: ready > 0, skills: ready > 1, echo: ready > 2, weapon: ready > 3, sequence, signatureWeapon,
});

assert.deepEqual(optimize().teams, []);
for (const invalid of [null, false, 4, [], 'bad']) assert.deepEqual(optimize(invalid).teams, []);
const greedyTrap = fixture(ids, [entry('a-greedy', ['a', 'b', 'c']), entry('b-first', ['a', 'd', 'e']), entry('c-second', ['b', 'f', 'g'])],
  { progress: { a: build(4, 6, true), b: build(4, 6, true), c: build(4, 6, true) } });
assert.deepEqual(teamIds(optimize(greedyTrap)), ['b-first', 'c-second'], 'greedy top team must not block a larger complete set');
assert.deepEqual(teamIds(optimize({ ...greedyTrap, maxTeams: 1 })), ['a-greedy']);
assert.deepEqual(teamIds(optimize({ ...greedyTrap, maxTeams: 0 })), []);
assert.deepEqual(teamIds(optimize({ ...greedyTrap, maxTeams: '1' })), [], 'invalid cap fails closed');
assert.deepEqual(teamIds(optimize({ ...greedyTrap, maxTeams: -1 })), []);
assert.deepEqual(teamIds(optimize({ ...greedyTrap, maxTeams: Infinity })), []);
const excludedResult = optimize({ ...greedyTrap, excludedIds: ['a', 'a', 'unknown', '__proto__'] });
assert.deepEqual(excludedResult.excludedIds, ['a']);
assert.deepEqual(excludedResult.remainingIds, ['c', 'd', 'e', 'h', 'i']);
assert.deepEqual(teamIds(excludedResult), ['c-second']);
assert.equal(excludedResult.ownedCount, 9);
assert.equal(excludedResult.availableCount, 8);

// Every priority is tested against a deliberately larger lower-priority value.
const choice = fixture(ids, [entry('alpha', ['a', 'b', 'c']), entry('beta', ['a', 'd', 'e'])], { maxTeams: 1 });
assert.deepEqual(teamIds(optimize(choice)), ['alpha'], 'canonical tie');
assert.deepEqual(teamIds(optimize({ ...choice, progress: { b: build(1), d: build(0, 6, true), e: build(0, 6, true) } })), ['alpha']);
assert.deepEqual(teamIds(optimize({ ...choice, progress: { b: build(0, 1), d: build(0, 0, true), e: build(0, 0, true) } })), ['alpha']);
assert.deepEqual(teamIds(optimize({ ...choice, progress: { d: build(0, 0, true) } })), ['beta']);
const nullResult = optimize({ ...choice, progress: { a: build(0, 0, false), b: build(), c: build(0, 0, true) } });
assert.deepEqual(nullResult.inputSummary, { sequenceKnown: 2, sequenceUnknown: 1, signatureKnown: 2, signatureUnknown: 1 });
assert.equal(nullResult.objective.sequence, 0);
assert.equal(nullResult.objective.signature, 1);
const malformedProgress = optimize({ ...choice, progress: { a: { level90: 1, skills: 'true', echo: true, weapon: false,
  sequence: '6', signatureWeapon: 'true' }, b: build(0, 9, 2), c: Object.create({ level90: true, sequence: 6, signatureWeapon: true }) } });
assert.equal(malformedProgress.objective.readiness, 1);
assert.equal(malformedProgress.objective.sequence, 0);
assert.equal(malformedProgress.objective.signature, 0);
assert.equal(malformedProgress.inputSummary.sequenceUnknown, 3);

const malformed = fixture([...ids, 'rover'], [
  entry('good', ['a', 'b', 'c']), entry('duplicate', ['d', 'e', 'f']), entry('duplicate', ['g', 'h', 'i']),
  entry('unknown', ['a', 'b', 'missing']), entry('same-member', ['a', 'a', 'b']), entry('short', ['a', 'b']),
  entry('long', ['a', 'b', 'c', 'd']), entry('bad<id', ['d', 'e', 'f']), entry('rover-empty', ['rover', 'e', 'f']),
  entry('rover-generic', ['rover', 'e', 'f'], { condition: '조건 확인' }),
  entry('rover-good', ['rover', 'e', 'f'], { condition: '방랑자: 회절 속성' }), null, [], {},
]);
const malformedResult = optimize(malformed);
assert.deepEqual(teamIds(malformedResult), ['good', 'rover-good']);
assert.equal(malformedResult.eligibleCount, 2);
assert(malformedResult.invalidIds.includes('duplicate'));
const duplicateCharacters = optimize({ ...choice, characters: [...choice.characters, { id: 'a', name: 'duplicate' }] });
assert.equal(duplicateCharacters.eligibleCount, 0);
const inheritedOwnership = Object.create({ a: true }); inheritedOwnership.b = true; inheritedOwnership.c = true;
assert.equal(optimize({ ...choice, owned: inheritedOwnership }).eligibleCount, 0);
assert.equal(optimize({ ...choice, owned: { a: 1, b: true, c: true } }).eligibleCount, 0);

const required = fixture(['rover', 'a', 'b', 'c', 'd'], [entry('required', ['rover', 'a', 'b'], {
  condition: '방랑자: 회절 속성', requirements: [{ characterId: 'rover', minSequence: 4 }, { characterId: 'a', signatureWeapon: true }],
})]);
let result = optimize(required);
assert.equal(result.eligibleCount, 0);
assert.equal(result.blockedTeams.length, 1);
assert.equal(result.blockedTeams[0].reasons.length, 2);
assert.match(result.blockedTeams[0].reasons[0], /미입력/);
result = optimize({ ...required, progress: { rover: build(4, 3, false), a: build(4, 0, false) } });
assert.equal(result.eligibleCount, 0);
assert.match(result.blockedTeams[0].reasons[0], /3돌/);
assert.match(result.blockedTeams[0].reasons[1], /미보유/);
result = optimize({ ...required, progress: { rover: build(4, 4, false), a: build(4, 0, true) } });
assert.equal(result.eligibleCount, 1);
assert.equal(result.blockedTeams.length, 0);
const invalidRequirements = [null, {}, 'bad', [null], [{}], [{ characterId: 'rover' }],
  [{ characterId: 'missing', minSequence: 4 }], [{ characterId: 'rover', minSequence: '4' }],
  [{ characterId: 'rover', minSequence: 7 }], [{ characterId: 'rover', minSequence: -1 }],
  [{ characterId: 'rover', minSequence: 1.5 }], [{ characterId: 'rover', signatureWeapon: 'true' }],
  [{ characterId: 'rover', signatureWeapon: false }],
  [{ characterId: 'rover', minSequence: 4, typo: true }],
  [{ characterId: 'rover', minSequence: 4 }, { characterId: 'rover', signatureWeapon: true }]];
for (const requirements of invalidRequirements) {
  assert.equal(optimize({ ...required, recommendations: [{ ...required.recommendations[0], requirements }] }).eligibleCount, 0);
}

function deepFreeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}
const frozen = deepFreeze(structuredClone(greedyTrap));
const frozenSnapshot = JSON.stringify(frozen);
const frozenResult = optimize(frozen);
assert.equal(JSON.stringify(frozen), frozenSnapshot);
frozenResult.teams[0].members[0] = 'changed';
assert.equal(JSON.stringify(frozen), frozenSnapshot, 'returned membership must not alias input arrays');

function canonicalObjective(teams, progress) {
  const members = teams.flatMap(team => team.members);
  return [teams.length,
    members.reduce((sum, id) => sum + ['level90', 'skills', 'echo', 'weapon'].filter(key => progress[id]?.[key] === true).length, 0),
    members.reduce((sum, id) => sum + (progress[id]?.sequence ?? 0), 0),
    members.filter(id => progress[id]?.signatureWeapon === true).length,
    teams.map(team => team.id).sort().join('|')];
}
function better(left, right) {
  for (let index = 0; index < 4; index++) if (left[index] !== right[index]) return left[index] > right[index];
  return left[4] < right[4];
}
function bruteForce(input) {
  let best = [], score = canonicalObjective([], input.progress);
  const cap = input.maxTeams ?? Math.floor(input.characters.length / 3);
  for (let mask = 0; mask < 2 ** input.recommendations.length; mask++) {
    const selected = input.recommendations.filter((_, index) => mask & (1 << index));
    const members = selected.flatMap(team => team.members);
    if (selected.length > cap || new Set(members).size !== members.length ||
      members.some(id => !input.owned[id] || input.excludedIds?.includes(id))) continue;
    const candidateScore = canonicalObjective(selected, input.progress);
    if (better(candidateScore, score)) { best = selected; score = candidateScore; }
  }
  return best.map(team => team.id).sort();
}
let seed = 20261030;
const random = max => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % max; };
for (let round = 0; round < 160; round++) {
  const pool = Array.from({ length: 6 + random(7) }, (_, index) => `c${index}`);
  const teams = Array.from({ length: 5 + random(9) }, (_, index) => {
    const members = new Set(); while (members.size < 3) members.add(pool[random(pool.length)]);
    return entry(`t${String(index).padStart(2, '0')}`, [...members]);
  });
  const generated = fixture(pool, teams, {
    progress: Object.fromEntries(pool.map(id => [id, build(random(5), random(3) ? random(7) : null, random(3) ? !!random(2) : null)])),
    excludedIds: random(3) ? [] : [pool[random(pool.length)]], maxTeams: random(3) ? null : 1 + random(3),
  });
  for (const id of pool) if (!random(6)) generated.owned[id] = false;
  const expected = bruteForce(generated);
  assert.deepEqual(teamIds(optimize(generated)), expected, `exhaustive oracle round ${round}`);
  assert.deepEqual(teamIds(optimize({ ...generated, characters: [...generated.characters].reverse(),
    recommendations: [...teams].reverse() })), expected, `input-order invariance round ${round}`);
}

vm.runInContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), context, { filename: 'data.js' });
vm.runInContext(fs.readFileSync(path.join(root, 'js/teams.js'), 'utf8'), context, { filename: 'teams.js' });
const actual = vm.runInContext('({ characters: CHARACTERS, recommendations: PARTY_RECOMMENDATIONS })', context);
const production = { ...actual, owned: Object.fromEntries(actual.characters.map(character => [character.id, true])),
  progress: Object.fromEntries(actual.characters.map(character => [character.id, build(4, 6, true)])) };
let start = performance.now();
const actualResult = optimize(production);
const actualDuration = performance.now() - start;
assert(actualResult.teams.length > 1);
assert.equal(new Set(actualResult.usedIds).size, actualResult.usedIds.length);
assert.equal(actualResult.usedIds.length, actualResult.teams.length * 3);
assert.equal(actualResult.invalidIds.length, 0, 'production candidates must all be valid');
assert(actualDuration < 2500, `production optimizer exceeded 2.5 seconds: ${actualDuration.toFixed(1)} ms`);

// A structured 150-candidate / 57-character stress case approximates competing
// DPS/support pairs; it is not a universal bound for this NP-hard problem.
const stressIds = Array.from({ length: 57 }, (_, index) => `s${index}`);
const stressTeams = Array.from({ length: 150 }, (_, index) => entry(`stress-${String(index).padStart(3, '0')}`,
  [`s${index % 25}`, `s${25 + Math.floor(index / 5) % 25}`, `s${50 + index % 7}`]));
start = performance.now();
const stressResult = optimize(fixture(stressIds, stressTeams, { progress: Object.fromEntries(stressIds.map(id => [id, build(4, 6, true)])) }));
const stressDuration = performance.now() - start;
assert.equal(stressResult.teams.length, 7, 'seven exclusive support slots bound this stress case');
assert(stressDuration < 2500, `150-candidate optimizer exceeded 2.5 seconds: ${stressDuration.toFixed(1)} ms`);
assert.equal(stressResult.search.exact, true);
console.log(`자동 편성 검사 통과: 전수 비교 160회, 입력·조건·우선순위·중복·보존·결정성 / 실자료 ${actual.recommendations.length}개 ${actualDuration.toFixed(1)}ms, 150개 ${stressDuration.toFixed(1)}ms`);
