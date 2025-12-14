"use client";

import { useEffect, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import example1 from "../../assets/images/example1.jpg";
import example2 from "../../assets/images/example2.jpg";
import example3 from "../../assets/images/example3.jpg";
import example4 from "../../assets/images/example4.jpg";
import {format, parse} from "date-fns";
import {ko} from "date-fns/locale";


// 사례 데이터 타입 정의
interface CaseData {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  equipment: string[];
  mainImage: string | null; // 이미지가 없을 수 있음
  hasMainImage?: boolean; // 이미지 존재 여부 플래그 (선택적)
  detailImages: string[];
  alt: string;
  inquiry?: {
    title?: string;
    description?: string;
    image?: string;
    email?: string;
    buttonText?: string;
  };
}

export default function Portfolio() {
  // 사례 데이터
  const [caseList, setCaseList] = useState<CaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Google Sheets를 CSV로 내보내는 URL 사용
        // gid=970749800은 customerCase 시트를 가리킴
        const spreadsheetId = process.env.REACT_APP_PORTFOLIO_SPREADSHEET_ID || '1XYBvUwDqzlfF9DnBiSKLgFsC_XA6k22auI_0I29Airs';
        const sheetGid = process.env.REACT_APP_PORTFOLIO_SHEET_GID || '970749800';
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetGid}`;
        
        console.log('📥 시공사례 CSV 데이터 가져오기 시작:', csvUrl);
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          console.error('❌ CSV 가져오기 실패:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 200)
          });
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('📄 포트폴리오 CSV 데이터 (처음 500자):', csvText.substring(0, 500));
        
        if (!csvText || csvText.trim().length === 0) {
          throw new Error('CSV 데이터가 비어있습니다.');
        }
        
        // CSV를 파싱하여 데이터 변환
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          throw new Error('CSV 파일에 데이터가 없습니다.');
        }
        
        const headers = lines[0].split(',').map(header => header.trim());

        console.log('📋 포트폴리오 헤더:', headers);
        console.log('📊 포트폴리오 데이터 행 수:', lines.length - 1);
        
        if (lines.length <= 1) {
          console.warn('⚠️ 헤더만 있고 데이터 행이 없습니다.');
          setCaseList([]);
          setIsLoading(false);
          return;
        }
        
        // CSV 라인을 안전하게 파싱하는 함수
        const parseCSVLine = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };
        
        // 배열 데이터를 파싱하는 함수
        const parseArrayData = (value: string): string[] => {
          if (!value || value.trim() === '') return [];
          
          // JSON 배열 형식인지 확인
          if (value.startsWith('[') && value.endsWith(']')) {
            try {
              return JSON.parse(value);
            } catch {
              // JSON 파싱 실패 시 쉼표로 분리
              return value.split(',').map(item => item.trim().replace(/^"|"$/g, ''));
            }
          }
          
          // 따옴표로 감싸진 배열 형식인지 확인
          if (value.startsWith('"[') && value.endsWith(']"')) {
            try {
              const innerValue = value.slice(1, -1);
              return JSON.parse(innerValue);
            } catch {
              // JSON 파싱 실패 시 쉼표로 분리
              return value.slice(1, -1).split(',').map(item => item.trim().replace(/^"|"$/g, ''));
            }
          }
          
          // 일반 쉼표로 구분된 형식
          return value.split(',').map(item => item.trim().replace(/^"|"$/g, ''));
        };
        
        // Google Drive URL을 직접 이미지 URL로 변환하는 함수
        const convertGoogleDriveUrl = (url: string): string => {
          // Google Drive 공유 링크 패턴들
          const patterns = [
            // https://drive.google.com/file/d/{fileId}/view?usp=sharing
            /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)\/view/,
            // https://drive.google.com/open?id={fileId}
            /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9-_]+)/,
            // https://docs.google.com/document/d/{fileId}/edit
            /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)\/edit/,
            // https://drive.google.com/uc?id={fileId}
            /https:\/\/drive\.google\.com\/uc\?id=([a-zA-Z0-9-_]+)/
          ];
          
          for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
              const fileId = match[1];
              // Google Drive 이미지 직접 접근 URL로 변환
              return `https://drive.google.com/uc?export=view&id=${fileId}`;
            }
          }
          
          // 변환할 수 없는 경우 원본 URL 반환
          return url;
        };
        
        // 이미지 URL 유효성 검사 함수
        const validateImageUrl = (url: string): string => {
          if (!url || url.trim() === '') return example1;
          
          // Google Drive 링크 변환
          const googleDriveUrl = convertGoogleDriveUrl(url);
          if (googleDriveUrl !== url) {
            return googleDriveUrl;
          }
          
          // URL이 유효한지 확인
          try {
            new URL(url);
            return url;
          } catch {
            // 상대 경로나 로컬 이미지인 경우
            if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
              return url;
            }
            // 외부 URL이지만 http/https가 없는 경우
            if (url.startsWith('www.') || url.includes('.') && !url.startsWith('http')) {
              return `https://${url}`;
            }
            // 유효하지 않은 URL인 경우 기본 이미지 반환
            return example1;
          }
        };
        
        // Base64 이미지를 디코딩하는 함수
        const decodeBase64Image = (base64String: string): string | null => {
          if (!base64String || base64String.trim() === '') return null;
          // 이미 data:image 접두사가 있으면 그대로 반환
          if (base64String.startsWith('data:image')) {
            return base64String;
          }
          // Base64 문자열인 경우 접두사 추가
          return `data:image/jpeg;base64,${base64String}`;
        };

        const transformedData = lines.slice(1)
          .filter(line => {
            // 빈 행이나 헤더 행 제외
            const trimmed = line.trim();
            if (!trimmed) return false;
            const values = parseCSVLine(trimmed);
            // 최소한 제목이나 설명이 있어야 유효한 데이터로 간주
            return values.length > 2 && (values[2] || values[3]);
          })
          .map((line, index) => {
            const values = parseCSVLine(line);
            
            // 스프레드시트 컬럼 구조:
            // 0: 타임스탬프, 1: id, 2: title, 3: description, 4: location,
            // 5: installmentDate, 6: equipment, 7: mainImage, 8: mainImageExtra,
            // 9: detailImage1, 10: detailImageExtra1, 11: detailImage2,
            // 12: detailImageExtra2, 13: detailImage3, 14: detailImageExtra3
            
            // 이미지 조합 (base64 분할 이미지 합치기)
            const mainImageBase64 = ((values[7] || '').trim() + (values[8] || '').trim());
            const detailImage1Base64 = ((values[9] || '').trim() + (values[10] || '').trim());
            const detailImage2Base64 = ((values[11] || '').trim() + (values[12] || '').trim());
            const detailImage3Base64 = ((values[13] || '').trim() + (values[14] || '').trim());
            
            // Base64 이미지를 디코딩
            const mainImage = mainImageBase64 ? decodeBase64Image(mainImageBase64) : null;
            const detailImage1 = detailImage1Base64 ? decodeBase64Image(detailImage1Base64) : null;
            const detailImage2 = detailImage2Base64 ? decodeBase64Image(detailImage2Base64) : null;
            const detailImage3 = detailImage3Base64 ? decodeBase64Image(detailImage3Base64) : null;
            
            // 상세 이미지 배열 생성 (null 제외)
            const detailImages = [detailImage1, detailImage2, detailImage3]
              .filter((img): img is string => img !== null);
            
            // 날짜 파싱
            let formattedDate = values[5] || '';
            if (formattedDate) {
              try {
                // "2025. 10. 9" 또는 "2025-01-15" 형식 파싱
                if (formattedDate.includes('.')) {
                  const dateParts = formattedDate.split('.').map(p => p.trim());
                  if (dateParts.length >= 3) {
                    const year = dateParts[0];
                    const month = dateParts[1].padStart(2, '0');
                    const day = dateParts[2].padStart(2, '0');
                    formattedDate = `${year}년 ${month}월 ${day}일`;
                  }
                } else if (formattedDate.includes('-')) {
                  // ISO 형식 (2025-01-15)
                  const dateObj = new Date(formattedDate);
                  if (!isNaN(dateObj.getTime())) {
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    formattedDate = `${year}년 ${month}월 ${day}일`;
                  }
                }
              } catch (e) {
                console.warn('날짜 파싱 오류:', e, formattedDate);
              }
            }
            
            // equipment를 배열로 변환 (쉼표로 구분되어 있다고 가정)
            const equipmentArray = values[6] 
              ? values[6].split(',').map(item => item.trim()).filter(item => item)
              : [];
            
            const item = {
              id: parseInt(values[1]) || index + 1,
              title: values[2] || '',
              description: values[3] || '',
              location: values[4] || '',
              date: formattedDate,
              equipment: equipmentArray,
              mainImage: mainImage || null, // 이미지가 없으면 null
              hasMainImage: !!mainImage, // 이미지 존재 여부 플래그
              detailImages: detailImages.length > 0 
                ? detailImages
                : [],
              alt: values[2] || '시공사례 이미지'
            };
            
            console.log(`포트폴리오 ${index + 1}:`, {
              title: item.title,
              description: item.description.substring(0, 50) + '...',
              location: item.location,
              date: item.date,
              equipment: item.equipment,
              mainImageLength: mainImageBase64.length,
              detailImagesCount: detailImages.length,
              hasMainImage: !!mainImage
            });
            
            return item;
          })
          .filter(item => item.title || item.description); // 제목이나 설명이 있는 항목만 표시

        console.log(`✅ 포트폴리오 ${transformedData.length}개를 불러왔습니다.`);
        
        if (transformedData.length === 0) {
          console.warn('⚠️ 불러온 데이터가 없습니다. CSV를 확인해주세요.');
        }
        
        setCaseList(transformedData);
      } catch (error) {
        console.error('❌ 시공사례 데이터 가져오기 오류:', error);
        
        // 에러 상세 정보 추출
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails = {
          message: errorMessage,
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined
        };
        
        console.error('에러 상세:', errorDetails);
        
        // 에러 발생 시 빈 배열로 설정 (샘플 데이터 표시 안 함)
        setCaseList([]);
        
        // 사용자에게 더 구체적인 에러 메시지 표시
        const userMessage = errorMessage.includes('HTTP 403') 
          ? '시공사례 데이터를 불러올 수 없습니다. 스프레드시트 공유 설정을 확인해주세요.'
          : errorMessage.includes('HTTP 404')
          ? '시공사례 데이터를 찾을 수 없습니다. 스프레드시트 URL을 확인해주세요.'
          : errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')
          ? '시공사례 데이터를 불러올 수 없습니다. 네트워크 연결을 확인해주세요.'
          : `시공사례 데이터를 불러오는데 실패했습니다.\n\n오류: ${errorMessage}\n\n잠시 후 다시 시도해주세요.`;
        
        alert(userMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    console.log('caseList: ', caseList);
  }, [caseList]);



  // 이미지 라이트박스
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  
  // 사례 모달
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    console.log('selectedCase: ', selectedCase);
  }, [selectedCase]);
  
  // 이미지 클릭 핸들러
  const handleImageClick = (caseItem: CaseData) => {
    setSelectedCase(caseItem);
    setShowDetailModal(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedCase(null);
  };

  // ESC 키 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDetailModal) {
        handleCloseModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDetailModal]);

  // 모달 외부 클릭 핸들러
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // 클릭된 요소가 오버레이(배경) 자체인 경우에만 닫기
    if (event.target === event.currentTarget) {
      handleCloseModal();
    }
  };

  // 이미지 에러 핸들러
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    img.src = example1; // 기본 이미지로 대체
    img.alt = '이미지를 불러올 수 없습니다';
  };

  return (
    <div className="flex flex-col items-center pb-20">
      <h1 className="text-center text-4xl mt-20">시공사례</h1>
      <div className="sub-title my-4 text-xl text-center">납품 및 시공실적</div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : caseList.length === 0 ? (
        <div className="p-4 w-[100%] max-w-[1200px] text-center py-12">
          <p className="text-gray-400 text-lg">등록된 시공사례가 없습니다.</p>
        </div>
      ) : (
        <div className="p-4 w-[100%] max-w-[1200px]">
          {/* 격자형 이미지 갤러리 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {caseList.map((item) => (
              <div
                key={item.id}
                className="relative group cursor-pointer overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => handleImageClick(item)}
              >
                {/* 이미지 */}
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-200">
                  {item.mainImage ? (
                    <img
                      src={item.mainImage}
                      alt={item.alt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                      <svg className="w-12 h-12 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500 text-xs font-medium">이미지 없음</p>
                    </div>
                  )}
                  {/* 오버레이 그라데이션 (항상 표시) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  {/* 제목 오버레이 (항상 표시) */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-lg font-semibold drop-shadow-lg">{item.title}</h3>
                    {item.location && (
                      <p className="text-sm text-white/90 mt-1">{item.location}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 사례 상세 모달 */}
          {showDetailModal && selectedCase && (
            <div 
              className="fixed inset-0 z-50 flex flex-col lg:items-center lg:justify-center p-0 lg:p-4 bg-white lg:bg-black lg:bg-opacity-75 overflow-y-auto"
              onClick={handleOverlayClick}
            >
              <div className="bg-white w-full h-full lg:rounded-lg lg:max-w-6xl lg:w-full lg:max-h-[90vh] lg:overflow-y-auto lg:my-8 flex flex-col">
                {/* 헤더 영역 - 모바일에서 고정 */}
                <div className="flex justify-between items-center p-4 lg:p-8 border-b pb-4 lg:pb-6 bg-white lg:bg-transparent sticky top-0 z-10 lg:relative lg:sticky-none">
                  <h2 className="text-2xl lg:text-4xl font-bold text-black text-left">{selectedCase.title}</h2>
                  <button 
                    onClick={handleCloseModal}
                    className="text-gray-500 hover:text-gray-700 p-2"
                  >
                    <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                {/* 콘텐츠 영역 - 스크롤 가능 */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                  
                  {/* 블로그 스타일 레이아웃 */}
                  <article className="prose prose-lg max-w-none text-black">
                    {/* 메타 정보 */}
                    <div className="flex items-center mb-8 text-gray-600">
                      <span className="mr-4">{selectedCase.date}</span>
                      <span className="mr-4">|</span>
                      <span>{selectedCase.location}</span>
                    </div>
                    
                    {/* 메인 이미지 */}
                    {selectedCase.mainImage && (
                      <div className="my-12">
                        <img 
                          src={selectedCase.mainImage} 
                          alt={selectedCase.alt} 
                          className="w-full h-auto rounded-lg shadow-lg"
                          onError={handleImageError}
                        />
                      </div>
                    )}
                    
                    {/* 프로젝트 설명 */}
                    <h3 className="text-2xl font-semibold mt-12 mb-6 text-left">프로젝트 개요</h3>
                    <p className="mb-12 text-lg leading-relaxed text-left">{selectedCase.description}</p>
                    
                    {/* 첫 번째 상세 이미지 */}
                    {selectedCase.detailImages.length > 0 && (
                      <div className="my-12">
                        <img 
                          src={selectedCase.detailImages[0]} 
                          alt={`${selectedCase.title} 상세 이미지 1`} 
                          className="w-full h-auto rounded-lg shadow-md cursor-pointer"
                          onClick={() => setLightboxIndex(0)}
                          onError={handleImageError}
                        />
                        <p className="text-sm text-gray-500 mt-2 italic text-left">이미지를 클릭하면 확대해서 볼 수 있습니다</p>
                      </div>
                    )}
                    
                    {/* 설치 장비 */}
                    <h3 className="text-2xl font-semibold mt-12 mb-6 text-left">설치 장비</h3>
                    <p className="mb-12 text-lg text-left">
                      {selectedCase.equipment.join(', ')}
                    </p>
                    
                    {/* 두 번째 상세 이미지 */}
                    {selectedCase.detailImages.length > 1 && (
                      <div className="my-12">
                        <img 
                          src={selectedCase.detailImages[1]} 
                          alt={`${selectedCase.title} 상세 이미지 2`} 
                          className="w-full h-auto rounded-lg shadow-md cursor-pointer"
                          onClick={() => setLightboxIndex(1)}
                        />
                      </div>
                    )}
                    
                    {/* 프로젝트 후기 */}
                    <h3 className="text-2xl font-semibold mt-12 mb-6 text-left">프로젝트 특징</h3>
                    <p className="mb-12 text-lg leading-relaxed text-left">
                      본 프로젝트는 {selectedCase.location}에 위치한 {selectedCase.title} 시스템을 구축한 사례입니다. 
                      고객의 요구사항을 충족시키기 위해 최적의 음향 시스템을 설계하고 구현했습니다. 
                      특히 공간의 특성을 고려한 맞춤형 솔루션을 제공하여 최상의 음향 경험을 제공했습니다.
                    </p>
                    
                    {/* 세 번째 상세 이미지 */}
                    {selectedCase.detailImages.length > 2 ? (
                      <div className="my-12">
                        <img 
                          src={selectedCase.detailImages[2]} 
                          alt={`${selectedCase.title} 상세 이미지 3`} 
                          className="w-full h-auto rounded-lg shadow-md cursor-pointer"
                          onClick={() => setLightboxIndex(2)}
                          onError={handleImageError}
                        />
                      </div>
                    ) : null}
                    
                    {/* 추가 이미지 갤러리 */}
                    {selectedCase.detailImages.length > 3 && (
                      <div className="my-12">
                        <h3 className="text-2xl font-semibold mb-4">추가 이미지</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {selectedCase.detailImages.slice(3).map((img, idx) => (
                            <img 
                              key={idx + 3} 
                              src={img} 
                              alt={`${selectedCase.title} 추가 이미지 ${idx + 1}`} 
                              className="w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setLightboxIndex(idx + 3)}
                              onError={handleImageError}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 문의하기 섹션 */}
                    <div className="mt-12 mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* 문의 이미지 (있는 경우에만 표시) */}
                        {selectedCase.inquiry?.image && (
                          <div className="md:w-1/3">
                            <img 
                              src={selectedCase.inquiry.image} 
                              alt="문의 이미지" 
                              className="w-full h-auto rounded-lg shadow-md"
                              onError={handleImageError}
                            />
                          </div>
                        )}
                        
                        {/* 문의 텍스트 */}
                        <div className={`${selectedCase.inquiry?.image ? 'md:w-2/3' : 'w-full'}`}>
                          <h3 className="text-2xl font-semibold mb-4">
                            {selectedCase.inquiry?.title || '이 프로젝트에 관심이 있으신가요?'}
                          </h3>
                          <p className="mb-6 text-lg">
                            {selectedCase.inquiry?.description || 
                              '당신의 공간에 맞는 최적의 음향 시스템에 대해 궁금하시다면 언제든지 문의해주세요. 전문 엔지니어가 고객님의 요구에 맞는 맞춤형 솔루션을 제안해 드립니다.'}
                          </p>
                          <button 
                            className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors"
                            onClick={() => window.location.href = `mailto:${selectedCase.inquiry?.email || 'info@thesound.com'}?subject=프로젝트문의_${selectedCase.title}`}
                          >
                            {selectedCase.inquiry?.buttonText || '문의하기'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          )}
          
          {/* 이미지 라이트박스 */}
          <Lightbox
            slides={selectedCase?.detailImages.map(src => ({ src })) || []}
            open={lightboxIndex >= 0}
            index={lightboxIndex}
            close={() => setLightboxIndex(-1)}
            plugins={[Fullscreen, Slideshow, Thumbnails, Zoom]}
          />
        </div>
      )}
    </div>
  );
}
