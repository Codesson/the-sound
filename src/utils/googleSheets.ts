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

// 스프레드시트 설정 (환경변수에서 가져오기)
const SPREADSHEET_CONFIG: SpreadsheetConfig = {
  spreadsheetId: process.env.REACT_APP_PRODUCTS_SPREADSHEET_ID || '1p8P_4ymeoSof5ExXClamxYwtvOtDK9Q1Sw4gSawu9uo',
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

/**
 * 시공사례 데이터를 Google Sheets에 직접 저장
 */
export interface PortfolioData {
  title: string;
  description: string;
  location: string;
  installmentDate: string;
  equipment: string;
  mainImage: string; // Base64 (첫 번째 셀, 최대 50,000자)
  mainImageExtra?: string; // Base64 (두 번째 셀, 50,000자 초과 시 사용)
  detailImage1?: string;
  detailImageExtra1?: string;
  detailImage2?: string;
  detailImageExtra2?: string;
  detailImage3?: string;
  detailImageExtra3?: string;
}

/**
 * 시공사례 데이터 읽기 (Google Sheets API 사용)
 */
export const readPortfolioData = async (
  accessToken: string,
  spreadsheetId: string = process.env.REACT_APP_PORTFOLIO_SPREADSHEET_ID || '1XYBvUwDqzlfF9DnBiSKLgFsC_XA6k22auI_0I29Airs',
  sheetName: string = 'customerCase'
): Promise<any[]> => {
  try {
    const encodedSheetName = encodeURIComponent(sheetName);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheetName}!A:Z`;
    
    console.log('📖 시공사례 데이터 읽기 API 호출:', {
      url: url.replace(accessToken, 'TOKEN_HIDDEN'),
      spreadsheetId,
      sheetName,
      encodedSheetName
    });
    
    const response = await fetch(url, {
      headers: getHeaders(accessToken)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || '';
      console.error('❌ Google Sheets API 읽기 오류:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        sheetName: sheetName,
        encodedSheetName: encodedSheetName
      });
      
      if (response.status === 403) {
        throw new Error(`403 오류: Google Sheets API 권한이 없습니다.\n\n가능한 원인:\n1. 스프레드시트 공유 설정 확인\n2. Google Sheets API 권한 확인\n3. OAuth 스코프 확인\n\n에러 상세: ${errorMessage}`);
      } else if (response.status === 401) {
        throw new Error(`401 오류: 인증이 필요합니다. 토큰이 만료되었을 수 있습니다. 다시 로그인해주세요.`);
      } else if (errorMessage.includes('parse') || errorMessage.includes('Range')) {
        throw new Error(`범위 파싱 오류: 시트 이름 "${sheetName}"을 확인해주세요.\n\n가능한 원인:\n1. 시트 이름이 정확한지 확인\n2. 시트가 존재하는지 확인\n3. 시트 이름에 특수문자가 있는지 확인\n\n에러 상세: ${errorMessage}`);
      } else {
        throw new Error(`시공사례 읽기 실패: ${response.status} ${response.statusText} - ${errorMessage}`);
      }
    }

    const data = await response.json();
    const rows = data.values || [];
    
    console.log('📊 시공사례 데이터 읽기 성공:', {
      총행수: rows.length,
      첫행: rows[0]?.slice(0, 5)
    });

    if (rows.length <= 1) {
      console.warn('⚠️ 시공사례 데이터가 없습니다. (헤더만 있거나 데이터 행이 없음)');
      return [];
    }

    // 헤더 제거하고 데이터 파싱
    const dataRows = rows.slice(1);
    
    // 필터링 전에 rowIndex를 계산해야 함 (필터링 후에는 실제 행 번호를 알 수 없음)
    return dataRows.map((row: any[], index: number) => {
      // 스프레드시트 컬럼 구조:
      // 0: 타임스탬프, 1: id, 2: title, 3: description, 4: location, 
      // 5: installmentDate, 6: equipment, 7: mainImage, 8: mainImageExtra,
      // 9: detailImage1, 10: detailImageExtra1, 11: detailImage2, 
      // 12: detailImageExtra2, 13: detailImage3, 14: detailImageExtra3
      
      const title = (row[2] || '').trim();
      const description = (row[3] || '').trim();
      const location = (row[4] || '').trim();
      const date = (row[5] || '').trim();
      const equipment = (row[6] || '').trim();
      
      // 이미지 조합 (mainImage + mainImageExtra)
      const mainImage = ((row[7] || '').trim() + (row[8] || '').trim());
      const detailImage1 = ((row[9] || '').trim() + (row[10] || '').trim());
      const detailImage2 = ((row[11] || '').trim() + (row[12] || '').trim());
      const detailImage3 = ((row[13] || '').trim() + (row[14] || '').trim());
      
      // rowIndex: 헤더(1행) + 데이터 행 번호 (index는 0부터 시작, 실제 행은 2부터 시작)
      // index=0이면 실제 행은 2행, index=1이면 실제 행은 3행
      const rowIndex = index + 2;
      
      return {
        id: index + 1,
        rowIndex: rowIndex, // 스프레드시트 실제 행 번호 (헤더 포함, 1-based)
        title,
        description,
        location,
        date,
        equipment,
        mainImage,
        detailImages: [detailImage1, detailImage2, detailImage3].filter((img: string) => img && img.trim() !== '')
      };
    }).filter((item: any) => {
      // title이 있거나 description이 있으면 표시
      return item.title || item.description || item.location;
    });
  } catch (error) {
    console.error('시공사례 읽기 오류:', error);
    throw error;
  }
};

/**
 * 시공사례 데이터 업데이트 (Google Sheets API 사용)
 */
export const updatePortfolioRow = async (
  accessToken: string,
  rowIndex: number, // 스프레드시트의 실제 행 번호 (헤더 포함, 1-based)
  data: {
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    equipment?: string;
    mainImage?: string;
    mainImageExtra?: string;
    detailImage1?: string;
    detailImageExtra1?: string;
    detailImage2?: string;
    detailImageExtra2?: string;
    detailImage3?: string;
    detailImageExtra3?: string;
  },
  spreadsheetId: string = process.env.REACT_APP_PORTFOLIO_SPREADSHEET_ID || '1XYBvUwDqzlfF9DnBiSKLgFsC_XA6k22auI_0I29Airs',
  sheetName: string = 'customerCase'
): Promise<void> => {
  try {
    // 시트 이름에 특수문자나 공백이 있으면 작은따옴표로 감싸야 함
    const sheetNameForRange = sheetName.includes(' ') || sheetName.includes('-') || sheetName.includes('.') 
      ? `'${sheetName}'` 
      : sheetName;
    
    // 특정 행의 특정 컬럼만 업데이트
    // 컬럼 구조: 0: 타임스탬프, 1: id, 2: title, 3: description, 4: location, 5: installmentDate, 6: equipment,
    // 7: mainImage, 8: mainImageExtra, 9: detailImage1, 10: detailImageExtra1, 11: detailImage2, 
    // 12: detailImageExtra2, 13: detailImage3, 14: detailImageExtra3
    const updates: any[] = [];
    
    if (data.title !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!C${rowIndex}`,
        values: [[data.title]]
      });
    }
    if (data.description !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!D${rowIndex}`,
        values: [[data.description]]
      });
    }
    if (data.location !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!E${rowIndex}`,
        values: [[data.location]]
      });
    }
    if (data.date !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!F${rowIndex}`,
        values: [[data.date]]
      });
    }
    if (data.equipment !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!G${rowIndex}`,
        values: [[data.equipment]]
      });
    }
    if (data.mainImage !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!H${rowIndex}`,
        values: [[data.mainImage]]
      });
    }
    if (data.mainImageExtra !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!I${rowIndex}`,
        values: [[data.mainImageExtra]]
      });
    }
    if (data.detailImage1 !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!J${rowIndex}`,
        values: [[data.detailImage1]]
      });
    }
    if (data.detailImageExtra1 !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!K${rowIndex}`,
        values: [[data.detailImageExtra1]]
      });
    }
    if (data.detailImage2 !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!L${rowIndex}`,
        values: [[data.detailImage2]]
      });
    }
    if (data.detailImageExtra2 !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!M${rowIndex}`,
        values: [[data.detailImageExtra2]]
      });
    }
    if (data.detailImage3 !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!N${rowIndex}`,
        values: [[data.detailImage3]]
      });
    }
    if (data.detailImageExtra3 !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!O${rowIndex}`,
        values: [[data.detailImageExtra3]]
      });
    }
    
    if (updates.length === 0) {
      console.warn('업데이트할 데이터가 없습니다.');
      return;
    }
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    
    console.log('📝 시공사례 데이터 업데이트 API 호출:', {
      url: url.replace(accessToken, 'TOKEN_HIDDEN'),
      spreadsheetId,
      sheetName,
      rowIndex,
      updates: updates.length
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: updates
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || '';
      console.error('❌ Google Sheets API 업데이트 오류:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      if (response.status === 403) {
        throw new Error(`403 오류: Google Sheets API 권한이 없습니다.`);
      } else if (response.status === 401) {
        throw new Error(`401 오류: 인증이 필요합니다. 토큰이 만료되었을 수 있습니다. 다시 로그인해주세요.`);
      } else {
        throw new Error(`시공사례 업데이트 실패: ${response.status} ${response.statusText} - ${errorMessage}`);
      }
    }

    console.log('✅ 시공사례 데이터가 업데이트되었습니다.');
  } catch (error) {
    console.error('시공사례 업데이트 오류:', error);
    throw error;
  }
};

