# 2026-10-23 데이터 확인 기록

기준 시간대는 Asia/Seoul입니다. 기존 역사 데이터 전체를 재검증한 기록이 아니라, 이번에 갱신한 3.7 공명자·배너·콘텐츠 자료의 근거입니다.

## 공식 한국어 공지

- [3.7 업데이트 안내](https://wutheringwaves.kurogames.com/kr/main/news/detail/5572)
- [공식 한국어 게임 공지 JSON](https://aki-gm-resources-back.aki-game.net/gamenotice/G153/10cd7254d57e58ae560b15d51e34b4c8/ko.json)
- 조회 당시 JSON SHA-256: `EB08D8FC2C8BF171CF7B1BDAADB1D793819CF27E89AC9F044279D063CC7BC1B7`

`game/50612`에서 5성 여우의 별자리(전도·증폭기), 5성 쇄명(전도·직검), 전무 옥궐에 피는 꽃·적막한 어둠을 확인했습니다. 여우의 별자리는 공식 메인 딜러이며 쇄명은 공식 가이드의 Unison Support와 피해 부스트 설명에 따라 플래너에서 서브딜러/서포터로 분류합니다.

`recommend/50588`, `50589`, `50590`에서 쇄명·루실라·린네의 3.7 후반 픽업과 4성 루미·단근·치샤를 확인했습니다. 기간은 원문 한국 시간 2026-10-22 11:00~2026-11-11 12:59입니다. 코드의 종료 초·밀리초는 마지막 공개된 분을 포함하기 위한 표현입니다. `50594`~`50596`에서 전무 3종과 4성 무기 행진의 서곡·역설의 격류·전우의 의리를 확인했습니다.

## 공식 이벤트 노트

[3.7 한국어 이벤트 노트 원본](https://aki-gm-resources-back.aki-game.net/notice/image/FPYtMsiebdOVEMDU.jpg)은 위 JSON `activity/50611`에 실린 이미지입니다. 직접 시각 확인했습니다.

- 전반 9/30~10/22: 여우의 별자리, 치사, 유노. 후반 10/22~11/11: 쇄명, 루실라, 린네.
- 탑 10/12~11/9, 다음 11/9~12/7.
- 해역 9/28~10/26, 다음 10/26~11/23.
- 종말 매트릭스·위험한 경지의 강습 10/7~11/12.

이 이미지는 콘텐츠의 날짜만 명시하며 리셋 시각·버프·몹은 명시하지 않습니다. 날짜를 표시 경계로 삼는 UI 계산은 한국 날짜의 일자 단위 예상치입니다. 실제 종료 시각을 보장하지 않습니다. 최초 공식 자료 점검에서는 버프·몹을 비워 두었으며, 이후 [비공식 자료 교차 확인 기록](content-sources-2026-10-23.md)의 범위만 보충했습니다. 매트릭스 다음 단계의 날짜를 공식 확정값으로 간주하지 않습니다.

매트릭스 일반 규칙은 JSON `game/50522`에서 확인했습니다. 제2주기 3.5~3.8, 안정 프로토콜 최대 3파티, 특이점 확장 파티 수 제한 없음, 출전당 피로도 1, 서로 다른 공명자 간 동일 무기·에코 동시 사용 불가입니다.

[전반 복각 상세 공지](https://wutheringwaves.kurogames.com/en/main/news/detail/5546)는 치사·유노의 종료 시각과 4성 복링·도기·유호를 명시하지만 여우의 별자리 신규 배너는 포함하지 않습니다. 따라서 통합 전반 항목에는 여우의 세부 종료 시각과 공통 4성을 임의로 확정하지 않았습니다. 전반의 날짜만 이벤트 노트에서 반영했습니다.

## 공식 캐릭터 가이드와 소재

- [여우의 별자리 가이드](https://wutheringwaves.kurogames.com/en/main/news/detail/5492), [소재 표 이미지](https://hw-media-cdn-mingchao.kurogame.com/object/1790179200000/vax53ru9d8bmcixufb-1790233780368.jpg)
- [쇄명 가이드](https://wutheringwaves.kurogames.com/en/main/news/detail/5644), [소재 표 이미지](https://hw-media-cdn-mingchao.kurogame.com/object/1792080000000/f3ci7wtfxus6zl1lbe-1792137955242.jpg)

두 이미지의 소재 표를 직접 확인했습니다.

| 공명자 | 단조 계열 | 일반 드랍 | 주간 소재 | 특산물 | 필드 보스 소재 |
|---|---|---|---|---|---|
| 여우의 별자리 | Spliced String | Autopuppet Kernel | Remnant of the Wheel | Bloom of Hearkening | Solidarity's Loneflame |
| 쇄명 | Broken Wing Polarizer | Howler Core | Remnant of the Wheel | Miasmic Branch | Forged Empyrean's Sigh |

단조/일반 드랍은 기존 `string`, `polarizer`, `autopuppet`, `howler` 계열에 매핑했습니다. 신규 소재의 한국어 정식 명칭과 주간 보스 이름은 확인되지 않아 임의 번역하지 않았습니다. 해당 표에는 총 수량이 없으므로 기존 공통 육성 수량 모델을 그대로 사용하며, 캐릭터별 수량을 새로 공식 검증했다고 주장하지 않습니다.

프로필은 공식 사이트 role-small 자산입니다.

- [여우의 별자리 이미지](https://wutheringwaves.kurogames.com/static4.0/assets/xin-4e9f5c0c.webp)
- [쇄명 이미지](https://wutheringwaves.kurogames.com/static4.0/assets/suoming-cc986429.webp)

## 표시 및 데이터 보존

현재 일정과 자료의 적용 기간을 분리합니다. 과거 기본값은 최신 자료로 갱신하고 사용자 수정 내용은 원래 기간과 함께 보존합니다. 기간이 지난 버프/몹은 과거 자료로 접어 표시합니다. 외부 백업의 임의 `official` 표시는 관리되는 기본 자료와 내용·기간·출처가 모두 일치할 때만 인정합니다.
