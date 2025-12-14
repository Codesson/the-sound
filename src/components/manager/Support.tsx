import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { managerStorage } from "../../utils/managerAuth";
import { 
    writeSupportToSheet,
    readSupportData
} from "../../utils/googleSheets";
import { uploadToGoogleDrive, getFileDownloadUrl, getFileViewUrl, extractFileId, getDirectImageUrl } from "../../utils/googleDriveUpload";

export default function Support() {
    const navigate = useNavigate();
    
    // 고객 지원 자료 관리 상태
    const [supportItems, setSupportItems] = useState<any[]>([]);
    const [supportLoading, setSupportLoading] = useState(false);
    const [showAddSupport, setShowAddSupport] = useState(false);
    const [currentSupportPage, setCurrentSupportPage] = useState(1);
    const [supportItemsPerPage] = useState(10);
    const [selectedSupport, setSelectedSupport] = useState<any | null>(null);
    const [showSupportDetail, setShowSupportDetail] = useState(false);
    const [savingSupport, setSavingSupport] = useState(false);
    const [supportFileUploading, setSupportFileUploading] = useState(false);
    const [supportForm, setSupportForm] = useState({
        title: '',
        desc: '',
        category: '기타',
        file: null as File | null,
        fileUrl: '' as string
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

    // Support 자료 목록 불러오기
    const fetchSupportItems = async () => {
        setSupportLoading(true);
        try {
            const { token } = managerStorage.get();
            if (!token) {
                throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
            }

            const supportData = await readSupportData(token, '1TnHBUzm-Pefue-B-WOS363wcblYZJY3WLnRY5DG4PIc', 'data');
            setSupportItems(supportData);
        } catch (error) {
            console.error('Support 자료 데이터 가져오기 오류:', error);

            if (checkAndHandle401Error(error)) {
                return;
            }

            setSupportItems([]);
        } finally {
            setSupportLoading(false);
        }
    };

    useEffect(() => {
        fetchSupportItems();
    }, []);

    // 이미지 URL 생성 함수
    const getImageUrl = (fileUrl: string): string => {
        const fileId = extractFileId(fileUrl);
        if (!fileId) return '';
        return getDirectImageUrl(fileId);
    };

    // 기존 카테고리 목록 가져오기
    const defaultCategories = ['학습자료', '기술문서', '튜토리얼', '체크리스트', '기타'];
    const existingCategories = Array.from(
        new Set([
            ...defaultCategories,
            ...supportItems.map(item => item.category).filter(Boolean)
        ])
    ).sort();


    // Support 자료 파일 업로드 핸들러
    const handleSupportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        
        if (!file) return;
        
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

            const result = await uploadToGoogleDrive(file, token, 'the-sound/storage');
            
            console.log('📤 파일 업로드 결과:', result);
            
            if (!result || !result.fileId) {
                console.error('❌ 파일 업로드 결과에 fileId가 없습니다:', result);
                throw new Error('파일 업로드는 완료되었지만 파일 ID를 받지 못했습니다.');
            }
            
            setSupportForm(prev => ({
                ...prev,
                file: file,
                fileUrl: result.fileId
            }));
            
            console.log('✅ fileUrl 설정됨:', result.fileId);
            alert('파일이 업로드되었습니다.');
        } catch (error) {
            console.error('❌ 파일 업로드 오류:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('오류 상세:', {
                error,
                message: errorMessage,
                stack: error instanceof Error ? error.stack : undefined
            });
            alert(`파일 업로드 중 오류가 발생했습니다:\n\n${errorMessage}\n\n브라우저 콘솔을 확인해주세요.`);
        } finally {
            setSupportFileUploading(false);
        }
    };

    // Support 자료 저장 핸들러
    const handleSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!supportForm.title || !supportForm.desc || !supportForm.fileUrl) {
            alert('모든 필수 필드를 입력하고 파일을 업로드해주세요.');
            return;
        }

        setSavingSupport(true);
        try {
            const { token } = managerStorage.get();
            if (!token) {
                throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
            }

            await writeSupportToSheet(token, {
                title: supportForm.title,
                desc: supportForm.desc,
                category: supportForm.category,
                fileUrl: supportForm.fileUrl
            }, '1TnHBUzm-Pefue-B-WOS363wcblYZJY3WLnRY5DG4PIc', 'data');

            alert('자료가 성공적으로 저장되었습니다!');
            
            setSupportForm({
                title: '',
                desc: '',
                category: '기타',
                file: null,
                fileUrl: ''
            });
            
            setShowAddSupport(false);
            fetchSupportItems();
        } catch (error) {
            console.error('자료 저장 오류:', error);
            
            if (checkAndHandle401Error(error)) {
                return;
            }
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`자료 저장 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
            setSavingSupport(false);
        }
    };

    return (
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
                            onClick={() => navigate('/manager')}
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
                                        .map((item, index) => (
                                            <tr key={item.id} className="hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{(currentSupportPage - 1) * supportItemsPerPage + index + 1}</td>
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
                                                        <>
                                                            <a
                                                                href={getFileDownloadUrl(item.fileUrl)}
                                                                download
                                                                className="text-green-400 hover:text-green-300 cursor-pointer"
                                                            >
                                                                파일
                                                            </a>
                                                            <div className="mt-2">
                                                                <img
                                                                    src={getImageUrl(item.fileUrl)}
                                                                    alt={item.title}
                                                                    className="w-20 h-20 object-cover rounded border border-slate-600 cursor-pointer hover:opacity-80"
                                                                    onClick={() => window.open(getImageUrl(item.fileUrl), '_blank')}
                                                                    onError={(e) => {
                                                                        // 이미지가 아니거나 로드 실패 시 숨김
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                    }}
                                                                />
                                                            </div>
                                                        </>
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

            {/* 새 Support 자료 추가 모달 */}
            {showAddSupport && createPortal(
                <div className="fixed inset-0 z-50">
                    <div 
                        className="absolute inset-0 bg-black/70" 
                        onClick={() => setShowAddSupport(false)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto">
                        <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-4">
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
                                    <div className="relative">
                                        <input
                                            type="text"
                                            list="category-list"
                                            value={supportForm.category}
                                            onChange={(e) => setSupportForm(prev => ({ ...prev, category: e.target.value }))}
                                            className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="카테고리를 선택하거나 입력하세요"
                                        />
                                        <datalist id="category-list">
                                            {existingCategories.map((category) => (
                                                <option key={category} value={category} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400">
                                        기존 카테고리를 선택하거나 새로운 카테고리를 입력할 수 있습니다.
                                    </p>
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
                                        disabled={savingSupport || supportFileUploading || !supportForm.fileUrl || !supportForm.title.trim() || !supportForm.desc.trim()}
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
                </div>,
                document.body
            )}

            {/* Support 자료 상세 보기 모달 */}
            {showSupportDetail && selectedSupport && createPortal(
                <div className="fixed inset-0 z-50">
                    <div 
                        className="absolute inset-0 bg-black/70" 
                        onClick={() => {
                            setShowSupportDetail(false);
                            setSelectedSupport(null);
                        }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto">
                        <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-5 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
                                <h3 className="text-xl font-bold text-white">자료 상세</h3>
                                <button
                                    className="text-gray-400 hover:text-white"
                                    onClick={() => {
                                        setShowSupportDetail(false);
                                        setSelectedSupport(null);
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
                                        <div className="space-y-3">
                                            <div className="flex gap-3">
                                                <a
                                                    href={getFileDownloadUrl(selectedSupport.fileUrl)}
                                                    download
                                                    className="text-blue-400 hover:text-blue-300 underline"
                                                >
                                                    다운로드
                                                </a>
                                                <span className="text-gray-500">|</span>
                                                <a
                                                    href={getFileViewUrl(selectedSupport.fileUrl)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 underline"
                                                >
                                                    Google Drive에서 보기
                                                </a>
                                            </div>
                                            {/* 이미지 미리보기 */}
                                            <div>
                                                <img
                                                    src={getImageUrl(selectedSupport.fileUrl)}
                                                    alt={selectedSupport.title}
                                                    className="max-w-full max-h-96 object-contain rounded-lg border border-slate-600 cursor-pointer hover:opacity-90"
                                                    onClick={() => window.open(getImageUrl(selectedSupport.fileUrl), '_blank')}
                                                    onError={(e) => {
                                                        // 이미지가 아니거나 로드 실패 시 숨김
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400">파일 없음</p>
                                    )}
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-700">
                                    <button
                                        onClick={() => {
                                            setShowSupportDetail(false);
                                            setSelectedSupport(null);
                                        }}
                                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                    >
                                        닫기
                                    </button>
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