export const writePortfolioToSheet = async (
  accessToken: string,
  data: PortfolioData,
  spreadsheetId: string = process.env.REACT_APP_PORTFOLIO_SPREADSHEET_ID || '1XYBvUwDqzlfF9DnBiSKLgFsC_XA6k22auI_0I29Airs',
  sheetName: string = 'customerCase' // 실제 시트 이름으로 변경
): Promise<void> => {
  try {
    // 데이터 행 생성 (기존 구조와 호환)
    // 컬럼 순서: 타임스탬프, id, title, description, location, installmentDate, equipment,
    // mainImage, mainImageExtra, detailImage1, detailImageExtra1, detailImage2, detailImageExtra2, detailImage3, detailImageExtra3
    const timestamp = new Date().toISOString();
    const row = [
      timestamp,                    // 타임스탬프
      '',                          // id (자동 생성 또는 나중에 설정)
      data.title,
      data.description,
      data.location,
      data.installmentDate,
      data.equipment,
      data.mainImage,              // Base64 이미지 (첫 번째 셀, 최대 50,000자)
      data.mainImageExtra || '',   // Base64 이미지 (두 번째 셀, 50,000자 초과 시)
      data.detailImage1 || '',     // detailImage1
      data.detailImageExtra1 || '', // detailImageExtra1
      data.detailImage2 || '',     // detailImage2
      data.detailImageExtra2 || '', // detailImageExtra2
      data.detailImage3 || '',     // detailImage3
      data.detailImageExtra3 || ''  // detailImageExtra3
    ];

    // 시트 이름에 공백이나 특수문자가 있을 수 있으므로 URL 인코딩
    // Google Sheets API 형식: 시트이름!A1:append (A:append는 유효하지 않음)
    const encodedSheetName = encodeURIComponent(sheetName);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheetName}!A1:append?valueInputOption=USER_ENTERED`;
    
    console.log('📤 Google Sheets API 호출:', {
      url: url.replace(accessToken, 'TOKEN_HIDDEN'),
      spreadsheetId,
      sheetName,
      encodedSheetName,
      sheetNameLength: sheetName.length,
      sheetNameChars: Array.from(sheetName).map(c => `${c}(${c.charCodeAt(0)})`).join(', '),
      rowLength: row.length,
      mainImageLength: data.mainImage?.length || 0,
      mainImageExtraLength: data.mainImageExtra?.length || 0
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify({
        values: [row]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || '';
      console.error('❌ Google Sheets API 오류:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        sheetName: sheetName,
        encodedSheetName: encodedSheetName
      });
      
      if (response.status === 403) {
        throw new Error(`403 오류: Google Sheets API 권한이 없습니다.\n\n가능한 원인:\n1. 스프레드시트 공유 설정 확인\n2. Google Sheets API 권한 확인\n3. OAuth 스코프 확인\n\n에러 상세: ${errorMessage}`);
      } else if (response.status === 401) {
        throw new Error(`401 오류: 인증이 필요합니다. 토큰이 만료되었을 수 있습니다. 다시 로그인해주세요.`);
      } else if (errorMessage.includes('parse') || errorMessage.includes('Range')) {
        throw new Error(`범위 파싱 오류: 시트 이름 "${sheetName}"을 확인해주세요.\n\n가능한 원인:\n1. 시트 이름이 정확한지 확인\n2. 시트가 존재하는지 확인\n3. 시트 이름에 특수문자가 있는지 확인\n\n에러 상세: ${errorMessage}`);
      } else {
        throw new Error(`시공사례 저장 실패: ${response.status} ${response.statusText} - ${errorMessage}`);
      }
    }

    console.log('✅ 시공사례가 Google Sheets에 저장되었습니다.');
  } catch (error) {
    console.error('시공사례 저장 오류:', error);
    throw error;
  }
};

/**
 * 제품 데이터를 Google Sheets에 직접 저장
 */
export interface ProductFormData {
  productName: string;
  category: string;
  description: string;
  specification: string;
  productImage: string; // Base64 (첫 번째 셀, 최대 50,000자)
  productImageExtra?: string; // Base64 (두 번째 셀, 50,000자 초과 시 사용)
}

export const writeProductToSheet = async (
  accessToken: string,
  data: ProductFormData,
  spreadsheetId?: string,
  sheetName?: string
): Promise<void> => {
  try {
    const targetSpreadsheetId = spreadsheetId || process.env.REACT_APP_PRODUCTS_SPREADSHEET_ID || '1p8P_4ymeoSof5ExXClamxYwtvOtDK9Q1Sw4gSawu9uo';
    const targetSheetName = sheetName || 'productList';

    // 데이터 행 생성
    // 실제 컬럼 구조: 0: id (A), 1: productName (B), 2: category (C), 3: description (D), 
    // 4: specification (E), 5: productImage (F), 6: productImageExtra (G), 7: updatedAt (H)
    const timestamp = new Date().toISOString();
    const row = [
      `product_${Date.now()}`,     // ID (A)
      data.productName,            // B
      data.category,               // C
      data.description,           // D
      data.specification,          // E - specification
      data.productImage,           // F - productImage (Base64 이미지, 첫 번째 셀, 최대 50,000자)
      data.productImageExtra || '', // G - productImageExtra (Base64 이미지, 두 번째 셀, 50,000자 초과 시)
      timestamp                    // H - updatedAt
    ];
    
    console.log('📤 제품 저장 데이터 확인:', {
      productName: data.productName,
      category: data.category,
      descriptionLength: data.description?.length || 0,
      specificationLength: data.specification?.length || 0,
      productImageLength: data.productImage?.length || 0,
      productImageExtraLength: data.productImageExtra?.length || 0,
      productImagePreview: data.productImage?.substring(0, 50) || '',
      productImageExtraPreview: data.productImageExtra?.substring(0, 50) || '',
      rowLength: row.length,
      rowDataPreview: row.map((cell, idx) => ({
        index: idx,
        column: String.fromCharCode(65 + idx),
        length: typeof cell === 'string' ? cell.length : 0,
        preview: typeof cell === 'string' ? cell.substring(0, 30) : cell
      }))
    });

    // 시트 이름에 공백이나 특수문자가 있을 수 있으므로 URL 인코딩
    const encodedSheetName = encodeURIComponent(targetSheetName);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${targetSpreadsheetId}/values/${encodedSheetName}!A1:append?valueInputOption=USER_ENTERED`;
    
    console.log('📤 제품 저장 API 호출:', {
      url: url.replace(accessToken, 'TOKEN_HIDDEN'),
      spreadsheetId: targetSpreadsheetId,
      sheetName: targetSheetName,
      encodedSheetName
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify({
        values: [row]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || '';
      console.error('❌ Google Sheets API 오류:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      if (response.status === 403) {
        throw new Error(`403 오류: Google Sheets API 권한이 없습니다. 스프레드시트 공유 설정을 확인해주세요.`);
      } else if (response.status === 401) {
        throw new Error(`401 오류: 인증이 필요합니다. 다시 로그인해주세요.`);
      } else if (errorMessage.includes('parse') || errorMessage.includes('Range')) {
        throw new Error(`범위 파싱 오류: 시트 이름 "${targetSheetName}"을 확인해주세요.\n\n가능한 원인:\n1. 시트 이름이 정확한지 확인\n2. 시트가 존재하는지 확인\n3. 시트 이름에 특수문자가 있는지 확인\n\n에러 상세: ${errorMessage}`);
      } else {
        throw new Error(`제품 저장 실패: ${response.status} ${response.statusText} - ${errorMessage}`);
      }
    }

    const responseData = await response.json().catch(() => ({}));
    console.log('✅ 제품이 Google Sheets에 저장되었습니다.', {
      response: responseData,
      spreadsheetUpdates: responseData.updates || responseData.updatedCells || 'N/A'
    });
  } catch (error) {
    console.error('제품 저장 오류:', error);
    throw error;
  }
};

/**
 * 제품 데이터 읽기 (Google Sheets API 사용)
 */
export const readProductData = async (
  accessToken: string,
  spreadsheetId: string = process.env.REACT_APP_PRODUCTS_SPREADSHEET_ID || '1p8P_4ymeoSof5ExXClamxYwtvOtDK9Q1Sw4gSawu9uo',
  sheetName: string = 'productList'
): Promise<any[]> => {
  try {
    const encodedSheetName = encodeURIComponent(sheetName);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheetName}!A:Z`;
    
    console.log('📖 제품 데이터 읽기 API 호출:', {
      url: url.replace(accessToken, 'TOKEN_HIDDEN'),
      spreadsheetId,
      sheetName,
      encodedSheetName
    });
    
    const response = await fetch(url, {
      headers: getHeaders(accessToken)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || '';
      console.error('❌ Google Sheets API 읽기 오류:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      if (response.status === 403) {
        throw new Error(`403 오류: Google Sheets API 권한이 없습니다. Google Cloud Console에서 Sheets API를 활성화하고 OAuth 스코프를 확인해주세요.`);
      } else if (response.status === 401) {
        throw new Error(`401 오류: 인증이 필요합니다. 다시 로그인해주세요.`);
      } else {
        throw new Error(`제품 데이터 읽기 실패: ${response.status} ${response.statusText} - ${errorMessage}`);
      }
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length <= 1) {
      return []; // 헤더만 있거나 데이터가 없는 경우
    }

    // 헤더 확인 (첫 번째 행이 헤더인지 확인)
    // writeProductToSheet는 헤더 없이 데이터만 추가하므로, 실제 시트에는 헤더가 없을 가능성이 높음
    const firstRow = rows[0];
    // 첫 번째 셀이 product_로 시작하면 데이터 행 (헤더 아님)
    const firstCellIsProductId = firstRow && firstRow[0] && firstRow[0].toString().startsWith('product_');
    // 첫 번째 행에 헤더 키워드가 있고, product_로 시작하지 않으면 헤더로 간주
    const hasHeaderKeywords = firstRow && firstRow.some((cell: any) => 
      typeof cell === 'string' && (
        cell.toLowerCase().includes('id') ||
        cell.toLowerCase().includes('name') ||
        cell.toLowerCase().includes('category') ||
        cell.toLowerCase().includes('description')
      )
    );
    const isHeaderRow = hasHeaderKeywords && !firstCellIsProductId;
    
    console.log('📋 제품 데이터 첫 번째 행:', firstRow);
    console.log('📊 헤더 행 여부:', isHeaderRow);
    console.log('📊 첫 번째 셀:', firstRow?.[0], '→ product_로 시작?', firstCellIsProductId);
    
    // 헤더가 있는 경우 헤더를 기반으로 인덱스 찾기, 없으면 기본 인덱스 사용
    // writeProductToSheet의 컬럼 구조: 
    // 0: id (A), 1: productName (B), 2: category (C), 3: description (D), 
    // 4: specification (E), 5: productImage (F), 6: productImageExtra (G), 7: updatedAt (H)
    const getColumnIndex = (columnName: string, defaultIndex: number): number => {
      if (!isHeaderRow) {
        // 헤더가 없으면 기본 인덱스 사용 (writeProductToSheet 구조와 일치)
        return defaultIndex;
      }
      // 헤더가 있으면 헤더에서 찾기
      // productImageExtra는 여러 키워드로 검색 (extra, imageextra, productimageextra 등)
      const searchKeywords = columnName === 'productimageextra' 
        ? ['productimageextra', 'imageextra', 'extra', 'image extra', 'product image extra']
        : [columnName];
      
      for (const keyword of searchKeywords) {
        const index = firstRow.findIndex((h: string) => 
          h && typeof h === 'string' && h.toLowerCase().includes(keyword.toLowerCase())
        );
        if (index !== -1) {
          return index;
        }
      }
      return defaultIndex;
    };
    
    // 헤더 제거하고 데이터 파싱
    // 실제 컬럼 구조: 0: id (A), 1: productName (B), 2: category (C), 3: description (D), 
    // 4: specification (E), 5: productImage (F), 6: productImageExtra (G), 7: updatedAt (H)
    const dataRows = isHeaderRow ? rows.slice(1) : rows;
    
    return dataRows.map((row: any[], index: number) => {
      // 헤더 기반으로 인덱스 찾기 (헤더가 없거나 매칭되지 않으면 기본 인덱스 사용)
      // 실제 컬럼 구조와 일치해야 함:
      // 0: id (A), 1: productName (B), 2: category (C), 3: description (D), 
      // 4: specification (E), 5: productImage (F), 6: productImageExtra (G), 7: updatedAt (H)
      const idIndex = getColumnIndex('id', 0);
      const productNameIndex = getColumnIndex('productname', 1);
      const categoryIndex = getColumnIndex('category', 2);
      const descriptionIndex = getColumnIndex('description', 3);
      const specificationIndex = getColumnIndex('specification', 4);  // E (컬럼 4)
      const productImageIndex = getColumnIndex('productimage', 5);  // F (컬럼 5)
      const productImageExtraIndex = getColumnIndex('productimageextra', 6);  // G (컬럼 6)
      const updatedAtIndex = getColumnIndex('updatedat', 7);  // H (컬럼 7)
      
      // F 컬럼 (인덱스 5): productImage (첫 번째 부분, 최대 50,000자)
      // G 컬럼 (인덱스 6): productImageExtra (두 번째 부분, 50,000자 초과 시)
      const productImageRaw = row[productImageIndex];
      const productImageExtraRaw = row[productImageExtraIndex];
      
      const productImage = (productImageRaw && typeof productImageRaw === 'string') ? productImageRaw.trim() : '';
      const productImageExtra = (productImageExtraRaw && typeof productImageExtraRaw === 'string') ? productImageExtraRaw.trim() : '';
      
      // productImage와 productImageExtra를 합쳐서 완전한 base64 이미지 생성
      const fullProductImage = productImage + productImageExtra;
      
      // Base64 문자열이 유효한지 확인 (최소 길이 체크 및 Base64 패턴 확인)
      const isValidBase64 = fullProductImage.length > 0 && 
        /^[A-Za-z0-9+/=]+$/.test(fullProductImage.replace(/\s/g, ''));
      
      const productImageUrl = isValidBase64
        ? `data:image/jpeg;base64,${fullProductImage}`
        : '';
      
      console.log(`🖼️ 제품 ${index + 1} 이미지 파싱 상세:`, {
        rowIndex: index + 1,
        productImageIndex,
        productImageExtraIndex,
        productImageRaw: productImageRaw ? `${typeof productImageRaw} (${productImageRaw.toString().substring(0, 50)})` : 'null/undefined',
        productImageExtraRaw: productImageExtraRaw ? `${typeof productImageExtraRaw} (${productImageExtraRaw.toString().substring(0, 50)})` : 'null/undefined',
        productImageLength: productImage.length,
        productImageExtraLength: productImageExtra.length,
        fullProductImageLength: fullProductImage.length,
        isValidBase64,
        productImageUrl: productImageUrl ? `${productImageUrl.substring(0, 60)}...` : '빈 문자열',
        productImagePreview: productImage.substring(0, 30),
        productImageExtraPreview: productImageExtra.substring(0, 30)
      });
      
      console.log(`📊 제품 ${index + 1} 컬럼 인덱스 및 이미지 데이터:`, {
        id: idIndex,
        productName: productNameIndex,
        category: categoryIndex,
        description: descriptionIndex,
        specification: specificationIndex,  // E (컬럼 4)
        productImage: productImageIndex,  // F (컬럼 5)
        productImageExtra: productImageExtraIndex,  // G (컬럼 6)
        updatedAt: updatedAtIndex,
        원본행데이터: row.slice(0, 8),
        이미지데이터: {
          productImageLength: productImage.length,
          productImageExtraLength: productImageExtra.length,
          productImagePreview: productImage.substring(0, 50),
          productImageExtraPreview: productImageExtra.substring(0, 50),
          fullImageLength: fullProductImage.length,
          hasImage: !!fullProductImage
        }
      });
      
      const product = {
        id: row[idIndex] || `product_${index + 1}`,
        productName: row[productNameIndex] || '',
        category: row[categoryIndex] || '',
        description: row[descriptionIndex] || '',
        specification: row[specificationIndex] || '',
        productImage: productImage,
        productImageExtra: productImageExtra,
        productImageUrl: productImageUrl,
        updatedAt: row[updatedAtIndex] || '',
        rowIndex: isHeaderRow ? index + 2 : index + 1 // 헤더 포함 여부에 따라 조정
      };
      
      console.log(`📦 제품 ${index + 1} 파싱:`, {
        원본행: row.slice(0, 8),
        인덱스: {
          id: idIndex,
          productName: productNameIndex,
          category: categoryIndex,
          description: descriptionIndex,
          specification: specificationIndex,
          productImage: productImageIndex,
          productImageExtra: productImageExtraIndex
        },
        파싱결과: {
          id: product.id,
          productName: product.productName,
          category: product.category,
          descriptionLength: product.description.length,
          specificationLength: product.specification.length,
          imageLength: product.productImage.length,
          imageExtraLength: product.productImageExtra.length,
          totalImageLength: (product.productImage + product.productImageExtra).length
        }
      });
      
      return product;
    });
  } catch (error) {
    console.error('제품 데이터 읽기 오류:', error);
    throw error;
  }
};

/**
 * 제품 데이터 업데이트
 */
export const updateProductRow = async (
  accessToken: string,
  rowIndex: number, // 스프레드시트의 실제 행 번호 (헤더 포함, 1-based)
  data: {
    productName?: string;
    category?: string;
    description?: string;
    specification?: string;
    productImage?: string;
    productImageExtra?: string;
  },
  spreadsheetId: string = process.env.REACT_APP_PRODUCTS_SPREADSHEET_ID || '1p8P_4ymeoSof5ExXClamxYwtvOtDK9Q1Sw4gSawu9uo',
  sheetName: string = 'productList'
): Promise<void> => {
  try {
    // 시트 이름에 특수문자나 공백이 있으면 작은따옴표로 감싸야 함
    const sheetNameForRange = sheetName.includes(' ') || sheetName.includes('-') || sheetName.includes('.') 
      ? `'${sheetName}'` 
      : sheetName;
    
    // 특정 행의 특정 컬럼만 업데이트
    // 실제 컬럼 구조: 
    // 0: id (A), 1: productName (B), 2: category (C), 3: description (D), 
    // 4: specification (E), 5: productImage (F), 6: productImageExtra (G), 7: updatedAt (H)
    const updates: any[] = [];
    
    if (data.productName !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!B${rowIndex}`,  // 컬럼 1 (B)
        values: [[data.productName]]
      });
    }
    if (data.category !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!C${rowIndex}`,  // 컬럼 2 (C)
        values: [[data.category]]
      });
    }
    if (data.description !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!D${rowIndex}`,  // 컬럼 3 (D)
        values: [[data.description]]
      });
    }
    if (data.specification !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!E${rowIndex}`,  // 컬럼 4 (E) - specification
        values: [[data.specification]]
      });
    }
    if (data.productImage !== undefined) {
      console.log('📸 제품 이미지 업데이트:', {
        rowIndex,
        range: `${sheetNameForRange}!F${rowIndex}`,
        imageLength: data.productImage.length,
        imagePreview: data.productImage.substring(0, 50),
        hasExtra: !!data.productImageExtra,
        extraLength: data.productImageExtra?.length || 0
      });
      updates.push({
        range: `${sheetNameForRange}!F${rowIndex}`,  // 컬럼 5 (F) - productImage
        values: [[data.productImage]]
      });
    }
    if (data.productImageExtra !== undefined) {
      console.log('📸 제품 이미지 추가 부분 업데이트:', {
        rowIndex,
        range: `${sheetNameForRange}!G${rowIndex}`,
        extraLength: data.productImageExtra.length,
        extraPreview: data.productImageExtra.substring(0, 50)
      });
      updates.push({
        range: `${sheetNameForRange}!G${rowIndex}`,  // 컬럼 6 (G) - productImageExtra
        values: [[data.productImageExtra]]
      });
    }
    
    // updatedAt 업데이트
    updates.push({
      range: `${sheetNameForRange}!H${rowIndex}`,  // 컬럼 7 (H)
      values: [[new Date().toISOString()]]
    });
    
    console.log('🔧 업데이트할 컬럼 매핑:', {
      productName: 'B (컬럼 1)',
      category: 'C (컬럼 2)',
      description: 'D (컬럼 3)',
      specification: 'E (컬럼 4)',
      productImage: 'F (컬럼 5)',
      productImageExtra: 'G (컬럼 6)',
      updatedAt: 'H (컬럼 7)',
      rowIndex: rowIndex,
      updates: updates.map(u => u.range)
    });
    
    if (updates.length === 0) {
      console.warn('업데이트할 데이터가 없습니다.');
      return;
    }
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    
    console.log('📝 제품 데이터 업데이트 API 호출:', {
      url: url.replace(accessToken, 'TOKEN_HIDDEN'),
      spreadsheetId,
      sheetName,
      sheetNameForRange,
      rowIndex,
      updates: updates.map(u => ({
        range: u.range,
        value: u.values[0][0]?.substring(0, 50) + (u.values[0][0]?.length > 50 ? '...' : '')
      })),
      updatesCount: updates.length
    });
    
    const requestBody = {
      valueInputOption: 'USER_ENTERED',
      data: updates
    };
    
    console.log('📤 제품 업데이트 요청 본문:', {
      valueInputOption: requestBody.valueInputOption,
      dataCount: requestBody.data.length,
      ranges: requestBody.data.map((u: any) => u.range)
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('📥 제품 업데이트 응답:', {
      status: response.status,
      statusText: response.statusText,
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 200)
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { rawResponse: responseText };
      }
      const errorMessage = errorData.error?.message || errorData.rawResponse || '';
      console.error('❌ Google Sheets API 업데이트 오류:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        fullResponse: responseText
      });
      
      if (response.status === 403) {
        throw new Error(`403 오류: Google Sheets API 권한이 없습니다.`);
      } else if (response.status === 401) {
        throw new Error(`401 오류: 인증이 필요합니다. 토큰이 만료되었을 수 있습니다. 다시 로그인해주세요.`);
      } else {
        throw new Error(`제품 업데이트 실패: ${response.status} ${response.statusText} - ${errorMessage}`);
      }
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { rawResponse: responseText };
    }
    
    console.log('✅ 제품 데이터가 업데이트되었습니다.', {
      response: responseData,
      updatedRanges: responseData.updatedRanges || responseData.updatedCells || 'N/A'
    });
  } catch (error) {
    console.error('제품 업데이트 오류:', error);
    throw error;
  }
};

/**
 * 고객 지원 자료 데이터 인터페이스
 */
export interface SupportFormData {
  title: string;
  desc: string;
  fileUrl: string; // Google Drive 파일 ID 또는 URL
  category: string;
}

/**
 * Support 자료를 Google Sheets에 저장
 */
export const writeSupportToSheet = async (
  accessToken: string,
  data: SupportFormData,
  spreadsheetId: string = process.env.REACT_APP_SUPPORT_SPREADSHEET_ID || '1TnHBUzm-Pefue-B-WOS363wcblYZJY3WLnRY5DG4PIc',
  sheetName: string = 'data'
): Promise<void> => {
  try {
    // 데이터 행 생성
    // 컬럼 순서: id (A), title (B), desc (C), createdAt (D), fileUrl (E), category (F)
    const timestamp = new Date();
    const dateString = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}`;
    
    // ID 자동 생성 (타임스탬프 기반)
    const id = Date.now();
    
    const row = [
      id.toString(),
      data.title,
      data.desc,
      dateString,
      data.fileUrl,
      data.category
    ];

    const encodedSheetName = encodeURIComponent(sheetName);
    // A:append를 사용하여 마지막 행 다음에 추가 (헤더 행이 있어도 자동으로 마지막에 추가됨)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheetName}!A:append?valueInputOption=USER_ENTERED`;
    
    console.log('📤 Support 자료 저장 API 호출:', {
      url: url.replace(accessToken, 'TOKEN_HIDDEN'),
      spreadsheetId,
      sheetName,
      rowLength: row.length,
      range: 'A:append (마지막 행에 추가)'
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify({
        values: [row]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || '';
      console.error('❌ Google Sheets API 오류:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      if (response.status === 403) {
        throw new Error(`403 오류: Google Sheets API 권한이 없습니다.\n\n에러 상세: ${errorMessage}`);
      } else if (response.status === 401) {
        throw new Error(`401 오류: 인증이 필요합니다. 토큰이 만료되었을 수 있습니다. 다시 로그인해주세요.`);
      } else {
        throw new Error(`Support 자료 저장 실패: ${response.status} ${response.statusText} - ${errorMessage}`);
      }
    }

    console.log('✅ Support 자료가 Google Sheets에 저장되었습니다.');
  } catch (error) {
    console.error('Support 자료 저장 오류:', error);
    throw error;
  }
};

/**
 * Support 자료 데이터 읽기
 */
export const readSupportData = async (
  accessToken: string,
  spreadsheetId: string = process.env.REACT_APP_SUPPORT_SPREADSHEET_ID || '1TnHBUzm-Pefue-B-WOS363wcblYZJY3WLnRY5DG4PIc',
  sheetName?: string // 시트 이름을 옵션으로 변경
): Promise<any[]> => {
  try {
    // 시트 이름이 없으면 먼저 스프레드시트의 첫 번째 시트를 가져옴
    let targetSheetName = sheetName;
    
    if (!targetSheetName) {
      console.log('📋 시트 이름이 지정되지 않았습니다. 스프레드시트의 첫 번째 시트를 찾는 중...');
      
      // 스프레드시트 메타데이터 가져오기
      const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
      const metadataResponse = await fetch(metadataUrl, {
        headers: getHeaders(accessToken)
      });

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json().catch(() => ({}));
        console.error('❌ 스프레드시트 메타데이터 읽기 실패:', {
          status: metadataResponse.status,
          error: errorData
        });
        throw new Error(`스프레드시트 메타데이터 읽기 실패: ${metadataResponse.status} - ${errorData.error?.message || ''}`);
      }

      const metadata = await metadataResponse.json();
      const sheets = metadata.sheets || [];
      
      if (sheets.length === 0) {
        throw new Error('스프레드시트에 시트가 없습니다.');
      }

      // 첫 번째 시트의 이름 사용
      if (sheets[0] && sheets[0].properties && sheets[0].properties.title) {
        targetSheetName = sheets[0].properties.title;
        console.log(`✅ 시트 이름 찾음: "${targetSheetName}"`);
      } else {
        throw new Error('스프레드시트에서 시트 이름을 찾을 수 없습니다.');
      }
    }

    // targetSheetName이 여전히 undefined이면 에러 발생
    if (!targetSheetName) {
      throw new Error('시트 이름을 찾을 수 없습니다. sheetName 파라미터를 제공하거나 스프레드시트에 시트가 있는지 확인해주세요.');
    }

    const encodedSheetName = encodeURIComponent(targetSheetName);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheetName}!A:F`;
    
    console.log('📖 Support 자료 읽기 API 호출:', {
      spreadsheetId,
      sheetName: targetSheetName,
      encodedSheetName,
      url: url.replace(accessToken, 'TOKEN_HIDDEN')
    });
    
    const response = await fetch(url, {
      headers: getHeaders(accessToken)
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { rawResponse: responseText };
      }
      
      console.error('❌ Support 자료 읽기 API 오류:', {
        status: response.status,
        statusText: response.statusText,
        sheetName: targetSheetName,
        error: errorData
      });
      
      if (response.status === 403) {
        throw new Error(`403 오류: Google Sheets API 권한이 없습니다.`);
      } else if (response.status === 401) {
        throw new Error(`401 오류: 인증이 필요합니다. 다시 로그인해주세요.`);
      } else if (response.status === 400 && errorData.error?.message?.includes('Unable to parse range')) {
        throw new Error(`400 오류: 시트 "${targetSheetName}"를 찾을 수 없습니다. 스프레드시트에 해당 시트가 존재하는지 확인해주세요.`);
      } else {
        throw new Error(`Support 자료 읽기 실패: ${response.status} ${response.statusText} - ${errorData.error?.message || errorData.rawResponse || ''}`);
      }
    }

    const data = await response.json();
    const rows = data.values || [];

    console.log('📊 Support 자료 읽기 성공:', {
      sheetName: targetSheetName,
      totalRows: rows.length,
      firstRow: rows[0] || '없음'
    });

    // 첫 번째 행은 헤더(컬럼 코드)이므로 제외하고 두 번째 행부터 데이터로 사용
    const dataRows = rows.length > 1 ? rows.slice(1) : [];
    
    console.log('📋 첫 번째 행(헤더)을 제외했습니다. 데이터 행 수:', dataRows.length);

    if (dataRows.length === 0) {
      console.log('⚠️ Support 자료가 없습니다.');
      return [];
    }

    // 헤더 행인지 확인하는 함수
    const isHeaderRow = (row: any[]): boolean => {
      if (!row || row.length === 0) return false;
      const firstCell = String(row[0] || '').toLowerCase().trim();
      const secondCell = String(row[1] || '').toLowerCase().trim();
      // 헤더로 판단되는 키워드들
      const headerKeywords = ['번호', 'id', 'title', '제목', 'desc', '설명', 'category', '카테고리', 'createdat', '등록일', 'fileurl', '파일'];
      return headerKeywords.includes(firstCell) || headerKeywords.includes(secondCell);
    };

    const parsedData = dataRows
      .filter((row: any[]) => !isHeaderRow(row)) // 헤더 행 제외
      .map((row: any[], index: number) => {
        return {
          id: row[0] || index + 1,
          title: row[1] || '',
          desc: row[2] || '',
          createdAt: row[3] || '',
          fileUrl: row[4] || '',
          category: row[5] || '기타',
          rowIndex: index + 2 // 헤더 행(1행)을 제외하므로 index + 2
        };
      })
      .filter((item: any) => item.title && item.title.trim() !== ''); // 빈 행 및 빈 제목 필터링

    console.log(`✅ Support 자료 ${parsedData.length}개를 성공적으로 읽었습니다.`);
    
    return parsedData;
  } catch (error) {
    console.error('❌ Support 자료 읽기 오류:', error);
    console.error('오류 상세:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

/**
 * Support 자료 업데이트
 */
export const updateSupportRow = async (
  accessToken: string,
  rowIndex: number, // 스프레드시트의 실제 행 번호 (헤더 포함, 1-based)
  data: {
    title?: string;
    desc?: string;
    fileUrl?: string;
    category?: string;
  },
  spreadsheetId: string = process.env.REACT_APP_SUPPORT_SPREADSHEET_ID || '1TnHBUzm-Pefue-B-WOS363wcblYZJY3WLnRY5DG4PIc',
  sheetName: string = 'Sheet1'
): Promise<void> => {
  try {
    const sheetNameForRange = sheetName.includes(' ') || sheetName.includes('-') || sheetName.includes('.') 
      ? `'${sheetName}'` 
      : sheetName;
    
    // 컬럼 구조: 0: id (A), 1: title (B), 2: desc (C), 3: createdAt (D), 4: fileUrl (E), 5: category (F)
    const updates: any[] = [];
    
    if (data.title !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!B${rowIndex}`,
        values: [[data.title]]
      });
    }
    if (data.desc !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!C${rowIndex}`,
        values: [[data.desc]]
      });
    }
    if (data.fileUrl !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!E${rowIndex}`,
        values: [[data.fileUrl]]
      });
    }
    if (data.category !== undefined) {
      updates.push({
        range: `${sheetNameForRange}!F${rowIndex}`,
        values: [[data.category]]
      });
    }
    
    if (updates.length === 0) {
      console.warn('업데이트할 데이터가 없습니다.');
      return;
    }
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    
    const requestBody = {
      valueInputOption: 'USER_ENTERED',
      data: updates
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { rawResponse: responseText };
      }
      const errorMessage = errorData.error?.message || errorData.rawResponse || '';
      
      if (response.status === 403) {
        throw new Error(`403 오류: Google Sheets API 권한이 없습니다.`);
      } else if (response.status === 401) {
        throw new Error(`401 오류: 인증이 필요합니다. 토큰이 만료되었을 수 있습니다. 다시 로그인해주세요.`);
      } else {
        throw new Error(`Support 자료 업데이트 실패: ${response.status} ${response.statusText} - ${errorMessage}`);
      }
    }

    console.log('✅ Support 자료가 업데이트되었습니다.');
  } catch (error) {
    console.error('Support 자료 업데이트 오류:', error);
    throw error;
  }
};
