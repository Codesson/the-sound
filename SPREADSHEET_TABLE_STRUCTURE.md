# 구글 스프레드시트 제품 정보 테이블 구조

## 📊 **스프레드시트 정보**
- **스프레드시트 ID**: `1p8P_4ymeoSof5ExXClamxYwtvOtDK9Q1Sw4gSawu9uo`
- **시트 이름**: `제품정보`
- **URL**: https://docs.google.com/spreadsheets/d/1p8P_4ymeoSof5ExXClamxYwtvOtDK9Q1Sw4gSawu9uo/edit?usp=drive_link

## 🗂️ **테이블 구조**

### **기본 컬럼 (A-G)**
| 컬럼 | 필드명 | 설명 | 예시 |
|------|--------|------|------|
| A | ID | 제품 고유 식별자 | product_1, product_2 |
| B | 모델명 | 제품 모델명 | E212, TS M12, E12 |
| C | 제품종류 | 제품 카테고리 | 메인 스피커, 12인치 모니터, 딜레이 스피커 |
| D | 설명 | 제품 상세 설명 | 제품의 특징과 용도 설명 |
| E | 이미지URL | 제품 이미지 경로 | /assets/images/speaker.png |
| F | 생성일 | 데이터 생성 날짜 | 2024-01-15T10:30:00.000Z |
| G | 수정일 | 데이터 수정 날짜 | 2024-01-15T10:30:00.000Z |

### **사양 컬럼 (H 이후)**
사양 정보는 키-값 쌍으로 저장됩니다:

| 컬럼 | 필드명 | 설명 | 예시 |
|------|--------|------|------|
| H | TYPE | 제품 타입 | 2WAY PASSIVE SPEAKER |
| I | TYPE_값 | TYPE의 값 | 2WAY PASSIVE SPEAKER |
| J | POWER | 출력/전력 | 1400/2800 |
| K | POWER_값 | POWER의 값 | 1400/2800 |
| L | FREQUENCY_RESPONSE | 주파수 응답 | 45HZ - 18,000HZ |
| M | FREQUENCY_RESPONSE_값 | FREQUENCY_RESPONSE의 값 | 45HZ - 18,000HZ |
| N | SENSITIVITY | 감도 | 109dB |
| O | SENSITIVITY_값 | SENSITIVITY의 값 | 109dB |
| P | COMPONENTS | 구성 요소 | LOW: 2 X 12" 3" VOICE COIL (B&C) |
| Q | COMPONENTS_값 | COMPONENTS의 값 | LOW: 2 X 12" 3" VOICE COIL (B&C) |
| R | NOMINAL_IMPEDANCE | 정격 임피던스 | 40HM |
| S | NOMINAL_IMPEDANCE_값 | NOMINAL_IMPEDANCE의 값 | 40HM |
| T | COVERAGE | 커버리지 | 60° X 40° OR 40° X 60° |
| U | COVERAGE_값 | COVERAGE의 값 | 60° X 40° OR 40° X 60° |
| V | SPLmax | 최대 음압레벨 | 137dB |
| W | SPLmax_값 | SPLmax의 값 | 137dB |
| X | CONNECTION | 연결 방식 | 2 X NL4 1$ |
| Y | CONNECTION_값 | CONNECTION의 값 | 2 X NL4 1$ |
| Z | ENCLOSER | 인클로저 | 15mm BALTIC PLYWOOD |
| AA | ENCLOSER_값 | ENCLOSER의 값 | 15mm BALTIC PLYWOOD |
| AB | FINISH | 마감 | WARNEX TEXTURE PAINT (BLACK OR WHITE) |
| AC | FINISH_값 | FINISH의 값 | WARNEX TEXTURE PAINT (BLACK OR WHITE) |
| AD | DIMENSIONS | 치수 | 700 X 450 X 430 |
| AE | DIMENSIONS_값 | DIMENSIONS의 값 | 700 X 450 X 430 |
| AF | WEIGHT | 무게 | 40KG |
| AG | WEIGHT_값 | WEIGHT의 값 | 40KG |

## 📋 **현재 제품 데이터**

