import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { managerStorage } from "../../utils/managerAuth";
import { 
    writePortfolioToSheet,
    readPortfolioData,
    updatePortfolioRow
} from "../../utils/googleSheets";
import { getBase64Size, compressImageToBase64, recompressBase64 } from "../../utils/imageCompression";

export default function Portfolio() {
    const navigate = useNavigate();
    
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
    const [portfolioImageUploading, setPortfolioImageUploading] = useState(false);
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

    // Base64 이미지를 디코딩하는 함수
    const decodeBase64Image = (base64String: string): string | null => {
        if (!base64String || base64String.trim() === '') return null;
        if (base64String.startsWith('data:image')) {
            return base64String;
        }
        return `data:image/jpeg;base64,${base64String}`;
    };

    // 시공사례 목록 가져오기
    const fetchPortfolioItems = async () => {
        setPortfolioLoading(true);
        try {
            const { token } = managerStorage.get();
            if (!token) {
                throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
            }
            
            const items = await readPortfolioData(token);
            
            const itemsWithImages = items.map((item: any) => ({
                ...item,
                mainImageUrl: decodeBase64Image(item.mainImage),
                detailImageUrls: item.detailImages.map((img: string) => decodeBase64Image(img)).filter((url: string | null) => url !== null)
            }));
            
            setPortfolioItems(itemsWithImages);
            setCurrentPortfolioPage(1);
        } catch (error) {
            console.error('시공사례 데이터 가져오기 오류:', error);
            
            if (checkAndHandle401Error(error)) {
                return;
            }
            
            setPortfolioItems([]);
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`시공사례 데이터를 불러오는데 실패했습니다.\n\n오류: ${errorMessage}`);
        } finally {
            setPortfolioLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolioItems();
    }, []);

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
        
        if (file.size > 10 * 1024 * 1024) {
            alert('이미지 파일 크기는 10MB 이하여야 합니다.');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        
        setPortfolioImageUploading(true);
        
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
                setPortfolioImageUploading(false);
                return;
            }
            
            let mainImage = compressedBase64;
            let mainImageExtra = '';
            
            if (finalSize > 50000) {
                mainImage = compressedBase64.substring(0, 50000);
                mainImageExtra = compressedBase64.substring(50000);
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
        
        if (file.size > 10 * 1024 * 1024) {
            alert('이미지 파일 크기는 10MB 이하여야 합니다.');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        
        setPortfolioImageUploading(true);
        
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
                setPortfolioImageUploading(false);
                return;
            }
            
            let detailImage = compressedBase64;
            let detailImageExtra = '';
            
            if (finalSize > 50000) {
                detailImage = compressedBase64.substring(0, 50000);
                detailImageExtra = compressedBase64.substring(50000);
            }
            
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
            newFiles[index] = undefined as any;
            
            const updates: any = {
                detailImageFiles: newFiles.filter(Boolean)
            };
            
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
            const { token } = managerStorage.get();
            if (!token) {
                alert('인증이 필요합니다. 다시 로그인해주세요.');
                return;
            }

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
            
            setShowAddPortfolio(false);
            fetchPortfolioItems();

        } catch (error) {
            console.error('업로드 에러:', error);
            
            if (checkAndHandle401Error(error)) {
                return;
            }
            
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
            alert(`업로드 중 오류가 발생했습니다: ${errorMessage}`);
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

            const rowIndex = selectedPortfolio.rowIndex || selectedPortfolio.id + 1;
            
            const updateData: any = {
                title: editingPortfolioData.title,
                description: editingPortfolioData.description,
                location: editingPortfolioData.location,
                date: editingPortfolioData.date,
                equipment: editingPortfolioData.equipment
            };
            
            if (editingPortfolioData.mainImage) {
                updateData.mainImage = editingPortfolioData.mainImage;
                updateData.mainImageExtra = editingPortfolioData.mainImageExtra || '';
            }
            
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

            await fetchPortfolioItems();
            
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
            mainImage: '',
            mainImageExtra: '',
            detailImage1: '',
            detailImageExtra1: '',
            detailImage2: '',
            detailImageExtra2: '',
            detailImage3: '',
            detailImageExtra3: '',
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

    return (
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
                            onClick={() => navigate('/manager')}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                            메뉴로 돌아가기
                        </button>
                    </div>
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

            {/* 시공사례 추가 모달 */}
            {showAddPortfolio && createPortal(
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
                </div>,
                document.body
            )}

            {/* 시공사례 상세 보기 모달 */}
            {showPortfolioDetail && selectedPortfolio && createPortal(
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
                </div>,
                document.body
            )}
        </div>
    );
}

