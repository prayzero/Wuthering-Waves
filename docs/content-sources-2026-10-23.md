# 현재 콘텐츠 버프·등장 몹 교차 확인 기록

확인일: 2026-10-23, 표시 시간대: Asia/Seoul. 이 기록은 앞선 [공식 자료 점검](data-sources-2026-10-23.md)에서 비워 둔 버프·몹을 보충합니다. 공식 일정과 비공식 전투 정보를 별도로 표시합니다.

## 자료 구분

- **공식**: [KURO 3.7 한국어 이벤트 노트](https://aki-gm-resources-back.aki-game.net/notice/image/FPYtMsiebdOVEMDU.jpg)의 날짜입니다. 탑 10/12~11/9, 해역 9/28~10/26, 매트릭스 10/7~11/12입니다. 이 이미지는 버프·몹의 근거가 아닙니다.
- **비공식 교차 확인**: Encore 한국어 데이터와 별도 플레이 기록의 게임 화면·커뮤니티 자료가 일치한 항목입니다. Encore의 다른 언어·API 주소는 같은 출처로 계산합니다. 커뮤니티 문서의 모든 편집자가 독립적으로 조사했는지까지 증명한 것은 아닙니다.
- 한국어 명칭은 Encore 원문을 사용하고, 다른 언어의 자료는 효과·수치·아이콘·배치 순서를 대조했습니다. 게임 화면을 직접 플레이해 수집한 것은 아니며, 공개된 플레이 기록의 화면을 확인했습니다.
- 정확한 서버 리셋 시각은 공식 확인하지 못했습니다. 사이트 종료일은 한국 날짜의 일자 단위 표시 경계이며, 이후 기존 자료를 이전 주기로 접어 표시합니다.

## 역경의 탑 41시즌

| 출처 | 확인 범위 |
|---|---|
| [Encore 한국어 41시즌](https://api.encore.moe/ko/toa/41) | 버프 원문, 12개 층의 몹 |
| [아라오지 10/12 플레이 기록](https://www.araoji-game.com/entry/wuthering-waves183) | 현재 시즌, 버프 수치와 주요 보스 |
| [TOPUPLive 10/20 공략](https://www.topuplive.com/news/wuthering-waves-3-7-tower-of-adversity-guide.html) | 버프 수치, 12개 층의 몹 대조 |
| [인벤 스누피냥 41시즌](https://m.inven.co.kr/board/party/6196/3178?vtype=mobile) | 국내 플레이 기록의 주요 보스 |

잔향·심연 1~2층·심연 3~4층·울림의 버프와 총 12개 층 몹을 반영했습니다. 심연 3~4층의 저항 예외는 **전도·회절**, 전자 효과 부여 후 자신의 최종 피해 증가는 **55%, 20초**입니다. 보스의 한국어 이름과 각 층 배치는 한국어 DB를 기준으로 다른 자료와 맞췄습니다.

TOPUPLive의 일반 모드 설명 중 좌우 탑이 영구 고정이라는 표현은 채택하지 않았습니다. 인벤 글의 편성 설명은 좌우 표기가 혼재하여 팀 추천의 근거로 쓰지 않았습니다.

## 해역 22시즌

| 출처 | 확인 범위 |
|---|---|
| [Encore 시즌22](https://api-v2.encore.moe/api/ko/whiwa/22) | 현재 시즌 효과, 단계별 몹·진입 효과 |
| [허상을 비추는 등불](https://api-v2.encore.moe/api/ko/item/71500103), [껍데기만 남은 이상](https://api-v2.encore.moe/api/ko/item/71500104), [영혼의 무게를 가늠하는 저울](https://api-v2.encore.moe/api/ko/item/71500105) | 금색 증표 3종의 한국어 수치·조건 |
| [아라오지 9/28 플레이 기록](https://www.araoji-game.com/entry/wuthering-waves179) | 증표 3종, 9~11단계 저항 속성·진입 에너지, 12단계 전후반 몹 |
| [일본 커뮤니티 위키](https://wikiwiki.jp/w-w/%E6%AD%BB%E3%81%AE%E6%AD%8C%E3%81%8C%E7%BA%8F%E3%81%86%E6%B5%B7%E3%81%AE%E5%BB%83%E5%A2%9F) | 공통 효과, 끝 없는 심연 추가 피해·증표 무제한, 9~11단계 추가 저항 수치 |

실제 화면의 [금색 증표](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20260928/20260928134023.webp)와 [12단계 전후반](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20260928/20260928141953.webp)을 읽어 수치·지속시간·중첩·사용 횟수와 몹 4종씩을 확인했습니다. 껍데기만 남은 이상의 변주 효과는 **전도 최종 피해 30%, 15초**입니다.

공통 타오르는 조수 **30초**, 명중한 적의 받는 최종 피해 **60%, 5초**, 끝 없는 심연의 받는 최종 피해 **30%**와 증표 무제한은 현재 주기(9/28~10/26)를 표시하는 위키와 Encore가 일치합니다. 위키의 표시된 최종 수정일은 10/15입니다.

9~11단계의 추가 저항은 **9단계 용융 / 10단계 응결 / 11단계 인멸, 각각 20%**입니다. 위키의 간략 표는 단계 번호가 8/9/10으로 어긋나므로, 번호·속성 매핑은 [9단계 화면](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20260928/20260928140443.webp), [10단계 화면](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20260928/20260928140904.webp), [11단계 화면](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20260928/20260928141335.webp)과 Encore를 대조했습니다. 20%는 위키의 별도 9~11단계 본문과 Encore에서 확인했습니다.

**제한**: 몹 목록은 독립 자료로 확인한 **12단계 끝 없는 심연 전후반**을 제공합니다. 7~11단계 전체 몹과 보라색 증표 수치는 단일 DB 근거만 확보되어 교차 확인 목록에 넣지 않았습니다. Encore 시즌 목록의 9/27 시작 날짜에는 시간대가 없어 일정 근거로 쓰지 않았습니다.

## 종말 매트릭스 제2주기 3단계

| 출처 | 확인 범위 |
|---|---|
| [Encore ID 8](https://api-v2.encore.moe/api/ko/dpmatrix/8) | 회로 4종, 보스 순서, 린네 출전 횟수 |
| [아라오지 10/13 플레이 기록](https://www.araoji-game.com/entry/wuthering-waves184) | 회로 화면의 수치·지속시간, 보스, 린네 2회 출전 |
| [SAYO 3.7 플레이 메모](https://sayo-nyaa.tistory.com/2403) | 특이점 보스 4종과 미믹의 순서 |

[회로 4종 게임 화면](https://cdn-ak.f.st-hatena.com/images/fotolife/A/Arche-Lightning/20261013/20261013183542.webp)을 직접 읽어 Encore와 대조했습니다. 특히 실드 효과는 **11%씩 최대 5스택·2초**, 합일 대응은 **최종 피해 55%·30초**입니다. 보스는 지옥불 기사 → 봉정계유 → 크라운리스 → 하늘의 기관 인형·겁살이며, 특이점에서는 이 순서를 반복한 뒤 매트릭스 미믹으로 진행합니다.

안정 최대 3파티, 특이점 파티 수 제한 없음, 피로도·장비 제한 등 일반 규칙은 [공식 게임 공지](https://aki-gm-resources-back.aki-game.net/gamenotice/G153/10cd7254d57e58ae560b15d51e34b4c8/ko.json)의 `game/50522`가 근거입니다. 각 공명자의 개별 강화 수치 전체는 이번 요약에 포함하지 않습니다.

**불일치 제외**: [TOPUPLive 매트릭스 공략](https://www.topuplive.com/news/wuwa-3-7-endstate-matrix-guide.html)의 실드 25%·합일 대응 15초는 게임 화면과 다릅니다. [WuWaMatrix](https://wuwamatrix.com/)의 수치는 일부 일치하지만 원출처 독립성을 확인하지 못했고, 종료일 카운트다운도 공식 11/12와 달라 일정 근거로 쓰지 않았습니다.

## 기록·표시 보호

사이트는 `corroborated`를 **교차 확인 자료 · 비공식**으로 표시하며 출처별 종류·확인 범위·확인일을 보여 줍니다. 공식 일정 링크가 있다는 이유로 버프·몹을 공식 자료로 인증하지 않습니다. 본문·기간·출처를 편집하거나 임의 인증 표시가 있는 백업을 가져오면 사용자 자료로 구분합니다. v6의 미수정 기본값만 v7로 갱신하며 사용자 수정 내용과 기존 보유·파티·뽑기 기록은 보존합니다.

원문 응답의 SHA-256(2026-10-23 저장본):

| 자료 | SHA-256 |
|---|---|
| Encore 탑41 | `8BEA1131FFFF1D08038AC7E2016053D3508E77A8BBB7DDC66D8C197CBADA9263` |
| Encore 해역22 | `3CE728A85E5981C3910838AEA0732B6FC043810C95D4F3A0C1795316C902CB5E` |
| Encore 매트릭스8 | `51B33FAC2E3245A263756D95EBE5BDE725DF49B7EEE373669A0E76CFDCF14143` |
