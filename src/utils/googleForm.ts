// Google Forms submission utility for product data

export interface NewProductForm {
  productName: string;
  category: string;
  description: string;
  specification: string;
  productImage: string;
  productImageExtra: string;
}

// Google Form ID
const GOOGLE_FORM_ID = '1FAIpQLSdn9mujZU3_4E93iVicGVDLBoyi1DFDD8gXKdS9NZPLlAkk5A';

// 실제 Google Form entry ID 매핑
const FIELD_MAP: Record<keyof NewProductForm, string> = {
    productName: 'entry.1512803299',
    category: 'entry.4143435',
    description: 'entry.46237049',
    specification: 'entry.514979068',
    productImage: 'entry.885682834',
    productImageExtra: 'entry.1485386310',
};

export const submitProductToGoogleForm = async (data: NewProductForm): Promise<{ ok: boolean; status: number; message: string }> => {
  try {
    const formUrl = `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`;
    
    const formData = new URLSearchParams();
    
    // 필수 필드 확인
    if (!data.productName || !data.category) {
      throw new Error('제품명과 카테고리는 필수 입력 항목입니다.');
    }
    
    // Base64 이미지 데이터 처리 및 분할
    let imageData = data.productImage;
    let imageDataExtra = data.productImageExtra || '';
    
    if (imageData && imageData.startsWith('data:image')) {
      // Base64가 5000자 초과 시 분할
      if (imageData.length > 5000) {
        console.log(`📊 이미지 크기: ${imageData.length}자 - 분할 저장 필요`);
        
        // 첫 번째 부분: 5000자
        const firstPart = imageData.substring(0, 5000);
        // 나머지 부분: 5000자 이후
        const remainingPart = imageData.substring(5000);
        
        imageData = firstPart;
        imageDataExtra = remainingPart;
        
        console.log(`✂️ 이미지 분할 완료:
          - 첫 번째 부분: ${imageData.length}자
          - 추가 부분: ${imageDataExtra.length}자
          - 총 ${Math.ceil(imageData.length / 5000) + Math.ceil(imageDataExtra.length / 5000)}개 필드 사용`);
      }
    }
    
    // 각 필드를 Google Form entry ID에 매핑
    Object.entries(data).forEach(([key, value]) => {
      const entryId = FIELD_MAP[key as keyof NewProductForm];
      if (entryId) {
        let finalValue = String(value || '');
        
        // 이미지 필드는 분할된 데이터 사용
        if (key === 'productImage') {
          finalValue = imageData;
        } else if (key === 'productImageExtra') {
          finalValue = imageDataExtra;
        }
        
        // 빈 값이 아닌 경우에만 추가
        if (finalValue.trim() !== '') {
          formData.append(entryId, finalValue);
        }
      }
    });

    console.log('제출할 데이터:', {
      formUrl,
      formData: Object.fromEntries(formData.entries()),
      entryCount: formData.toString().split('&').length,
      imageDataLength: imageData.length
    });

    // Google Forms 제출을 위한 iframe 방식 사용
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = 'hidden_iframe';
    document.body.appendChild(iframe);

    // Form 생성 및 제출
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = formUrl;
    form.target = 'hidden_iframe';
    form.style.display = 'none';

    // FormData를 form input으로 변환
    formData.forEach((value, key) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();

    // iframe과 form 정리 (5초 후)
    setTimeout(() => {
      document.body.removeChild(form);
      document.body.removeChild(iframe);
    }, 5000);

    return { 
      ok: true, 
      status: 200, 
      message: 'Google Form에 성공적으로 제출되었습니다. Google Form을 확인해주세요.' 
    };
    
  } catch (error) {
    console.error('Google Form 제출 오류:', error);
    return { 
      ok: false, 
      status: 0, 
      message: error instanceof Error ? error.message : '제출 중 오류가 발생했습니다.' 
    };
  }
};

// 테스트용 함수
export const testGoogleFormSubmission = async () => {
  const testData: NewProductForm = {
    productName: 'TEST_MODEL',
    category: '테스트 제품',
    description: '테스트 설명입니다.',
    specification: '',
    productImage: '',
    productImageExtra: '',
  };

  try {
    const result = await submitProductToGoogleForm(testData);
    console.log('테스트 제출 결과:', result);
    return result;
  } catch (error) {
    console.error('테스트 제출 실패:', error);
    throw error;
  }
};

// Entry ID 검증 함수
export const validateEntryIds = () => {
  console.log('Google Form Entry ID 매핑:');
  Object.entries(FIELD_MAP).forEach(([field, entryId]) => {
    console.log(`${field}: ${entryId}`);
  });
  
  console.log('\nGoogle Form URL:', `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/viewform`);
  console.log('제출 URL:', `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`);
};
