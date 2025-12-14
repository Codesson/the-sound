import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { managerStorage } from "../../utils/managerAuth";
import { 
    writeProductToSheet,
    readProductData,
    updateProductRow
} from "../../utils/googleSheets";
import { getBase64Size, compressImageToBase64, recompressBase64 } from "../../utils/imageCompression";

export default function Products() {
    const navigate = useNavigate();
    
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
    const [imageUploading, setImageUploading] = useState(false);

    // 401 오류 체크 및 로그아웃 처리
    const checkAndHandle401Error = (error: any) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('401') || errorMessage.includes('인증이 필요합니다') || errorMessage.includes('토큰이 만료')) {
            managerStorage.clear();
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
            navigate('/manager/login');
            return true;
        }
        return false;
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
            
            if (checkAndHandle401Error(error)) {
                return;
            }
            
            setProducts([]);
        } finally {
            setProductLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // 모달이 열릴 때 배경 스크롤 방지
    useEffect(() => {
        if (showProductDetail) {
            // body 스크롤 방지
            document.body.style.overflow = 'hidden';
            // 모달 내부 스크롤 이벤트가 배경으로 전파되지 않도록 처리
            const handleWheel = (e: WheelEvent) => {
                const target = e.target as HTMLElement;
                const modalContent = target.closest('.modal-content-wrapper');
                if (!modalContent) {
                    e.preventDefault();
                }
            };
            const handleTouchMove = (e: TouchEvent) => {
                const target = e.target as HTMLElement;
                const modalContent = target.closest('.modal-content-wrapper');
                if (!modalContent) {
                    e.preventDefault();
                }
            };
            window.addEventListener('wheel', handleWheel, { passive: false });
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            
            return () => {
                document.body.style.overflow = '';
                window.removeEventListener('wheel', handleWheel);
                window.removeEventListener('touchmove', handleTouchMove);
            };
        }
    }, [showProductDetail]);

    const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProductForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProductImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('이미지 파일 크기는 10MB 이하여야 합니다.');
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드 가능합니다.');
                return;
            }

            setImageUploading(true);
            
            try {
                let compressedBase64 = await compressImageToBase64(file, {
                    maxWidth: 2560,
                    maxHeight: 2560,
                    quality: 0.5,
                    format: 'image/jpeg'
                });

                const initialSize = compressedBase64.length;
                if (initialSize > 100000) {
                    compressedBase64 = await recompressBase64(compressedBase64, 95);
                }

                const finalSize = compressedBase64.length;
                
                if (finalSize > 100000) {
                    alert(`⚠️ 이미지가 너무 큽니다!\n\n현재 크기: ${finalSize}자\n최대 허용: 100,000자 (2개 셀)\n\n더 작은 이미지를 사용하거나 해상도를 낮춰주세요.`);
                    setImageUploading(false);
                    return;
                }
                
                let mainImage = compressedBase64;
                let extraImage = '';
                
                if (finalSize > 50000) {
                    mainImage = compressedBase64.substring(0, 50000);
                    extraImage = compressedBase64.substring(50000);
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

    // 제품 편집 시작
    const handleStartEditProduct = () => {
        setEditingProductData({
            productName: selectedProduct?.productName || '',
            category: selectedProduct?.category || '',
            description: selectedProduct?.description || '',
            specification: selectedProduct?.specification || '',
            productImage: '',
            productImageExtra: '',
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

            let rowIndex = selectedProduct.rowIndex;
            
            if (!rowIndex || rowIndex < 1) {
                const productIndex = products.findIndex(p => p.id === selectedProduct.id);
                if (productIndex !== -1) {
                    rowIndex = productIndex + 2;
                } else {
                    rowIndex = 2;
                }
            }
            
            if (rowIndex === 1) {
                rowIndex = 2;
            }
            
            const updateData: any = {
                productName: editingProductData.productName,
                category: editingProductData.category,
                description: editingProductData.description,
                specification: editingProductData.specification
            };
            
            if (editingProductData.productImage) {
                updateData.productImage = editingProductData.productImage;
                updateData.productImageExtra = editingProductData.productImageExtra || '';
            }
            
            await updateProductRow(token, rowIndex, updateData);

            await fetchProducts();
            
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
                productImageExtra: hasOriginalProductImage ? selectedProduct.productImageExtra : '',
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
            let compressedBase64 = await compressImageToBase64(file, {
                maxWidth: 2560,
                maxHeight: 2560,
                quality: 0.5,
                format: 'image/jpeg'
            });
            
            const initialSize = compressedBase64.length;
            if (initialSize > 100000) {
                compressedBase64 = await recompressBase64(compressedBase64, 95);
            }
            
            const finalSize = compressedBase64.length;
            
            if (finalSize > 100000) {
                alert(`⚠️ 이미지가 너무 큽니다!\n\n현재 크기: ${finalSize}자\n최대 허용: 100,000자 (2개 셀)\n\n더 작은 이미지를 사용하거나 해상도를 낮춰주세요.`);
                setEditingProductImageUploading(false);
                return;
            }
            
            let productImage = compressedBase64;
            let productImageExtra = '';
            
            if (finalSize > 50000) {
                productImage = compressedBase64.substring(0, 50000);
                productImageExtra = compressedBase64.substring(50000);
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

    return (
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
                            onClick={() => navigate('/manager')}
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
            <div className="flex-1 overflow-hidden flex flex-col mt-4">
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

            {/* 새 제품 추가 모달 */}
            {showAddProduct && createPortal(
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
                                            if (!productForm.productName.trim() || !productForm.category.trim()) {
                                                alert('모델명과 제품종류는 필수 입력 항목입니다.');
                                                return;
                                            }

                                            const { token } = managerStorage.get();
                                            if (!token) {
                                                alert('인증이 필요합니다. 다시 로그인해주세요.');
                                                return;
                                            }

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
                                            
                                            setProductForm({
                                                productName: '',
                                                category: '',
                                                description: '',
                                                specification: '',
                                                productImage: '',
                                                productImageExtra: '',
                                                mainImage: null,
                                            });
                                            
                                            fetchProducts();
                                            
                                        } catch (error) {
                                            console.error('제품 저장 오류:', error);
                                            
                                            if (checkAndHandle401Error(error)) {
                                                return;
                                            }
                                            
                                            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
                                            alert(`제품 저장 중 오류가 발생했습니다: ${errorMessage}`);
                                        }
                                    }}
                                >
                                    {imageUploading ? '처리 중...' : '저장'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* 제품 상세 보기 모달 */}
            {showProductDetail && selectedProduct && createPortal(
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
                    <div 
                        className="absolute inset-0 flex items-start justify-center p-4 overflow-y-auto pt-8 modal-content-wrapper"
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                    >
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
                                                
                                                let existingImage = selectedProduct.productImageUrl;
                                                if (!existingImage && (selectedProduct.productImage || selectedProduct.productImageExtra)) {
                                                    const fullImage = (selectedProduct.productImage || '') + (selectedProduct.productImageExtra || '');
                                                    if (fullImage) {
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
                                            let imageUrl = selectedProduct.productImageUrl;
                                            if (!imageUrl && (selectedProduct.productImage || selectedProduct.productImageExtra)) {
                                                const fullImage = (selectedProduct.productImage || '') + (selectedProduct.productImageExtra || '');
                                                if (fullImage) {
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
                                                                setProductImageError(true);
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
                </div>,
                document.body
            )}
        </div>
    );
}

