import Spec from "../components/Spec";
import Organization from "../components/Organization";
import Greetings from "../components/Greetings";
import Certificates from "../components/Certificates";
import audienceImage from "../assets/images/audience.jpg";

export default function Introduce() {
  return (
    <div className="w-full">
      <section className="relative w-full ">
        <div className="w-full h-screen">
          <img
            className="-z-0 absolute"
            src={audienceImage}
            alt="관중 이미지"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
          <div className="relative left-[10%] w-2/4 max-w-[550px] text-4xl top-32 font-bold text-center p-8 bg-neutral-600 bg-opacity-50">
            <p>음향 영상 조명 LED</p>
            <p>맞춤형 설계 및 시공과 튜닝</p>
            <p>전문 업체</p>
          </div>
        </div>
      </section>
      <Greetings />
      <Spec />
      <Organization />
      <Certificates />
    </div>
  );
}
