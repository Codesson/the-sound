// 매니저 SSO 인증 유틸리티

export interface ManagerUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  isAuthorized: boolean;
}

// 환경변수에서 매니저 이메일 목록 가져오기 (쉼표로 구분)
const getAuthorizedManagerEmails = (): string[] => {
  const envEmails = process.env.REACT_APP_MANAGER_EMAILS;
  if (!envEmails) {
    console.warn('⚠️ REACT_APP_MANAGER_EMAILS 환경변수가 설정되지 않았습니다.');
    return [];
  }
  return envEmails.split(',').map(email => email.trim()).filter(email => email.length > 0);
};

const AUTHORIZED_MANAGER_EMAILS = getAuthorizedManagerEmails();

/**
 * 구글 OAuth 토큰 검증
 */
export const verifyGoogleToken = async (accessToken: string): Promise<{
  isValid: boolean;
  user?: ManagerUser;
  error?: string;
}> => {
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
    const data = await response.json();
    
    if (response.ok) {
      const user: ManagerUser = {
        id: data.user_id,
        email: data.email,
        name: data.email?.split('@')[0] || 'Unknown User',
        isAuthorized: AUTHORIZED_MANAGER_EMAILS.length > 0 && AUTHORIZED_MANAGER_EMAILS.includes(data.email)
      };
      
      return {
        isValid: true,
        user
      };
    } else {
      return { 
        isValid: false, 
        error: data.error || 'Token verification failed' 
      };
    }
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * 구글 OAuth 클라이언트 초기화 및 토큰 요청
 */
export const initGoogleAuth = (onSuccess: (token: string, user: ManagerUser) => void, onError: (error: string) => void) => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  
  if (!clientId || clientId === 'your_google_client_id_here') {
    onError('Google Client ID가 설정되지 않았습니다.');
    return;
  }

  // Google Identity Services 스크립트가 로드되었는지 확인
  if (typeof window !== 'undefined' && (window as any).google) {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
      callback: async (response: any) => {
        if (response.access_token) {
          const verification = await verifyGoogleToken(response.access_token);
          if (verification.isValid && verification.user) {
            // 환경변수에 매니저 이메일이 설정되지 않은 경우 체크
            if (AUTHORIZED_MANAGER_EMAILS.length === 0) {
              console.error('❌ REACT_APP_MANAGER_EMAILS 환경변수가 설정되지 않았습니다.');
              onError('매니저 이메일이 환경변수에 설정되지 않았습니다. REACT_APP_MANAGER_EMAILS를 확인해주세요.');
              return;
            }
            
            if (verification.user.isAuthorized) {
              onSuccess(response.access_token, verification.user);
            } else {
              onError(`접근 권한이 없습니다. 허용된 매니저 계정이 아닙니다.\n\n허용된 계정: ${AUTHORIZED_MANAGER_EMAILS.join(', ')}\n로그인 시도 계정: ${verification.user.email}`);
            }
          } else {
            onError(verification.error || '토큰 검증에 실패했습니다.');
          }
        } else {
          onError('액세스 토큰을 받지 못했습니다.');
        }
      }
    });
    
    client.requestAccessToken();
  } else {
    onError('Google Identity Services가 로드되지 않았습니다.');
  }
};

/**
 * Google Identity Services 스크립트 동적 로드
 */
export const loadGoogleIdentityServices = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window object is not available'));
      return;
    }

    // 이미 로드되었는지 확인
    if ((window as any).google) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    
    document.head.appendChild(script);
  });
};

/**
 * 로컬 스토리지에서 매니저 정보 관리
 */
export const managerStorage = {
  set: (user: ManagerUser, token: string) => {
    localStorage.setItem('manager_user', JSON.stringify(user));
    localStorage.setItem('manager_token', token);
  },
  
  get: (): { user: ManagerUser | null; token: string | null } => {
    const userStr = localStorage.getItem('manager_user');
    const token = localStorage.getItem('manager_token');
    
    return {
      user: userStr ? JSON.parse(userStr) : null,
      token
    };
  },
  
  clear: () => {
    localStorage.removeItem('manager_user');
    localStorage.removeItem('manager_token');
  },
  
  isLoggedIn: (): boolean => {
    const { user, token } = managerStorage.get();
    return !!(user && token && user.isAuthorized);
  }
};
