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
  // #region agent log
  const isDevelopment = process.env.NODE_ENV === 'development';
  const debugInfo = {
    hasProcessEnv: typeof process !== 'undefined',
    hasProcessEnvEnv: typeof process !== 'undefined' && typeof process.env !== 'undefined',
    allEnvKeys: typeof process !== 'undefined' && typeof process.env !== 'undefined' 
      ? Object.keys(process.env).filter(k => k.includes('REACT_APP')).join(',') 
      : 'N/A'
  };
  console.log('🔍 [DEBUG] initGoogleAuth 진입:', debugInfo);
  if (isDevelopment) {
    fetch('http://127.0.0.1:7242/ingest/91dbcc5f-5d5b-410a-96a2-98889f20ae4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'managerAuth.ts:64',message:'initGoogleAuth 함수 진입',data:debugInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  // #region agent log
  const clientIdDebug = {
    clientId: clientId ? `${clientId.substring(0, 10)}...` : clientId,
    clientIdType: typeof clientId,
    clientIdLength: clientId ? clientId.length : 0,
    isUndefined: clientId === undefined,
    isNull: clientId === null,
    isEmpty: clientId === '',
    isPlaceholder: clientId === 'your_google_client_id_here',
    firstChars: clientId ? clientId.substring(0, 20) : 'N/A'
  };
  console.error('🔍 [DEBUG] 환경변수 상태:', clientIdDebug);
  console.error('🔍 [DEBUG] REACT_APP_GOOGLE_CLIENT_ID 값:', clientId || '❌ undefined/null/empty');
  if (isDevelopment) {
    fetch('http://127.0.0.1:7242/ingest/91dbcc5f-5d5b-410a-96a2-98889f20ae4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'managerAuth.ts:68',message:'환경변수 읽기 후 값 확인',data:clientIdDebug,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion
  
  if (!clientId || clientId === 'your_google_client_id_here') {
    // #region agent log
    const errorReason = !clientId ? 'undefined/null/empty' : clientId === 'your_google_client_id_here' ? 'placeholder' : 'unknown';
    console.error('❌ [DEBUG] 클라이언트 ID 검증 실패:', { clientId, reason: errorReason });
    if (isDevelopment) {
      fetch('http://127.0.0.1:7242/ingest/91dbcc5f-5d5b-410a-96a2-98889f20ae4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'managerAuth.ts:73',message:'클라이언트 ID 검증 실패 - 에러 발생',data:{clientId:clientId,reason:errorReason},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    }
    // #endregion
    onError('Google Client ID가 설정되지 않았습니다.');
    return;
  }

  // #region agent log
  const googleServicesDebug = {
    hasWindow: typeof window !== 'undefined',
    hasGoogle: typeof window !== 'undefined' && !!(window as any).google,
    hasAccounts: typeof window !== 'undefined' && !!(window as any).google?.accounts,
    hasOAuth2: typeof window !== 'undefined' && !!(window as any).google?.accounts?.oauth2
  };
  console.log('🔍 [DEBUG] Google Identity Services 상태:', googleServicesDebug);
  if (isDevelopment) {
    fetch('http://127.0.0.1:7242/ingest/91dbcc5f-5d5b-410a-96a2-98889f20ae4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'managerAuth.ts:85',message:'Google Identity Services 확인',data:googleServicesDebug,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  // Google Identity Services 스크립트가 로드되었는지 확인
  if (typeof window !== 'undefined' && (window as any).google) {
    // #region agent log
    console.log('✅ [DEBUG] OAuth 클라이언트 초기화 시작, Client ID 길이:', clientId.length);
    if (isDevelopment) {
      fetch('http://127.0.0.1:7242/ingest/91dbcc5f-5d5b-410a-96a2-98889f20ae4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'managerAuth.ts:89',message:'OAuth 클라이언트 초기화 시작',data:{clientIdLength:clientId.length,clientIdPrefix:clientId.substring(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    }
    // #endregion
    // #region agent log
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'N/A';
    const currentHref = typeof window !== 'undefined' ? window.location.href : 'N/A';
    console.log('🔍 [DEBUG] 현재 페이지 정보:', { origin: currentOrigin, href: currentHref });
    if (isDevelopment) {
      fetch('http://127.0.0.1:7242/ingest/91dbcc5f-5d5b-410a-96a2-98889f20ae4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'managerAuth.ts:119',message:'OAuth 클라이언트 초기화 전 현재 페이지 정보',data:{origin:currentOrigin,href:currentHref},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion
    // #region agent log
    console.log('🔍 [DEBUG] OAuth 클라이언트 초기화 상세 정보:', {
      clientId: clientId ? `${clientId.substring(0, 30)}...` : 'N/A',
      clientIdLength: clientId?.length || 0,
      origin: currentOrigin,
      href: currentHref,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
    });
    // #endregion
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
      callback: async (response: any) => {
        // #region agent log
        if (response.error) {
          console.error('❌ [DEBUG] OAuth 에러 응답:', response);
          if (isDevelopment) {
            fetch('http://127.0.0.1:7242/ingest/91dbcc5f-5d5b-410a-96a2-98889f20ae4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'managerAuth.ts:122',message:'OAuth 에러 응답',data:{error:response.error,errorDescription:response.error_description,errorUri:response.error_uri},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          }
        }
        // #endregion
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
          // #region agent log
          const errorDetails = response.error ? {
            error: response.error,
            error_description: response.error_description,
            error_uri: response.error_uri
          } : { message: '액세스 토큰이 없습니다' };
          console.error('❌ [DEBUG] 액세스 토큰 수신 실패:', errorDetails);
          if (isDevelopment) {
            fetch('http://127.0.0.1:7242/ingest/91dbcc5f-5d5b-410a-96a2-98889f20ae4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'managerAuth.ts:142',message:'액세스 토큰 수신 실패',data:errorDetails,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          }
          // #endregion
          let errorMessage = '액세스 토큰을 받지 못했습니다.';
          if (response.error === 'redirect_uri_mismatch') {
            const errorDetails = response.error_description || '알 수 없는 오류';
            const fullClientId = clientId || 'N/A';
            const clientIdPreview = fullClientId !== 'N/A' ? `${fullClientId.substring(0, 30)}...` : 'N/A';
            
            errorMessage = `❌ Google OAuth 리디렉션 URI 불일치 오류\n\n` +
              `현재 도메인: ${currentOrigin}\n` +
              `클라이언트 ID: ${clientIdPreview}\n` +
              `에러 상세: ${errorDetails}\n\n` +
              `🔧 해결 방법:\n` +
              `1. Google Cloud Console 접속: https://console.cloud.google.com/\n` +
              `2. API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID\n` +
              `3. 클라이언트 ID "${clientIdPreview}" 선택 (환경변수와 일치하는지 확인)\n` +
              `4. "승인된 JavaScript 원본" 섹션 확인\n` +
              `5. 다음을 정확히 추가 (경로 제외, 각각 별도 줄):\n` +
              `   ✅ ${currentOrigin}\n` +
              `   ✅ http://localhost:4000 (개발용)\n\n` +
              `⚠️ 중요 체크리스트:\n` +
              `   □ 경로를 포함하지 않았는지 확인 (${currentOrigin}/the-sound ❌)\n` +
              `   □ 프로토콜을 포함했는지 확인 (https:// 필수)\n` +
              `   □ 저장 후 2-5분 대기했는지 확인\n` +
              `   □ 브라우저 캐시를 삭제했는지 확인\n` +
              `   □ 올바른 클라이언트 ID를 선택했는지 확인\n\n` +
              `현재 페이지: ${currentHref}`;
            console.error('🔍 [DEBUG] redirect_uri_mismatch 상세 정보:', {
              currentOrigin,
              currentHref,
              errorDescription: response.error_description,
              errorUri: response.error_uri,
              clientId: clientIdPreview,
              clientIdFull: fullClientId,
              allOrigins: typeof window !== 'undefined' ? [window.location.origin, window.location.hostname, window.location.host].join(', ') : 'N/A'
            });
          } else if (response.error) {
            errorMessage = `OAuth 오류: ${response.error}\n${response.error_description || ''}`;
          }
          onError(errorMessage);
        }
      }
    });
    
    // #region agent log
    console.log('✅ [DEBUG] 액세스 토큰 요청 전송');
    if (isDevelopment) {
      fetch('http://127.0.0.1:7242/ingest/91dbcc5f-5d5b-410a-96a2-98889f20ae4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'managerAuth.ts:120',message:'액세스 토큰 요청 전송',data:{hasClient:!!client},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    }
    // #endregion
    client.requestAccessToken();
  } else {
    // #region agent log
    const errorDebug = {
      hasWindow: typeof window !== 'undefined',
      hasGoogle: typeof window !== 'undefined' && !!(window as any).google
    };
    console.error('❌ [DEBUG] Google Identity Services 로드 실패:', errorDebug);
    if (isDevelopment) {
      fetch('http://127.0.0.1:7242/ingest/91dbcc5f-5d5b-410a-96a2-98889f20ae4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'managerAuth.ts:125',message:'Google Identity Services 로드 실패',data:errorDebug,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    }
    // #endregion
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
