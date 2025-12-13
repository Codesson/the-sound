// Google Drive에 이미지 업로드하고 공개 링크 반환

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink: string;
}

/**
 * Google Drive에 이미지 업로드
 * @param file - 업로드할 파일
 * @param accessToken - Google OAuth 액세스 토큰
 * @param folderName - Drive 폴더 이름 (선택)
 */
export const uploadToGoogleDrive = async (
  file: File,
  accessToken: string,
  folderName: string = '시공사례_이미지'
): Promise<DriveUploadResult> => {
  try {
    // 1. 폴더 찾기 또는 생성
    const folderId = await findOrCreateFolder(folderName, accessToken);
    
    // 2. 파일 메타데이터 준비
    const metadata = {
      name: `${Date.now()}_${file.name}`,
      parents: [folderId],
      mimeType: file.type
    };
    
    // 3. Multipart 업로드 준비
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    
    // 4. Google Drive API로 업로드
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink,thumbnailLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: form
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Drive 업로드 실패: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      console.error('❌ Google Drive 업로드 오류 상세:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    
    console.log('📤 Google Drive API 응답:', result);
    
    if (!result || !result.id) {
      throw new Error('Google Drive API에서 파일 ID를 받지 못했습니다.');
    }
    
    // 5. 파일을 공개로 설정
    await makeFilePublic(result.id, accessToken);
    
    // DriveUploadResult 인터페이스에 맞게 변환
    const uploadResult: DriveUploadResult = {
      fileId: result.id,
      webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
      webContentLink: result.webContentLink || '',
      thumbnailLink: result.thumbnailLink || ''
    };
    
    console.log('✅ Google Drive 업로드 성공:', uploadResult);
    
    return uploadResult;
    
  } catch (error) {
    console.error('❌ Google Drive 업로드 오류:', error);
    throw error;
  }
};

/**
 * 폴더 찾기 또는 생성 (중첩된 폴더 구조 지원)
 */
const findOrCreateFolder = async (
  folderPath: string,
  accessToken: string
): Promise<string> => {
  try {
    // 폴더 경로를 슬래시로 분리
    const folderNames = folderPath.split('/').filter(name => name.trim() !== '');
    
    if (folderNames.length === 0) {
      throw new Error('폴더 경로가 올바르지 않습니다.');
    }
    
    let currentParentId = 'root'; // 루트 폴더에서 시작
    
    // 각 폴더를 순차적으로 찾거나 생성
    for (const folderName of folderNames) {
      // 현재 부모 폴더 내에서 폴더 검색
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${currentParentId}' in parents`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      const searchResult = await searchResponse.json();
      
      // 폴더가 있으면 ID 사용
      if (searchResult.files && searchResult.files.length > 0) {
        currentParentId = searchResult.files[0].id;
        console.log(`✅ 폴더 찾음: "${folderName}" (ID: ${currentParentId})`);
      } else {
        // 폴더가 없으면 생성
        const createResponse = await fetch(
          'https://www.googleapis.com/drive/v3/files',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: folderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [currentParentId]
            })
          }
        );
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          throw new Error(`폴더 생성 실패: ${folderName} - ${errorData.error?.message || createResponse.statusText}`);
        }
        
        const createResult = await createResponse.json();
        currentParentId = createResult.id;
        console.log(`✅ 폴더 생성됨: "${folderName}" (ID: ${currentParentId})`);
      }
    }
    
    return currentParentId; // 마지막 폴더의 ID 반환
    
  } catch (error) {
    console.error('폴더 찾기/생성 오류:', error);
    throw error;
  }
};

/**
 * 파일을 공개로 설정
 */
const makeFilePublic = async (
  fileId: string,
  accessToken: string
): Promise<void> => {
  try {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      }
    );
  } catch (error) {
    console.warn('파일 공개 설정 오류:', error);
  }
};

/**
 * 직접 이미지 URL 생성
 */
export const getDirectImageUrl = (fileId: string): string => {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

/**
 * Google Drive 파일 URL에서 파일 ID만 추출
 */
export const extractFileId = (fileUrl: string): string => {
  if (!fileUrl) return '';
  
  // 이미 전체 URL인 경우 파일 ID 추출
  if (fileUrl.includes('drive.google.com/file/d/')) {
    const match = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // 이미 파일 ID만 있는 경우 그대로 반환
  return fileUrl;
};

/**
 * Google Drive 파일 다운로드 URL 생성
 */
export const getFileDownloadUrl = (fileUrl: string): string => {
  const fileId = extractFileId(fileUrl);
  if (!fileId) return '';
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

/**
 * Google Drive 파일 보기 URL 생성
 */
export const getFileViewUrl = (fileUrl: string): string => {
  const fileId = extractFileId(fileUrl);
  if (!fileId) return '';
  return `https://drive.google.com/file/d/${fileId}/view`;
};

