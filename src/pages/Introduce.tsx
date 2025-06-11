import Spec from "../components/Spec";
import Organization from "../components/Organization";
import Greetings from "../components/Greetings";
import Certificates from "../components/Certificates";
import audienceImage from "../assets/images/audience.jpg";

export default function Introduce() {
  return (
    <div className="w-full">
      <section className="relative w-full overflow-hidden">
        <div className="w-full h-screen relative">
          {/* Background with enhanced overlay */}
          <img
            className="absolute inset-0 w-full h-full object-cover"
            src={audienceImage}
            alt="관중 이미지"
          />
          
          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-black/50"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
          
          {/* Hero content - moved to left top with right offset */}
          <div className="relative h-full flex items-start justify-start px-8 pt-32">
            <div className="max-w-4xl ml-80">
              <div className="bg-gradient-to-br from-black/80 via-black/70 to-black/85 rounded-3xl p-10 md:p-12 lg:p-16 border border-white/20 shadow-2xl">
                <div className="space-y-6">
                  <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white leading-none tracking-tight">
                    <span className="block bg-gradient-to-r from-white via-blue-100 to-gray-100 bg-clip-text text-transparent filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                      음향 영상 조명 LED
                    </span>
                  </h1>
                  
                  <h2 className="text-xl md:text-2xl lg:text-4xl font-light text-white/95 leading-relaxed tracking-wide">
                    <span className="bg-gradient-to-r from-gray-100 to-white bg-clip-text text-transparent">
                      맞춤형 설계 및 시공과 튜닝
                    </span>
                  </h2>
                  
                  <p className="text-lg md:text-xl lg:text-2xl font-extralight text-white/85 tracking-widest leading-relaxed">
                    <span className="inline-block border-l-2 border-white/30 pl-4">
                      전문 업체
                    </span>
                  </p>
                </div>
                
                {/* Enhanced decorative elements */}
                <div className="mt-10 flex justify-start items-center space-x-4">
                  <div className="w-16 h-0.5 bg-gradient-to-r from-blue-300/80 via-white/60 to-transparent rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-300/60 to-white/40 rounded-full animate-pulse shadow-lg"></div>
                  <div className="w-10 h-0.5 bg-gradient-to-r from-white/50 to-transparent rounded-full"></div>
                  <div className="w-1 h-1 bg-white/30 rounded-full animate-pulse delay-700"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating elements for visual interest */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse"></div>
            <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-white/15 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 left-2/3 w-0.5 h-0.5 bg-white/25 rounded-full animate-pulse delay-500"></div>
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
