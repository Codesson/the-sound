// Google Drive API 접근 유틸리티
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
}

export interface DriveAccessResult {
  success: boolean;
  message: string;
  files?: DriveFile[];
  error?: string;
}

// Google Drive API 스코프 확인
export const verifyGoogleDriveScopes = async (token: string): Promise<{
  hasDriveAccess: boolean;
  scopes: string[];
  message: string;
}> => {
  try {
    // 토큰에서 스코프 추출
    const payload = JSON.parse(atob(token.split('.')[1]));
    const scopes = payload.scope ? payload.scope.split(' ') : [];
    
    const driveScopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ];

    const hasDriveAccess = scopes.some(scope => 
      driveScopes.some(driveScope => scope.includes(driveScope))
    );

    return {
      hasDriveAccess,
      scopes,
      message: hasDriveAccess 
        ? 'Google Drive 접근 권한이 있습니다' 
        : 'Google Drive 접근 권한이 없습니다'
    };
  } catch (error) {
    return {
      hasDriveAccess: false,
      scopes: [],
      message: '토큰 파싱 중 오류가 발생했습니다'
    };
  }
};

// Google Drive 파일 목록 가져오기
export const getGoogleDriveFiles = async (token: string): Promise<DriveAccessResult> => {
  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          message: '인증이 필요합니다. 토큰이 유효하지 않습니다.',
          error: 'UNAUTHORIZED'
        };
      } else if (response.status === 403) {
        return {
          success: false,
          message: 'Google Drive 접근 권한이 없습니다.',
          error: 'FORBIDDEN'
        };
      } else {
        return {
          success: false,
          message: `Google Drive API 오류: ${response.status}`,
          error: 'API_ERROR'
        };
      }
    }

    const data = await response.json();
    const files: DriveFile[] = data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink
    }));

    return {
      success: true,
      message: `${files.length}개의 파일을 찾았습니다`,
      files
    };
  } catch (error) {
    return {
      success: false,
      message: `네트워크 오류: ${error}`,
      error: 'NETWORK_ERROR'
    };
  }
};

// Google Drive 파일 업로드
export const uploadToGoogleDrive = async (
  token: string,
  file: File,
  folderId?: string
): Promise<DriveAccessResult> => {
  try {
    // 메타데이터 생성
    const metadata = {
      name: file.name,
      parents: folderId ? [folderId] : undefined
    };

    // 멀티파트 업로드
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      return {
        success: false,
        message: `파일 업로드 실패: ${response.status}`,
        error: 'UPLOAD_FAILED'
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: `파일이 성공적으로 업로드되었습니다: ${result.name}`,
      files: [{
        id: result.id,
        name: result.name,
        mimeType: result.mimeType,
        createdTime: result.createdTime,
        modifiedTime: result.modifiedTime,
        webViewLink: result.webViewLink
      }]
    };
  } catch (error) {
    return {
      success: false,
      message: `업로드 중 오류 발생: ${error}`,
      error: 'UPLOAD_ERROR'
    };
  }
};

// Google Drive 파일 삭제
export const deleteGoogleDriveFile = async (token: string, fileId: string): Promise<DriveAccessResult> => {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return {
        success: false,
        message: `파일 삭제 실패: ${response.status}`,
        error: 'DELETE_FAILED'
      };
    }

    return {
      success: true,
      message: '파일이 성공적으로 삭제되었습니다'
    };
  } catch (error) {
    return {
      success: false,
      message: `삭제 중 오류 발생: ${error}`,
      error: 'DELETE_ERROR'
    };
  }
};

// Google Drive 폴더 생성
export const createGoogleDriveFolder = async (
  token: string,
  folderName: string,
  parentFolderId?: string
): Promise<DriveAccessResult> => {
  try {
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined
    };

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    if (!response.ok) {
      return {
        success: false,
        message: `폴더 생성 실패: ${response.status}`,
        error: 'CREATE_FOLDER_FAILED'
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: `폴더가 성공적으로 생성되었습니다: ${result.name}`,
      files: [{
        id: result.id,
        name: result.name,
        mimeType: result.mimeType,
        createdTime: result.createdTime,
        modifiedTime: result.modifiedTime
      }]
    };
  } catch (error) {
    return {
      success: false,
      message: `폴더 생성 중 오류 발생: ${error}`,
      error: 'CREATE_FOLDER_ERROR'
    };
  }
};

// Google Drive 접근 테스트
export const testGoogleDriveAccess = async (token: string): Promise<DriveAccessResult> => {
  try {
    // 1. 스코프 확인
    const scopeInfo = await verifyGoogleDriveScopes(token);
    if (!scopeInfo.hasDriveAccess) {
      return {
        success: false,
        message: 'Google Drive 접근 권한이 없습니다',
        error: 'NO_DRIVE_SCOPE'
      };
    }

    // 2. 파일 목록 가져오기 테스트
    const filesResult = await getGoogleDriveFiles(token);
    if (!filesResult.success) {
      return filesResult;
    }

    return {
      success: true,
      message: 'Google Drive 접근이 정상적으로 작동합니다',
      files: filesResult.files
    };
  } catch (error) {
    return {
      success: false,
      message: `Google Drive 접근 테스트 실패: ${error}`,
      error: 'TEST_FAILED'
    };
  }
};

// Google Sheets 접근 (CSV 다운로드)
export const downloadGoogleSheetAsCSV = async (
  sheetId: string,
  gid: string = '0'
): Promise<string> => {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download sheet: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    throw new Error(`Google Sheets 다운로드 실패: ${error}`);
  }
};