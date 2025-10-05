import { useEffect, useState } from "react";

export default function Manager() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        location: '',
        installmentDate: '',
        equipment: '',
        mainImage: null as File | null,
        detailImages: [] as File[]
    });
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
    }, [])

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
                ) : (
                    // 시공사례 업로드 폼
                    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-white">고객 사례 업로드</h2>
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
                )}
                </div>
            </div>
        </div>
    )
}