### **E212 (메인 스피커)**
- **모델명**: E212
- **제품종류**: 메인 스피커
- **주요 사양**:
  - TYPE: 2WAY PASSIVE SPEAKER
  - POWER: 1400/2800
  - FREQUENCY_RESPONSE: 45HZ - 18,000HZ
  - SENSITIVITY: 109dB
  - COMPONENTS: LOW: 2 X 12" 3" VOICE COIL (B&C), HI: 1 X 1.4" 3" VOICE COIL (B&C) COAXIAL
  - NOMINAL_IMPEDANCE: 40HM
  - COVERAGE: 60° X 40° OR 40° X 60° HF-HORN ROTATABLE
  - SPLmax: 137dB
  - CONNECTION: 2 X NL4 1$
  - ENCLOSER: 15mm BALTIC PLYWOOD
  - FINISH: WARNEX TEXTURE PAINT (BLACK OR WHITE)
  - DIMENSIONS: 700 X 450 X 430
  - WEIGHT: 40KG

### **TS M12 (12인치 모니터)**
- **모델명**: TS M12
- **제품종류**: 12인치 모니터
- **사양**: 준비 중

### **E12 (딜레이 스피커)**
- **모델명**: E12
- **제품종류**: 딜레이 스피커
- **사양**: 준비 중

### **S218 (서브우퍼)**
- **모델명**: S218
- **제품종류**: 서브우퍼
- **사양**: 준비 중

### **E15 (15인치 스피커)**
- **모델명**: E15
- **제품종류**: 15인치 스피커
- **주요 사양**:
  - TYPE: 15" PASSIVE SPEAKER
  - POWER: 800W RMS
  - FREQUENCY_RESPONSE: 50HZ - 20,000HZ
  - SENSITIVITY: 98dB

### **LED BAR 100 (LED 바)**
- **모델명**: LED BAR 100
- **제품종류**: LED 바
- **주요 사양**:
  - TYPE: LED BAR LIGHT
  - LED COUNT: 100 PCS
  - POWER: 200W
  - BEAM ANGLE: 15°

### **MIXER X32 (디지털 믹서)**
- **모델명**: MIXER X32
- **제품종류**: 디지털 믹서
- **주요 사양**:
  - TYPE: DIGITAL MIXER
  - CHANNELS: 32 INPUT / 16 OUTPUT
  - SAMPLE RATE: 48kHz
  - EFFECTS: Built-in Effects

### **AMP 2000 (파워 앰프)**
- **모델명**: AMP 2000
- **제품종류**: 파워 앰프
- **주요 사양**:
  - TYPE: POWER AMPLIFIER
  - POWER: 2000W @ 4Ω
  - THD: <0.1%
  - FREQUENCY_RESPONSE: 20HZ - 20,000HZ

## 🔧 **사용 방법**

### **1. 스프레드시트 초기화**
- 매니저 시스템에서 "스프레드시트 초기화" 버튼 클릭
- 헤더 행이 자동으로 생성됩니다

### **2. 제품 데이터 저장**
- "제품 데이터 저장" 버튼 클릭
- 현재 웹사이트의 제품 정보가 스프레드시트에 저장됩니다

### **3. 스프레드시트 데이터 로드**
- "스프레드시트 데이터 로드" 버튼 클릭
- 스프레드시트의 데이터를 웹사이트로 불러옵니다

## 🔐 **권한 설정**

### **Google Cloud Console 설정**
1. **API 및 서비스** > **사용자 인증 정보**에서 OAuth 2.0 클라이언트 ID 생성
2. **승인된 JavaScript 원본**에 도메인 추가:
   - `http://localhost:4000` (개발용)
   - `https://codessone.github.io` (프로덕션용)
3. **스코프**에 다음 권한 추가:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### **스프레드시트 공유 설정**
1. 스프레드시트를 편집 가능하도록 설정
2. 매니저 계정에 편집 권한 부여
3. Google Sheets API가 접근할 수 있도록 설정

## 📝 **데이터 형식**

### **JSON 형식 예시**
```json
{
  "id": "product_1",
  "model": "E212",
  "kind": "메인 스피커",
  "description": "E212 스피커는 유수한 스피커제조사들이 사용하는...",
  "imageUrl": "/assets/images/speaker.png",
  "specifications": {
    "TYPE": "2WAY PASSIVE SPEAKER",
    "POWER": "1400/2800",
    "FREQUENCY_RESPONSE": "45HZ - 18,000HZ",
    "SENSITIVITY": "109dB"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

이 구조를 통해 제품 정보를 체계적으로 관리하고, 웹사이트와 스프레드시트 간의 데이터 동기화를 원활하게 할 수 있습니다.
