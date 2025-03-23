import React from "react";
import micDoubleImage from "../assets/images/mic-double.jpg";

export default function Greetings() {
  return (
    <section className="flex py-8 items-center h-[70vh]">
      <div className="w-[50%]">
        <img
          src={micDoubleImage}
          width={800}
          height={700}
          style={{ objectFit: "contain", width: '800px', height: '700px' }}
          alt="마이크 이미지"
        />
      </div>
      <div className="p-24 text-left">
        <p className="text-xl">음향 영상 조명 LED 올인원 전문 시공 업체</p>
        <p className="text-4xl">The Sound</p>
        <div className="mt-8">
          <div className="text-xl flex flex-col gap-6 leading-[2]">
            <p>
              저희 THE SOUND를 찾아 주셔서 감사합니다.
            </p>
            <p>
              더사운드는 음향 영상 조명
              LED등 필요한 모든 방송장비를 프로 엔지니어가 컨설팅 및 설치 튜닝하는
              전문 업체 입니다.
            </p>
            <p>
              항상 여러분이 만족하는 스타일로 서비스를
              제공하려고 항상 노력하고 있습니다.
            </p>
            <p>
              더욱더 좋은 서비스로 보답할수
              있는 더사운드가 되도록 노력 하겠습니다.
            </p>
            <p>
              감사합니다.
            </p>
          </div>
          <div className="flex gap-3 justify-end mt-6 text-2xl">
            <span>CEO</span>
            <span>심 석 주</span>
          </div>
        </div>
      </div>
    </section>
  );
}
