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
      throw new Error(`Drive 업로드 실패: ${response.status}`);
    }
    
    const result = await response.json();
    
    // 5. 파일을 공개로 설정
    await makeFilePublic(result.id, accessToken);
    
    console.log('✅ Google Drive 업로드 성공:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Google Drive 업로드 오류:', error);
    throw error;
  }
};

/**
 * 폴더 찾기 또는 생성
 */
const findOrCreateFolder = async (
  folderName: string,
  accessToken: string
): Promise<string> => {
  try {
    // 폴더 검색
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const searchResult = await searchResponse.json();
    
    // 폴더가 있으면 반환
    if (searchResult.files && searchResult.files.length > 0) {
      return searchResult.files[0].id;
    }
    
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
          mimeType: 'application/vnd.google-apps.folder'
        })
      }
    );
    
    const createResult = await createResponse.json();
    return createResult.id;
    
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

