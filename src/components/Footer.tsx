import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6">The Sound</h3>
            <p className="text-gray-400 leading-relaxed">
              음향 영상 조명 LED 올인원 전문 시공 업체
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-6">연락처</h4>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-start space-x-2">
                <span className="text-gray-500 font-medium min-w-[60px]">TEL:</span>
                <span className="text-sm leading-relaxed">032)502-1002</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-gray-500 font-medium min-w-[60px]">FAX:</span>
                <span className="text-sm leading-relaxed">032)502-1003</span>
              </div>
            </div>
          </div>

          {/* Location Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-6">위치</h4>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-start space-x-2">
                <span className="text-gray-500 font-medium min-w-[60px]">사무실:</span>
                <span className="text-sm leading-relaxed">인천시 연수구 선학로90, 212호</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-gray-500 font-medium min-w-[60px]">공장:</span>
                <span className="text-sm leading-relaxed">경기도 남양주시 강변북로651번길 22-26, 102호</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-500 text-sm">
              © 2024 The Sound. All rights reserved.
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
