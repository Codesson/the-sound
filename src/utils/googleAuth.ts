// Google OAuth 인증 유틸리티
export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// Google Identity Services 로드
export const loadGoogleIdentityServices = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve();
      } else {
        reject(new Error('Google Identity Services failed to load'));
      }
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services script'));
    };
    
    document.head.appendChild(script);
  });
};

// Google OAuth 초기화
export const initGoogleAuth = (
  onSuccess: (token: string, userInfo: GoogleUserInfo) => void,
  onError: (error: string) => void
) => {
  if (!window.google?.accounts?.id) {
    onError('Google Identity Services not loaded');
    return;
  }

  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  if (!clientId) {
    onError('Google Client ID not configured');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: any) => {
      try {
        // JWT 토큰 디코딩 (간단한 방법)
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        
        const userInfo: GoogleUserInfo = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture
        };

        onSuccess(response.credential, userInfo);
      } catch (error) {
        onError('Failed to parse Google response');
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true
  });

  // 로그인 버튼 렌더링
  window.google.accounts.id.renderButton(
    document.getElementById('google-signin-button'),
    {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'signin_with',
      shape: 'rectangular'
    }
  );
};

// Google 로그아웃
export const signOutGoogle = () => {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect();
  }
};

// 토큰 검증
export const verifyGoogleToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
    return response.ok;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
};

// 사용자 정보 가져오기
export const getGoogleUserInfo = async (token: string): Promise<GoogleUserInfo | null> => {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await response.json();
    return {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    };
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
};

// 스코프 확인
export const checkGoogleScopes = (token: string): string[] => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.scope ? payload.scope.split(' ') : [];
  } catch (error) {
    console.error('Failed to check scopes:', error);
    return [];
  }
};

// Google Drive 스코프 확인
export const hasGoogleDriveScope = (token: string): boolean => {
  const scopes = checkGoogleScopes(token);
  return scopes.some(scope => 
    scope.includes('drive') || 
    scope.includes('https://www.googleapis.com/auth/drive')
  );
};

// 토큰 새로고침 (필요시)
// ⚠️ 주의: 이 함수는 서버 사이드에서만 사용해야 합니다.
// Client Secret을 클라이언트에 노출하면 안 되므로, 
// 토큰 새로고침이 필요한 경우 백엔드 API를 통해 처리해야 합니다.
export const refreshGoogleToken = async (refreshToken: string): Promise<string | null> => {
  console.warn('⚠️ refreshGoogleToken은 클라이언트에서 사용할 수 없습니다. 백엔드 API를 통해 처리하세요.');
  
  // 클라이언트에서는 사용자에게 재로그인을 요청하는 것이 더 안전합니다.
  return null;
  
  /* 서버 사이드 구현 예시:
  try {
    const response = await fetch('/api/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
  */
};

// 전역 타입 선언
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement | null, config: any) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}