# Google OAuth 설정 가이드

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 이름: "The Sound"

### 1.2 OAuth 동의 화면 설정
1. **APIs & Services** > **OAuth consent screen** 이동
2. **User Type**: External 선택
3. **App Information**:
   - App name: "The Sound"
   - User support email: your-email@example.com
   - Developer contact information: your-email@example.com
4. **Scopes** 추가:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive.readonly`
5. **Test users** 추가 (개발 단계에서)

### 1.3 OAuth 2.0 클라이언트 ID 생성
1. **APIs & Services** > **Credentials** 이동
2. **Create Credentials** > **OAuth 2.0 Client ID** 선택
3. **Application type**: Web application
4. **Name**: "The Sound Web Client"
5. **Authorized JavaScript origins**:
   - `http://localhost:3000` (개발용)
   - `https://codesson.github.io` (프로덕션용)
6. **Authorized redirect URIs**:
   - `http://localhost:3000` (개발용)
   - `https://codesson.github.io/the-sound` (프로덕션용)

## 2. 환경변수 설정

### 2.1 .env 파일 생성
```bash
# Google OAuth 설정
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Google Apps Script URL
REACT_APP_GOOGLE_APPS_SCRIPT_URL=your_google_apps_script_url_here
```

### 2.2 실제 값으로 교체
- `your_google_client_id_here`: Google Cloud Console에서 생성한 Client ID
- `your_google_client_secret_here`: Google Cloud Console에서 생성한 Client Secret
- `your_google_apps_script_url_here`: Google Apps Script 배포 URL

## 3. Google Apps Script 설정

### 3.1 스크립트 생성
1. [Google Apps Script](https://script.google.com/) 접속
2. 새 프로젝트 생성
3. `google-apps-script.js` 파일 내용 복사
4. 프로젝트 이름: "The Sound Backend"

### 3.2 Google Sheets 연동
1. Google Sheets에서 새 스프레드시트 생성
2. 시트 이름: "Portfolio", "Products", "Support"
3. Apps Script에서 스프레드시트 ID 복사

### 3.3 스크립트 배포
1. **Deploy** > **New deployment** 클릭
2. **Type**: Web app
3. **Execute as**: Me
4. **Who has access**: Anyone
5. **Deploy** 클릭
6. 웹 앱 URL 복사

## 4. 사용법

### 4.1 Google 로그인
```typescript
import { initGoogleAuth, GoogleUserInfo } from './utils/googleAuth';

initGoogleAuth(
  (token: string, userInfo: GoogleUserInfo) => {
    console.log('로그인 성공:', userInfo);
    // 로그인 성공 처리
  },
  (error: string) => {
    console.error('로그인 실패:', error);
    // 로그인 실패 처리
  }
);
```

### 4.2 Google Drive 접근
```typescript
import { testGoogleDriveAccess } from './utils/googleDriveAccess';

const result = await testGoogleDriveAccess(token);
if (result.success) {
  console.log('Drive 접근 성공:', result.files);
} else {
  console.error('Drive 접근 실패:', result.message);
}
```

## 5. 보안 주의사항

### 5.1 환경변수 보안
- `.env` 파일은 절대 Git에 커밋하지 않기
- `.env.example` 파일로 필요한 환경변수 문서화
- 프로덕션에서는 환경변수를 안전하게 관리

### 5.2 OAuth 스코프 최소화
- 필요한 최소한의 스코프만 요청
- 사용자에게 명확한 권한 설명 제공
- 정기적으로 스코프 검토 및 정리

### 5.3 토큰 관리
- 토큰을 안전하게 저장
- 토큰 만료 시 자동 갱신
- 로그아웃 시 토큰 무효화

## 6. 문제 해결

### 6.1 일반적인 오류
- **403 Forbidden**: 스코프 권한 확인
- **401 Unauthorized**: 토큰 유효성 확인
- **CORS 오류**: 허용된 도메인 확인

### 6.2 디버깅
- 브라우저 개발자 도구에서 네트워크 탭 확인
- Google Cloud Console에서 API 사용량 모니터링
- Apps Script 로그 확인

## 7. 추가 리소스

- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API 문서](https://developers.google.com/drive/api)
- [Google Apps Script 문서](https://developers.google.com/apps-script)
- [React Google OAuth 가이드](https://developers.google.com/identity/gsi/web/guides/overview)