import React, { useState } from "react";
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

export default function Products() {
  const productsList: ItemModel[] = [
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
  ];

  const [selectedItem, setSelectedItem] = useState<ItemModel | null>(null);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);

  const selectItem = (index: number) => {
    setSelectedItem(productsList[index]);
    // 모바일에서는 바로 팝업 열기
    if (window.innerWidth < 1024) {
      setIsSpecModalOpen(true);
    }
  };

  const closeSpecModal = () => {
    setIsSpecModalOpen(false);
  };

  return (
    <section className="pt-[70px] min-h-[100vh] bg-slate-900">
      {/* Title Section */}
      <div className="py-8 px-8 border-b border-slate-700/50">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            제품소개
          </h2>
          <div className="text-lg text-gray-300">
        최고의 기술로 국내 직접 생산
          </div>
          <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {productsList.map((part, index) => (
          <div
            key={index}
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
      </div>

      {/* Selected Product Details or Default Content - Desktop Only */}
      {selectedItem ? (
        <div className="hidden lg:block px-8 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Product Image and Info */}
                <div className="p-12 flex flex-col justify-center items-center bg-gradient-to-br from-slate-800/20 to-slate-900/20">
                  <h4 className="text-3xl font-bold text-white mb-8 text-center">
                    {selectedItem.model}
                    <span className="block text-lg text-blue-300 mt-2">({selectedItem.kind})</span>
                  </h4>
                  <div className="relative">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-6 shadow-xl">
                      <img 
                        width={400} 
                        height={400} 
                        src={selectedItem.url} 
                        alt={selectedItem.alt}
                        className="w-full h-80 object-contain"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent rounded-xl"></div>
                  </div>
                </div>

                {/* Specifications */}
                <div className="p-8">
                  <div className="mb-6 border-b border-slate-700 pb-3">
                    <h5 className="text-2xl font-bold text-white">
                      제품 사양
                    </h5>
                  </div>
                  
                  {/* Desktop Spec Display */}
                  <div className="hidden lg:block">
                    {selectedItem.spec ? (
                      <div className="bg-slate-800/20 rounded-lg border border-slate-700/30 overflow-hidden">
                        <div className="divide-y divide-slate-700/30">
                          {Object.entries(selectedItem.spec).map(([key, value]) => (
                            <div key={key} className="px-3 py-2 hover:bg-slate-800/20 transition-colors duration-200">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                                <div className="text-blue-300 font-semibold text-xs uppercase tracking-wide lg:col-span-1">
                                  {key}
                                </div>
                                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line lg:col-span-2">
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
              </div>

              {/* Description */}
              {selectedItem.desc && (
                <div className="px-8 pb-8">
                  <div className="bg-gradient-to-br from-slate-800/30 via-slate-800/20 to-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-700/40 overflow-hidden shadow-lg">
                    <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 px-6 py-4 border-b border-slate-700/30">
                      <h5 className="text-xl font-bold text-white flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                        제품 설명
                      </h5>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-300 leading-7 text-base text-left whitespace-pre-line">
                        {selectedItem.desc}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:block px-8 py-20">
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
      )}

      {/* Mobile Spec Modal */}
      {isSpecModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeSpecModal}
          ></div>
          
          {/* Modal Content */}
          <div className="absolute inset-0 flex flex-col bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/50">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedItem.model}
                </h3>
                <p className="text-sm text-blue-300">
                  {selectedItem.kind}
                </p>
              </div>
              <button
                onClick={closeSpecModal}
                className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Product Image */}
              <div className="mb-6">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 shadow-lg">
                  <img 
                    src={selectedItem.url} 
                    alt={selectedItem.alt || selectedItem.model}
                    className="w-full h-48 object-contain"
                  />
                </div>
              </div>
              
              <h4 className="text-lg font-bold text-white mb-4">
                제품 사양
              </h4>
              
              {selectedItem.spec ? (
                <div className="bg-slate-800/20 rounded-lg border border-slate-700/30 overflow-hidden">
                  <div className="divide-y divide-slate-700/30">
                    {Object.entries(selectedItem.spec).map(([key, value]) => (
                      <div key={key} className="p-4">
                        <div className="space-y-2">
                          <div className="text-blue-300 font-semibold text-sm uppercase tracking-wide">
                            {key}
                          </div>
                          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
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
        </div>
      )}
    </section>
  );
}
