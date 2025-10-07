import { useEffect, useState } from "react";
import speakerImage from "../../assets/images/speaker.png";
import videoImage from "../../assets/images/3d-video.png";
import spotlightsImage from "../../assets/images/spotlights.png";
import ledImage from "../../assets/images/led.png";

export default function Manager() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentView, setCurrentView] = useState<'menu' | 'portfolio' | 'products'>('menu');
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
        model: '',
        kind: '',
        description: '',
        spec: '',
        mainImage: null as File | null
    });
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [loading, setLoading] = useState(false);
    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        const formData = new FormData(event.currentTarget);
        const id = formData.get('id') as string;
        const pw = formData.get('pw') as string;
        
        console.log('data: ', { id, pw });
        
        try {
            // 임의의 값으로 로그인 처리 (실제 API 호출 대신)
            if (id && pw) {
                setIsLoggedIn(true);
                console.log('로그인 성공:', { id, pw });
            } else {
                alert('아이디와 비밀번호를 입력해주세요.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

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
    
    const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setProductForm(prev => ({
            ...prev,
            mainImage: file
        }));
    };

    useEffect(() => {
        // API 엔드포인트가 실제로 존재하는지 확인
        fetch('/api/login')
            .then((res) => {
                console.log('API response status:', res.status);
                if (!res.ok) {
                    console.warn('API endpoint not available:', res.status);
                }
            })
            .catch((error) => {
                console.warn('API endpoint not found:', error);
            });
    }, []);
    
    // 제품 관리 페이지 진입 시 제품 목록 불러오기
    useEffect(() => {
        if (currentView === 'products') {
            fetchProducts();
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
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="flex flex-col gap-4">
                                <input 
                                    name="id" 
                                    placeholder="아이디"
                                    className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input 
                                    name="pw" 
                                    type="password"
                                    placeholder="비밀번호"
                                    className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                로그인
                            </button>
                        </form>
                    </div>
                ) : currentView === 'menu' ? (
                    // 메뉴 화면
                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl font-bold text-white mb-4">관리자 시스템</h2>
                            <p className="text-gray-400">관리할 항목을 선택하세요</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                onClick={() => setCurrentView('portfolio')}
                                className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl p-8 transition-all duration-300 hover:scale-105"
                            >
                                <h3 className="text-2xl font-semibold text-white mb-2">포트폴리오 관리</h3>
                                <p className="text-gray-300">시공 사례를 추가하고 관리할 수 있습니다</p>
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
                                onClick={logout}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                ) : currentView === 'portfolio' ? (
                    // 시공사례 업로드 폼
                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
                        <div className="mb-8 flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-white">고객 사례 업로드</h2>
                            <button
                                onClick={() => setCurrentView('menu')}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                                메뉴로 돌아가기
                            </button>
                        </div>
                        
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
                                고객 사례 업로드
                            </button>
            </form>
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
        </div>
    )
}