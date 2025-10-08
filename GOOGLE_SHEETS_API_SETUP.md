# Google Sheets API 403 오류 해결 가이드

## 🚨 **403 오류 원인**
- Google Sheets API가 활성화되지 않음
- OAuth 스코프에 적절한 권한이 없음
- 스프레드시트 접근 권한 부족

## 🔧 **해결 방법**

### **1단계: Google Cloud Console에서 Sheets API 활성화**

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 접속
   - 프로젝트 선택 (the-sound-auth 또는 해당 프로젝트)

2. **API 및 서비스 활성화**
   - 좌측 메뉴에서 **"API 및 서비스"** > **"라이브러리"** 클릭
   - 검색창에 **"Google Sheets API"** 입력
   - **"Google Sheets API"** 선택
   - **"사용 설정"** 버튼 클릭

3. **Google Drive API도 활성화** (필요한 경우)
   - 검색창에 **"Google Drive API"** 입력
   - **"Google Drive API"** 선택
   - **"사용 설정"** 버튼 클릭

### **2단계: OAuth 동의 화면 스코프 추가**

1. **OAuth 동의 화면 설정**
   - **"API 및 서비스"** > **"OAuth 동의 화면"** 이동
   - **"편집"** 버튼 클릭

2. **스코프 추가**
   - **"스코프 추가 또는 삭제"** 클릭
   - 다음 스코프들을 추가:
     ```
     https://www.googleapis.com/auth/spreadsheets
     https://www.googleapis.com/auth/drive.readonly
     https://www.googleapis.com/auth/drive.file
     ```
   - **"업데이트"** 클릭
   - **"저장 후 계속"** 클릭

3. **테스트 사용자 확인**
   - **"테스트 사용자"** 섹션에서 매니저 계정이 추가되어 있는지 확인
   - 없다면 **"+ 사용자 추가"** 클릭하여 매니저 이메일 추가

### **3단계: OAuth 2.0 클라이언트 ID 재생성**

1. **기존 클라이언트 ID 삭제**
   - **"API 및 서비스"** > **"사용자 인증 정보"** 이동
   - 기존 OAuth 2.0 클라이언트 ID 삭제

2. **새 클라이언트 ID 생성**
   - **"+ 사용자 인증 정보 만들기"** > **"OAuth 2.0 클라이언트 ID"** 선택
   - **애플리케이션 유형**: 웹 애플리케이션
   - **이름**: The Sound Web Client
   - **승인된 JavaScript 원본**:
     ```
     http://localhost:4000
     https://codessone.github.io
     ```
   - **승인된 리디렉션 URI**:
     ```
     http://localhost:4000/manager
     https://codessone.github.io/the-sound/manager
     ```
   - **"만들기"** 클릭

3. **새 클라이언트 ID를 .env 파일에 업데이트**
   ```env
   REACT_APP_GOOGLE_CLIENT_ID=새로운_클라이언트_ID
   ```

### **4단계: 스프레드시트 공유 설정**

1. **스프레드시트 열기**
   - https://docs.google.com/spreadsheets/d/1p8P_4ymeoSof5ExXClamxYwtvOtDK9Q1Sw4gSawu9uo/edit?usp=drive_link

2. **공유 설정**
   - 우측 상단 **"공유"** 버튼 클릭
   - **"일반 액세스"** 섹션에서:
     - **"제한됨"** → **"링크가 있는 모든 사용자"**로 변경
     - 또는 매니저 계정 이메일을 직접 추가하고 **"편집자"** 권한 부여

3. **권한 확인**
   - 매니저 계정으로 스프레드시트에 직접 접근 가능한지 확인

### **5단계: 개발 서버 재시작**

```bash
# 개발 서버 중지 (Ctrl+C)
# 환경 변수 업데이트 후 재시작
yarn start
```

### **6단계: 테스트**

1. **브라우저 캐시 삭제**
   - 개발자 도구 (F12) > Application > Storage > Clear storage

2. **매니저 로그인 테스트**
   - http://localhost:4000/manager 접속
   - Google 로그인 시도
   - 새로운 권한 요청 팝업 확인

3. **스프레드시트 기능 테스트**
   - "스프레드시트 초기화" 버튼 클릭
   - "제품 데이터 저장" 버튼 클릭

## 🔍 **추가 디버깅 방법**

### **브라우저 개발자 도구에서 확인**
1. **Network 탭**에서 API 요청 확인
2. **Console 탭**에서 오류 메시지 확인
3. **Application 탭** > **Local Storage**에서 토큰 확인

### **일반적인 오류 메시지**
- `403 Forbidden`: API 권한 부족
- `401 Unauthorized`: 토큰 만료 또는 잘못된 토큰
- `400 Bad Request`: 잘못된 요청 형식

## 📞 **문제가 지속되는 경우**

1. **Google Cloud Console에서 API 사용량 확인**
2. **OAuth 동의 화면 상태 확인** (테스트 중인지, 게시됨인지)
3. **스프레드시트 ID와 시트 이름 확인**
4. **매니저 계정이 테스트 사용자 목록에 있는지 확인**

이 단계들을 순서대로 따라하면 403 오류가 해결될 것입니다.
