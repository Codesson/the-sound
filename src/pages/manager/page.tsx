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
    ProductData,
    writePortfolioToSheet,
    writeProductToSheet,
    readPortfolioData,
    updatePortfolioRow,
    readProductData,
    updateProductRow,
    writeSupportToSheet,
    readSupportData,
    updateSupportRow,
    SupportFormData
} from "../../utils/googleSheets";
import { uploadToGoogleDrive } from "../../utils/googleDriveUpload";
import { optimizeForGoogleForms, getBase64Size, compressImageToBase64, recompressBase64 } from "../../utils/imageCompression";

export default function Manager() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentView, setCurrentView] = useState<'menu' | 'portfolio' | 'products' | 'support'>('menu');
    
    // 시공사례 관리 상태
    const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
    const [portfolioLoading, setPortfolioLoading] = useState(false);
    const [showAddPortfolio, setShowAddPortfolio] = useState(false);
    const [currentPortfolioPage, setCurrentPortfolioPage] = useState(1);
    const [portfolioItemsPerPage] = useState(10);
    const [selectedPortfolio, setSelectedPortfolio] = useState<any | null>(null);
    const [showPortfolioDetail, setShowPortfolioDetail] = useState(false);
    const [isEditingPortfolio, setIsEditingPortfolio] = useState(false);
    const [editingPortfolioData, setEditingPortfolioData] = useState<any>(null);
    const [savingPortfolio, setSavingPortfolio] = useState(false);
    const [editingImageUploading, setEditingImageUploading] = useState(false);
    const [managerUser, setManagerUser] = useState<ManagerUser | null>(null);
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        location: '',
        installmentDate: '',
        equipment: '',
        mainImage: '' as string,
        mainImageExtra: '' as string,
        detailImage1: '' as string,
        detailImageExtra1: '' as string,
        detailImage2: '' as string,
        detailImageExtra2: '' as string,
        detailImage3: '' as string,
        detailImageExtra3: '' as string,
        mainImageFile: null as File | null,
        detailImageFiles: [] as File[]
    });
    
    // 제품 관리 상태
    const [products, setProducts] = useState<any[]>([]);
    const [productLoading, setProductLoading] = useState(false);
    const [currentProductPage, setCurrentProductPage] = useState(1);
    const [productItemsPerPage] = useState(10);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [showProductDetail, setShowProductDetail] = useState(false);
    const [isEditingProduct, setIsEditingProduct] = useState(false);
    const [editingProductData, setEditingProductData] = useState<any>(null);
    const [savingProduct, setSavingProduct] = useState(false);
    const [editingProductImageUploading, setEditingProductImageUploading] = useState(false);
    const [hasOriginalProductImage, setHasOriginalProductImage] = useState(false);
    const [productImageError, setProductImageError] = useState(false);
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
    const [portfolioImageUploading, setPortfolioImageUploading] = useState(false);
    
    // 고객 지원 자료 관리 상태
    const [supportItems, setSupportItems] = useState<any[]>([]);
    const [supportLoading, setSupportLoading] = useState(false);
    const [showAddSupport, setShowAddSupport] = useState(false);
    const [currentSupportPage, setCurrentSupportPage] = useState(1);
    const [supportItemsPerPage] = useState(10);
    const [selectedSupport, setSelectedSupport] = useState<any | null>(null);
    const [showSupportDetail, setShowSupportDetail] = useState(false);
    const [isEditingSupport, setIsEditingSupport] = useState(false);
    const [editingSupportData, setEditingSupportData] = useState<any>(null);
    const [savingSupport, setSavingSupport] = useState(false);
    const [supportFileUploading, setSupportFileUploading] = useState(false);
    const [supportForm, setSupportForm] = useState({
        title: '',
        desc: '',
        category: '기타',
        file: null as File | null,
        fileUrl: '' as string
    });
    
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
        setShowAddPortfolio(false);
        setIsEditingPortfolio(false);
        setEditingPortfolioData(null);
        setSelectedPortfolio(null);
        setShowPortfolioDetail(false);
        managerStorage.clear();
    };

    // 401 오류 체크 및 로그아웃 처리
    const checkAndHandle401Error = (error: any) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('401') || errorMessage.includes('인증이 필요합니다') || errorMessage.includes('토큰이 만료')) {
            handleLogout();
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
            return true;
        }
        return false;
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
            
            // 401 오류 체크 및 로그아웃 처리
            if (checkAndHandle401Error(error)) {
                return;
            }
            
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
            
            // 401 오류 체크 및 로그아웃 처리
            if (checkAndHandle401Error(error)) {
                return;
            }
            
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
            
            // 401 오류 체크 및 로그아웃 처리
            if (checkAndHandle401Error(error)) {
                return;
            }
            
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

    const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        
        if (!file) return;
        
        // 파일 크기 체크 (10MB 제한 - 압축 후 크기 감소 예상)
        if (file.size > 10 * 1024 * 1024) {
            alert('이미지 파일 크기는 10MB 이하여야 합니다.');
                return;
            }
            
            // 파일 타입 체크
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드 가능합니다.');
                return;
            }
            
            setPortfolioImageUploading(true);
            
            try {
            console.log('📸 메인 이미지 압축 시작:', {
                원본크기: `${Math.round(file.size / 1024)}KB`,
                파일명: file.name
            });

            // 1단계: 적절한 품질로 압축 (2560x2560, quality 0.5) - 2개 셀 사용 시 최대 100,000자까지 가능
            let compressedBase64 = await compressImageToBase64(file, {
                maxWidth: 2560,
                maxHeight: 2560,
                quality: 0.5,
                format: 'image/jpeg'
            });

            const initialSize = compressedBase64.length;
            const initialSizeKB = Math.round(getBase64Size(compressedBase64) / 1024);
            console.log(`✅ 1단계 압축 완료: ${initialSize}자 (${initialSizeKB}KB)`);

            // 2단계: 100,000자 초과 시 재압축 (목표: 95KB ≈ 127,000자, 안전 마진)
            if (initialSize > 100000) {
                console.log('🔄 2단계 재압축 시작 (100,000자 이하 목표)...');
                compressedBase64 = await recompressBase64(compressedBase64, 95);
                const finalSize = compressedBase64.length;
                const finalSizeKB = Math.round(getBase64Size(compressedBase64) / 1024);
                console.log(`✅ 2단계 재압축 완료: ${finalSize}자 (${finalSizeKB}KB)`);
            }

            const finalSize = compressedBase64.length;
            const finalSizeKB = Math.round(getBase64Size(compressedBase64) / 1024);
            
            // 100,000자 초과 시 업로드 차단 (2개 셀 = 50,000자 x 2)
            if (finalSize > 100000) {
                alert(`⚠️ 이미지가 너무 큽니다!\n\n현재 크기: ${finalSize}자 (${finalSizeKB}KB)\n최대 허용: 100,000자 (2개 셀)\n\n더 작은 이미지를 사용하거나 해상도를 낮춰주세요.`);
                    setPortfolioImageUploading(false);
                    return;
                }
                
            // 50,000자 초과 시 2개 셀에 분할 저장
            let mainImage = compressedBase64;
                let mainImageExtra = '';
                
            if (finalSize > 50000) {
                mainImage = compressedBase64.substring(0, 50000);
                mainImageExtra = compressedBase64.substring(50000);
                console.log(`✂️ 메인 이미지 분할: ${finalSize}자 → ${mainImage.length}자 + ${mainImageExtra.length}자`);
                console.log(`📊 분할 저장: 첫 번째 셀 ${Math.round(getBase64Size(mainImage) / 1024)}KB, 두 번째 셀 ${Math.round(getBase64Size(mainImageExtra) / 1024)}KB`);
                } else {
                console.log(`✅ 메인 이미지 최적화 완료: ${finalSize}자 (${finalSizeKB}KB) - 단일 셀 저장`);
                }
                
                setUploadForm(prev => ({
                    ...prev,
                mainImage: mainImage,
                mainImageExtra: mainImageExtra,
                    mainImageFile: file
                }));
            } catch (error) {
                console.error('이미지 인코딩 오류:', error);
                alert('이미지 처리 중 오류가 발생했습니다.');
            } finally {
                setPortfolioImageUploading(false);
        }
    };

    const handleDetailImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        
        if (!file) return;
        
        // 파일 크기 체크 (10MB 제한 - 압축 후 크기 감소 예상)
        if (file.size > 10 * 1024 * 1024) {
            alert('이미지 파일 크기는 10MB 이하여야 합니다.');
            return;
        }
        
        // 파일 타입 체크
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        
        setPortfolioImageUploading(true);
        
        try {
            console.log(`📸 상세 이미지 ${index + 1} 압축 시작:`, {
                원본크기: `${Math.round(file.size / 1024)}KB`,
                파일명: file.name
            });

            // 1단계: 상세 이미지 압축 (2560x2560, quality 0.6) - 2개 셀 사용 시 최대 100,000자까지 가능
            let compressedBase64 = await compressImageToBase64(file, {
                maxWidth: 2560,
                maxHeight: 2560,
                quality: 0.5,
                format: 'image/jpeg'
            });

            const initialSize = compressedBase64.length;
            const initialSizeKB = Math.round(getBase64Size(compressedBase64) / 1024);
            console.log(`✅ 1단계 압축 완료: ${initialSize}자 (${initialSizeKB}KB)`);

            // 2단계: 100,000자 초과 시 재압축 (목표: 95KB ≈ 127,000자, 안전 마진)
            if (initialSize > 100000) {
                console.log('🔄 2단계 재압축 시작 (100,000자 이하 목표)...');
                compressedBase64 = await recompressBase64(compressedBase64, 95);
                const finalSize = compressedBase64.length;
                const finalSizeKB = Math.round(getBase64Size(compressedBase64) / 1024);
                console.log(`✅ 2단계 재압축 완료: ${finalSize}자 (${finalSizeKB}KB)`);
            }

            const finalSize = compressedBase64.length;
            const finalSizeKB = Math.round(getBase64Size(compressedBase64) / 1024);
            
            // 100,000자 초과 시 업로드 차단 (2개 셀 = 50,000자 x 2)
            if (finalSize > 100000) {
                alert(`⚠️ 이미지가 너무 큽니다!\n\n현재 크기: ${finalSize}자 (${finalSizeKB}KB)\n최대 허용: 100,000자 (2개 셀)\n\n더 작은 이미지를 사용하거나 해상도를 낮춰주세요.`);
                setPortfolioImageUploading(false);
                return;
            }
            
            // 50,000자 초과 시 2개 셀에 분할 저장
            let detailImage = compressedBase64;
            let detailImageExtra = '';
            
            if (finalSize > 50000) {
                detailImage = compressedBase64.substring(0, 50000);
                detailImageExtra = compressedBase64.substring(50000);
                console.log(`✂️ 상세 이미지 ${index + 1} 분할: ${finalSize}자 → ${detailImage.length}자 + ${detailImageExtra.length}자`);
                console.log(`📊 분할 저장: 첫 번째 셀 ${Math.round(getBase64Size(detailImage) / 1024)}KB, 두 번째 셀 ${Math.round(getBase64Size(detailImageExtra) / 1024)}KB`);
            } else {
                console.log(`✅ 상세 이미지 ${index + 1} 최적화 완료: ${finalSize}자 (${finalSizeKB}KB) - 단일 셀 저장`);
            }
            
            // 인덱스에 따라 적절한 필드 업데이트
            setUploadForm(prev => {
                const newFiles = [...(prev.detailImageFiles || [])];
                newFiles[index] = file;
                
                const updates: any = {
                    detailImageFiles: newFiles
                };
                
                if (index === 0) {
                    updates.detailImage1 = detailImage;
                    updates.detailImageExtra1 = detailImageExtra;
                } else if (index === 1) {
                    updates.detailImage2 = detailImage;
                    updates.detailImageExtra2 = detailImageExtra;
                } else if (index === 2) {
                    updates.detailImage3 = detailImage;
                    updates.detailImageExtra3 = detailImageExtra;
                }
                
                return { ...prev, ...updates };
            });
        } catch (error) {
            console.error('이미지 인코딩 오류:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
        } finally {
            setPortfolioImageUploading(false);
        }
    };

    const removeDetailImage = (index: number) => {
        setUploadForm(prev => {
            const newFiles = [...prev.detailImageFiles];
            newFiles[index] = undefined as any; // 해당 인덱스만 제거
            
            const updates: any = {
                detailImageFiles: newFiles.filter(Boolean) // undefined 제거
            };
            
            // 해당 인덱스의 이미지 필드 초기화
            if (index === 0) {
                updates.detailImage1 = '';
                updates.detailImageExtra1 = '';
            } else if (index === 1) {
                updates.detailImage2 = '';
                updates.detailImageExtra2 = '';
            } else if (index === 2) {
                updates.detailImage3 = '';
                updates.detailImageExtra3 = '';
            }
            
            return {
            ...prev,
                ...updates
            };
        });
    };

    const removeMainImage = () => {
        setUploadForm(prev => ({
            ...prev,
            mainImage: '',
            mainImageExtra: '',
            mainImageFile: null
        }));
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!uploadForm.title || !uploadForm.description || !uploadForm.location || !uploadForm.installmentDate || !uploadForm.equipment) {
            alert('모든 필수 필드를 입력해주세요.');
            return;
        }

        try {
            // OAuth 토큰 가져오기
            const { token, user } = managerStorage.get();
            console.log('🔑 토큰 확인:', {
                tokenExists: !!token,
                tokenLength: token?.length || 0,
                user: user ? { email: user.email, isAuthorized: user.isAuthorized } : null
            });
            
            if (!token) {
                alert('인증이 필요합니다. 다시 로그인해주세요.');
                return;
            }

            console.log('📤 시공사례 저장 데이터:', {
                title: uploadForm.title,
                description: uploadForm.description,
                location: uploadForm.location,
                installmentDate: uploadForm.installmentDate,
                equipment: uploadForm.equipment,
                mainImageLength: uploadForm.mainImage.length,
                mainImageExtraLength: uploadForm.mainImageExtra?.length || 0,
                detailImage1Length: uploadForm.detailImage1?.length || 0,
                detailImageExtra1Length: uploadForm.detailImageExtra1?.length || 0,
                detailImage2Length: uploadForm.detailImage2?.length || 0,
                detailImageExtra2Length: uploadForm.detailImageExtra2?.length || 0,
                detailImage3Length: uploadForm.detailImage3?.length || 0,
                detailImageExtra3Length: uploadForm.detailImageExtra3?.length || 0
            });

            // Google Sheets API로 직접 저장 (분할 이미지 그대로 전달)
            await writePortfolioToSheet(token, {
                title: uploadForm.title,
                description: uploadForm.description,
                location: uploadForm.location,
                installmentDate: uploadForm.installmentDate,
                equipment: uploadForm.equipment,
                mainImage: uploadForm.mainImage,
                mainImageExtra: uploadForm.mainImageExtra || undefined,
                detailImage1: uploadForm.detailImage1 || undefined,
                detailImageExtra1: uploadForm.detailImageExtra1 || undefined,
                detailImage2: uploadForm.detailImage2 || undefined,
                detailImageExtra2: uploadForm.detailImageExtra2 || undefined,
                detailImage3: uploadForm.detailImage3 || undefined,
                detailImageExtra3: uploadForm.detailImageExtra3 || undefined,
            });

            alert('시공사례가 성공적으로 저장되었습니다!');
                
                // 폼 초기화
                setUploadForm({
                    title: '',
                    description: '',
                    location: '',
                    installmentDate: '',
                    equipment: '',
                    mainImage: '',
                    mainImageExtra: '',
                    detailImage1: '',
                    detailImageExtra1: '',
                    detailImage2: '',
                    detailImageExtra2: '',
                    detailImage3: '',
                    detailImageExtra3: '',
                    mainImageFile: null,
                    detailImageFiles: []
                });
            
            // 모달 닫기
            setShowAddPortfolio(false);
            
            // 시공사례 목록 새로고침
            fetchPortfolioItems();

        } catch (error) {
            console.error('업로드 에러:', error);
            
            // 401 오류 체크 및 로그아웃 처리
            if (checkAndHandle401Error(error)) {
                return;
            }
            
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
            alert(`업로드 중 오류가 발생했습니다: ${errorMessage}`);
        }
    };

    const logout = () => {
        setIsLoggedIn(false);
        setCurrentView('menu');
        setShowAddProduct(false);
    };

    // Base64 이미지를 디코딩하는 함수
    const decodeBase64Image = (base64String: string): string | null => {
        if (!base64String || base64String.trim() === '') return null;
        // 이미 data:image로 시작하면 그대로 반환
        if (base64String.startsWith('data:image')) {
            return base64String;
        }
        // Base64 데이터만 있는 경우 data:image 헤더 추가
        // JPEG인지 PNG인지 확인 (일반적으로 JPEG 사용)
        return `data:image/jpeg;base64,${base64String}`;
    };

    // 시공사례 목록 가져오기 (Google Sheets API 사용)
    const fetchPortfolioItems = async () => {
        setPortfolioLoading(true);
        try {
            // OAuth 토큰 가져오기
            const { token } = managerStorage.get();
            if (!token) {
                throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
            }
            
            console.log('📊 시공사례 데이터 읽기 시작 (Google Sheets API 사용)');
            
            // Google Sheets API를 사용하여 데이터 읽기
            const items = await readPortfolioData(token);
            
            // 이미지 URL 변환 및 상세 이미지 URL 생성
            const itemsWithImages = items.map((item: any) => ({
                ...item,
                mainImageUrl: decodeBase64Image(item.mainImage),
                detailImageUrls: item.detailImages.map((img: string) => decodeBase64Image(img)).filter((url: string | null) => url !== null)
            }));
            
            console.log('📋 파싱된 시공사례 항목들:', itemsWithImages);
            console.log(`✅ 시공사례 ${itemsWithImages.length}개를 불러왔습니다.`);
            
            setPortfolioItems(itemsWithImages);
            setCurrentPortfolioPage(1); // 목록 새로고침 시 첫 페이지로 이동
        } catch (error) {
            console.error('❌ 시공사례 데이터 가져오기 오류:', error);
            console.error('에러 상세:', error instanceof Error ? error.message : String(error));
            console.error('에러 스택:', error instanceof Error ? error.stack : '');
            
            // 401 오류 체크 및 로그아웃 처리
            if (checkAndHandle401Error(error)) {
                return;
            }
            
            setPortfolioItems([]);
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`시공사례 데이터를 불러오는데 실패했습니다.\n\n오류: ${errorMessage}\n\n브라우저 콘솔을 확인해주세요.`);
        } finally {
            setPortfolioLoading(false);
        }
    };

    // 시공사례 수정 저장
    const handleSavePortfolio = async () => {
        if (!selectedPortfolio || !editingPortfolioData) return;
        
        setSavingPortfolio(true);
        try {
            const { token } = managerStorage.get();
            if (!token) {
                throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
            }

            // rowIndex가 없으면 id를 기반으로 계산 (id는 1-based, rowIndex는 헤더 포함이므로 id + 1)
            const rowIndex = selectedPortfolio.rowIndex || selectedPortfolio.id + 1;
            
            // 이미지 업데이트: 새 이미지가 선택된 경우에만 업데이트
            const updateData: any = {
                title: editingPortfolioData.title,
                description: editingPortfolioData.description,
                location: editingPortfolioData.location,
                date: editingPortfolioData.date,
                equipment: editingPortfolioData.equipment
            };
            
            // 새 메인 이미지가 선택된 경우에만 업데이트
            if (editingPortfolioData.mainImage) {
                updateData.mainImage = editingPortfolioData.mainImage;
                updateData.mainImageExtra = editingPortfolioData.mainImageExtra || '';
            }
            
            // 새 상세 이미지가 선택된 경우에만 업데이트
            if (editingPortfolioData.detailImage1) {
                updateData.detailImage1 = editingPortfolioData.detailImage1;
                updateData.detailImageExtra1 = editingPortfolioData.detailImageExtra1 || '';
            }
            if (editingPortfolioData.detailImage2) {
                updateData.detailImage2 = editingPortfolioData.detailImage2;
                updateData.detailImageExtra2 = editingPortfolioData.detailImageExtra2 || '';
            }
            if (editingPortfolioData.detailImage3) {
                updateData.detailImage3 = editingPortfolioData.detailImage3;
                updateData.detailImageExtra3 = editingPortfolioData.detailImageExtra3 || '';
            }
            
            await updatePortfolioRow(token, rowIndex, updateData);

            // 목록 새로고침
            await fetchPortfolioItems();
            
            // 수정된 데이터로 selectedPortfolio 업데이트
            const updatedPortfolio = {
                ...selectedPortfolio,
                ...editingPortfolioData
            };
            setSelectedPortfolio(updatedPortfolio);
            setIsEditingPortfolio(false);
            setEditingPortfolioData(null);
            
            alert('시공사례가 성공적으로 수정되었습니다.');
        } catch (error) {
            console.error('시공사례 수정 오류:', error);
            
            // 401 오류 체크 및 로그아웃 처리
            if (checkAndHandle401Error(error)) {
                return;
            }
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`시공사례 수정에 실패했습니다.\n\n오류: ${errorMessage}`);
        } finally {
            setSavingPortfolio(false);
        }
    };

    // 편집 모드 시작
    const handleStartEdit = () => {
        setEditingPortfolioData({
            title: selectedPortfolio?.title || '',
            description: selectedPortfolio?.description || '',
            location: selectedPortfolio?.location || '',
            date: selectedPortfolio?.date || '',
            equipment: selectedPortfolio?.equipment || '',
            mainImage: '', // 새로 선택한 이미지만 저장
            mainImageExtra: '',
            detailImage1: '', // 새로 선택한 이미지만 저장
            detailImageExtra1: '',
            detailImage2: '',
            detailImageExtra2: '',
            detailImage3: '',
            detailImageExtra3: '',
            // 기존 이미지 정보는 별도로 보관
            hasOriginalMainImage: !!selectedPortfolio?.mainImageUrl,
            originalDetailImages: selectedPortfolio?.detailImageUrls || []
        });
        setIsEditingPortfolio(true);
    };

    // 편집 모드에서 메인 이미지 변경
    const handleEditMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;
        
        if (file.size > 10 * 1024 * 1024) {
            alert('이미지 파일 크기는 10MB 이하여야 합니다.');
                return;
            }
            
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        
        setEditingImageUploading(true);
        try {
            let compressedBase64 = await compressImageToBase64(file, {
                maxWidth: 2560,
                maxHeight: 2560,
                quality: 0.7,
                format: 'image/jpeg'
            });
            
            const initialSize = compressedBase64.length;
            if (initialSize > 100000) {
                compressedBase64 = await recompressBase64(compressedBase64, 95);
            }
            
            const finalSize = compressedBase64.length;
            if (finalSize > 100000) {
                alert(`⚠️ 이미지가 너무 큽니다!\n\n현재 크기: ${finalSize}자\n최대 허용: 100,000자 (2개 셀)\n\n더 작은 이미지를 사용하거나 해상도를 낮춰주세요.`);
                setEditingImageUploading(false);
                return;
            }
            
            let mainImage = compressedBase64;
            let mainImageExtra = '';
            if (finalSize > 50000) {
                mainImage = compressedBase64.substring(0, 50000);
                mainImageExtra = compressedBase64.substring(50000);
            }
            
            setEditingPortfolioData({
                ...editingPortfolioData,
                mainImage: mainImage,
                mainImageExtra: mainImageExtra
            });
        } catch (error) {
            console.error('이미지 인코딩 오류:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
        } finally {
            setEditingImageUploading(false);
        }
    };

    // 편집 모드에서 상세 이미지 변경
    const handleEditDetailImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;
        
        if (file.size > 10 * 1024 * 1024) {
            alert('이미지 파일 크기는 10MB 이하여야 합니다.');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        
        setEditingImageUploading(true);
        try {
            let compressedBase64 = await compressImageToBase64(file, {
                maxWidth: 2560,
                maxHeight: 2560,
                quality: 0.6,
                format: 'image/jpeg'
            });
            
            const initialSize = compressedBase64.length;
            if (initialSize > 100000) {
                compressedBase64 = await recompressBase64(compressedBase64, 95);
            }
            
            const finalSize = compressedBase64.length;
            if (finalSize > 100000) {
                alert(`⚠️ 이미지가 너무 큽니다!\n\n현재 크기: ${finalSize}자\n최대 허용: 100,000자 (2개 셀)\n\n더 작은 이미지를 사용하거나 해상도를 낮춰주세요.`);
                setEditingImageUploading(false);
                return;
            }
            
            let detailImage = compressedBase64;
            let detailImageExtra = '';
            if (finalSize > 50000) {
                detailImage = compressedBase64.substring(0, 50000);
                detailImageExtra = compressedBase64.substring(50000);
            }
            
            setEditingPortfolioData({
                ...editingPortfolioData,
                [`detailImage${index + 1}`]: detailImage,
                [`detailImageExtra${index + 1}`]: detailImageExtra
            });
        } catch (error) {
            console.error('이미지 인코딩 오류:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
        } finally {
            setEditingImageUploading(false);
        }
    };

    // 편집 취소
    const handleCancelEdit = () => {
        setIsEditingPortfolio(false);
        setEditingPortfolioData(null);
    };
    
    // 제품 편집 시작
    const handleStartEditProduct = () => {
        setEditingProductData({
            productName: selectedProduct?.productName || '',
            category: selectedProduct?.category || '',
            description: selectedProduct?.description || '',
            specification: selectedProduct?.specification || '',
            productImage: '', // 새로 선택한 이미지만 저장
            productImageExtra: '', // 새로 선택한 이미지 추가 부분
        });
        setHasOriginalProductImage(!!selectedProduct?.productImageUrl);
        setProductImageError(false);
        setIsEditingProduct(true);
    };
    
    // 제품 편집 취소
    const handleCancelEditProduct = () => {
        setIsEditingProduct(false);
        setEditingProductData(null);
    };
    
    // 제품 저장
    const handleSaveProduct = async () => {
        if (!selectedProduct) return;
        
        setSavingProduct(true);
        try {
            const { token } = managerStorage.get();
            if (!token) {
                throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
            }

            // rowIndex는 헤더 포함 1-based 인덱스
            // readProductData에서 계산된 rowIndex를 사용
            // writeProductToSheet는 A1:append를 사용하므로 헤더 없이 데이터만 추가됨
            // 따라서 실제 시트에는 헤더가 없을 가능성이 높음
            // 하지만 readProductData에서 헤더를 감지했을 수도 있으므로 확인 필요
            
            let rowIndex = selectedProduct.rowIndex;
            
            // rowIndex가 없거나 유효하지 않은 경우
            if (!rowIndex || rowIndex < 1) {
                // products 배열에서 인덱스를 찾아서 계산
                const productIndex = products.findIndex(p => p.id === selectedProduct.id);
                if (productIndex !== -1) {
                    // writeProductToSheet가 헤더 없이 추가하므로 헤더가 없을 가능성이 높음
                    // 하지만 안전하게 헤더가 있다고 가정하고 +2로 계산
                    rowIndex = productIndex + 2; // 헤더 있음 가정 (1행이 헤더, 2행부터 데이터)
                } else {
                    rowIndex = 2; // 기본값
                }
            }
            
            // rowIndex가 1인 경우 (헤더 행)는 건너뛰기
            if (rowIndex === 1) {
                rowIndex = 2;
            }
            
            console.log('🔍 rowIndex 계산:', {
                selectedProductRowIndex: selectedProduct.rowIndex,
                finalRowIndex: rowIndex,
                productId: selectedProduct.id,
                productIndexInArray: products.findIndex(p => p.id === selectedProduct.id),
                totalProducts: products.length
            });
            
            console.log('💾 제품 저장 시작:', {
                selectedProduct: {
                    id: selectedProduct.id,
                    rowIndex: selectedProduct.rowIndex,
                    productName: selectedProduct.productName
                },
                editingProductData: {
                    productName: editingProductData.productName,
                    category: editingProductData.category,
                    description: editingProductData.description?.substring(0, 50),
                    specification: editingProductData.specification?.substring(0, 50),
                    hasImage: !!editingProductData.productImage
                },
                calculatedRowIndex: rowIndex
            });
            
            // 이미지 업데이트: 새 이미지가 선택된 경우에만 업데이트
            const updateData: any = {
                productName: editingProductData.productName,
                category: editingProductData.category,
                description: editingProductData.description,
                specification: editingProductData.specification
            };
            
            // 새 제품 이미지가 선택된 경우에만 업데이트
            if (editingProductData.productImage) {
                updateData.productImage = editingProductData.productImage;
                updateData.productImageExtra = editingProductData.productImageExtra || '';
                console.log('🖼️ 제품 이미지 업데이트 데이터:', {
                    productImageLength: editingProductData.productImage.length,
                    productImageExtraLength: editingProductData.productImageExtra?.length || 0,
                    productImagePreview: editingProductData.productImage.substring(0, 50),
                    productImageExtraPreview: editingProductData.productImageExtra?.substring(0, 50) || ''
                });
            } else {
                console.log('⚠️ 제품 이미지가 없어서 이미지 업데이트를 건너뜁니다.');
            }
            
            console.log('📤 updateProductRow 호출:', {
                rowIndex,
                updateDataKeys: Object.keys(updateData),
                updateData: {
                    ...updateData,
                    productImage: updateData.productImage ? `${updateData.productImage.length}자` : undefined,
                    productImageExtra: updateData.productImageExtra ? `${updateData.productImageExtra.length}자` : undefined
                }
            });
            
            await updateProductRow(token, rowIndex, updateData);

            // 목록 새로고침
            await fetchProducts();
            
            // 수정된 데이터로 selectedProduct 업데이트
            const updatedProduct = {
                ...selectedProduct,
                ...editingProductData
            };
            if (editingProductData.productImage) {
                updatedProduct.productImageUrl = `data:image/jpeg;base64,${editingProductData.productImage}`;
            }
            setSelectedProduct(updatedProduct);
            setIsEditingProduct(false);
            setEditingProductData(null);
            
            alert('제품이 성공적으로 수정되었습니다.');
        } catch (error) {
            console.error('제품 수정 오류:', error);
            
            // 401 오류 체크 및 로그아웃 처리
            if (checkAndHandle401Error(error)) {
                return;
            }
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`제품 수정에 실패했습니다.\n\n오류: ${errorMessage}`);
        } finally {
            setSavingProduct(false);
        }
    };
    
    // 편집 모드에서 제품 이미지 변경
    const handleEditProductImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) {
            setEditingProductData((prev: any) => ({
                ...prev,
                productImage: hasOriginalProductImage ? selectedProduct.productImage : '',
            }));
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            alert('이미지 파일 크기는 10MB 이하여야 합니다.');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        
        setEditingProductImageUploading(true);
        try {
            console.log('📸 편집 모드 제품 이미지 압축 시작:', {
                원본크기: `${Math.round(file.size / 1024)}KB`,
                파일명: file.name
            });
            
            let compressedBase64 = await compressImageToBase64(file, {
                maxWidth: 2560,
                maxHeight: 2560,
                quality: 0.5,
                format: 'image/jpeg'
            });
            
            const initialSize = compressedBase64.length;
            const initialSizeKB = Math.round(getBase64Size(compressedBase64) / 1024);
            console.log(`✅ 1단계 압축 완료: ${initialSize}자 (${initialSizeKB}KB)`);
            
            // 2단계: 100,000자 초과 시 재압축
            if (initialSize > 100000) {
                console.log('🔄 2단계 재압축 시작 (100,000자 이하 목표)...');
                compressedBase64 = await recompressBase64(compressedBase64, 95);
                const finalSize = compressedBase64.length;
                const finalSizeKB = Math.round(getBase64Size(compressedBase64) / 1024);
                console.log(`✅ 2단계 재압축 완료: ${finalSize}자 (${finalSizeKB}KB)`);
            }
            
            const finalSize = compressedBase64.length;
            const finalSizeKB = Math.round(getBase64Size(compressedBase64) / 1024);
            
            // 100,000자 초과 시 업로드 차단 (2개 셀 = 50,000자 x 2)
            if (finalSize > 100000) {
                alert(`⚠️ 이미지가 너무 큽니다!\n\n현재 크기: ${finalSize}자 (${finalSizeKB}KB)\n최대 허용: 100,000자 (2개 셀)\n\n더 작은 이미지를 사용하거나 해상도를 낮춰주세요.`);
                setEditingProductImageUploading(false);
                return;
            }
            
            // 50,000자 초과 시 2개 셀에 분할 저장
            let productImage = compressedBase64;
            let productImageExtra = '';
            
            if (finalSize > 50000) {
                productImage = compressedBase64.substring(0, 50000);
                productImageExtra = compressedBase64.substring(50000);
                console.log(`✂️ 제품 이미지 분할: ${finalSize}자 → ${productImage.length}자 + ${productImageExtra.length}자`);
                console.log(`📊 분할 저장: 첫 번째 셀 ${Math.round(getBase64Size(productImage) / 1024)}KB, 두 번째 셀 ${Math.round(getBase64Size(productImageExtra) / 1024)}KB`);
            } else {
                console.log(`✅ 제품 이미지 최적화 완료: ${finalSize}자 (${finalSizeKB}KB) - 단일 셀 저장`);
            }
            
            setEditingProductData((prev: any) => ({
                ...prev,
                productImage: productImage,
                productImageExtra: productImageExtra,
            }));
        } catch (error) {
            console.error('이미지 인코딩 오류:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
        } finally {
            setEditingProductImageUploading(false);
        }
    };
    
    // 제품 목록 가져오기
    const fetchProducts = async () => {
        setProductLoading(true);
        try {
            const { token } = managerStorage.get();
            if (!token) {
                throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
            }

            const productsData = await readProductData(token);
            setProducts(productsData);
        } catch (error) {
            console.error('제품 데이터 가져오기 오류:', error);
            
            // 401 오류 체크 및 로그아웃 처리
            if (checkAndHandle401Error(error)) {
                return;
            }
            
            setProducts([]);
        } finally {
            setProductLoading(false);
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
            // 파일 크기 체크 (10MB 제한 - 압축 후 크기 감소 예상)
            if (file.size > 10 * 1024 * 1024) {
                alert('이미지 파일 크기는 10MB 이하여야 합니다.');
            return;
        }

            // 파일 타입 체크
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드 가능합니다.');
                return;
            }

            setImageUploading(true);
            
            try {
                console.log('📸 이미지 압축 시작:', {
                    원본크기: `${Math.round(file.size / 1024)}KB`,
                    파일명: file.name
                });

                // 1단계: 적절한 품질로 압축 (2560x2560, quality 0.5) - 2개 셀 사용 시 최대 100,000자까지 가능
                let compressedBase64 = await compressImageToBase64(file, {
                    maxWidth: 2560,
                    maxHeight: 2560,
                    quality: 0.5,
                    format: 'image/jpeg'
                });

                const initialSize = compressedBase64.length;
                const initialSizeKB = Math.round(getBase64Size(compressedBase64) / 1024);
                console.log(`✅ 1단계 압축 완료: ${initialSize}자 (${initialSizeKB}KB)`);

                // 2단계: 100,000자 초과 시 재압축 (목표: 95KB ≈ 127,000자, 안전 마진)
                if (initialSize > 100000) {
                    console.log('🔄 2단계 재압축 시작 (100,000자 이하 목표)...');
                    compressedBase64 = await recompressBase64(compressedBase64, 95);
                    const finalSize = compressedBase64.length;
                    const finalSizeKB = Math.round(getBase64Size(compressedBase64) / 1024);
                    console.log(`✅ 2단계 재압축 완료: ${finalSize}자 (${finalSizeKB}KB)`);
                }

                const finalSize = compressedBase64.length;
                const finalSizeKB = Math.round(getBase64Size(compressedBase64) / 1024);
                
                // 100,000자 초과 시 업로드 차단 (2개 셀 = 50,000자 x 2)
                if (finalSize > 100000) {
                    alert(`⚠️ 이미지가 너무 큽니다!\n\n현재 크기: ${finalSize}자 (${finalSizeKB}KB)\n최대 허용: 100,000자 (2개 셀)\n\n더 작은 이미지를 사용하거나 해상도를 낮춰주세요.`);
                    setImageUploading(false);
                    return;
                }
                
                // 50,000자 초과 시 2개 셀에 분할 저장
                let mainImage = compressedBase64;
                let extraImage = '';
                
                if (finalSize > 50000) {
                    mainImage = compressedBase64.substring(0, 50000);
                    extraImage = compressedBase64.substring(50000);
                    console.log(`✂️ 이미지 분할: ${finalSize}자 → ${mainImage.length}자 + ${extraImage.length}자`);
                    console.log(`📊 분할 저장: 첫 번째 셀 ${Math.round(getBase64Size(mainImage) / 1024)}KB, 두 번째 셀 ${Math.round(getBase64Size(extraImage) / 1024)}KB`);
            } else {
                    console.log(`✅ 이미지 최적화 완료: ${finalSize}자 (${finalSizeKB}KB) - 단일 셀 저장`);
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
                productImageExtra: '',
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

    // Support 자료 목록 불러오기
    const fetchSupportItems = async () => {
        setSupportLoading(true);
        try {
            const { token } = managerStorage.get();
            if (!token) {
                throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
            }

            const supportData = await readSupportData(token);
            setSupportItems(supportData);
        } catch (error) {
            console.error('Support 자료 데이터 가져오기 오류:', error);

            // 401 오류 체크 및 로그아웃 처리
            if (checkAndHandle401Error(error)) {
                return;
            }

            setSupportItems([]);
        } finally {
            setSupportLoading(false);
        }
    };

    // Support 자료 파일 업로드 핸들러
    const handleSupportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        
        if (!file) return;
        
        // 파일 크기 체크 (50MB 제한)
        if (file.size > 50 * 1024 * 1024) {
            alert('파일 크기는 50MB 이하여야 합니다.');
            return;
        }
        
        setSupportFileUploading(true);
        
        try {
            const { token } = managerStorage.get();
            if (!token) {
                alert('로그인이 필요합니다.');
                return;
            }

            // Google Drive에 파일 업로드
            const result = await uploadToGoogleDrive(file, token, '고객지원_자료');
            
            // 파일 ID를 URL로 변환
            const fileUrl = `https://drive.google.com/file/d/${result.fileId}/view`;
            
            setSupportForm(prev => ({
                ...prev,
                file: file,
                fileUrl: result.fileId // 파일 ID 저장 (나중에 URL 변환 가능)
            }));
            
            alert('파일이 업로드되었습니다.');
        } catch (error) {
            console.error('파일 업로드 오류:', error);
            alert('파일 업로드 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
            setSupportFileUploading(false);
        }
    };

    // Support 자료 저장 핸들러
    const handleSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!supportForm.title || !supportForm.desc || !supportForm.fileUrl) {
            alert('제목, 설명, 파일을 모두 입력해주세요.');
            return;
        }

        try {
            const { token } = managerStorage.get();
            if (!token) {
                alert('로그인이 필요합니다. 다시 로그인해주세요.');
                return;
            }

            setSavingSupport(true);

            const supportData: SupportFormData = {
                title: supportForm.title,
                desc: supportForm.desc,
                fileUrl: supportForm.fileUrl, // Google Drive 파일 ID
                category: supportForm.category
            };

            await writeSupportToSheet(token, supportData);
            
            alert('고객 지원 자료가 저장되었습니다.');
            
            // 폼 초기화
            setSupportForm({
                title: '',
                desc: '',
                category: '기타',
                file: null,
                fileUrl: ''
            });
            
            setShowAddSupport(false);
            
            // 목록 새로고침
            await fetchSupportItems();
        } catch (error) {
            console.error('Support 자료 저장 오류:', error);
            if (checkAndHandle401Error(error)) {
                return;
            }
            alert('저장 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
            setSavingSupport(false);
        }
    };

    // 제품 관리 페이지 진입 시 제품 목록 불러오기
    useEffect(() => {
        if (currentView === 'products') {
            fetchProducts();
        } else if (currentView === 'portfolio') {
            fetchPortfolioItems();
        } else if (currentView === 'support') {
            fetchSupportItems();
        }
    }, [currentView]);

    return (
        <div className="min-h-screen bg-slate-900">
            <div className="flex justify-center items-start h-screen pt-24">
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
                                        onClick={() => setCurrentView('support')}
                                className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl p-8 transition-all duration-300 hover:scale-105"
                                                    >
                                <h3 className="text-2xl font-semibold text-white mb-2">고객 지원 자료 관리</h3>
                                <p className="text-gray-300">고객 지원 자료를 업로드하고 관리할 수 있습니다</p>
                                                    </button>
                                    
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
                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 max-w-6xl w-full max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
                        {/* 상단 고정 헤더 */}
                        <div className="sticky top-0 z-20 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm -m-6 p-6 mb-6 border-b border-slate-700/50 flex-shrink-0">
                            <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-white">시공사례 관리</h2>
                            <div className="space-x-4">
                                <button
                                    onClick={() => setShowAddPortfolio(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                >
                                    새 시공사례 추가
                                </button>
                                <button
                                    onClick={() => setCurrentView('menu')}
                                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                >
                                    메뉴로 돌아가기
                                </button>
                            </div>
                        </div>
                        
                            {/* 시공사례 목록 헤더 */}
                            <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-700/50">
                                <h3 className="text-xl font-semibold text-white">등록된 시공사례 목록</h3>
                                {portfolioItems.length > 0 && (
                                    <span className="text-sm text-gray-400 bg-slate-700/50 px-3 py-1 rounded-full">
                                        총 {portfolioItems.length}개
                                    </span>
                                )}
                            </div>
                            </div>
                        
                        {/* 시공사례 목록 */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            
                            {/* 페이지네이션 정보 */}
                            {portfolioItems.length > portfolioItemsPerPage && (
                                <div className="flex justify-between items-center mb-4 text-sm text-gray-400 flex-shrink-0">
                                    <span>
                                        {((currentPortfolioPage - 1) * portfolioItemsPerPage) + 1} - {Math.min(currentPortfolioPage * portfolioItemsPerPage, portfolioItems.length)} / {portfolioItems.length}개 표시
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setCurrentPortfolioPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPortfolioPage === 1}
                                            className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-800/30 disabled:text-gray-600 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                                        >
                                            이전
                                        </button>
                                        <span className="px-3 py-1 bg-slate-700/50 rounded-lg">
                                            {currentPortfolioPage} / {Math.ceil(portfolioItems.length / portfolioItemsPerPage)}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPortfolioPage(prev => Math.min(Math.ceil(portfolioItems.length / portfolioItemsPerPage), prev + 1))}
                                            disabled={currentPortfolioPage === Math.ceil(portfolioItems.length / portfolioItemsPerPage)}
                                            className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-800/30 disabled:text-gray-600 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                                        >
                                            다음
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex-1 overflow-hidden">
                                {portfolioLoading ? (
                                    <div className="text-center py-8 h-full flex items-center justify-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                        <p className="text-gray-300 mt-2">로딩 중...</p>
                                    </div>
                                ) : portfolioItems.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-700/30 rounded-lg border border-slate-600/50 h-full flex flex-col items-center justify-center">
                                        <p className="text-gray-400 mb-4">등록된 시공사례가 없습니다</p>
                                        <button
                                            onClick={() => setShowAddPortfolio(true)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                        >
                                            첫 번째 시공사례 추가하기
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-slate-800/20 rounded-lg border border-slate-600/30 overflow-hidden h-full">
                                        <div className="h-full overflow-y-auto custom-scrollbar">
                                            <table className="w-full">
                                                <thead className="bg-slate-700/50 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-slate-600">제목</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-slate-600">위치</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-slate-600">날짜</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-slate-600">설명</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-slate-600">장비</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                            {portfolioItems
                                                .slice(
                                                    (currentPortfolioPage - 1) * portfolioItemsPerPage,
                                                    currentPortfolioPage * portfolioItemsPerPage
                                                )
                                                .map((item) => (
                                                        <tr 
                                                            key={item.id} 
                                                            onClick={() => {
                                                                setSelectedPortfolio(item);
                                                                setShowPortfolioDetail(true);
                                                            }}
                                                            className="bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-colors duration-200 border-b border-slate-600/30"
                                                        >
                                                            <td className="px-4 py-3 text-sm text-white font-medium">
                                                                {item.title || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-300">
                                                                {item.location || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-300">
                                                                {item.date || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                                                                {item.description || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                                                                {item.equipment || '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : currentView === 'products' ? (
                    // 제품 관리 화면
                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 max-w-6xl w-full max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
                        {/* 상단 고정 헤더 */}
                        <div className="sticky top-0 z-20 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm -m-6 p-6 mb-6 border-b border-slate-700/50 flex-shrink-0">
                            <div className="flex justify-between items-center">
                                    <h2 className="text-3xl font-bold text-white">제품 관리</h2>
                            <div className="space-x-4">
                                        <button
                                            onClick={() => setShowAddProduct(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
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
                                </div>

                        {/* 제품 목록 헤더 */}
                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-700/50">
                            <h3 className="text-xl font-semibold text-white">등록된 제품 목록</h3>
                            {products.length > 0 && (
                                <span className="text-sm text-gray-400 bg-slate-700/50 px-3 py-1 rounded-full">
                                    총 {products.length}개
                                </span>
                            )}
                        </div>
                        
                        {/* 제품 목록 */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            
                            {/* 페이지네이션 정보 */}
                            {products.length > productItemsPerPage && (
                                <div className="flex justify-between items-center mb-4 text-sm text-gray-400 flex-shrink-0">
                                    <span>
                                        {((currentProductPage - 1) * productItemsPerPage) + 1} - {Math.min(currentProductPage * productItemsPerPage, products.length)} / {products.length}개 표시
                                    </span>
                                    <div className="flex space-x-2">
                                <button
                                            onClick={() => setCurrentProductPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentProductPage === 1}
                                            className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-800/30 disabled:text-gray-600 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                                        >
                                            이전
                                </button>
                                        <span className="px-3 py-1 bg-slate-700/50 rounded-lg">
                                            {currentProductPage} / {Math.ceil(products.length / productItemsPerPage)}
                                        </span>
                                <button
                                            onClick={() => setCurrentProductPage(prev => Math.min(Math.ceil(products.length / productItemsPerPage), prev + 1))}
                                            disabled={currentProductPage === Math.ceil(products.length / productItemsPerPage)}
                                            className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-800/30 disabled:text-gray-600 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                                        >
                                            다음
                                </button>
                                    </div>
                                </div>
                            )}
                                    
                                    <div className="flex-1 overflow-hidden">
                                {productLoading ? (
                                            <div className="text-center py-8 h-full flex items-center justify-center">
                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                                <p className="text-gray-300 mt-2">로딩 중...</p>
                                            </div>
                                        ) : products.length === 0 ? (
                                            <div className="text-center py-12 bg-slate-700/30 rounded-lg border border-slate-600/50 h-full flex flex-col items-center justify-center">
                                                <p className="text-gray-400 mb-4">등록된 제품이 없습니다</p>
                                                <button
                                                    onClick={() => setShowAddProduct(true)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                                >
                                                    첫 번째 제품 추가하기
                                                </button>
                                            </div>
                                        ) : (
                                    <div className="bg-slate-800/20 rounded-lg border border-slate-600/30 overflow-hidden h-full">
                                        <div className="h-full overflow-y-auto custom-scrollbar">
                                            <table className="w-full">
                                                <thead className="bg-slate-700/50 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-slate-600">모델명</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-slate-600">제품종류</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-slate-600">설명</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-slate-600">사양</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {products
                                                        .slice(
                                                            (currentProductPage - 1) * productItemsPerPage,
                                                            currentProductPage * productItemsPerPage
                                                        )
                                                        .map((item) => (
                                                            <tr 
                                                                key={item.id} 
                                                                onClick={() => {
                                                                    console.log('🔍 제품 상세 열기:', {
                                                                        productId: item.id,
                                                                        productName: item.productName,
                                                                        productImageUrl: item.productImageUrl ? `${item.productImageUrl.substring(0, 60)}...` : '없음',
                                                                        productImageLength: item.productImage?.length || 0,
                                                                        productImageExtraLength: item.productImageExtra?.length || 0,
                                                                        hasProductImageUrl: !!item.productImageUrl
                                                                    });
                                                                    setSelectedProduct(item);
                                                                    setShowProductDetail(true);
                                                                    setProductImageError(false);
                                                                }}
                                                                className="bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-colors duration-200 border-b border-slate-600/30"
                                                            >
                                                                <td className="px-4 py-3 text-sm text-white font-medium">
                                                                    {item.productName || '-'}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-300">
                                                                    {item.category || '-'}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                                                                    {item.description || '-'}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                                                                    {item.specification || '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                        <div className="mt-2 space-y-2">
                                            <div className="flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                                <span className="text-sm text-gray-400">이미지 압축 중...</span>
                                            </div>
                                            <p className="text-xs text-gray-500 ml-6">
                                                최적화를 위해 이미지를 압축하고 있습니다. 잠시만 기다려주세요.
                                            </p>
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

                                            // OAuth 토큰 가져오기
                                            const { token } = managerStorage.get();
                                            if (!token) {
                                                alert('인증이 필요합니다. 다시 로그인해주세요.');
                                                return;
                                            }

                                            console.log('📤 제품 저장 데이터:', {
                                                productName: productForm.productName,
                                                category: productForm.category,
                                                description: productForm.description,
                                                specification: productForm.specification,
                                                productImageLength: productForm.productImage.length,
                                                productImageExtraLength: productForm.productImageExtra?.length || 0
                                            });

                                            // Google Sheets API로 직접 저장 (분할 이미지 그대로 전달)
                                            await writeProductToSheet(token, {
                                                productName: productForm.productName.trim(),
                                                category: productForm.category.trim(),
                                                description: productForm.description.trim(),
                                                specification: productForm.specification.trim(),
                                                productImage: productForm.productImage,
                                                productImageExtra: productForm.productImageExtra || '',
                                            }, process.env.REACT_APP_PRODUCTS_SPREADSHEET_ID || '1p8P_4ymeoSof5ExXClamxYwtvOtDK9Q1Sw4gSawu9uo', 'productList');
                                            
                                            alert('제품이 성공적으로 저장되었습니다!');
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
                                            
                                        } catch (error) {
                                            console.error('제품 저장 오류:', error);
                                            
                                            // 401 오류 체크 및 로그아웃 처리
                                            if (checkAndHandle401Error(error)) {
                                                return;
                                            }
                                            
                                            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
                                            alert(`제품 저장 중 오류가 발생했습니다: ${errorMessage}`);
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
                                
            {/* 시공사례 추가 모달 */}
            {showAddPortfolio && (
                <div className="fixed inset-0 z-50">
                    <div 
                        className="absolute inset-0 bg-black/70" 
                        onClick={() => setShowAddPortfolio(false)}
                    />
                    <div className="absolute inset-0 flex items-start justify-center p-4 overflow-y-auto pt-8">
                        <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-4">
                            <div className="flex items-center justify-between p-6 border-b border-slate-700">
                                <h3 className="text-2xl font-bold text-white">새 시공사례 추가</h3>
                                <button
                                    className="text-gray-400 hover:text-white text-2xl"
                                    onClick={() => setShowAddPortfolio(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <form onSubmit={handleUploadSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    제목 *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={uploadForm.title}
                                    onChange={handleUploadFormChange}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400"
                                        placeholder="시공사례 제목을 입력하세요"
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
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400 resize-none"
                                        placeholder="시공사례에 대한 상세 설명을 입력하세요"
                                    required
                                />
                            </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    시공 장소 *
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={uploadForm.location}
                                    onChange={handleUploadFormChange}
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400"
                                            placeholder="예: 서울시 강남구"
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
                                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white"
                                    required
                                />
                                    </div>
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
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400 resize-none"
                                        placeholder="예: E212 스피커 2대, 조명기 10대"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    메인 이미지
                                </label>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={handleMainImageChange}
                                        disabled={portfolioImageUploading}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
                                    />
                                <p className="text-sm text-gray-400 mt-1">대표 이미지를 선택하세요. (최대 5MB, 16000자까지, 8000자 초과 시에만 분할 저장)</p>
                                
                                    {portfolioImageUploading && (
                                        <div className="mt-2 flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                            <span className="text-sm text-gray-400">이미지 처리 중...</span>
                                </div>
                                    )}
                                
                                    {uploadForm.mainImageFile && !portfolioImageUploading && (
                                        <div className="mt-3 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-400">선택된 파일: {uploadForm.mainImageFile.name}</p>
                                {uploadForm.mainImage && (
                                                        <div className="mt-1 space-y-1">
                                                            <p className="text-xs text-green-400">
                                                                ✅ 첫 번째 부분: {uploadForm.mainImage.length}자 
                                                                ({Math.round(getBase64Size(uploadForm.mainImage) / 1024)}KB)
                                                            </p>
                                                            {uploadForm.mainImageExtra && (
                                                                <p className="text-xs text-blue-400">
                                                                    ➕ 추가 부분: {uploadForm.mainImageExtra.length}자 
                                                                    ({Math.round(getBase64Size(uploadForm.mainImageExtra) / 1024)}KB)
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-500">
                                                                📊 총 크기: {uploadForm.mainImage.length + (uploadForm.mainImageExtra?.length || 0)}자
                                                                {uploadForm.mainImageExtra ? ' (2개 필드로 분할 저장)' : ' (단일 필드 저장)'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            <button
                                                type="button"
                                                onClick={removeMainImage}
                                                    className="text-red-400 hover:text-red-300 text-sm"
                                            >
                                                    제거
                                            </button>
                                        </div>

                                            <img
                                                src={URL.createObjectURL(uploadForm.mainImageFile)}
                                                alt="메인 이미지 미리보기"
                                                className="w-full max-w-xs rounded-lg border border-slate-600"
                                            />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    상세 이미지 (최대 3개)
                                </label>
                                
                                {/* 상세 이미지 1 */}
                                <div className="border border-slate-600/50 rounded-lg p-4 bg-slate-800/30">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        상세 이미지 1
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={(e) => handleDetailImageChange(0, e)}
                                        disabled={portfolioImageUploading}
                                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 disabled:opacity-50"
                                    />
                                    
                                    {uploadForm.detailImageFiles[0] && !portfolioImageUploading && (
                                        <div className="mt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-400">{uploadForm.detailImageFiles[0].name}</p>
                                                    <p className="text-xs text-green-400">
                                                        ✅ 첫 번째 부분: {uploadForm.detailImage1.length}자
                                                    </p>
                                                    {uploadForm.detailImageExtra1 && (
                                                        <p className="text-xs text-blue-400">
                                                            ➕ 추가 부분: {uploadForm.detailImageExtra1.length}자
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        📊 총 크기: {uploadForm.detailImage1.length + (uploadForm.detailImageExtra1?.length || 0)}자
                                                    </p>
                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => removeDetailImage(0)}
                                                    className="text-red-400 hover:text-red-300 text-xs"
                                                >
                                                    제거
                                                </button>
                                            </div>
                                            <img
                                                src={URL.createObjectURL(uploadForm.detailImageFiles[0])}
                                                alt="상세 이미지 1"
                                                className="w-full max-w-xs rounded-lg border border-slate-600"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* 상세 이미지 2 */}
                                <div className="border border-slate-600/50 rounded-lg p-4 bg-slate-800/30">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        상세 이미지 2
                                        </label>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={(e) => handleDetailImageChange(1, e)}
                                        disabled={portfolioImageUploading}
                                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 disabled:opacity-50"
                                    />
                                    
                                    {uploadForm.detailImageFiles[1] && !portfolioImageUploading && (
                                        <div className="mt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-400">{uploadForm.detailImageFiles[1].name}</p>
                                                    <p className="text-xs text-green-400">
                                                        ✅ 첫 번째 부분: {uploadForm.detailImage2.length}자
                                                    </p>
                                                    {uploadForm.detailImageExtra2 && (
                                                        <p className="text-xs text-blue-400">
                                                            ➕ 추가 부분: {uploadForm.detailImageExtra2.length}자
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        📊 총 크기: {uploadForm.detailImage2.length + (uploadForm.detailImageExtra2?.length || 0)}자
                                                    </p>
                                                </div>
                                                    <button
                                                        type="button"
                                                    onClick={() => removeDetailImage(1)}
                                                    className="text-red-400 hover:text-red-300 text-xs"
                                                    >
                                                    제거
                                                    </button>
                                                </div>
                                            <img
                                                src={URL.createObjectURL(uploadForm.detailImageFiles[1])}
                                                alt="상세 이미지 2"
                                                className="w-full max-w-xs rounded-lg border border-slate-600"
                                            />
                                        </div>
                                    )}
                                    </div>

                                {/* 상세 이미지 3 */}
                                <div className="border border-slate-600/50 rounded-lg p-4 bg-slate-800/30">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        상세 이미지 3
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={(e) => handleDetailImageChange(2, e)}
                                        disabled={portfolioImageUploading}
                                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 disabled:opacity-50"
                                    />
                                    
                                    {uploadForm.detailImageFiles[2] && !portfolioImageUploading && (
                                        <div className="mt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-400">{uploadForm.detailImageFiles[2].name}</p>
                                                    <p className="text-xs text-green-400">
                                                        ✅ 첫 번째 부분: {uploadForm.detailImage3.length}자
                                                    </p>
                                                    {uploadForm.detailImageExtra3 && (
                                                        <p className="text-xs text-blue-400">
                                                            ➕ 추가 부분: {uploadForm.detailImageExtra3.length}자
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        📊 총 크기: {uploadForm.detailImage3.length + (uploadForm.detailImageExtra3?.length || 0)}자
                                                    </p>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => removeDetailImage(2)}
                                                    className="text-red-400 hover:text-red-300 text-xs"
                                                >
                                                    제거
                                                </button>
                                            </div>
                                            <img
                                                src={URL.createObjectURL(uploadForm.detailImageFiles[2])}
                                                alt="상세 이미지 3"
                                                className="w-full max-w-xs rounded-lg border border-slate-600"
                                            />
                                    </div>
                                )}
                                </div>
                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddPortfolio(false)}
                                        className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
                                    >
                                        취소
                                    </button>
                            <button
                                type="submit"
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                        시공사례 업로드
                            </button>
                                </div>
            </form>
                    </div>
                </div>
            </div>
            )}

            {/* 시공사례 상세 보기 모달 */}
            {showPortfolioDetail && selectedPortfolio && (
                <div className="fixed inset-0 z-50">
                    <div 
                        className="absolute inset-0 bg-black/70" 
                        onClick={() => {
                            if (isEditingPortfolio) {
                                if (window.confirm('편집 중인 내용이 저장되지 않습니다. 정말 닫으시겠습니까?')) {
                                    setShowPortfolioDetail(false);
                                    setSelectedPortfolio(null);
                                    setIsEditingPortfolio(false);
                                    setEditingPortfolioData(null);
                                }
                            } else {
                                setShowPortfolioDetail(false);
                                setSelectedPortfolio(null);
                            }
                        }}
                    />
                    <div className="absolute inset-0 flex items-start justify-center p-4 overflow-y-auto pt-8">
                        <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-4">
                            <div className="flex items-center justify-between p-6 border-b border-slate-700">
                                <h3 className="text-2xl font-bold text-white">시공사례 상세</h3>
                                <div className="flex items-center gap-3">
                                    {!isEditingPortfolio && (
                                        <button
                                            onClick={handleStartEdit}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                        >
                                            수정
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (isEditingPortfolio) {
                                                if (window.confirm('편집 중인 내용이 저장되지 않습니다. 정말 닫으시겠습니까?')) {
                                                    setShowPortfolioDetail(false);
                                                    setSelectedPortfolio(null);
                                                    setIsEditingPortfolio(false);
                                                    setEditingPortfolioData(null);
                                                }
                                            } else {
                                                setShowPortfolioDetail(false);
                                                setSelectedPortfolio(null);
                                            }
                                        }}
                                        className="text-gray-400 hover:text-white text-lg font-medium px-3 py-1 rounded transition-colors"
                                    >
                                        닫기
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {/* 기본 정보 */}
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-start">
                                            <label className="text-sm font-medium text-gray-400 w-24 flex-shrink-0 text-left">제목</label>
                                            {isEditingPortfolio ? (
                                                <input
                                                    type="text"
                                                    value={editingPortfolioData?.title || ''}
                                                    onChange={(e) => setEditingPortfolioData({...editingPortfolioData, title: e.target.value})}
                                                    className="text-white text-base flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            ) : (
                                                <p className="text-white text-base flex-1 text-left">{selectedPortfolio.title || '-'}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <label className="text-sm font-medium text-gray-400 w-24 flex-shrink-0 text-left">위치</label>
                                            {isEditingPortfolio ? (
                                                <input
                                                    type="text"
                                                    value={editingPortfolioData?.location || ''}
                                                    onChange={(e) => setEditingPortfolioData({...editingPortfolioData, location: e.target.value})}
                                                    className="text-white text-base flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            ) : (
                                                <p className="text-white text-base flex-1 text-left">{selectedPortfolio.location || '-'}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <label className="text-sm font-medium text-gray-400 w-24 flex-shrink-0 text-left">설치 날짜</label>
                                            {isEditingPortfolio ? (
                                                <input
                                                    type="text"
                                                    value={editingPortfolioData?.date || ''}
                                                    onChange={(e) => setEditingPortfolioData({...editingPortfolioData, date: e.target.value})}
                                                    className="text-white text-base flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="예: 2025. 1. 15"
                                                />
                                            ) : (
                                                <p className="text-white text-base flex-1 text-left">{selectedPortfolio.date || '-'}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <label className="text-sm font-medium text-gray-400 w-24 flex-shrink-0 text-left">설명</label>
                                            {isEditingPortfolio ? (
                                                <textarea
                                                    value={editingPortfolioData?.description || ''}
                                                    onChange={(e) => setEditingPortfolioData({...editingPortfolioData, description: e.target.value})}
                                                    className="text-white text-base flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                                    rows={4}
                                                />
                                            ) : (
                                                <p className="text-white text-base flex-1 text-left whitespace-pre-wrap">{selectedPortfolio.description || '-'}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <label className="text-sm font-medium text-gray-400 w-24 flex-shrink-0 text-left">장비</label>
                                            {isEditingPortfolio ? (
                                                <input
                                                    type="text"
                                                    value={editingPortfolioData?.equipment || ''}
                                                    onChange={(e) => setEditingPortfolioData({...editingPortfolioData, equipment: e.target.value})}
                                                    className="text-white text-base flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            ) : (
                                                <p className="text-white text-base flex-1 text-left">{selectedPortfolio.equipment || '-'}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 메인 이미지 */}
                                <div>
                                    <h5 className="text-lg font-semibold text-white mb-3 border-b border-slate-700 pb-3 text-left">대표 이미지</h5>
                                    {isEditingPortfolio ? (
                                        <div className="space-y-3">
                                            <div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleEditMainImageChange}
                                                    disabled={editingImageUploading}
                                                    className="w-full bg-slate-800 text-white rounded-lg border border-slate-600 px-3 py-2 disabled:opacity-50"
                                                />
                                                <div className="mt-2 space-y-1">
                                                    {editingPortfolioData?.hasOriginalMainImage && !editingPortfolioData?.mainImage && (
                                                        <div className="bg-blue-900/30 border border-blue-500/50 rounded px-3 py-2">
                                                            <p className="text-sm text-blue-300 font-medium">기존 이미지 있음</p>
                                                            <p className="text-xs text-blue-400 mt-1">현재 저장된 대표 이미지가 있습니다. 새 이미지를 선택하면 기존 이미지가 교체됩니다.</p>
                                                        </div>
                                                    )}
                                                    {editingPortfolioData?.mainImage && (
                                                        <div className="bg-green-900/30 border border-green-500/50 rounded px-3 py-2">
                                                            <p className="text-sm text-green-300 font-medium">새 이미지 선택됨</p>
                                                            <p className="text-xs text-green-400 mt-1">저장 시 기존 이미지가 새 이미지로 교체됩니다.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {editingImageUploading && (
                                                <div className="flex items-center space-x-2 text-sm text-gray-400">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                                    <span>이미지 압축 중...</span>
                                                </div>
                                            )}
                                            {(editingPortfolioData?.mainImage || selectedPortfolio.mainImageUrl) && (
                                                <div className="relative">
                                                    <div className="absolute top-2 left-2 z-10">
                                                        {editingPortfolioData?.mainImage ? (
                                                            <span className="bg-green-600 text-white text-xs font-medium px-2 py-1 rounded">새 이미지</span>
                                                        ) : editingPortfolioData?.hasOriginalMainImage ? (
                                                            <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">기존 이미지</span>
                                                        ) : null}
                                                    </div>
                                                    <img 
                                                        src={editingPortfolioData?.mainImage 
                                                            ? decodeBase64Image(editingPortfolioData.mainImage + (editingPortfolioData.mainImageExtra || ''))
                                                            : selectedPortfolio.mainImageUrl
                                                        } 
                                                        alt={selectedPortfolio.title || '대표 이미지'}
                                                        className="max-w-full max-h-96 object-contain rounded-lg border border-slate-600 shadow-lg"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        selectedPortfolio.mainImageUrl ? (
                                            <div className="flex justify-start">
                                                <img 
                                                    src={selectedPortfolio.mainImageUrl} 
                                                    alt={selectedPortfolio.title || '대표 이미지'}
                                                    className="max-w-full max-h-96 object-contain rounded-lg border border-slate-600 shadow-lg"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        const parent = target.parentElement;
                                                        if (parent) {
                                                            parent.innerHTML = '<p class="text-gray-400 text-center py-8">이미지를 불러올 수 없습니다.</p>';
                                                        }
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-slate-800/50 rounded-lg border border-slate-600">
                                                <p className="text-gray-400">대표 이미지가 없습니다.</p>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* 상세 이미지 갤러리 */}
                                <div>
                                    <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-3">
                                        <h5 className="text-lg font-semibold text-white">상세 이미지</h5>
                                        {!isEditingPortfolio && selectedPortfolio.detailImageUrls && selectedPortfolio.detailImageUrls.length > 0 && (
                                            <span className="text-sm text-gray-400">총 {selectedPortfolio.detailImageUrls.length}개</span>
                                        )}
                                    </div>
                                    {isEditingPortfolio ? (
                                        <div className="space-y-4">
                                            {[0, 1, 2].map((index) => {
                                                const detailImage = editingPortfolioData?.[`detailImage${index + 1}` as keyof typeof editingPortfolioData] as string || '';
                                                const detailImageExtra = editingPortfolioData?.[`detailImageExtra${index + 1}` as keyof typeof editingPortfolioData] as string || '';
                                                const imageUrl = detailImage ? decodeBase64Image(detailImage + detailImageExtra) : null;
                                                const originalImageUrl = selectedPortfolio.detailImageUrls?.[index];
                                                const hasOriginalImage = !!originalImageUrl;
                                                const hasNewImage = !!detailImage;
                                                
                                                return (
                                                    <div key={index} className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-300">상세 이미지 {index + 1}</label>
                                                        <div>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleEditDetailImageChange(e, index)}
                                                                disabled={editingImageUploading}
                                                                className="w-full bg-slate-800 text-white rounded-lg border border-slate-600 px-3 py-2 disabled:opacity-50"
                                                            />
                                                            <div className="mt-2 space-y-1">
                                                                {hasOriginalImage && !hasNewImage && (
                                                                    <div className="bg-blue-900/30 border border-blue-500/50 rounded px-3 py-2">
                                                                        <p className="text-sm text-blue-300 font-medium">기존 이미지 있음</p>
                                                                        <p className="text-xs text-blue-400 mt-1">현재 저장된 상세 이미지 {index + 1}가 있습니다. 새 이미지를 선택하면 기존 이미지가 교체됩니다.</p>
                                                                    </div>
                                                                )}
                                                                {hasNewImage && (
                                                                    <div className="bg-green-900/30 border border-green-500/50 rounded px-3 py-2">
                                                                        <p className="text-sm text-green-300 font-medium">새 이미지 선택됨</p>
                                                                        <p className="text-xs text-green-400 mt-1">저장 시 기존 이미지가 새 이미지로 교체됩니다.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {(imageUrl || originalImageUrl) && (
                                                            <div className="relative flex justify-start">
                                                                <div className="relative">
                                                                    <div className="absolute top-2 left-2 z-10">
                                                                        {hasNewImage ? (
                                                                            <span className="bg-green-600 text-white text-xs font-medium px-2 py-1 rounded">새 이미지</span>
                                                                        ) : hasOriginalImage ? (
                                                                            <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">기존 이미지</span>
                                                                        ) : null}
                                                                    </div>
                                                                    <img 
                                                                        src={imageUrl || originalImageUrl || ''} 
                                                                        alt={`상세 이미지 ${index + 1}`}
                                                                        className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-600"
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.style.display = 'none';
                                                                        }}
                                                                    />
                                                                    {hasNewImage && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setEditingPortfolioData({
                                                                                    ...editingPortfolioData,
                                                                                    [`detailImage${index + 1}`]: '',
                                                                                    [`detailImageExtra${index + 1}`]: ''
                                                                                });
                                                                            }}
                                                                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                                                                        >
                                                                            새 이미지 삭제
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        selectedPortfolio.detailImageUrls && selectedPortfolio.detailImageUrls.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {selectedPortfolio.detailImageUrls.map((imageUrl: string, index: number) => (
                                                    <div key={index} className="relative group">
                                                        <img 
                                                            src={imageUrl} 
                                                            alt={`${selectedPortfolio.title || '시공사례'} - 상세 ${index + 1}`}
                                                            className="w-full h-48 object-cover rounded-lg border border-slate-600 hover:opacity-80 transition-opacity cursor-pointer shadow-md"
                                                            onClick={() => window.open(imageUrl, '_blank')}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const parent = target.parentElement;
                                                                if (parent) {
                                                                    parent.innerHTML = '<div class="w-full h-48 bg-slate-800/50 rounded-lg border border-slate-600 flex items-center justify-center"><p class="text-gray-500 text-sm">이미지 로드 실패</p></div>';
                                                                }
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                            <span className="text-white text-sm font-medium">클릭하여 확대</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-slate-800/50 rounded-lg border border-slate-600">
                                                <p className="text-gray-400">상세 이미지가 없습니다.</p>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* 버튼 */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                                    {isEditingPortfolio ? (
                                        <>
                                            <button
                                                onClick={handleCancelEdit}
                                                disabled={savingPortfolio}
                                                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                취소
                                            </button>
                                            <button
                                                onClick={handleSavePortfolio}
                                                disabled={savingPortfolio}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {savingPortfolio && (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                )}
                                                저장
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setShowPortfolioDetail(false);
                                                setSelectedPortfolio(null);
                                                setIsEditingPortfolio(false);
                                                setEditingPortfolioData(null);
                                            }}
                                            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
                                        >
                                            닫기
                                        </button>
                                    )}
                                </div>
                            </div>
                    </div>
                </div>
            </div>
            )}

            {/* Support 자료 관리 화면 */}
            {currentView === 'support' && (
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 max-w-6xl w-full max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
                    {/* 상단 고정 헤더 */}
                    <div className="sticky top-0 z-20 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm -m-6 p-6 mb-6 border-b border-slate-700/50 flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-white">고객 지원 자료 관리</h2>
                            <div className="space-x-4">
                                <button
                                    onClick={() => setShowAddSupport(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                >
                                    자료 추가
                                </button>
                                <button
                                    onClick={() => setCurrentView('menu')}
                                    className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                >
                                    메뉴로
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Support 자료 목록 헤더 */}
                    <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-700/50 flex-shrink-0">
                        <h3 className="text-xl font-semibold text-white">등록된 자료 목록</h3>
                        {supportItems.length > 0 && (
                            <span className="text-sm text-gray-400 bg-slate-700/50 px-3 py-1 rounded-full">
                                총 {supportItems.length}개
                            </span>
                        )}
                    </div>

                    {/* Support 자료 목록 */}
                    <div className="flex-1 overflow-y-auto mt-4">
                        {supportLoading ? (
                            <div className="text-center py-8 h-full flex items-center justify-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                <p className="text-gray-300 mt-2">로딩 중...</p>
                            </div>
                        ) : supportItems.length === 0 ? (
                            <div className="text-center py-12 bg-slate-700/30 rounded-lg border border-slate-600/50 h-full flex flex-col items-center justify-center">
                                <p className="text-gray-400 mb-4">등록된 자료가 없습니다</p>
                                <button
                                    onClick={() => setShowAddSupport(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                                >
                                    첫 자료 추가하기
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-700">
                                        <thead className="bg-slate-900/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">번호</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">제목</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">설명</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">카테고리</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">등록일</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">작업</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-slate-800/30 divide-y divide-slate-700">
                                            {supportItems
                                                .slice((currentSupportPage - 1) * supportItemsPerPage, currentSupportPage * supportItemsPerPage)
                                                .map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-700/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.id}</td>
                                                    <td className="px-6 py-4 text-sm text-white font-medium">{item.title}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">{item.desc}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-900 text-blue-200">
                                                            {item.category || '기타'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.createdAt}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSupport(item);
                                                                setShowSupportDetail(true);
                                                            }}
                                                            className="text-blue-400 hover:text-blue-300 mr-3"
                                                        >
                                                            보기
                                                        </button>
                                                        {item.fileUrl && (
                                                            <a
                                                                href={`https://drive.google.com/file/d/${item.fileUrl}/view`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-green-400 hover:text-green-300"
                                                            >
                                                                파일
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* 페이지네이션 */}
                                {Math.ceil(supportItems.length / supportItemsPerPage) > 1 && (
                                    <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-700 flex items-center justify-between">
                                        <div className="text-sm text-gray-400">
                                            {((currentSupportPage - 1) * supportItemsPerPage) + 1} - {Math.min(currentSupportPage * supportItemsPerPage, supportItems.length)} / {supportItems.length}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setCurrentSupportPage(p => Math.max(1, p - 1))}
                                                disabled={currentSupportPage === 1}
                                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                이전
                                            </button>
                                            <button
                                                onClick={() => setCurrentSupportPage(p => Math.min(Math.ceil(supportItems.length / supportItemsPerPage), p + 1))}
                                                disabled={currentSupportPage >= Math.ceil(supportItems.length / supportItemsPerPage)}
                                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                다음
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 새 Support 자료 추가 모달 */}
            {showAddSupport && (
                <div className="fixed inset-0 z-50">
                    <div 
                        className="absolute inset-0 bg-black/70" 
                        onClick={() => setShowAddSupport(false)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
                            <div className="flex items-center justify-between p-5 border-b border-slate-700">
                                <h3 className="text-xl font-bold text-white">새 지원 자료 추가</h3>
                                <button
                                    className="text-gray-400 hover:text-white"
                                    onClick={() => setShowAddSupport(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSupportSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        제목 <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={supportForm.title}
                                        onChange={(e) => setSupportForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        설명 <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        value={supportForm.desc}
                                        onChange={(e) => setSupportForm(prev => ({ ...prev, desc: e.target.value }))}
                                        className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        카테고리
                                    </label>
                                    <select
                                        value={supportForm.category}
                                        onChange={(e) => setSupportForm(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="학습자료">학습자료</option>
                                        <option value="기술문서">기술문서</option>
                                        <option value="튜토리얼">튜토리얼</option>
                                        <option value="체크리스트">체크리스트</option>
                                        <option value="기타">기타</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        파일 <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="file"
                                        onChange={handleSupportFileChange}
                                        disabled={supportFileUploading}
                                        className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                        required
                                    />
                                    {supportFileUploading && (
                                        <p className="mt-2 text-sm text-blue-400">파일 업로드 중...</p>
                                    )}
                                    {supportForm.fileUrl && !supportFileUploading && (
                                        <p className="mt-2 text-sm text-green-400">✓ 파일이 업로드되었습니다.</p>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddSupport(false)}
                                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingSupport || supportFileUploading || !supportForm.fileUrl}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {savingSupport && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        )}
                                        저장
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Support 자료 상세 보기 모달 */}
            {showSupportDetail && selectedSupport && (
                <div className="fixed inset-0 z-50">
                    <div 
                        className="absolute inset-0 bg-black/70" 
                        onClick={() => {
                            setShowSupportDetail(false);
                            setSelectedSupport(null);
                            setIsEditingSupport(false);
                            setEditingSupportData(null);
                        }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-5 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
                                <h3 className="text-xl font-bold text-white">자료 상세</h3>
                                <button
                                    className="text-gray-400 hover:text-white"
                                    onClick={() => {
                                        setShowSupportDetail(false);
                                        setSelectedSupport(null);
                                        setIsEditingSupport(false);
                                        setEditingSupportData(null);
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">제목</label>
                                    <p className="text-white text-lg">{selectedSupport.title}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">설명</label>
                                    <p className="text-white">{selectedSupport.desc}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">카테고리</label>
                                    <span className="inline-block px-2 py-1 text-sm font-medium rounded-full bg-blue-900 text-blue-200">
                                        {selectedSupport.category || '기타'}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">등록일</label>
                                    <p className="text-white">{selectedSupport.createdAt}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">파일</label>
                                    {selectedSupport.fileUrl ? (
                                        <a
                                            href={`https://drive.google.com/file/d/${selectedSupport.fileUrl}/view`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 underline"
                                        >
                                            Google Drive에서 보기
                                        </a>
                                    ) : (
                                        <p className="text-gray-400">파일 없음</p>
                                    )}
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-700">
                                    <button
                                        onClick={() => {
                                            setShowSupportDetail(false);
                                            setSelectedSupport(null);
                                            setIsEditingSupport(false);
                                            setEditingSupportData(null);
                                        }}
                                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                    >
                                        닫기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 제품 상세 보기 모달 */}
            {showProductDetail && selectedProduct && (
                <div className="fixed inset-0 z-50">
                    <div 
                        className="absolute inset-0 bg-black/70" 
                        onClick={() => {
                            if (isEditingProduct) {
                                if (window.confirm('편집 중인 내용이 저장되지 않습니다. 정말 닫으시겠습니까?')) {
                                    setShowProductDetail(false);
                                    setSelectedProduct(null);
                                    setIsEditingProduct(false);
                                    setEditingProductData(null);
                                    setProductImageError(false);
                                }
                            } else {
                                setShowProductDetail(false);
                                setSelectedProduct(null);
                                setProductImageError(false);
                            }
                        }}
                    />
                    <div className="absolute inset-0 flex items-start justify-center p-4 overflow-y-auto pt-8">
                        <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-4">
                            <div className="flex items-center justify-between p-6 border-b border-slate-700">
                                <h3 className="text-2xl font-bold text-white">제품 상세</h3>
                                <div className="flex items-center gap-3">
                                    {!isEditingProduct && (
                                        <button
                                            onClick={handleStartEditProduct}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                        >
                                            수정
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (isEditingProduct) {
                                                if (window.confirm('편집 중인 내용이 저장되지 않습니다. 정말 닫으시겠습니까?')) {
                                                    setShowProductDetail(false);
                                                    setSelectedProduct(null);
                                                    setIsEditingProduct(false);
                                                    setEditingProductData(null);
                                                    setProductImageError(false);
                                                }
                                            } else {
                                                setShowProductDetail(false);
                                                setSelectedProduct(null);
                                                setProductImageError(false);
                                            }
                                        }}
                                        className="text-gray-400 hover:text-white text-lg font-medium px-3 py-1 rounded transition-colors"
                                    >
                                        닫기
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {/* 기본 정보 */}
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-start">
                                            <label className="text-sm font-medium text-gray-400 w-24 flex-shrink-0 text-left">모델명</label>
                                            {isEditingProduct ? (
                                                <input
                                                    type="text"
                                                    value={editingProductData?.productName || ''}
                                                    onChange={(e) => setEditingProductData({...editingProductData, productName: e.target.value})}
                                                    className="text-white text-base flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            ) : (
                                                <p className="text-white text-base flex-1 text-left">{selectedProduct.productName || '-'}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <label className="text-sm font-medium text-gray-400 w-24 flex-shrink-0 text-left">제품종류</label>
                                            {isEditingProduct ? (
                                                <input
                                                    type="text"
                                                    value={editingProductData?.category || ''}
                                                    onChange={(e) => setEditingProductData({...editingProductData, category: e.target.value})}
                                                    className="text-white text-base flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            ) : (
                                                <p className="text-white text-base flex-1 text-left">{selectedProduct.category || '-'}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <label className="text-sm font-medium text-gray-400 w-24 flex-shrink-0 text-left">설명</label>
                                            {isEditingProduct ? (
                                                <textarea
                                                    value={editingProductData?.description || ''}
                                                    onChange={(e) => setEditingProductData({...editingProductData, description: e.target.value})}
                                                    className="text-white text-base flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                                    rows={4}
                                                />
                                            ) : (
                                                <p className="text-white text-base flex-1 text-left whitespace-pre-wrap">{selectedProduct.description || '-'}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-start">
                                            <label className="text-sm font-medium text-gray-400 w-24 flex-shrink-0 text-left">사양</label>
                                            {isEditingProduct ? (
                                                <textarea
                                                    value={editingProductData?.specification || ''}
                                                    onChange={(e) => setEditingProductData({...editingProductData, specification: e.target.value})}
                                                    className="text-white text-base flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                                    rows={4}
                                                />
                                            ) : (
                                                <div className="flex-1 text-left">
                                                    {selectedProduct.specification ? (() => {
                                                        // 쉼표를 기준으로 분리하고 각 항목을 key:value로 파싱
                                                        const specs = selectedProduct.specification.split(',').map((s: string) => s.trim()).filter((s: string) => s);
                                                        if (specs.length === 0) {
                                                            return <p className="text-white text-base">-</p>;
                                                        }
                                                        return (
                                                            <div className="space-y-2">
                                                                {specs.map((spec: string, index: number) => {
                                                                    const colonIndex = spec.indexOf(':');
                                                                    if (colonIndex === -1) {
                                                                        return (
                                                                            <div key={index} className="flex items-start">
                                                                                <span className="text-gray-400 text-sm font-medium w-32 flex-shrink-0 text-left">{spec}</span>
                                                                                <span className="text-white text-base flex-1">-</span>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    const key = spec.substring(0, colonIndex).trim();
                                                                    const value = spec.substring(colonIndex + 1).trim();
                                                                    return (
                                                                        <div key={index} className="flex items-start">
                                                                            <span className="text-gray-400 text-sm font-medium w-32 flex-shrink-0 text-left">{key}</span>
                                                                            <span className="text-white text-base flex-1">{value || '-'}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })() : (
                                                        <p className="text-white text-base">-</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 제품 이미지 */}
                                <div>
                                    <h5 className="text-lg font-semibold text-white mb-3 border-b border-slate-700 pb-3 text-left">제품 이미지</h5>
                                    {isEditingProduct ? (
                                        <div className="space-y-3">
                                            <div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleEditProductImageChange}
                                                    disabled={editingProductImageUploading}
                                                    className="w-full bg-slate-800 text-white rounded-lg border border-slate-600 px-3 py-2 disabled:opacity-50"
                                                />
                                                <div className="mt-2 space-y-1">
                                                    {hasOriginalProductImage && !editingProductData?.productImage && (
                                                        <div className="bg-blue-900/30 border border-blue-500/50 rounded px-3 py-2">
                                                            <p className="text-sm text-blue-300 font-medium">기존 이미지 있음</p>
                                                            <p className="text-xs text-blue-400 mt-1">현재 저장된 제품 이미지가 있습니다. 새 이미지를 선택하면 기존 이미지가 교체됩니다.</p>
                                                        </div>
                                                    )}
                                                    {editingProductData?.productImage && (
                                                        <div className="bg-green-900/30 border border-green-500/50 rounded px-3 py-2">
                                                            <p className="text-sm text-green-300 font-medium">새 이미지 선택됨</p>
                                                            <p className="text-xs text-green-400 mt-1">저장 시 기존 이미지가 새 이미지로 교체됩니다.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {editingProductImageUploading && (
                                                <div className="flex items-center space-x-2 text-sm text-gray-400">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                                    <span>이미지 압축 중...</span>
                                                </div>
                                            )}
                                            {(() => {
                                                // 편집 모드에서 새 이미지가 있으면 사용
                                                if (editingProductData?.productImage) {
                                                    return (
                                                        <div className="relative">
                                                            <div className="absolute top-2 left-2 z-10">
                                                                <span className="bg-green-600 text-white text-xs font-medium px-2 py-1 rounded">새 이미지</span>
                                                            </div>
                                                            <img 
                                                                src={`data:image/jpeg;base64,${editingProductData.productImage}${editingProductData.productImageExtra || ''}`}
                                                                alt={selectedProduct.productName || '제품 이미지'}
                                                                className="max-w-full max-h-96 object-contain rounded-lg border border-slate-600 shadow-lg"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                }
                                                
                                                // 기존 이미지: productImageUrl이 있으면 사용, 없으면 productImage + productImageExtra 합쳐서 생성
                                                // productImageUrl이 이미 data:image/jpeg;base64, 접두사를 포함하고 있을 수 있으므로 확인
                                                let existingImage = selectedProduct.productImageUrl;
                                                if (!existingImage && (selectedProduct.productImage || selectedProduct.productImageExtra)) {
                                                    const fullImage = (selectedProduct.productImage || '') + (selectedProduct.productImageExtra || '');
                                                    if (fullImage) {
                                                        // productImage/productImageExtra가 이미 data:image 접두사를 포함하고 있는지 확인
                                                        if (fullImage.startsWith('data:image')) {
                                                            existingImage = fullImage;
                                                        } else {
                                                            existingImage = `data:image/jpeg;base64,${fullImage}`;
                                                        }
                                                    }
                                                }
                                                
                                                if (existingImage) {
                                                    return (
                                                        <div className="relative">
                                                            <div className="absolute top-2 left-2 z-10">
                                                                {hasOriginalProductImage && (
                                                                    <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">기존 이미지</span>
                                                                )}
                                                            </div>
                                                            <img 
                                                                src={existingImage}
                                                                alt={selectedProduct.productName || '제품 이미지'}
                                                                className="max-w-full max-h-96 object-contain rounded-lg border border-slate-600 shadow-lg"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                }
                                                
                                                return null;
                                            })()}
                                        </div>
                                    ) : (
                                        (() => {
                                            // productImageUrl이 있으면 사용, 없으면 productImage + productImageExtra 합쳐서 생성
                                            // productImageUrl이 이미 data:image/jpeg;base64, 접두사를 포함하고 있을 수 있으므로 확인
                                            let imageUrl = selectedProduct.productImageUrl;
                                            if (!imageUrl && (selectedProduct.productImage || selectedProduct.productImageExtra)) {
                                                const fullImage = (selectedProduct.productImage || '') + (selectedProduct.productImageExtra || '');
                                                if (fullImage) {
                                                    // productImage/productImageExtra가 이미 data:image 접두사를 포함하고 있는지 확인
                                                    if (fullImage.startsWith('data:image')) {
                                                        imageUrl = fullImage;
                                                    } else {
                                                        imageUrl = `data:image/jpeg;base64,${fullImage}`;
                                                    }
                                                }
                                            }
                                            
                                            if (imageUrl && !productImageError) {
                                                return (
                                                    <div className="flex justify-start">
                                                        <img 
                                                            src={imageUrl} 
                                                            alt={selectedProduct.productName || '제품 이미지'}
                                                            className="max-w-full max-h-96 object-contain rounded-lg border border-slate-600 shadow-lg"
                                                            onError={(e) => {
                                                                console.error('❌ 제품 이미지 로드 실패:', {
                                                                    productId: selectedProduct.id,
                                                                    productName: selectedProduct.productName,
                                                                    productImageUrl: selectedProduct.productImageUrl ? `${selectedProduct.productImageUrl.substring(0, 100)}...` : '없음',
                                                                    productImageLength: selectedProduct.productImage?.length || 0,
                                                                    productImageExtraLength: selectedProduct.productImageExtra?.length || 0,
                                                                    constructedImageUrl: imageUrl ? `${imageUrl.substring(0, 100)}...` : '없음',
                                                                    error: e
                                                                });
                                                                setProductImageError(true);
                                                            }}
                                                            onLoad={() => {
                                                                console.log('✅ 제품 이미지 로드 성공:', {
                                                                    productId: selectedProduct.id,
                                                                    productName: selectedProduct.productName,
                                                                    imageUrlLength: imageUrl.length,
                                                                    hasProductImageUrl: !!selectedProduct.productImageUrl,
                                                                    hasProductImage: !!selectedProduct.productImage,
                                                                    hasProductImageExtra: !!selectedProduct.productImageExtra
                                                                });
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className="text-center py-8 bg-slate-800/50 rounded-lg border border-slate-600">
                                                        <p className="text-gray-400">
                                                            {productImageError ? '이미지를 불러올 수 없습니다.' : '제품 이미지가 없습니다.'}
                                                        </p>
                                                        {productImageError && (
                                                            <p className="text-xs text-gray-500 mt-2">
                                                                이미지 URL: {imageUrl ? `${imageUrl.substring(0, 50)}...` : '없음'}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            }
                                        })()
                                    )}
                                </div>

                                {/* 버튼 */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                                    {isEditingProduct ? (
                                        <>
                                            <button
                                                onClick={handleCancelEditProduct}
                                                disabled={savingProduct}
                                                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                취소
                                            </button>
                                            <button
                                                onClick={handleSaveProduct}
                                                disabled={savingProduct}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {savingProduct && (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                )}
                                                저장
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setShowProductDetail(false);
                                                setSelectedProduct(null);
                                                setIsEditingProduct(false);
                                                setEditingProductData(null);
                                                setProductImageError(false);
                                            }}
                                            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
                                        >
                                            닫기
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}