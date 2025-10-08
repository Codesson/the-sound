// 구글 스프레드시트 API 유틸리티

export interface ProductData {
  id: string;
  model: string;
  kind: string;
  description: string;
  imageUrl: string;
  specifications: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface SpreadsheetConfig {
  spreadsheetId: string;
  sheetName: string;
  range: string;
}

// 스프레드시트 설정
const SPREADSHEET_CONFIG: SpreadsheetConfig = {
  spreadsheetId: '1p8P_4ymeoSof5ExXClamxYwtvOtDK9Q1Sw4gSawu9uo',
  sheetName: '제품정보',
  range: 'A:Z'
};

/**
 * 구글 스프레드시트 API 요청 헤더 생성
 */
const getHeaders = (accessToken: string) => ({
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
});

/**
 * 스프레드시트 데이터 읽기
 */
export const readSpreadsheetData = async (accessToken: string): Promise<ProductData[]> => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_CONFIG.spreadsheetId}/values/${SPREADSHEET_CONFIG.sheetName}!${SPREADSHEET_CONFIG.range}`;
    
    const response = await fetch(url, {
      headers: getHeaders(accessToken)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 403) {
        throw new Error(`403 오류: Google Sheets API 권한이 없습니다. Google Cloud Console에서 Sheets API를 활성화하고 OAuth 스코프를 확인해주세요.`);
      } else if (response.status === 401) {
        throw new Error(`401 오류: 인증이 필요합니다. 다시 로그인해주세요.`);
      } else {
        throw new Error(`스프레드시트 읽기 실패: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
      }
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length <= 1) {
      return []; // 헤더만 있거나 데이터가 없는 경우
    }

    // 헤더 제거하고 데이터 파싱
    const headers = rows[0];
    const dataRows = rows.slice(1);

    return dataRows.map((row: any[], index: number) => {
      const product: ProductData = {
        id: row[0] || `product_${index + 1}`,
        model: row[1] || '',
        kind: row[2] || '',
        description: row[3] || '',
        imageUrl: row[4] || '',
        specifications: {},
        createdAt: row[5] || new Date().toISOString(),
        updatedAt: row[6] || new Date().toISOString()
      };

      // 사양 정보 파싱 (7번째 컬럼부터)
      for (let i = 7; i < headers.length; i += 2) {
        if (headers[i] && row[i] && headers[i + 1] && row[i + 1]) {
          product.specifications[headers[i]] = row[i + 1];
        }
      }

      return product;
    });
  } catch (error) {
    console.error('스프레드시트 읽기 오류:', error);
    throw error;
  }
};

/**
 * 스프레드시트에 제품 데이터 쓰기
 */
export const writeSpreadsheetData = async (accessToken: string, products: ProductData[]): Promise<void> => {
  try {
    // 헤더 생성
    const headers = [
      'ID', '모델명', '제품종류', '설명', '이미지URL', '생성일', '수정일'
    ];

    // 사양 헤더 추가 (모든 제품의 사양 키를 수집)
    const allSpecKeys = new Set<string>();
    products.forEach(product => {
      Object.keys(product.specifications).forEach(key => {
        allSpecKeys.add(key);
      });
    });

    // 사양 헤더를 키-값 쌍으로 추가
    allSpecKeys.forEach(key => {
      headers.push(key, `${key}_값`);
    });

    // 데이터 행 생성
    const rows = [headers];
    
    products.forEach(product => {
      const row = [
        product.id,
        product.model,
        product.kind,
        product.description,
        product.imageUrl,
        product.createdAt,
        product.updatedAt
      ];

      // 사양 데이터 추가
      allSpecKeys.forEach(key => {
        const value = product.specifications[key] || '';
        row.push(key, value);
      });

      rows.push(row);
    });

    // 스프레드시트에 데이터 쓰기
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_CONFIG.spreadsheetId}/values/${SPREADSHEET_CONFIG.sheetName}!A1:append?valueInputOption=USER_ENTERED`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify({
        values: rows
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 403) {
        throw new Error(`403 오류: Google Sheets API 권한이 없습니다. Google Cloud Console에서 Sheets API를 활성화하고 OAuth 스코프를 확인해주세요.`);
      } else if (response.status === 401) {
        throw new Error(`401 오류: 인증이 필요합니다. 다시 로그인해주세요.`);
      } else {
        throw new Error(`스프레드시트 쓰기 실패: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
      }
    }
  } catch (error) {
    console.error('스프레드시트 쓰기 오류:', error);
    throw error;
  }
};

/**
 * 스프레드시트 초기화 (헤더만 설정)
 */
export const initializeSpreadsheet = async (accessToken: string): Promise<void> => {
  try {
    // 기본 헤더 설정
    const headers = [
      'ID', '모델명', '제품종류', '설명', '이미지URL', '생성일', '수정일',
      'TYPE', 'TYPE_값',
      'POWER', 'POWER_값',
      'FREQUENCY_RESPONSE', 'FREQUENCY_RESPONSE_값',
      'SENSITIVITY', 'SENSITIVITY_값',
      'COMPONENTS', 'COMPONENTS_값',
      'NOMINAL_IMPEDANCE', 'NOMINAL_IMPEDANCE_값',
      'COVERAGE', 'COVERAGE_값',
      'SPLmax', 'SPLmax_값',
      'CONNECTION', 'CONNECTION_값',
      'ENCLOSER', 'ENCLOSER_값',
      'FINISH', 'FINISH_값',
      'DIMENSIONS', 'DIMENSIONS_값',
      'WEIGHT', 'WEIGHT_값'
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_CONFIG.spreadsheetId}/values/${SPREADSHEET_CONFIG.sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1?valueInputOption=USER_ENTERED`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(accessToken),
      body: JSON.stringify({
        values: [headers]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 403) {
        throw new Error(`403 오류: Google Sheets API 권한이 없습니다. Google Cloud Console에서 Sheets API를 활성화하고 OAuth 스코프를 확인해주세요.`);
      } else if (response.status === 401) {
        throw new Error(`401 오류: 인증이 필요합니다. 다시 로그인해주세요.`);
      } else {
        throw new Error(`스프레드시트 초기화 실패: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
      }
    }
  } catch (error) {
    console.error('스프레드시트 초기화 오류:', error);
    throw error;
  }
};

/**
 * 현재 제품 데이터를 스프레드시트 형식으로 변환
 */
export const convertProductsToSpreadsheetFormat = (products: any[]): ProductData[] => {
  return products.map((product, index) => ({
    id: `product_${index + 1}`,
    model: product.model || '',
    kind: product.kind || '',
    description: product.desc || '',
    imageUrl: product.url || '',
    specifications: product.spec || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
};

/**
 * 스프레드시트 권한 확인
 */
export const checkSpreadsheetAccess = async (accessToken: string): Promise<boolean> => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_CONFIG.spreadsheetId}`;
    
    const response = await fetch(url, {
      headers: getHeaders(accessToken)
    });

    return response.ok;
  } catch (error) {
    console.error('스프레드시트 접근 확인 오류:', error);
    return false;
  }
};
