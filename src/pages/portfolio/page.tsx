"use client";

import { useEffect, useState } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
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

// 사례 데이터 타입 정의
interface CaseData {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  equipment: string[];
  mainImage: string;
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
  const caseList: CaseData[] = [
    {
      id: 1,
      title: "서울 홍대 라이브 클럽",
      description: "홍대 라이브 클럽 음향 시스템 설치 및 조명 설치",
      location: "서울시 마포구 홍대입구",
      date: "2023년 2월",
      equipment: [
        "메인 스피커 E212 4대",
        "서브우퍼 S218 2대",
        "파워 앰프 Crown XTi6002",
        "조명 시스템 설치"
      ],
      mainImage: example1,
      detailImages: [example1, example2, example3],
      alt: "홍대 라이브 클럽",
      inquiry: {
        title: "라이브 클럽 음향 시스템에 관심이 있으신가요?",
        description: "라이브 음악을 위한 최적의 음향 시스템을 구축해 드립니다. 홍대 클럽 현장 방문 및 데모 시연도 가능합니다.",
        image: example3,
        email: "club@thesound.com",
        buttonText: "클럽 음향 문의하기"
      }
    },
    {
      id: 2,
      title: "부산 해운대 컨퍼런스홀",
      description: "대형 컨퍼런스홀 음향 및 영상 시스템 구축",
      location: "부산시 해운대구",
      date: "2022년 11월",
      equipment: [
        "메인 스피커 E212 8대",
        "딜레이 스피커 E12 6대",
        "디지털 믹서 콘솔",
        "LED 디스플레이 설치"
      ],
      mainImage: example2,
      detailImages: [example2, example3, example4],
      alt: "해운대 컨퍼런스홀",
      inquiry: {
        title: "컨퍼런스홀 음향 시스템 구축이 필요하신가요?",
        description: "대형 컨퍼런스홀이나 강당을 위한 최적의 음향 및 영상 시스템을 제안해 드립니다. 공간 특성에 맞는 설계를 통해 완벽한 음향을 구현합니다.",
        image: example2,
        email: "conference@thesound.com",
        buttonText: "컨퍼런스 시스템 상담받기"
      }
    },
    {
      id: 3,
      title: "인천 공연장 시스템",
      description: "공연장 전체 음향 시스템 리노베이션",
      location: "인천시 남동구",
      date: "2023년 4월",
      equipment: [
        "메인 스피커 E212 시스템",
        "모니터 스피커 TS M12 8대",
        "디지털 믹서 시스템",
        "조명 및 특수효과 장비"
      ],
      mainImage: example3,
      detailImages: [example3, example4, example1],
      alt: "인천 공연장",
      inquiry: {
        title: "공연장 음향 시스템 리노베이션을 계획 중이신가요?",
        description: "노후된 음향 시스템을 최신 장비로 업그레이드해 드립니다. 전문 엔지니어의 튜닝으로 최적의 공연 환경을 만들어 드립니다.",
        image: example4,
        email: "renovation@thesound.com",
        buttonText: "리노베이션 견적 요청하기"
      }
    },
    {
      id: 4,
      title: "대전 교회 음향시스템",
      description: "대형 교회 음향 및 영상 시스템 구축 사례",
      location: "대전시 유성구",
      date: "2022년 8월", 
      equipment: [
        "메인 스피커 E212 6대",
        "서브우퍼 S218 4대",
        "영상 시스템 설치",
        "디지털 믹서 콘솔"
      ],
      mainImage: example4,
      detailImages: [example4, example1, example2],
      alt: "대전 교회",
      inquiry: {
        title: "교회 음향 시스템 업그레이드가 필요하신가요?",
        description: "예배나 찬양을 위한 최적의 음향 시스템을 구축합니다. 목소리와 악기의 밸런스가 완벽한 예배당을 만들어 드립니다.",
        image: example1,
        email: "church@thesound.com",
        buttonText: "교회 음향 상담하기"
      }
    }
  ];

  // 이미지 라이트박스
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  
  // 사례 모달
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
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

  // 사진 앨범용 이미지 배열
  const photos = caseList.map(item => ({
    src: item.mainImage,
    alt: item.alt,
    width: 1200,
    height: 860,
    caseData: item
  }));

