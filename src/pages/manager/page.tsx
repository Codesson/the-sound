import { useEffect, useState } from "react";
import speakerImage from "../../assets/images/speaker.png";
import videoImage from "../../assets/images/3d-video.png";
import spotlightsImage from "../../assets/images/spotlights.png";
import ledImage from "../../assets/images/led.png";
import { loadGoogleIdentityServices, initGoogleAuth, ManagerUser, managerStorage } from "../../utils/managerAuth";
import { 
    readSpreadsheetData, 
    writeSpreadsheetData, 
    initializeSpreadsheet, 
    convertProductsToSpreadsheetFormat,
    checkSpreadsheetAccess,
    ProductData 
} from "../../utils/googleSheets";
import { submitProductToGoogleForm, NewProductForm } from "../../utils/googleForm";
import { optimizeForGoogleForms, getBase64Size } from "../../utils/imageCompression";

export default function Manager() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentView, setCurrentView] = useState<'menu' | 'portfolio' | 'products'>('menu');
    
    // 시공사례 관리 상태
    const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
    const [portfolioLoading, setPortfolioLoading] = useState(false);
    const [managerUser, setManagerUser] = useState<ManagerUser | null>(null);
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        location: '',
        installmentDate: '',
        equipment: '',
        mainImage: null as File | null,
        detailImages: [] as File[]
    });
    
    // 제품 관리 상태
    const [products, setProducts] = useState<any[]>([]);
    const [productForm, setProductForm] = useState({
        productName: '',
        category: '',
        description: '',
        specification: '',
        productImage: '' as string,
        productImageExtra: '' as string,
        mainImage: null as File | null,
    });
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    
    // 스프레드시트 관리 상태
    const [spreadsheetData, setSpreadsheetData] = useState<ProductData[]>([]);
    const [spreadsheetLoading, setSpreadsheetLoading] = useState(false);
    const [spreadsheetError, setSpreadsheetError] = useState<string | null>(null);
    // 구글 SSO 로그인 핸들러
    const handleGoogleLogin = () => {
        initGoogleAuth(
            (token: string, user: ManagerUser) => {
                setManagerUser(user);
                setIsLoggedIn(true);
                managerStorage.set(user, token);
                console.log('매니저 로그인 성공:', user);
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
        setCurrentView('menu');
        setShowAddProduct(false);
        managerStorage.clear();
    };

    // 스프레드시트 데이터 로드
    const loadSpreadsheetData = async () => {
        const { token } = managerStorage.get();
        if (!token) {
            setSpreadsheetError('로그인이 필요합니다.');
            return;
        }

        setSpreadsheetLoading(true);
        setSpreadsheetError(null);

        try {
            // 스프레드시트 접근 권한 확인
            const hasAccess = await checkSpreadsheetAccess(token);
            if (!hasAccess) {
                throw new Error('스프레드시트 접근 권한이 없습니다. Google Sheets API 권한을 확인해주세요.');
            }

            const data = await readSpreadsheetData(token);
            setSpreadsheetData(data);
        } catch (error) {
            console.error('스프레드시트 데이터 로드 오류:', error);
            setSpreadsheetError(error instanceof Error ? error.message : '데이터 로드에 실패했습니다.');
        } finally {
            setSpreadsheetLoading(false);
        }
    };

    // 스프레드시트 초기화
    const initializeSpreadsheetData = async () => {
        const { token } = managerStorage.get();
        if (!token) {
            setSpreadsheetError('로그인이 필요합니다.');
            return;
        }

        setSpreadsheetLoading(true);
        setSpreadsheetError(null);

        try {
            await initializeSpreadsheet(token);
            alert('스프레드시트가 초기화되었습니다.');
        } catch (error) {
            console.error('스프레드시트 초기화 오류:', error);
            setSpreadsheetError(error instanceof Error ? error.message : '초기화에 실패했습니다.');
        } finally {
            setSpreadsheetLoading(false);
        }
    };

    // 현재 제품 데이터를 스프레드시트에 저장
    const saveProductsToSpreadsheet = async () => {
        const { token } = managerStorage.get();
        if (!token) {
            setSpreadsheetError('로그인이 필요합니다.');
            return;
        }

        setSpreadsheetLoading(true);
        setSpreadsheetError(null);

        try {
            // 현재 제품 데이터를 스프레드시트 형식으로 변환
            const spreadsheetProducts = convertProductsToSpreadsheetFormat(products);
            await writeSpreadsheetData(token, spreadsheetProducts);
            alert('제품 데이터가 스프레드시트에 저장되었습니다.');
            await loadSpreadsheetData(); // 데이터 새로고침
        } catch (error) {
            console.error('스프레드시트 저장 오류:', error);
            setSpreadsheetError(error instanceof Error ? error.message : '저장에 실패했습니다.');
        } finally {
            setSpreadsheetLoading(false);
        }
    };

    const handleUploadFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUploadForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setUploadForm(prev => ({
            ...prev,
            mainImage: file
        }));
    };

    const handleDetailImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setUploadForm(prev => ({
            ...prev,
            detailImages: [...prev.detailImages, ...files]
        }));
    };

    const removeDetailImage = (index: number) => {
        setUploadForm(prev => ({
            ...prev,
            detailImages: prev.detailImages.filter((_, i) => i !== index)
        }));
    };

    const removeMainImage = () => {
        setUploadForm(prev => ({
            ...prev,
            mainImage: null
        }));
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!uploadForm.title || !uploadForm.description || !uploadForm.location || !uploadForm.installmentDate || !uploadForm.equipment) {
            alert('모든 필수 필드를 입력해주세요.');
            return;
        }

        const formData = new FormData();
        formData.append('title', uploadForm.title);
        formData.append('description', uploadForm.description);
        formData.append('location', uploadForm.location);
        formData.append('installmentDate', uploadForm.installmentDate);
        formData.append('equipment', uploadForm.equipment);
        
        if (uploadForm.mainImage) {
            formData.append('mainImage', uploadForm.mainImage);
        }
        
        uploadForm.detailImages.forEach((file, index) => {
            formData.append(`detailImage_${index}`, file);
        });

        try {
            // 이미지 파일들을 업로드하고 URL을 받아오는 함수 (실제 구현에서는 이미지 호스팅 서비스 사용)
            const uploadImageToHosting = async (file: File): Promise<string> => {
                // 실제 구현에서는 이미지 호스팅 서비스 (예: Cloudinary, AWS S3 등)를 사용
                // 현재는 임시로 파일명을 반환
                return `https://example.com/images/${file.name}`;
            };

            let mainImageUrl = '';
            let detailImageUrls: string[] = [];

            // 메인 이미지 업로드
            if (uploadForm.mainImage) {
                mainImageUrl = await uploadImageToHosting(uploadForm.mainImage);
            }

            // 상세 이미지들 업로드
            for (const file of uploadForm.detailImages) {
                const url = await uploadImageToHosting(file);
                detailImageUrls.push(url);
            }

            // Google Sheets에 추가할 데이터 준비
            const newRowData = {
                id: Date.now(), // 임시 ID (실제로는 시트의 마지막 ID + 1)
                title: uploadForm.title,
                description: uploadForm.description,
                location: uploadForm.location,
                date: uploadForm.installmentDate.replace(/-/g, ''), // YYYYMMDD 형식으로 변환
                equipment: uploadForm.equipment,
                mainImage: mainImageUrl,
                detailImages: detailImageUrls.join(','), // 배열을 쉼표로 구분된 문자열로 변환
                alt: uploadForm.title,
                inquiry: '' // 빈 문자열로 초기화
            };

            // Google Apps Script 웹훅 URL (실제 URL로 교체 필요)
            const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
            
            const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRowData)
            });

            if (response.ok) {
                console.log('Google Sheets에 데이터가 성공적으로 추가되었습니다:', newRowData);
                alert('고객 사례가 성공적으로 업로드되었습니다!');
                
                // 폼 초기화
                setUploadForm({
                    title: '',
                    description: '',
                    location: '',
                    installmentDate: '',
                    equipment: '',
                    mainImage: null,
                    detailImages: []
                });
            } else {
                throw new Error('Google Sheets 업로드 실패');
            }

        } catch (error) {
            console.error('업로드 에러:', error);
            alert('업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };

    const logout = () => {
        setIsLoggedIn(false);
        setCurrentView('menu');
        setShowAddProduct(false);
    };

    // 시공사례 목록 가져오기
    const fetchPortfolioItems = async () => {
        setPortfolioLoading(true);
        try {
            const PORTFOLIO_SPREADSHEET_ID = "1XYBvUwDqzlfF9DnBiSKLgFsC_XA6k22auI_0I29Airs";
            console.log('📊 시공사례 스프레드시트 ID:', PORTFOLIO_SPREADSHEET_ID);
            
            const response = await fetch(
                `https://docs.google.com/spreadsheets/d/${PORTFOLIO_SPREADSHEET_ID}/export?format=csv`
            );
            
            if (!response.ok) {
                throw new Error('시공사례 데이터를 가져오는데 실패했습니다.');
            }
            
            const csvText = await response.text();
            console.log('📄 시공사례 CSV 데이터 (처음 200자):', csvText.substring(0, 200));
            
            // CSV 파싱 (제품과 동일한 방식)
            const lines = csvText.split('\n').filter(line => line.trim() !== '');
            
            if (lines.length <= 1) {
                console.warn('시공사례 데이터가 없습니다.');
                setPortfolioItems([]);
                return;
            }
            
            const headers = lines[0].split(',').map(h => h.trim());
            console.log('📋 시공사례 헤더:', headers);
            
            const items = lines.slice(1).map((line, index) => {
                const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                
                return {
                    id: index + 1,
                    title: values[0] || '',
                    description: values[1] || '',
                    location: values[2] || '',
                    date: values[3] || '',
                    equipment: values[4] || '',
                    mainImage: values[5] || '',
                    detailImages: values[6] || ''
                };
            }).filter(item => item.title);
            
            setPortfolioItems(items);
            console.log(`✅ 시공사례 ${items.length}개를 불러왔습니다.`);
        } catch (error) {
            console.error('시공사례 데이터 가져오기 오류:', error);
            setPortfolioItems([]);
        } finally {
            setPortfolioLoading(false);
        }
    };
    
    // 제품 목록 가져오기
    const fetchProducts = async () => {
        setLoading(true);
        try {
            // 제품소개 페이지와 동일한 하드코딩된 데이터 사용
            const productsData = [
                {
                    id: 1,
                    model: "E212",
                    kind: "메인 스피커",
                    description: "E212 스피커는 유수한 스피커제조사들이 사용하는 B&C(ITALY) SPEAKER를 시작으로...",
                    spec: "TYPE: 2WAY PASSIVE SPEAKER\nCOMPONENTS: LOW: 2 X 12\" 3\" VOICE COIL (B&C)",
                    mainImage: speakerImage,
                    alt: "E212 스피커"
                },
                {
                    id: 2,
                    model: "TS M12",
                    kind: "12인치 모니터",
                    description: "12인치 모니터 스피커입니다.",
                    spec: "",
                    mainImage: videoImage,
                    alt: "TS M12 모니터"
                },
                {
                    id: 3,
                    model: "E12",
                    kind: "딜레이 스피커",
                    description: "딜레이 스피커입니다.",
                    spec: "",
                    mainImage: spotlightsImage,
                    alt: "E12 딜레이 스피커"
                },
                {
                    id: 4,
                    model: "S218",
                    kind: "서브우퍼",
                    description: "18인치 서브우퍼입니다.",
                    spec: "",
                    mainImage: ledImage,
                    alt: "S218 서브우퍼"
                }
            ];
            
            setProducts(productsData);
        } catch (error) {
            console.error('제품 데이터 가져오기 오류:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProductForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 이미지 파일을 base64로 인코딩하는 함수
    const encodeImageToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error('Failed to convert image to base64'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read image file'));
            reader.readAsDataURL(file);
        });
    };

    const handleProductImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        
        if (file) {
            // 파일 크기 체크 (5MB 제한)
            if (file.size > 5 * 1024 * 1024) {
                alert('이미지 파일 크기는 5MB 이하여야 합니다.');
            return;
        }

            // 파일 타입 체크
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드 가능합니다.');
                return;
            }

            setImageUploading(true);
            
            try {
                // Google Forms용 이미지 최적화 (5000자 이하로 압축)
                const result = await optimizeForGoogleForms(file);
                
                const sizeKB = Math.round(getBase64Size(result.base64) / 1024);
                
                // 10000자 초과 시 업로드 차단
                if (result.base64.length > 10000) {
                    alert(`⚠️ 이미지가 너무 큽니다!\n\n현재 크기: ${result.base64.length}자 (${sizeKB}KB)\n최대 허용: 10,000자\n\n더 작은 이미지를 사용하거나 해상도를 낮춰주세요.`);
                    setImageUploading(false);
                    return;
                }
                
                // 5000자 초과 시 분할 저장 (알림 없이)
                let mainImage = result.base64;
                let extraImage = '';
                
                if (result.base64.length > 5000) {
                    mainImage = result.base64.substring(0, 5000);
                    extraImage = result.base64.substring(5000);
                    console.log(`✂️ 이미지 분할: ${result.base64.length}자 → ${mainImage.length}자 + ${extraImage.length}자`);
            } else {
                    console.log(`✅ 이미지 최적화 완료: ${result.size}자 (${sizeKB}KB)`);
                }
                
                setProductForm(prev => ({
                    ...prev,
                    productImage: mainImage,
                    productImageExtra: extraImage,
                    mainImage: file,
                }));
        } catch (error) {
                console.error('이미지 인코딩 오류:', error);
                alert('이미지 처리 중 오류가 발생했습니다.');
            } finally {
                setImageUploading(false);
            }
        } else {
            setProductForm(prev => ({
                ...prev,
                productImage: '',
                mainImage: null,
            }));
        }
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

    // 제품 관리 페이지 진입 시 제품 목록 불러오기
    useEffect(() => {
        if (currentView === 'products') {
            fetchProducts();
        } else if (currentView === 'portfolio') {
            fetchPortfolioItems();
        }
    }, [currentView]);

    return (
        <div className="min-h-screen bg-slate-900">
            <div className="flex justify-center items-center h-screen pt-24">
                <div className="w-full max-w-4xl px-4">
                {!isLoggedIn ? (
                    // 로그인 폼
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
                ) : currentView === 'menu' ? (
                    // 메뉴 화면
                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
                                <div className="mb-8 text-center">
                                    <h2 className="text-3xl font-bold text-white mb-4">관리자 시스템</h2>
                                    {managerUser && (
                                        <div className="mb-4">
                                            <p className="text-gray-300">환영합니다, <span className="text-blue-400 font-medium">{managerUser.name}</span>님!</p>
                                            <p className="text-sm text-gray-500">{managerUser.email}</p>
                                                                </div>
                                                            )}
                                    <p className="text-gray-400">관리할 항목을 선택하세요</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <button
                                onClick={() => setCurrentView('portfolio')}
                                className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl p-8 transition-all duration-300 hover:scale-105"
                                        >
                                <h3 className="text-2xl font-semibold text-white mb-2">시공사례 관리</h3>
                                <p className="text-gray-300">시공 사례를 확인하고 관리할 수 있습니다</p>
                                        </button>
                                    
                                    <button
                                        onClick={() => setCurrentView('products')}
                                className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl p-8 transition-all duration-300 hover:scale-105"
                                                    >
                                <h3 className="text-2xl font-semibold text-white mb-2">제품 관리</h3>
                                <p className="text-gray-300">제품 정보를 확인하고 관리할 수 있습니다</p>
                                                    </button>
                                            </div>

                                <div className="mt-8 text-center">
                                        <button
                                        onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                        >
                                        로그아웃
                                        </button>
                                        </div>
                    </div>
                ) : currentView === 'portfolio' ? (
                    // 시공사례 관리 화면
                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 max-w-6xl w-full">
                        <div className="mb-8 flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-white">시공사례 관리</h2>
                            <button
                                onClick={() => setCurrentView('menu')}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                                메뉴로 돌아가기
                            </button>
                        </div>
                        
                        {/* 시공사례 목록 */}
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-white mb-4">등록된 시공사례 목록</h3>
                            
                            {portfolioLoading ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                    <p className="text-gray-300 mt-2">로딩 중...</p>
                                </div>
                            ) : portfolioItems.length === 0 ? (
                                <div className="text-center py-12 bg-slate-700/30 rounded-lg border border-slate-600/50">
                                    <p className="text-gray-400 mb-4">등록된 시공사례가 없습니다</p>
                    </div>
                ) : (
                                <div className="space-y-3">
                                    {portfolioItems.map((item) => (
                                        <div key={item.id} className="bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700/70 transition-colors duration-200">
                                            <div className="flex items-start p-4">
                                                {/* 시공사례 정보 */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="text-lg font-semibold text-white mb-1">{item.title}</h4>
                                                            <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                                                                <span className="text-blue-300">📍 {item.location}</span>
                                                                <span>📅 {item.date}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                                                                {item.description}
                                                            </p>
                                                            {item.equipment && (
                                                                <p className="text-xs text-gray-400">
                                                                    <span className="text-gray-500">장비:</span> {item.equipment}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex space-x-2 ml-4">
                                                            <button className="text-gray-400 hover:text-yellow-400 transition-colors p-1">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </button>
                                                            <button className="text-gray-400 hover:text-red-400 transition-colors p-1">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* 기존 업로드 폼은 아래에 유지 */}
                        <div className="mt-8 pt-8 border-t border-slate-700">
                            <h3 className="text-xl font-semibold text-white mb-4">새 시공사례 추가</h3>
                        
                        <form onSubmit={handleUploadSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    제목 *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={uploadForm.title}
                                    onChange={handleUploadFormChange}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400 backdrop-blur-sm"
                                    placeholder="고객 사례 제목을 입력하세요"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    설명 *
                                </label>
                                <textarea
                                    name="description"
                                    value={uploadForm.description}
                                    onChange={handleUploadFormChange}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400 backdrop-blur-sm resize-none"
                                    placeholder="고객 사례에 대한 상세 설명을 입력하세요"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    시공 장소 *
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={uploadForm.location}
                                    onChange={handleUploadFormChange}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400 backdrop-blur-sm"
                                    placeholder="시공 장소를 입력하세요 (예: 서울시 강남구)"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    시공 일자 *
                                </label>
                                <input
                                    type="date"
                                    name="installmentDate"
                                    value={uploadForm.installmentDate}
                                    onChange={handleUploadFormChange}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white backdrop-blur-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    사용 장비 *
                                </label>
                                <textarea
                                    name="equipment"
                                    value={uploadForm.equipment}
                                    onChange={handleUploadFormChange}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400 backdrop-blur-sm resize-none"
                                    placeholder="사용된 장비 목록을 입력하세요 (예: E212 스피커 2대, 조명기 10대)"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    메인 이미지
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={handleMainImageChange}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 backdrop-blur-sm"
                                    />
                                </div>
                                <p className="text-sm text-gray-400 mt-1">대표 이미지를 선택하세요.</p>
                                
                                {uploadForm.mainImage && (
                                    <div className="mt-4">
                                        <div className="relative inline-block">
                                            <img
                                                src={URL.createObjectURL(uploadForm.mainImage)}
                                                alt="메인 이미지 미리보기"
                                                className="w-32 h-32 object-cover rounded-lg border border-slate-600/50"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeMainImage}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 truncate">{uploadForm.mainImage.name}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    상세 이미지
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={handleDetailImagesChange}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 backdrop-blur-sm"
                                    />
                                </div>
                                <p className="text-sm text-gray-400 mt-1">여러 상세 이미지를 선택할 수 있습니다.</p>
                                
                                {uploadForm.detailImages.length > 0 && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-200 mb-2">
                                            선택된 상세 이미지 ({uploadForm.detailImages.length}개)
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {uploadForm.detailImages.map((file, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`상세 이미지 미리보기 ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded-lg border border-slate-600/50"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDetailImage(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                                    >
                                                        ×
                                                    </button>
                                                    <p className="text-xs text-gray-400 mt-1 truncate">{file.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium shadow-lg"
                            >
                                시공사례 업로드
                            </button>
                        </form>
                        </div>
                    </div>
                ) : currentView === 'products' ? (
                    // 제품 관리 화면
                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 max-w-6xl w-full">
                                <div className="mb-8 flex justify-between items-center">
                                    <h2 className="text-3xl font-bold text-white">제품 관리</h2>
                            <div className="space-x-4">
                                        <button
                                            onClick={() => setShowAddProduct(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                        >
                                    새 제품 추가
                                        </button>
                                        <button
                                            onClick={() => setCurrentView('menu')}
                                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                        >
                                    메뉴로 돌아가기
                                        </button>
                                    </div>
                                </div>

                        {/* 스프레드시트 관리 섹션 */}
                        <div className="mb-8 bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                            <h3 className="text-xl font-bold text-white mb-4">구글 스프레드시트 연동</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <button
                                    onClick={loadSpreadsheetData}
                                    disabled={spreadsheetLoading}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                                >
                                    {spreadsheetLoading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    )}
                                    <span>스프레드시트 데이터 로드</span>
                                </button>
                                
                                <button
                                    onClick={saveProductsToSpreadsheet}
                                    disabled={spreadsheetLoading}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                                >
                                    {spreadsheetLoading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                        </svg>
                                    )}
                                    <span>제품 데이터 저장</span>
                                </button>
                                
                                <button
                                    onClick={initializeSpreadsheetData}
                                    disabled={spreadsheetLoading}
                                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                                >
                                    {spreadsheetLoading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    )}
                                    <span>스프레드시트 초기화</span>
                                </button>
                </div>
                            
                            {/* 스프레드시트 링크 */}
                            <div className="mb-4">
                                <p className="text-sm text-gray-400 mb-2">스프레드시트 링크:</p>
                                <a 
                                    href="https://docs.google.com/spreadsheets/d/1p8P_4ymeoSof5ExXClamxYwtvOtDK9Q1Sw4gSawu9uo/edit?usp=drive_link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 underline text-sm break-all"
                                >
                                    https://docs.google.com/spreadsheets/d/1p8P_4ymeoSof5ExXClamxYwtvOtDK9Q1Sw4gSawu9uo/edit?usp=drive_link
                                </a>
            </div>

                            {/* 에러 메시지 */}
                            {spreadsheetError && (
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                                    <div className="flex items-start space-x-3">
                                        <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <div className="flex-1">
                                            <p className="text-red-300 text-sm font-medium mb-2">스프레드시트 오류</p>
                                            <p className="text-red-300 text-sm mb-3">{spreadsheetError}</p>
                                            {spreadsheetError.includes('403') && (
                                                <div className="bg-red-800/20 rounded p-3">
                                                    <p className="text-red-200 text-xs font-medium mb-2">해결 방법:</p>
                                                    <ol className="text-red-200 text-xs space-y-1 list-decimal list-inside">
                                                        <li>Google Cloud Console에서 Google Sheets API 활성화</li>
                                                        <li>OAuth 동의 화면에 스코프 추가</li>
                                                        <li>OAuth 2.0 클라이언트 ID 재생성</li>
                                                        <li>스프레드시트 공유 권한 확인</li>
                                                        <li>개발 서버 재시작</li>
                                                    </ol>
                                                    <a 
                                                        href="https://console.cloud.google.com/apis/library/sheets.googleapis.com"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-300 hover:text-blue-200 underline text-xs mt-2 inline-block"
                                                    >
                                                        Google Sheets API 활성화 →
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 스프레드시트 데이터 미리보기 */}
                            {spreadsheetData.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-lg font-semibold text-white mb-3">스프레드시트 데이터 ({spreadsheetData.length}개 제품)</h4>
                                    <div className="bg-slate-900/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                                        <div className="space-y-2">
                                            {spreadsheetData.map((product, index) => (
                                                <div key={product.id} className="bg-slate-800/50 rounded p-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h5 className="text-white font-medium">{product.model}</h5>
                                                            <p className="text-gray-400 text-sm">{product.kind}</p>
                                                        </div>
                                                        <span className="text-xs text-gray-500">#{index + 1}</span>
                                                    </div>
                                                    {product.description && (
                                                        <p className="text-gray-300 text-sm mt-1 line-clamp-2">{product.description}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                                </div>

                                {/* 제품 목록 */}
                        <div className="mb-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">등록된 제품 목록</h3>
                                    
                                    {loading ? (
                                        <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                    <p className="text-gray-300 mt-2">로딩 중...</p>
                                        </div>
                                    ) : products.length === 0 ? (
                                <div className="text-center py-12 bg-slate-700/30 rounded-lg border border-slate-600/50">
                                    <p className="text-gray-400 mb-4">등록된 제품이 없습니다</p>
                                            <button
                                                onClick={() => setShowAddProduct(true)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                            >
                                                첫 번째 제품 추가하기
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {products.map((product) => (
                                                <div key={product.id} className="bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700/70 transition-colors duration-200">
                                                    <div className="flex items-center p-4">
                                                        {/* 제품 이미지 - 심플하게 */}
                                                        <div className="flex-shrink-0 mr-4">
                                                            {product.mainImage && (
                                                                <div className="w-16 h-16 bg-slate-600/50 rounded-lg flex items-center justify-center">
                                                                    <img
                                                                        src={product.mainImage}
                                                                        alt={product.alt}
                                                                        className="w-12 h-12 object-contain"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* 제품 정보 */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <h4 className="text-lg font-semibold text-white truncate">{product.model}</h4>
                                                                    <p className="text-sm text-blue-300">{product.kind}</p>
                                                                </div>
                                                                <div className="flex space-x-2 ml-4">
                                                                    <button className="text-gray-400 hover:text-yellow-400 transition-colors p-1">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button className="text-gray-400 hover:text-red-400 transition-colors p-1">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* 제품 설명 */}
                                                            <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                                                                {product.description}
                                                            </p>
                                                            
                                                            {/* 사양 정보 (있는 경우만) */}
                                                            {product.spec && (
                                                                <div className="mt-2 text-xs text-gray-400">
                                                                    <div className="space-y-1">
                                                                        {product.spec.split('\n').slice(0, 3).map((line: string, index: number) => {
                                                                            if (!line.trim()) return null;
                                                                            const colonIndex = line.indexOf(':');
                                                                            if (colonIndex === -1) return null;
                                                                            
                                                                            const key = line.substring(0, colonIndex).trim();
                                                                            const value = line.substring(colonIndex + 1).trim();
                                                                            
                                                                            return (
                                                                                <div key={index} className="flex">
                                                                                    <span className="text-gray-500 font-medium min-w-0 flex-shrink-0 mr-2">
                                                                                        {key}:
                                                                                    </span>
                                                                                    <span className="text-gray-300 truncate">
                                                                                        {value}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        }).filter(Boolean)}
                                                                        {product.spec.split('\n').length > 3 && (
                                                                            <div className="text-gray-500 text-xs">
                                                                                ... 외 {product.spec.split('\n').length - 3}개 항목
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                ) : null}
                </div>
            </div>

            {/* 새 제품 추가 모달 */}
                        {showAddProduct && (
                <div className="fixed inset-0 z-50">
                    <div 
                        className="absolute inset-0 bg-black/70" 
                        onClick={() => setShowAddProduct(false)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
                            <div className="flex items-center justify-between p-5 border-b border-slate-700">
                                <h3 className="text-xl font-bold text-white">새 제품 추가</h3>
                                        <button
                                    className="text-gray-400 hover:text-white"
                                            onClick={() => setShowAddProduct(false)}
                                        >
                                    ✕
                                        </button>
                                    </div>
                                    
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-1">모델명</label>
                                        <input
                                            name="productName"
                                            value={productForm.productName}
                                            onChange={handleProductFormChange}
                                            className="w-full bg-slate-800 text-white rounded-lg border border-slate-700 px-3 py-2"
                                            placeholder="예: E212"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-1">제품종류</label>
                                        <input
                                            name="category"
                                            value={productForm.category}
                                            onChange={handleProductFormChange}
                                            className="w-full bg-slate-800 text-white rounded-lg border border-slate-700 px-3 py-2"
                                            placeholder="예: 메인 스피커"
                                        />
                                    </div>
                                    </div>

                                    <div>
                                    <label className="block text-sm text-gray-300 mb-1">설명</label>
                                        <textarea
                                            name="description"
                                            value={productForm.description}
                                            onChange={handleProductFormChange}
                                            rows={4}
                                        className="w-full bg-slate-800 text-white rounded-lg border border-slate-700 px-3 py-2"
                                        placeholder="제품 설명을 입력하세요"
                                        />
                                    </div>

                                    <div>
                                    <label className="block text-sm text-gray-300 mb-1">사양 정보</label>
                                        <textarea
                                            name="specification"
                                            value={productForm.specification}
                                            onChange={handleProductFormChange}
                                            rows={6}
                                        className="w-full bg-slate-800 text-white rounded-lg border border-slate-700 px-3 py-2"
                                        placeholder="TYPE: 2WAY PASSIVE SPEAKER&#10;POWER: 1400/2800&#10;FREQUENCY RESPONSE: 45HZ - 18,000HZ"
                                        />
                                    </div>

                                    <div>
                                    <label className="block text-sm text-gray-300 mb-1">대표 이미지</label>
                                            <input
                                                type="file"
                                        accept="image/*"
                                                onChange={handleProductImageChange}
                                        disabled={imageUploading}
                                        className="w-full bg-slate-800 text-white rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-50"
                                            />
                                    
                                    {imageUploading && (
                                        <div className="mt-2 flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                            <span className="text-sm text-gray-400">이미지 처리 중...</span>
                                            </div>
                                        )}

                                    {productForm.mainImage && !imageUploading && (
                                        <div className="mt-3 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-400">선택된 파일: {productForm.mainImage.name}</p>
                                                    {productForm.productImage && (
                                                        <div className="mt-1 space-y-1">
                                                            <p className="text-xs text-green-400">
                                                                ✅ 첫 번째 부분: {productForm.productImage.length}자 
                                                                ({Math.round(getBase64Size(productForm.productImage) / 1024)}KB)
                                                            </p>
                                                            {productForm.productImageExtra && (
                                                                <p className="text-xs text-blue-400">
                                                                    ➕ 추가 부분: {productForm.productImageExtra.length}자 
                                                                    ({Math.round(getBase64Size(productForm.productImageExtra) / 1024)}KB)
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-500">
                                                                📊 총 크기: {productForm.productImage.length + (productForm.productImageExtra?.length || 0)}자
                                                                {productForm.productImageExtra ? ' (2개 필드로 분할 저장)' : ' (단일 필드 저장)'}
                                                            </p>
                            </div>
                        )}
                                                </div>
                                    <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProductForm(prev => ({
                                                            ...prev,
                                                            mainImage: null,
                                                            productImage: ''
                                                        }));
                                                    }}
                                                    className="text-red-400 hover:text-red-300 text-sm"
                                                >
                                                    제거
                                    </button>
                                </div>
                        
                                            {/* 이미지 미리보기 */}
                                            {productForm.mainImage && (
                                                <div className="space-y-2">
                                                    <img
                                                        src={URL.createObjectURL(productForm.mainImage)}
                                                        alt="이미지 미리보기"
                                                        className="w-32 h-32 object-cover rounded-lg border border-slate-600"
                                                    />
                                                    
                                                    {/* Base64 텍스트 파일 다운로드 버튼 */}
                                            <button
                                                type="button"
                                                        onClick={() => {
                                                            const blob = new Blob([productForm.productImage], { type: 'text/plain' });
                                                            const url = URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `${productForm.productName || 'product'}_image_base64.txt`;
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            document.body.removeChild(a);
                                                            URL.revokeObjectURL(url);
                                                        }}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                                                    >
                                                        📄 Base64 텍스트 파일로 다운로드
                                            </button>
                                        </div>
                                            )}
                    </div>
                )}
                            </div>
                                </div>

                            <div className="p-5 border-t border-slate-700 flex justify-end space-x-3">
                                                    <button
                                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
                                    onClick={() => setShowAddProduct(false)}
                                                    >
                                    취소
                                                    </button>
                            <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                                    disabled={!productForm.productName || !productForm.category || imageUploading}
                                    onClick={async () => {
                                        try {
                                            // 필수 필드 검증
                                            if (!productForm.productName.trim() || !productForm.category.trim()) {
                                                alert('모델명과 제품종류는 필수 입력 항목입니다.');
                                                return;
                                            }

                                            // Google Form에 제출할 데이터 준비
                                            const formData: NewProductForm = {
                                                productName: productForm.productName.trim(),
                                                category: productForm.category.trim(),
                                                description: productForm.description.trim(),
                                                productImage: productForm.productImage || productForm.mainImage?.name || '',
                                                productImageExtra: productForm.productImageExtra || '',
                                                specification: productForm.specification.trim(),
                                            };

                                            console.log('Google Form에 제출할 데이터:', formData);

                                            // Google Form에 제출
                                            const result = await submitProductToGoogleForm(formData);
                                            
                                            if (result.ok) {
                                                alert(result.message);
                                                setShowAddProduct(false);
                                                
                                                // 폼 초기화
                                                setProductForm({
                                                    productName: '',
                                                    category: '',
                                                    description: '',
                                                    specification: '',
                                                    productImage: '',
                                                    productImageExtra: '',
                                                    mainImage: null,
                                                });
                                            } else {
                                                alert(`제출 실패: ${result.message}`);
                                            }
                                            
                                        } catch (error) {
                                            console.error('Google Form 제출 오류:', error);
                                            alert('제품 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
                                        }
                                    }}
                                >
                                    {imageUploading ? '처리 중...' : 'Google Form으로 제출'}
                            </button>
                            </div>
                </div>
            </div>
                                    </div>
                                )}
        </div>
    )
}