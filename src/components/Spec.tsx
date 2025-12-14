import React, { Fragment } from "react";

export default function Spec() {
  //   const COMPABT_SPEC = {
  //     name: {
  //       label: "회사명",
  //       value: "더사운드 주식회사",
  //     },
  //     representative: {
  //       label: "대표자",
  //       value: "심 석 주",
  //     },
  //     address: {
  //       label: "소재지",
  //       value: "인천시 연수구 선학로90, 212호",
  //     },
  //     phone: {
  //       label: "연락처",
  //       value: "032-502-1002",
  //     },
  //     founded: {
  //       label: "설립일",
  //       value: "2008년 8월",
  //     },
  //     legalFounded: {
  //       label: "법인설립일",
  //       value: "2014년 5월",
  //     },
  //     licenseNo: {
  //       label: "사업자번호",
  //       value: "122-86-40010",
  //     },
  //     businessForm: {
  //       label: "업태",
  //       value: "제조/도·소매/서비스/정보통신공사",
  //     },
  //     businessType: {
  //       label: "업종",
  //       value:
  //         "음향영상, 특수조명, 네트워크장비, 전상장비, 부대장치, 공연장비대여, 소프트웨어개발업",
  //     },
  //   };

  const COMPANY_SPEC = [
    {
      label: "회사명",
      value: "더사운드 주식회사",
    },
    {
      label: "대표자",
      value: "심 석 주",
    },
    {
      label: "소재지",
      value: "인천시 연수구 선학로90, 212호",
    },
    {
      label: "연락처",
      value: "032-502-1002",
    },
    {
      label: "설립일",
      value: "2008년 8월",
    },
    {
      label: "법인설립일",
      value: "2014년 5월",
    },
    {
      label: "사업자번호",
      value: "122-86-40010",
    },
    {
      label: "업태",
      value: "제조/도·소매/서비스/정보통신공사",
    },
    {
      label: "업종",
      value:
        "음향영상, 특수조명, 네트워크장비, 전상장비, 부대장치, 공연장비대여, 소프트웨어개발업",
    },
  ];

  return (
    <section className="w-full py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 min-h-[70vh] flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-8 lg:gap-12 max-w-7xl mx-auto">
          {/* Company info section */}
          <div className="w-full lg:w-1/2 flex">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-700 w-full flex flex-col">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center border-b border-gray-600 pb-3 sm:pb-4">
                회사 정보
              </h2>
              <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col justify-center">
                {COMPANY_SPEC.map(({ label, value }, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start py-2 sm:py-3 border-b border-gray-700 last:border-b-0 gap-2 sm:gap-0">
                    <div className="w-full sm:w-28 lg:w-32 flex-shrink-0 text-left">
                      <span className="text-xs sm:text-sm font-semibold text-gray-300 bg-gray-700 px-2 sm:px-3 py-1 rounded-full inline-block">
                        {label}
                      </span>
                    </div>
                    <div className="flex-1 sm:ml-4">
                      <span className="text-sm sm:text-base text-white font-medium leading-relaxed">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Logo section */}
          <div className="w-full lg:w-1/2 flex">
            <div className="relative group w-full">
              <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl sm:rounded-3xl opacity-20 group-hover:opacity-30 transition-all duration-300 blur-lg"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-8 sm:p-10 lg:p-12 border border-white/20 w-full h-full flex items-center justify-center min-h-[400px] sm:min-h-[500px]">
                {/* Custom "더사운드" Logo */}
                <div className="text-center space-y-4 sm:space-y-6">
                  {/* Main Logo Text */}
                  <div className="relative">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-2">
                      <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                        더사운드
                      </span>
                    </h1>
                    <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 blur-xl rounded-2xl"></div>
                  </div>
                  
                  {/* English Text */}
                  <div className="relative">
                    <p className="text-lg sm:text-xl font-bold text-white/90 tracking-[0.2em] sm:tracking-[0.3em]">
                      THE SOUND
                    </p>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="flex justify-center items-center space-x-2">
                    <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full"></div>
                    <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent rounded-full"></div>
                  </div>
                  
                  {/* Tagline */}
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-white/70 font-medium">
                      Audio Visual Lighting LED
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      Professional Solutions
                    </p>
                  </div>
                  
                  {/* Sound Wave Animation */}
                  <div className="flex justify-center items-end space-x-1 mt-4 sm:mt-6">
                    <div className="w-0.5 sm:w-1 bg-gradient-to-t from-blue-400 to-purple-400 rounded-full animate-pulse" style={{height: '8px'}}></div>
                    <div className="w-0.5 sm:w-1 bg-gradient-to-t from-purple-400 to-blue-400 rounded-full animate-pulse delay-100" style={{height: '12px'}}></div>
                    <div className="w-0.5 sm:w-1 bg-gradient-to-t from-blue-400 to-purple-400 rounded-full animate-pulse delay-200" style={{height: '10px'}}></div>
                    <div className="w-0.5 sm:w-1 bg-gradient-to-t from-purple-400 to-blue-400 rounded-full animate-pulse delay-300" style={{height: '16px'}}></div>
                    <div className="w-0.5 sm:w-1 bg-gradient-to-t from-blue-400 to-purple-400 rounded-full animate-pulse delay-400" style={{height: '12px'}}></div>
                    <div className="w-0.5 sm:w-1 bg-gradient-to-t from-purple-400 to-blue-400 rounded-full animate-pulse delay-500" style={{height: '9px'}}></div>
                    <div className="w-0.5 sm:w-1 bg-gradient-to-t from-blue-400 to-purple-400 rounded-full animate-pulse delay-600" style={{height: '14px'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
