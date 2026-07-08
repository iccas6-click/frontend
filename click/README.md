# CLICK Frontend

CLICK 모바일 앱의 React Native/Expo 프론트엔드입니다. 사용자는 처방전, 약봉투, 복약 안내문과 건강기능식품 라벨을 촬영하거나 갤러리에서 선택하고, 인식 결과를 확인·수정한 뒤 약-건강기능식품 상호작용 분석 결과를 확인할 수 있습니다.

## 이번 브랜치의 main 대비 변경점

- 앱 용어를 `알약` 중심에서 `처방약`, `처방전·약봉투` 중심으로 정리했습니다.
- 처방전·약봉투 인식은 낱알 후보 선택 UI가 아니라 문서 이미지 인식 결과를 검토하는 흐름으로 조정했습니다.
- 카메라/갤러리로 선택한 원본 사진을 인식 중, 실패, 결과 화면에서 함께 보여줍니다.
- 인식 실패 또는 재촬영 상황에서 바로 카메라로만 돌아가지 않고 촬영/갤러리 선택 화면으로 돌아가도록 바꿨습니다.
- 처방전·약봉투 안내 문구를 한 줄로 줄이고 `TopBar`에 subtitle 한 줄 표시 옵션을 추가했습니다.
- 처방전·약봉투 인식 timeout을 120초, 건강기능식품 인식 timeout을 90초로 조정했습니다.
- 처방전 인식 업로드는 전체 정규화 이미지 1장을 우선 사용하도록 정리했습니다.
- 설정 화면의 낱알 인식 엔진 선택 UI를 제거하고 처방전·약봉투 인식 설명으로 대체했습니다.

## 주요 화면

```text
app/index.tsx            홈
app/reuse.tsx            촬영/갤러리/기존 기록 선택
app/camera.tsx           카메라 촬영
app/result.tsx           인식 중/실패/결과
app/review.tsx           인식 항목 검토 및 수정
app/analyze.tsx          상호작용 분석 중
app/analysis.tsx         분석 결과
app/history.tsx          기록 목록
app/record.tsx           기록 상세
app/settings.tsx         설정
```

## 핵심 서비스

```text
services/ocr.ts
  약/건강기능식품 이미지 정규화, AI 서버 업로드, 인식 결과 변환

services/interactions.ts
  백엔드 /api/v1/interactions/analyze 호출

services/history-storage.ts
  인식 항목과 분석 결과 로컬 기록 저장
```

## 실행

```bash
npm install
npx expo start
```

필요한 환경변수:

```env
EXPO_PUBLIC_PILL_AI_URL=
EXPO_PUBLIC_SUPPLEMENT_AI_URL=
EXPO_PUBLIC_BACKEND_URL=
```

## 기술 스택

- React Native
- Expo / Expo Router
- Expo Camera
- Expo Image Picker
- Expo Image Manipulator
- Axios
- AsyncStorage
- TypeScript
