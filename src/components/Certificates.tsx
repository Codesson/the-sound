import React from "react";
import insuranceImage from "../assets/images/insurance.png";

export default function Certificates() {
  const certificatesInfo = [
    {
      label: "사업자등록증",
      src: insuranceImage,
      alt: "사업자등록증",
    },
    {
      label: "정보통신공사업등록증",
      src: insuranceImage,
      alt: "정보통신공사업등록증",
    },
    {
      label: "소프트웨어사업자",
      src: insuranceImage,
      alt: "소프트웨어사업자",
    },
    {
      label: "중소기업확인서",
      src: insuranceImage,
      alt: "중소기업확인서",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 min-h-[90vh] flex flex-col justify-center">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4 tracking-wide">
            인증현황
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {certificatesInfo.map((info, index) => (
            <div key={index} className="group">
              <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-700 group-hover:scale-105 group-hover:border-blue-500/50">
                {/* Certificate image container */}
                <div className="relative overflow-hidden rounded-xl mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img 
                    width={200} 
                    height={280} 
                    alt={info.alt} 
                    src={info.src} 
                    className="w-full h-auto object-cover rounded-xl shadow-md"
                    style={{ width: '200px', height: '280px' }} 
                  />
                </div>
                
                {/* Certificate title */}
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {info.label}
                  </h3>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
                </div>
                
                {/* Decorative corner accent */}
                <div className="absolute top-2 right-2 w-4 h-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom decorative element */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-blue-600 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse delay-500"></div>
            <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-purple-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
