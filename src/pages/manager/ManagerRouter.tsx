import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, Outlet } from "react-router-dom";
import { loadGoogleIdentityServices, initGoogleAuth, ManagerUser, managerStorage } from "../../utils/managerAuth";
import Menu from "./Menu";
import Portfolio from "../../components/manager/Portfolio";
import Products from "../../components/manager/Products";
import Support from "../../components/manager/Support";

export default function ManagerRouter() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [managerUser, setManagerUser] = useState<ManagerUser | null>(null);
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
    const navigate = useNavigate();

    // 구글 SSO 로그인 핸들러
    const handleGoogleLogin = () => {
        initGoogleAuth(
            (token: string, user: ManagerUser) => {
                setManagerUser(user);
                setIsLoggedIn(true);
                managerStorage.set(user, token);
                console.log('매니저 로그인 성공:', user);
                navigate('/manager');
            },
            (error: string) => {
                console.error('매니저 로그인 에러:', error);
                alert(`로그인 실패: ${error}`);
            }
        );
    };

    // 로그아웃 핸들러
    const handleLogout = () => {
        setIsLoggedIn(false);
        setManagerUser(null);
        managerStorage.clear();
        navigate('/manager');
    };

    useEffect(() => {
        // Google Identity Services 로드
        loadGoogleIdentityServices()
            .then(() => {
                setIsGoogleLoaded(true);
                console.log('Google Identity Services 로드 완료');
            })
            .catch((error) => {
                console.error('Google Identity Services 로드 실패:', error);
            });

        // 로컬 스토리지에서 로그인 상태 확인
        const { user, token } = managerStorage.get();
        if (user && token && user.isAuthorized) {
            setManagerUser(user);
            setIsLoggedIn(true);
            console.log('기존 로그인 상태 복원:', user);
        }
    }, []);

    // 로그인 페이지 컴포넌트
    const LoginPage = () => (
        <div className="min-h-screen bg-slate-900">
            <div className="flex justify-center items-start h-screen pt-24">
                <div className="w-full max-w-4xl px-4">
                    <div className="w-80 mx-auto text-center">
                        <h4 className="mb-10 w-full text-2xl font-bold text-white">관리자 시스템</h4>
                        <p className="mb-8 text-gray-300">Google 계정으로 로그인하세요</p>
                        
                        {/* 구글 SSO 로그인 버튼 */}
                        {isGoogleLoaded ? (
                            <button 
                                onClick={handleGoogleLogin}
                                className="w-full bg-white hover:bg-gray-50 text-gray-900 py-4 px-6 rounded-lg border border-gray-300 transition-colors duration-200 flex items-center justify-center space-x-3 shadow-lg"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                <span className="font-medium text-lg">Google로 로그인</span>
                            </button>
                        ) : (
                            <div className="w-full bg-gray-200 text-gray-500 py-4 px-6 rounded-lg flex items-center justify-center space-x-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                                <span>Google 로그인을 불러오는 중...</span>
                            </div>
                        )}

                        {/* 보안 안내 */}
                        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                            <p className="text-sm text-blue-300">
                                🔒 보안: 허용된 매니저 계정만 접근할 수 있습니다
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // 보호된 라우트 컴포넌트
    const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
        if (!isLoggedIn) {
            return <Navigate to="/manager/login" replace />;
        }
        return <>{children}</>;
    };

    return (
        <Routes>
            <Route path="/login" element={!isLoggedIn ? <LoginPage /> : <Navigate to="/manager" replace />} />
            <Route 
                path="/*" 
                element={
                    <ProtectedRoute>
                        <div className="min-h-screen bg-slate-900">
                            <div className="flex justify-center items-start h-screen pt-24">
                                <div className="w-full max-w-4xl px-4">
                                    <Outlet />
                                </div>
                            </div>
                        </div>
                    </ProtectedRoute>
                }
            >
                <Route index element={<Menu managerUser={managerUser} onLogout={handleLogout} />} />
                <Route path="portfolio" element={<Portfolio />} />
                <Route path="products" element={<Products />} />
                <Route path="support" element={<Support />} />
            </Route>
            <Route path="*" element={<Navigate to="/manager" replace />} />
        </Routes>
    );
}

