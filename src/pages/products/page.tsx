import React, { useState, useEffect } from "react";
import speakerImage from "../../assets/images/speaker.png";
import videoImage from "../../assets/images/3d-video.png";
import spotlightsImage from "../../assets/images/spotlights.png";
import ledImage from "../../assets/images/led.png";

type ItemModel = {
  model: string;
  url: string;
  alt: string;
  kind: string;
  desc: string;
  spec?: Record<string, string> | undefined;
};

// Base64 이미지를 디코딩하는 함수
const decodeBase64Image = (base64String: string): string => {
  if (!base64String) return '';
  // 이미 data:image로 시작하면 그대로 반환
  if (base64String.startsWith('data:image')) {
    return base64String;
  }
  // 아니면 data:image 헤더 추가
  return `data:image/png;base64,${base64String}`;
};

export default function Products() {
  const [productsList, setProductsList] = useState<ItemModel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 기본 제품 데이터 (fallback용)
  const defaultProducts: ItemModel[] = [
    {
      model: "E212",
      kind: `메인 스피커`,
      url: speakerImage,
      alt: "메인 스피커",
      desc: 'E212 스피커는 유수한 스피커제조사들이 사용하는 B&C(ITALY) SPEAKER를 시작으로 CROSSOVER NETWORK 부품엔 hi-end 스피커 제조사들이 사용하는 JANTZEN(DENMARK)사의 MOX RESISTANCE, CAPACITOR, AIR CORE COIL을 사용하여 ANALOGUE 사운드를 추구하였고, 스피커 내부에 사용되는 케이블 역시 hi-end 스피커 제조사들이 사용하는 NEOTECH(TAIWAN)사의 케이블을 사용하여 좋은 소리를 위해서 과감한 물량으로 제조 되었습니다. 물량뿐 아니라 음향학적 이론의 토대 위의 허용 가능한 수정을 하기 위해, 음향 관련 현직에서 일하고 계시는 교수님들과 음향 감독님들과의 수 없는 현장에서의 데모를 통해 2년 이라는 개발기간을 거치며 4번의 ENCLOSER 수정, 6번의 CROSSOVER NETWORK수정을 거쳐 마침내 MADE IN KOREA 스피커인 E212가 나오게 되었습니다.\n 좋은 소리를 위해 많은 비용이 필요한 현실에서 E212는 좋은 대안이 되어 줄 것입니다.',
      spec: {
        'TYPE': "2WAY PASSIVE SPEAKER",
        'COMPONENTS': `LOW: 2 X 12" 3" VOICE COIL (B&C)
        HI: 1 X 1.4" 3" VOICE COIL (B&C) COAXIAL
        CROSSOVER NETWORK (JANTZEN)
        `,
        "FREQUENCY RESPONSE": "45HZ - 18,000HZ",
        "POWER HANDLING CAPACITY(PROGRAM/PEAK)": '1400/2800',
        'NOMINAL IMPEDANCE': '40HM',
        'COVERAGE(HXV)': '60° X 40° OR 40° X 60° HF-HORN ROTATABLE',
        "SPLmax/1m": "137dB",
        "SENSITIVITY(1W/1M)": '109dB',
        'CONNECTION': '2 X NL4 1$',
        'ENCLOSER': '15mm BALTIC PLYWOOD',
        'FINISH': 'WARNEX TEXTURE PAINT (BLACK OR WHITE)',
        'DIMENSIONS(H X W X D)': '700 X 450 X 430',
        'WEIGHT': '40KG'
      }
    },
    {
      model: "TS M12",
      kind: `12인치 모니터`,
      url: videoImage,
      alt: "",
      desc: '',
      spec: undefined
    },
    {
      model: "E12",
      kind: `딜레이 스피커`,
      url: spotlightsImage,
      alt: "",
      desc: '',
      spec: undefined
    },
    {
      model: "S218",
      kind: `서브우퍼`,
      url: ledImage,
      alt: "",
      desc: '',
      spec: undefined
    },
    {
      model: "E15",
      kind: `15인치 스피커`,
      url: speakerImage,
      alt: "",
      desc: '15인치 고출력 스피커로 중대형 공간에 적합한 제품입니다.',
      spec: {
        'TYPE': "15\" PASSIVE SPEAKER",
        'POWER': "800W RMS",
        'FREQUENCY RESPONSE': "50HZ - 20,000HZ",
        'SENSITIVITY': "98dB"
      }
    },
    {
      model: "LED BAR 100",
      kind: `LED 바`,
      url: ledImage,
      alt: "",
      desc: '100개 LED를 사용한 고출력 LED 바 조명입니다.',
      spec: {
        'TYPE': "LED BAR LIGHT",
        'LED COUNT': "100 PCS",
        'POWER': "200W",
        'BEAM ANGLE': "15°"
      }
    },
    {
      model: "MIXER X32",
      kind: `디지털 믹서`,
      url: videoImage,
      alt: "",
      desc: '32채널 디지털 믹서로 전문적인 음향 제어가 가능합니다.',
      spec: {
        'TYPE': "DIGITAL MIXER",
        'CHANNELS': "32 INPUT / 16 OUTPUT",
        'SAMPLE RATE': "48kHz",
        'EFFECTS': "Built-in Effects"
      }
    },
    {
      model: "AMP 2000",
      kind: `파워 앰프`,
      url: spotlightsImage,
      alt: "",
      desc: '2000W 파워 앰프로 고출력 스피커 구동에 최적화되었습니다.',
      spec: {
        'TYPE': "POWER AMPLIFIER",
        'POWER': "2000W @ 4Ω",
        'THD': "<0.1%",
        'FREQUENCY RESPONSE': "20HZ - 20,000HZ"
      }
    },
  ];

  const [selectedItem, setSelectedItem] = useState<ItemModel | null>(null);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); // 한 페이지당 제품 수
  
  // Google Spreadsheet에서 제품 데이터 가져오기
  useEffect(() => {
    const fetchProductsFromSpreadsheet = async () => {
      setLoading(true);
      try {
        const SPREADSHEET_ID = process.env.REACT_APP_PRODUCTS_SPREADSHEET_ID || "1p8P_4ymeoSof5ExXClamxYwtvOtDK9Q1Sw4gSawu9uo";
        console.log('📊 사용 중인 스프레드시트 ID:', SPREADSHEET_ID);
        
        // gid를 지정하지 않으면 "설문지 응답" 시트를 가져옴 (Google Form 응답 시트)
        const response = await fetch(
          `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`
        );
        
        if (!response.ok) {
          throw new Error('스프레드시트 데이터를 가져오는데 실패했습니다.');
        }
        
        const csvText = await response.text();
        
        // CSV 파싱 함수 (따옴표 안의 쉼표와 줄바꿈 처리)
        const parseCSV = (text: string): string[][] => {
          const rows: string[][] = [];
          let currentRow: string[] = [];
          let currentField = '';
          let insideQuotes = false;
          
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];
            
            if (char === '"') {
              if (insideQuotes && nextChar === '"') {
                // 이중 따옴표는 하나의 따옴표로
                currentField += '"';
                i++; // 다음 따옴표 건너뛰기
              } else {
                // 따옴표 토글
                insideQuotes = !insideQuotes;
              }
            } else if (char === ',' && !insideQuotes) {
              // 필드 구분자
              currentRow.push(currentField.trim());
              currentField = '';
            } else if (char === '\n' && !insideQuotes) {
              // 행 구분자
              currentRow.push(currentField.trim());
              if (currentRow.some(field => field !== '')) {
                rows.push(currentRow);
              }
              currentRow = [];
              currentField = '';
            } else {
              currentField += char;
            }
          }
          
          // 마지막 필드와 행 처리
          if (currentField || currentRow.length > 0) {
            currentRow.push(currentField.trim());
            if (currentRow.some(field => field !== '')) {
              rows.push(currentRow);
            }
          }
          
          return rows;
        };
        
        const rows = parseCSV(csvText);
        
        if (rows.length <= 1) {
          console.warn('스프레드시트에 데이터가 없습니다. 기본 데이터를 사용합니다.');
          setProductsList(defaultProducts);
          return;
        }
        
        // 헤더 확인 (타임스탬프, id, productName, category, description, specification, productImage, productImageExtra)
        const headers = rows[0];
        console.log('📋 스프레드시트 헤더:', headers);
        console.log('📊 총 컬럼 수:', headers.length);
        
        // 데이터 파싱 (헤더 제외)
        const products = rows.slice(1).map((values, index) => {
          // CSV 컬럼: 타임스탬프, id, productName, category, description, specification, productImage, productImageExtra
          const timestamp = values[0] || '';
          const id = values[1] || '';
          const productName = values[2] || '';
          const category = values[3] || '';
          const description = values[4] || '';
          const specification = values[5] || '';
          const productImage = values[6] || '';
          const productImageExtra = values[7] || ''; // 8번째 컬럼
          
          console.log(`\n🔍 제품 ${index + 1} (ID: ${id}):`, { 
            timestamp,
            productName, 
            category, 
            descLength: description.length, 
            specLength: specification.length, 
            imageLength: productImage.length,
            imageExtraLength: productImageExtra.length,
            imagePreview: productImage.substring(0, 50)
          });
          
          // 이미지 처리: productImage와 productImageExtra를 합쳐서 완전한 base64 이미지 생성
          let imageUrl = speakerImage; // 기본 이미지
          if (productImage && productImage.length > 10) {
            // productImageExtra가 있으면 합치기
            const fullBase64 = productImageExtra ? productImage + productImageExtra : productImage;
            imageUrl = decodeBase64Image(fullBase64);
            console.log(`  → 이미지 합침: ${productImage.length} + ${productImageExtra.length} = ${fullBase64.length}자`);
          }
          
          // 사양 정보 파싱 (쉼표로 구분된 key:value 형식)
          let spec: Record<string, string> | undefined = undefined;
          if (specification && specification.trim()) {
            spec = {};
            // 쉼표로 구분된 사양 항목들
            const specItems = specification.split(',').map(s => s.trim()).filter(s => s);
            specItems.forEach(item => {
              const colonIndex = item.indexOf(':');
              if (colonIndex !== -1) {
                const key = item.substring(0, colonIndex).trim();
                const value = item.substring(colonIndex + 1).trim();
                if (key && value) {
                  spec![key] = value;
                }
              }
            });
            // 사양이 비어있으면 undefined로 설정
            if (Object.keys(spec).length === 0) {
              spec = undefined;
            }
          }
          
          return {
            model: productName,
            kind: category,
            url: imageUrl,
            alt: productName,
            desc: description,
            spec
          };
        }).filter(product => product.model); // 모델명이 있는 것만 필터링
        
        if (products.length > 0) {
          setProductsList(products);
          console.log(`✅ 스프레드시트에서 ${products.length}개 제품을 불러왔습니다.`);
        } else {
          console.warn('스프레드시트에서 유효한 제품 데이터를 찾을 수 없습니다. 기본 데이터를 사용합니다.');
          setProductsList(defaultProducts);
        }
      } catch (error) {
        console.error('스프레드시트 데이터 가져오기 오류:', error);
        console.log('기본 제품 데이터를 사용합니다.');
        setProductsList(defaultProducts);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductsFromSpreadsheet();
  }, []);

  // 페이징 계산
  const totalPages = Math.ceil(productsList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = productsList.slice(startIndex, endIndex);

  const selectItem = (index: number) => {
    // 현재 페이지의 실제 인덱스로 변환
    const actualIndex = startIndex + index;
    setSelectedItem(productsList[actualIndex]);
    // 모든 화면 크기에서 팝업 열기
    setIsSpecModalOpen(true);
  };

  const closeSpecModal = () => {
    setIsSpecModalOpen(false);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // 페이지 변경 시 스크롤을 제품 그리드로 이동
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // 로딩 중일 때 표시
  if (loading) {
    return (
      <section className="pt-[70px] min-h-[100vh] bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-white text-xl">제품 데이터를 불러오는 중...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-[70px] min-h-[100vh] bg-slate-900">
      {/* Title Section */}
      <div className="py-8 px-8 border-b border-slate-700/50">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            제품소개
          </h2>
          <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
        </div>
      </div>

      {/* Products Grid */}
      <div id="products-section" className="px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* 제품 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {currentProducts.map((part, index) => (
              <div
                key={startIndex + index}
                className="group cursor-pointer"
                onClick={() => selectItem(index)}
              >
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30">
                  <div className="relative mb-6">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 shadow-lg">
                      <img 
                        src={part.url} 
                        width={200} 
                        height={200} 
                        alt={part.alt || part.model} 
                        className="w-full h-48 object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-800/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">
                      {part.model}
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-200 transition-colors duration-300">
                      {part.kind}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages >= 1 && (
            <div className="flex justify-center items-center space-x-4">
              {/* 이전 페이지 버튼 */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === 1
                    ? 'bg-slate-700/50 text-gray-500 cursor-not-allowed'
                    : 'bg-slate-700/80 text-white hover:bg-slate-600/80 hover:scale-105'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* 페이지 번호들 */}
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-slate-700/80 text-gray-300 hover:bg-slate-600/80 hover:text-white hover:scale-105'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* 다음 페이지 버튼 */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === totalPages
                    ? 'bg-slate-700/50 text-gray-500 cursor-not-allowed'
                    : 'bg-slate-700/80 text-white hover:bg-slate-600/80 hover:scale-105'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* 페이지 정보 */}
          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">
              {startIndex + 1}-{Math.min(endIndex, productsList.length)} / {productsList.length} 제품
            </p>
          </div>
        </div>
      </div>

      {/* Default Content - Company Introduction */}
      <div className="px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Company Philosophy */}
              <div className="p-12 flex flex-col justify-center bg-gradient-to-br from-slate-800/20 to-slate-900/20">
                <div className="text-center">
                  <h4 className="text-3xl font-bold text-white mb-8">
                    The Sound
                    <span className="block text-lg text-blue-300 mt-2">Professional Audio Solutions</span>
                  </h4>
                  <div className="relative mx-auto w-64 h-64 mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>
                    <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-full p-8 border border-slate-600/30 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center border-2 border-blue-400/50">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="p-12">
                <h5 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-3">
                  제품 선택 안내
                </h5>
                <div className="space-y-6">
                  <div className="bg-slate-800/20 rounded-lg p-6 border border-slate-700/30 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600"></div>
                    <h6 className="text-lg font-semibold text-white mb-3 pl-4">
                      PRODUCT SELECTION
                    </h6>
                    <p className="text-gray-300 text-sm leading-relaxed pl-4">
                      위의 제품 카드를 클릭하시면 상세한 제품 정보와 사양을 확인하실 수 있습니다.
                    </p>
                  </div>
                  
                  <div className="bg-slate-800/20 rounded-lg p-6 border border-slate-700/30 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-purple-600"></div>
                    <h6 className="text-lg font-semibold text-white mb-3 pl-4">
                      CUSTOMIZED SOLUTION
                    </h6>
                    <p className="text-gray-300 text-sm leading-relaxed pl-4">
                      모든 제품은 고객의 요구사항에 맞춰 설계 및 제작되며, 최고 품질의 부품만을 사용합니다.
                    </p>
                  </div>

                  <div className="bg-slate-800/20 rounded-lg p-6 border border-slate-700/30 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-cyan-600"></div>
                    <h6 className="text-lg font-semibold text-white mb-3 pl-4">
                      MADE IN KOREA
                    </h6>
                    <p className="text-gray-300 text-sm leading-relaxed pl-4">
                      국내 직접 생산을 통한 엄격한 품질 관리로 최상의 성능과 신뢰성을 보장합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Values */}
            <div className="px-8 pb-8">
              <div className="bg-gradient-to-br from-slate-800/30 via-slate-800/20 to-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-700/40 overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 px-6 py-4 border-b border-slate-700/30">
                  <h5 className="text-xl font-bold text-white flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    COMPANY COMMITMENT
                  </h5>
                </div>
                <div className="p-6">
                  <p className="text-gray-300 leading-7 text-base text-left">
                    The Sound는 음향, 영상, 조명, LED 분야의 전문 시공 업체로서 고객의 꿈과 비전을 현실로 만들어 드립니다. 
                    최첨단 기술과 풍부한 경험을 바탕으로 한 맞춤형 솔루션 제공을 통해 고객 만족을 최우선으로 하며, 
                    지속적인 연구개발과 품질 향상을 통해 업계 최고 수준의 서비스를 제공하겠습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Spec Modal - All Screen Sizes */}
      {isSpecModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeSpecModal}
          ></div>
          
          {/* Modal Content */}
          <div className="absolute inset-0 flex flex-col lg:items-center lg:justify-center p-0 lg:p-4 bg-slate-900">
            <div className="bg-slate-900 w-full h-full lg:rounded-lg lg:max-w-6xl lg:w-full lg:max-h-[90vh] lg:overflow-y-auto lg:my-8 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 lg:p-8 border-b border-slate-700/50 bg-slate-800/50 lg:bg-transparent sticky top-0 z-10 lg:relative">
                <div>
                  <h3 className="text-xl lg:text-4xl font-bold text-white">
                    {selectedItem.model}
                  </h3>
                  <p className="text-sm lg:text-lg text-blue-300">
                    {selectedItem.kind}
                  </p>
                </div>
                <button
                  onClick={closeSpecModal}
                  className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Product Image */}
                  <div className="order-1 lg:order-1">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 lg:p-8 shadow-lg">
                      <img 
                        src={selectedItem.url} 
                        alt={selectedItem.alt || selectedItem.model}
                        className="w-full h-48 lg:h-80 object-contain"
                      />
                    </div>
                  </div>
                  
                  {/* Product Specs */}
                  <div className="order-2 lg:order-2">
                    <h4 className="text-lg lg:text-2xl font-bold text-white mb-4 lg:mb-6">
                      제품 사양
                    </h4>
                    
                    {selectedItem.spec ? (
                      <div className="bg-slate-800/20 rounded-lg border border-slate-700/30 overflow-hidden">
                        <div className="divide-y divide-slate-700/30">
                          {Object.entries(selectedItem.spec).map(([key, value]) => (
                            <div key={key} className="p-3 lg:p-4 hover:bg-slate-800/20 transition-colors duration-200">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                                <div className="text-blue-300 font-semibold text-xs lg:text-sm uppercase tracking-wide lg:col-span-1">
                                  {key}
                                </div>
                                <div className="text-gray-300 text-sm lg:text-base leading-relaxed whitespace-pre-line lg:col-span-2">
                                  {value}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center py-8">
                        제품 사양 정보가 준비 중입니다.
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Product Description */}
                {selectedItem.desc && (
                  <div className="mt-8 lg:mt-12">
                    <div className="bg-gradient-to-br from-slate-800/30 via-slate-800/20 to-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-700/40 overflow-hidden shadow-lg">
                      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-700/30">
                        <h5 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
                          <div className="w-1 h-4 lg:h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                          제품 설명
                        </h5>
                      </div>
                      <div className="p-4 lg:p-6">
                        <p className="text-gray-300 leading-6 lg:leading-7 text-sm lg:text-base text-left whitespace-pre-line">
                          {selectedItem.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
