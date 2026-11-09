# 현재 콘텐츠 갱신 근거

확인일: 2026-11-09, 표시 시간대: Asia/Seoul. 공식 일정과 비공식 전투 정보를 분리합니다. 이전 조사 기록은 [2026-10-23 기록](content-sources-2026-10-23.md)에 보존합니다.

## 일정과 자료 등급

[KURO 3.7 한국어 이벤트 노트](https://aki-gm-resources-back.aki-game.net/notice/image/FPYtMsiebdOVEMDU.jpg)의 하단 일정 이미지를 직접 읽었습니다.

| 콘텐츠 | 이번 표시 기간 | 판정 |
|---|---|---|
| 역경의 탑 42시즌 | 2026-11-09~2026-12-07 | 공식 날짜 |
| 해역 23시즌 | 2026-10-26~2026-11-23 | 공식 날짜 |
| 종말 매트릭스 제2주기 3단계 | 2026-10-07~2026-11-12 | 공식 날짜, 진행 중인 단계 유지 |

공식 노트는 버프·몹의 근거가 아닙니다. 전투 정보는 Encore 한국어 데이터와 별도 플레이 기록의 실제 게임 화면을 대조한 **비공식 교차 확인 자료**입니다. Encore의 다른 언어·API 주소는 독립 출처로 세지 않았습니다. 공개 플레이 화면을 확인했으며 직접 게임에 접속하여 수집한 자료는 아닙니다.

정확한 리셋 시각은 이번 공식 일정 이미지에 없습니다. 3.8 점검 시작은 [공식 게임 공지](https://aki-gm-resources-back.aki-game.net/gamenotice/G153/10cd7254d57e58ae560b15d51e34b4c8/ko.json) `game/50622`의 11/12 04:00(UTC+8), 즉 **05:00 KST**지만 이를 매트릭스 종료 시각으로 직접 명시한 문장은 확인하지 못했습니다. 날짜와 점검 시각을 조합한 추론을 확정 종료 시각으로 넣지 않습니다. 기존 종료일 경계와 만료 자료 보호를 유지해야 합니다.

## 역경의 탑 42시즌

| 출처 | 대조 범위 |
|---|---|
| [Encore 한국어 42시즌](https://api.encore.moe/ko/toa/42) | 버프 원문, 층별 몹 |
| [아라오지 11/9 플레이 기록](https://www.araoji-game.com/entry/wuthering-waves191) | 아래 실제 게임 화면의 버프·몹 |

실제 게임 화면:

- [잔향 4층 버프·몹](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20261109/20261109170002.webp)
- [울림 4층 버프·몹](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20261109/20261109170812.webp)
- [심연 1층 버프·몹](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20261109/20261109172451.webp), [심연 2층 몹](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20261109/20261109173626.webp)
- [심연 3~4층 버프](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20261109/20261109174438.webp), [심연 3층 몹](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20261109/20261109180151.webp), [심연 4층 몹](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20261109/20261109180252.webp)

위 7장을 읽어 수치·지속시간·효과 조건·몬스터 아이콘과 배열을 대조했습니다. 잔향의 변주 효과는 **18초**, 심연 3~4층 저항 증가의 예외는 이번 주기에 **전도·에코 어빌리티 피해**입니다. 지난 시즌의 전도·회절 예외를 재사용하지 않습니다. 같은 구역의 에코 어빌리티 최종 피해 **50%**는 다른 변주·전자·합일 조건과 별도의 효과이며, 원문에 별도 지속시간이 없습니다.

몹은 **잔향 4층·울림 4층·심연 1~4층, 총 6개 층**만 표시합니다. 좌우 1~3층은 Encore에 데이터가 있으나 독립 자료로 교차 확인하지 못해 이번 표시 목록에서 제외했습니다. 한국어 명칭은 Encore를 기준으로 했고, `잔성 · 밀리너` 및 `갈기늑대 · 눈꽃`처럼 가운데점이 이름 일부인 경우 구분자를 달리하여 몹 수를 오인하지 않게 했습니다.

**제외 자료:** [Gagether 탑 페이지](https://gagether.wiki/ja/games/wuwa/combat/tower-of-adversity)의 검색 요약은 42시즌을 표시했지만 실제 읽은 본문은 41시즌 효과·몹이어서 근거로 사용하지 않았습니다. 10/20 TOPUPLive 공략 역시 이전 주기이므로 새 시즌의 증거로 재사용하지 않았습니다.

## 해역 23시즌

| 출처 | 대조 범위 |
|---|---|
| [Encore 시즌 23](https://api-v2.encore.moe/api/ko/whiwa/23) | 공통 효과, 단계 진입 효과·저항·몹 |
| [등불 71500107](https://api-v2.encore.moe/api/ko/item/71500107), [정교한 기술 71500108](https://api-v2.encore.moe/api/ko/item/71500108), [저울 71500109](https://api-v2.encore.moe/api/ko/item/71500109) | 이번 주기 금색 증표 한국어 원문 |
| [아라오지 10/26 플레이 기록](https://www.araoji-game.com/entry/wuthering-waves186) | 금색 증표 화면, 단계별 저항 속성, 끝 없는 심연 몹 |
| [일본 커뮤니티 위키](https://wikiwiki.jp/w-w/%E6%AD%BB%E3%81%AE%E6%AD%8C%E3%81%8C%E7%BA%8F%E3%81%86%E6%B5%B7%E3%81%AE%E5%BB%83%E5%A2%9F) | 10/26~11/23 주기 표시, 공통 효과·추가 저항·12단계 효과·몹·증표 제한 |

[금색 증표 3종 게임 화면](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20261026/20261026102020.webp)과 [12단계 전후반 몹 화면](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20261026/20261026112253.webp)을 직접 읽었습니다. 이전 「껍데기만 남은 이상」을 현재 「영감이 샘솟은 정교한 기술」로 교체합니다. 전자 효과 부여 시 자신 최종 피해 **65%·20초**, 합일 대응 시 자신 전도 최종 피해 **60%·20초**이며 기본 사용 제한은 2회입니다. 다른 금색 증표도 이번 주기의 아이템 ID로 연결합니다.

공통 조수 **30초**, 명중한 적의 받는 최종 피해 **60%·5초**, 12단계 추가 **30%**와 증표 무제한은 현재 주기 위키와 Encore가 일치합니다. 9~11단계의 추가 저항은 각각 **용융·응결·인멸 20%**입니다. 위키의 간략 표 번호가 8/9/10으로 어긋난 부분은 채택하지 않고, 실제 플레이 글의 9/10/11 구분 및 Encore 각 단계의 `stages[].buffs`를 사용했습니다.

몹 목록은 독립 자료로 확인한 **12단계 전반·후반**입니다. 7~11단계 전체 몹과 보라색 증표는 이번 요약에 넣지 않습니다. 시즌 목록의 시간대 없는 날짜보다 공식 노트의 날짜를 우선합니다.

## 종말 매트릭스 제2주기 3단계

[Encore ID 8](https://api-v2.encore.moe/api/ko/dpmatrix/8)을 다시 요청해 `SeasonId: 2`, `Name: S2 단계3`, `EndVersion: 3.8`을 확인했습니다. 회로 4종, 보스 순서·저항, 린네 추가 피로도 항목은 기존 표시 내용과 같습니다.

[아라오지 10/13 기록](https://www.araoji-game.com/entry/wuthering-waves184)의 [회로 4종 화면](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20261013/20261013183542.webp)을 다시 읽었습니다. 실드 효과 **11%·최대 5스택·2초**, 합일 대응 **55%·30초**가 일치합니다. 본문에서 보스 4종의 속성 저항과 린네 2회 출전을 재확인했고, [SAYO 플레이 메모](https://sayo-nyaa.tistory.com/2403)에서 보스와 미믹의 진행 순서를 다시 확인했습니다. 따라서 전투 내용은 유지하고 확인일만 11/9로 갱신합니다. 미래 단계의 버프를 현재 정보에 넣지 않습니다.

## 재현용 해시와 반영 범위

2026-11-09 HTTP 원문 응답의 SHA-256입니다. 기존 매트릭스 저장본과 전체 응답 해시는 다르지만 이번 사이트에 표시하는 회로·보스·저항·추가 출전 항목을 개별 대조했습니다. 전체 응답이 동일하다고 주장하지 않습니다.

| 자료 | SHA-256 |
|---|---|
| Encore 탑 42 | `522b5aa3261638937cf64ef1d35b0148f8d4b2d21fc59432476e7ad843030f99` |
| Encore 해역 23 | `97b077436111c92faeecd3b30f2c72f9b7655b6e4b54df5fb0c2e67807e532b2` |
| Encore 매트릭스 8 | `57d2021de652d8ffccc44d2a60926f41846ca4ce4bd174a04bcf170c262574ec` |

이 조사 산출물은 `content-update.json`의 `contentDefaults` 배열입니다. 구현 반영 시 `corroborated`의 **비공식** 표기와 출처별 확인 범위를 유지해야 합니다. 사용자 편집 자료를 공식·교차 확인 기본값으로 재인증하지 않으며, 기존 보유·육성·파티 기록을 보존해야 합니다.
