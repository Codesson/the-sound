import React from "react";
import micDoubleImage from "../assets/images/mic-double.jpg";

export default function Greetings() {
  return (
    <section className="flex py-16 items-center min-h-[80vh] bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="container mx-auto px-8 flex items-center gap-16">
        {/* Image section */}
        <div className="w-1/2 flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
            <img
              src={micDoubleImage}
              width={700}
              height={600}
              className="relative rounded-2xl shadow-2xl object-cover transition-transform duration-300 group-hover:scale-105"
              style={{ objectFit: "contain", width: '700px', height: '600px' }}
              alt="마이크 이미지"
            />
          </div>
        </div>
        
        {/* Content section */}
        <div className="w-1/2 space-y-8">
          <div className="space-y-4">
            <p className="text-lg font-medium text-gray-300 tracking-wide">
              음향 영상 조명 LED 올인원 전문 시공 업체
            </p>
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              The Sound
            </h1>
          </div>
          
          <div className="space-y-6">
            <div className="prose prose-lg text-gray-200 leading-relaxed space-y-6">
              <p className="text-lg font-medium text-white">
                저희 THE SOUND를 찾아 주셔서 감사합니다.
              </p>
              <p className="text-lg text-gray-300">
                더사운드는 음향 영상 조명
                LED등 필요한 모든 방송장비를 프로 엔지니어가 컨설팅 및 설치 튜닝하는
                전문 업체 입니다.
              </p>
              <p className="text-lg text-gray-300">
                항상 여러분이 만족하는 스타일로 서비스를
                제공하려고 항상 노력하고 있습니다.
              </p>
              <p className="text-lg text-gray-300">
                더욱더 좋은 서비스로 보답할수
                있는 더사운드가 되도록 노력 하겠습니다.
              </p>
              <p className="text-lg font-medium text-white">
                감사합니다.
              </p>
            </div>
            
            {/* CEO signature */}
            <div className="mt-12 pt-8 border-t border-gray-600">
              <div className="flex items-center justify-end space-x-4">
                <div className="text-right">
                  <span className="block text-sm text-gray-400 font-medium">CEO</span>
                  <span className="block text-2xl font-bold text-white mt-1">심 석 주</span>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">CEO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
