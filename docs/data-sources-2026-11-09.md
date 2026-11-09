# 2026-11-09 공식 자료 확인 기록

기준 시간대는 Asia/Seoul입니다. 3.7 현재 모집을 재확인하고 3.8 공식 예고와 릴리의 공개 프로필을 확인했습니다. 기존 역사 데이터 전체를 다시 검증한 기록은 아닙니다. 콘텐츠 버프·등장 몹의 비공식 교차 확인 기록은 별도 문서로 구분합니다.

## 현재 모집과 업데이트 예정

[공식 한국어 게임 공지 JSON](https://aki-gm-resources-back.aki-game.net/gamenotice/G153/10cd7254d57e58ae560b15d51e34b4c8/ko.json)의 `recommend/50588`, `50589`, `50590` 및 `50594`~`50596`을 재확인했습니다. 3.7 후반 쇄명·루실라·린네, 4성 루미·단근·치샤의 한국 시간 일정은 10월 22일 11:00~11월 11일 12:59로 유지됩니다. 전무와 4성 무기 구성도 기존 기록과 같습니다. 현재 진행 중인 버전은 3.7입니다.

동일 JSON의 `game/50622`는 3.8 「아득한 꿈속, 잔잔히 스러진 백합」 점검을 11월 12일 04:00~11:00(UTC+8)로 예고합니다. 한국 시간으로는 05:00~12:00 예정입니다. 사전 다운로드는 11월 10일 11:00 한국 시간 예정입니다. 점검은 연장될 수 있으므로 예정 종료 12:00을 실제 모집 시작 시각으로 확정하지 않습니다. [공식 영문 점검 안내](https://wutheringwaves.kurogames.com/en/main/news/detail/5705)와도 대조했습니다.

조회 JSON의 SHA-256은 `C891CC960995ABCC0313C70779321C69E1B2603CA67D49B2697C9F2506CC9315`입니다. 공지 표시용 `startTimeMs`·`endTimeMs`를 모집 일정으로 사용하지 않습니다.

## 3.8 공식 예고

[공식 3.8 프리뷰](https://wutheringwaves.kurogames.com/en/main/news/detail/5689)의 [모집 안내 원본 이미지](https://hw-media-cdn-mingchao.kurogame.com/object/1793721600000/bf9na5fajbnk2iwz6x-1793782906845.jpg)를 확대하여 확인했습니다. 전반은 릴리·시그리카·구원, 후반은 양양 · 현령·수수·히유키입니다. 전반 전무는 Lullaby·Solsworn Ciphers·Emerald Sentence, 후반은 Azure Oath·Firstlight's Herald·Frostburn으로 각 캐릭터를 대조했습니다.

3.8은 11월 12일 업데이트 예정이며, 전반은 업데이트 이후 시작하는 예고로 표시합니다. 프리뷰에는 전반 종료일, 후반 시작일·종료일, 각 모집의 4성 목록이 없습니다. 따라서 해당 값은 비우고 `announced: true`로 유지합니다. 날짜를 임의 계산하여 진행 중 모집으로 전환하지 않습니다.

프리뷰 하단에는 선택형 공명자·무기 모집 Starpath Reverbs II / Tideforge Reverbs II도 예고되어 있습니다. 목표 5성을 선택하고 변경할 수 있다는 규칙은 확인했지만, 상세 일정·천장·캐릭터 이름 목록을 확정하는 개별 안내는 이번에 확보하지 못했습니다. 따라서 해당 모집의 구체적 데이터는 추가하지 않았습니다.

원본 이미지 SHA-256은 `BB08E23D8908BDD5E8D45322AF31C56F0BC4F91E92B1A17A7D95C8ADEF77B090`입니다. 자료 작성자와 통합 담당자가 각각 전반/후반 확대 이미지를 확인했습니다.

## 릴리 공개 데이터

한국어 게임 공지 `game/50622`에서 5성 릴리, 회절·권총, 전무 「럴러바이」를 확인했습니다. [공식 릴리 프로필](https://wutheringwaves.kurogames.com/en/main/news/detail/5725)의 [소재·역할 표](https://hw-media-cdn-mingchao.kurogame.com/object/1793980800000/iexkaqp5y27ff2v3g1-1794017212963.jpg)를 직접 확인했습니다.

| 구분 | 확인된 공식 영문 데이터 | 저장소 반영 |
|---|---|---|
| 역할 | Support and Healer | 힐러/서포터 |
| 단조 계열 | Incomplete Combustor | 기존 `combustor` 계열 |
| 일반 드랍 | Exoswarm Core | 기존 `exoswarm` 계열 |
| 주간 소재 | Gold in Memory | 기존 기억 속 금빛 항목 |
| 특산물 | Reverie Lily | 공식 한국어 명칭 미확인으로 영문 유지 |
| 필드 보스 소재 | Suncoveter's Reach | 기존 태양을 노리는 손끝 항목 |

기존 한국어 소재명은 저장소의 대응 항목을 재사용하며, 이번 영문 가이드를 통해 릴리와 해당 소재의 연관성을 확인했습니다. 표에는 총 수량이 없으므로 기존 공통 육성 수량 모델을 유지하며 릴리의 전체 수량을 새로 공식 검증했다고 주장하지 않습니다. 소재 이미지 SHA-256은 `E6D40A1A48A24C8CA0832D49E1D7C7721A38D4D9E77E9CD281A531586E77D1A6`입니다.

프로필은 [공식 사이트 role-small 자산](https://wutheringwaves.kurogames.com/static4.0/assets/lily-485d0de8.webp)을 사용합니다. 11월 9일에는 미출시 캐릭터이므로 `announced: true`, `releaseDate: '2026-11-12'`는 출시 예정 날짜를 나타냅니다. 출시 여부와 상세 추천 파티를 추정하여 확정하지 않습니다.

## 확인 범위의 제한

- [기존 3.7 공식 이벤트 노트](https://aki-gm-resources-back.aki-game.net/notice/image/FPYtMsiebdOVEMDU.jpg)는 탑 11/9~12/7, 해역 10/26~11/23, 종말 매트릭스 10/7~11/12의 날짜를 제공합니다. 버프·몹의 근거는 아닙니다.
- 게임 공지 `game/50522`는 제2주기 3.5~3.8과 버전별 단계 갱신을 설명하지만, 현재 3단계의 종료가 11월 12일 05:00이라는 직접 문장은 확인되지 않았습니다. 점검 시작과 연결한 해석을 공식 확정 시각으로 쓰지 않습니다.
- 3.8 출시 후 세부 일정, 한국어 신규 특산물명, 실제 플레이 기반 추천 파티는 추가 검증 대상입니다.

공식 사이트 본문이 이미지로 제공되어 사이트의 공개 문서 JSON과 연결된 원본 이미지를 함께 확인했습니다. 공개 JSON은 [프리뷰 5689](https://hw-media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/en/article/5689.json), [릴리 프로필 5725](https://hw-media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/en/article/5725.json)입니다. 출처 유형은 모두 공식이며, 미확인 항목을 비공식 자료로 보충한 것처럼 표시하지 않습니다.
