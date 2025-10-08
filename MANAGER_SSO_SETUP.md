# 매니저 SSO 로그인 설정 가이드

구글 OAuth를 사용한 매니저 SSO 로그인 시스템 설정 방법입니다.

## 🔧 **설정 방법**

### 1. 매니저 이메일 설정

`src/utils/managerAuth.ts` 파일에서 허용된 매니저 이메일을 설정하세요:

```typescript
// 허용된 매니저 이메일 목록 (하나의 계정만)
const AUTHORIZED_MANAGER_EMAIL = 'your-manager-email@gmail.com'; // 실제 매니저 이메일로 변경
```

### 2. Google Cloud Console 설정

**2.1 OAuth 동의 화면 설정**
```
1. https://console.cloud.google.com/ 접속
2. API 및 서비스 → OAuth 동의 화면
3. 사용자 유형: "외부" 선택
4. 앱 정보 입력:
   - 앱 이름: The Sound Manager
   - 사용자 지원 이메일: your-email@gmail.com
   - 개발자 연락처: your-email@gmail.com
5. 스코프 추가:
   - https://www.googleapis.com/auth/userinfo.email
   - https://www.googleapis.com/auth/userinfo.profile
6. 테스트 사용자에 매니저 이메일 추가
7. 저장 후 계속
```

**2.2 승인된 JavaScript 원본 설정**
```
API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID
승인된 JavaScript 원본에 추가:
- http://localhost:4000
- https://codessone.github.io
```

### 3. 환경 변수 설정

`.env` 파일에 Google Client ID 설정:

```env
REACT_APP_GOOGLE_CLIENT_ID=your_actual_client_id_here
```

## 🔒 **보안 특징**

### 1. 단일 계정 인증
- 하나의 매니저 계정만 허용
- 다른 계정으로 로그인 시도 시 접근 거부

### 2. 로컬 스토리지 관리
- 로그인 상태를 로컬 스토리지에 저장
- 페이지 새로고침 시에도 로그인 상태 유지
- 로그아웃 시 모든 데이터 삭제

### 3. 토큰 검증
- Google OAuth 토큰을 실시간으로 검증
- 유효하지 않은 토큰으로는 접근 불가

## 🧪 **테스트 방법**

### 1. 허용된 계정으로 로그인
```
1. 개발 서버 실행: yarn start
2. /manager 페이지 접속
3. "Google로 로그인" 클릭
4. 허용된 매니저 계정으로 로그인
5. 관리자 시스템 접근 확인
```

### 2. 허용되지 않은 계정으로 테스트
```
1. 다른 Google 계정으로 로그인 시도
2. "접근 권한이 없습니다" 메시지 확인
3. 관리자 시스템 접근 불가 확인
```

## 📋 **체크리스트**

- [ ] `managerAuth.ts`에서 매니저 이메일 설정
- [ ] Google Cloud Console에서 OAuth 동의 화면 설정
- [ ] 테스트 사용자에 매니저 이메일 추가
- [ ] 승인된 JavaScript 원본 설정
- [ ] .env 파일에 Client ID 설정
- [ ] 개발 서버 재시작
- [ ] 허용된 계정으로 로그인 테스트
- [ ] 허용되지 않은 계정으로 접근 거부 테스트

## 🚨 **주의사항**

1. **매니저 이메일 변경**: 코드에서 이메일을 변경한 후 반드시 재빌드 필요
2. **보안**: 매니저 이메일은 정확하게 입력해야 함
3. **테스트**: 개발 단계에서는 테스트 사용자로 추가해야 함
4. **토큰 만료**: Google 토큰이 만료되면 자동으로 재로그인 요구

## 🔄 **매니저 계정 변경 방법**

1. `src/utils/managerAuth.ts`에서 `AUTHORIZED_MANAGER_EMAIL` 수정
2. Google Cloud Console에서 새 계정을 테스트 사용자로 추가
3. 개발 서버 재시작
4. 새 계정으로 로그인 테스트

이제 안전하고 간편한 매니저 SSO 로그인 시스템이 완성되었습니다!
