# 환경변수 설정 가이드

## 환경변수 목록

### Google OAuth 설정
- `REACT_APP_GOOGLE_CLIENT_ID`: Google OAuth 2.0 클라이언트 ID
  - 용도: Google 로그인 인증
  - 예시: `794134324873-mo6pdae4ihclhvae05jkn430f1o2ninc.apps.googleusercontent.com`

- `REACT_APP_GOOGLE_CLIENT_SECRET`: Google OAuth 2.0 클라이언트 시크릿
  - 용도: Google 로그인 인증 (서버 사이드)
  - 예시: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`

### Google Apps Script
- `REACT_APP_GOOGLE_APPS_SCRIPT_URL`: Google Apps Script 웹 앱 URL
  - 용도: 백엔드 데이터 처리
  - 예시: `https://script.google.com/macros/s/xxxxx/exec`

### Google Spreadsheet
- `REACT_APP_PRODUCTS_SPREADSHEET_ID`: 제품 목록 스프레드시트 ID
  - 용도: 제품 데이터 저장 및 조회
  - 예시: `1p8P_4ymeoSof5ExXClamxYwtvOtDK9Q1Sw4gSawu9uo`
  - ⚠️ 주의: 이전에 `REACT_APP_GOOGLE_CLIENT_ID`로 잘못 사용되었음

### 관리자 설정
- `REACT_APP_MANAGER_EMAIL`: 허용된 관리자 이메일
  - 용도: 관리자 페이지 접근 권한 제어
  - 예시: `codessone@gmail.com`

## 환경변수 설정 방법

### 1. .env 파일 생성
```bash
cp .env.example .env
```

### 2. .env 파일 편집
실제 값으로 환경변수를 설정합니다.

### 3. 개발 서버 재시작
환경변수 변경 후 개발 서버를 재시작해야 합니다.
```bash
yarn start
```

## 보안 주의사항

- ⚠️ `.env` 파일은 절대 Git에 커밋하지 마세요
- ✅ `.env.example` 파일만 Git에 커밋하세요
- ✅ 프로덕션 환경에서는 환경변수를 안전하게 관리하세요
- ✅ OAuth Client Secret은 정기적으로 재생성하세요

## 환경변수 사용 예시

```typescript
// 스프레드시트 ID 가져오기
const spreadsheetId = process.env.REACT_APP_PRODUCTS_SPREADSHEET_ID;

// 관리자 이메일 확인
const managerEmail = process.env.REACT_APP_MANAGER_EMAIL;
```
