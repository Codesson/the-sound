import React from 'react';

export default function Footer() {
  return (
    <div className="p-4 py-20">
      <p className="text-2xl">The Sound</p>
      <div className="mt-8 pl-4 text-md flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="font-bold w-16">사무실</div>
          <div>인천시 연수구 선학로90, 212호</div>
        </div>
        <div className="flex gap-4">
          <div className="font-bold w-16">공장</div>
          <div>경기도 남양주시 강변북로651번길 22-26, 102호</div>
        </div>

        <div className="flex gap-4">
          <div className="font-bold w-16">TEL</div>
          <div>032)502-1002</div>
        </div>
        <div className="flex gap-4">
          <div className="font-bold w-16">FAX</div>
          <div>032)502-1003</div>
        </div>
      </div>
    </div>
  );
}
