// 이미지 압축 및 최적화 유틸리티

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 ~ 1.0
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * 이미지 파일을 압축하고 base64로 변환
 */
export const compressImageToBase64 = async (
  file: File,
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.7,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Canvas 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context를 생성할 수 없습니다.'));
          return;
        }

        // 비율 유지하며 크기 조정
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // Base64로 변환
        const base64 = canvas.toDataURL(format, quality);
        
        console.log('이미지 압축 완료:', {
          원본크기: `${img.width}x${img.height}`,
          압축크기: `${width}x${height}`,
          원본용량: `${Math.round(file.size / 1024)}KB`,
          압축용량: `${Math.round(base64.length * 0.75 / 1024)}KB`,
          압축률: `${Math.round((1 - (base64.length * 0.75) / file.size) * 100)}%`
        });

        resolve(base64);
      };

      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Base64 문자열의 실제 바이트 크기 계산
 */
export const getBase64Size = (base64: string): number => {
  // data:image/jpeg;base64, 부분 제거
  const base64Data = base64.split(',')[1] || base64;
  
  // Base64는 3바이트를 4문자로 인코딩
  // 패딩(=)을 고려한 실제 크기 계산
  const padding = (base64Data.match(/=/g) || []).length;
  return (base64Data.length * 3) / 4 - padding;
};

/**
 * Base64 문자열을 더 작은 크기로 재압축
 */
export const recompressBase64 = async (
  base64: string,
  targetSizeKB: number = 50
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context를 생성할 수 없습니다.'));
        return;
      }

      let quality = 0.9;
      let width = img.width;
      let height = img.height;
      let result = base64;

      // 목표 크기에 도달할 때까지 반복 압축
      const compress = () => {
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        result = canvas.toDataURL('image/jpeg', quality);
        const currentSize = getBase64Size(result) / 1024;

        console.log(`압축 시도: 품질=${quality.toFixed(2)}, 크기=${width}x${height}, 용량=${currentSize.toFixed(1)}KB`);

        if (currentSize > targetSizeKB && (quality > 0.1 || width > 100)) {
          if (quality > 0.3) {
            // 품질 낮추기
            quality -= 0.1;
          } else {
            // 크기 줄이기
            width = Math.floor(width * 0.9);
            height = Math.floor(height * 0.9);
            quality = 0.7; // 품질 리셋
          }
          compress();
        } else {
          console.log(`최종 압축 완료: ${currentSize.toFixed(1)}KB`);
          resolve(result);
        }
      };

      compress();
    };

    img.onerror = () => {
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };

    img.src = base64;
  });
};

/**
 * 썸네일 생성 (매우 작은 크기)
 */
export const createThumbnail = async (
  file: File,
  size: number = 200
): Promise<string> => {
  return compressImageToBase64(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.6,
    format: 'image/jpeg'
  });
};

/**
 * 이미지 최적화 (Google Forms용)
 * 전략: 16000자까지 허용, 8000자 이상이면 mainImage와 mainImageExtra로 분할
 */
export const optimizeForGoogleForms = async (file: File): Promise<{
  base64: string;
  size: number;
  canSubmit: boolean;
}> => {
  try {
    // 파일 크기 정보 출력
    const fileSizeKB = file.size / 1024;
    const estimatedBase64Chars = Math.round(file.size * 1.37);
    
    console.log(`📊 파일 정보:`, {
      원본크기: `${fileSizeKB.toFixed(1)}KB`,
      예상Base64: `${estimatedBase64Chars}자`,
      허용범위: '최대 16000자 (8000자씩 2개 필드)'
    });

    // 원본 이미지를 Base64로 인코딩 (압축 없이)
    const reader = new FileReader();
    const originalBase64 = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(file);
    });

    const size = originalBase64.length;
    console.log(`✅ Base64 인코딩 완료: ${size}자`);

    // 16000자 초과 시 제출 불가
    if (size > 16000) {
      console.log(`❌ 크기 초과: ${size}자 > 16000자 (최대 허용 크기)`);
      return { base64: originalBase64, size, canSubmit: false };
    }

    // 8000자까지는 단일 필드, 초과 시에만 분할
    if (size > 8000) {
      console.log(`📋 분할 저장: ${size}자 → mainImage(8000자) + mainImageExtra(${size - 8000}자)`);
    } else {
      console.log(`📋 단일 저장: ${size}자 → mainImage(${size}자)`);
    }

    const canSubmit = true;

    console.log('Google Forms 최적화 결과:', {
      최종크기: `${size}자`,
      바이트크기: `${Math.round(getBase64Size(originalBase64) / 1024)}KB`,
      분할여부: size > 8000 ? '✅ (mainImage + mainImageExtra)' : '❌ (mainImage만)',
      제출가능: canSubmit ? '✅' : '❌'
    });

    return { base64: originalBase64, size, canSubmit };
    
  } catch (error) {
    console.error('이미지 최적화 오류:', error);
    throw error;
  }
};