  return (
    <div className="flex flex-col items-center pb-20">
      <h1 className="text-center text-4xl mt-20">시공사례</h1>
      <div className="sub-title my-4 text-xl text-center">납품 및 시공실적</div>
      <div className="p-4 w-[100%] max-w-[800px]">
        <RowsPhotoAlbum
          photos={photos}
          onClick={({ photo }) => handleImageClick(photo.caseData)}
          spacing={20}
          targetRowHeight={300}
        />
        
        {/* 사례 상세 모달 */}
        {showDetailModal && selectedCase && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 overflow-y-auto"
            onClick={handleOverlayClick}
          >
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8">
              <div className="p-8">
                {/* 헤더 영역 */}
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="text-4xl font-bold text-black">{selectedCase.title}</h2>
                  <button 
                    onClick={handleCloseModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                {/* 블로그 스타일 레이아웃 */}
                <article className="prose prose-lg max-w-none text-black">
                  {/* 메타 정보 */}
                  <div className="flex items-center mb-6 text-gray-600">
                    <span className="mr-4">{selectedCase.date}</span>
                    <span className="mr-4">|</span>
                    <span>{selectedCase.location}</span>
                  </div>
                  
                  {/* 메인 이미지 */}
                  <div className="my-8">
                    <img 
                      src={selectedCase.mainImage} 
                      alt={selectedCase.alt} 
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                  
                  {/* 프로젝트 설명 */}
                  <h3 className="text-2xl font-semibold mt-8 mb-4">프로젝트 개요</h3>
                  <p className="mb-8 text-lg leading-relaxed">{selectedCase.description}</p>
                  
                  {/* 첫 번째 상세 이미지 */}
                  {selectedCase.detailImages.length > 0 && (
                    <div className="my-8">
                      <img 
                        src={selectedCase.detailImages[0]} 
                        alt={`${selectedCase.title} 상세 이미지 1`} 
                        className="w-full h-auto rounded-lg shadow-md cursor-pointer"
                        onClick={() => setLightboxIndex(0)}
                      />
                      <p className="text-sm text-gray-500 mt-2 italic text-center">이미지를 클릭하면 확대해서 볼 수 있습니다</p>
                    </div>
                  )}
                  
                  {/* 설치 장비 */}
                  <h3 className="text-2xl font-semibold mt-8 mb-4">설치 장비</h3>
                  <ul className="list-disc pl-5 mb-8 space-y-2">
                    {selectedCase.equipment.map((item, idx) => (
                      <li key={idx} className="text-lg">{item}</li>
                    ))}
                  </ul>
                  
                  {/* 두 번째 상세 이미지 */}
                  {selectedCase.detailImages.length > 1 && (
                    <div className="my-8">
                      <img 
                        src={selectedCase.detailImages[1]} 
                        alt={`${selectedCase.title} 상세 이미지 2`} 
                        className="w-full h-auto rounded-lg shadow-md cursor-pointer"
                        onClick={() => setLightboxIndex(1)}
                      />
                    </div>
                  )}
                  
                  {/* 프로젝트 후기 */}
                  <h3 className="text-2xl font-semibold mt-8 mb-4">프로젝트 특징</h3>
                  <p className="mb-8 text-lg leading-relaxed">
                    본 프로젝트는 {selectedCase.location}에 위치한 {selectedCase.title} 시스템을 구축한 사례입니다. 
                    고객의 요구사항을 충족시키기 위해 최적의 음향 시스템을 설계하고 구현했습니다. 
                    특히 공간의 특성을 고려한 맞춤형 솔루션을 제공하여 최상의 음향 경험을 제공했습니다.
                  </p>
                  
                  {/* 세 번째 상세 이미지 */}
                  {selectedCase.detailImages.length > 2 && (
                    <div className="my-8">
                      <img 
                        src={selectedCase.detailImages[2]} 
                        alt={`${selectedCase.title} 상세 이미지 3`} 
                        className="w-full h-auto rounded-lg shadow-md cursor-pointer"
                        onClick={() => setLightboxIndex(2)}
                      />
                    </div>
                  )}
                  
                  {/* 추가 이미지 갤러리 */}
                  {selectedCase.detailImages.length > 3 && (
                    <div className="my-8">
                      <h3 className="text-2xl font-semibold mb-4">추가 이미지</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedCase.detailImages.slice(3).map((img, idx) => (
                          <img 
                            key={idx + 3} 
                            src={img} 
                            alt={`${selectedCase.title} 추가 이미지 ${idx + 1}`} 
                            className="w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxIndex(idx + 3)}
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
    </div>
  );
}
