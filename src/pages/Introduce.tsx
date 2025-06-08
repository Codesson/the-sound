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
            <div className="max-w-lg ml-80">
              <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 md:p-8 border border-white/10 shadow-lg">
                <div className="space-y-3">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight">
                    <span className="block bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent drop-shadow-sm">
                      음향 영상 조명 LED
                    </span>
                  </h1>
                  
                  <h2 className="text-base md:text-lg lg:text-xl font-medium text-white/90 leading-relaxed">
                    맞춤형 설계 및 시공과 튜닝
                  </h2>
                  
                  <p className="text-sm md:text-base lg:text-lg font-normal text-white/80">
                    전문 업체
                  </p>
                </div>
                
                {/* Decorative line elements */}
                <div className="mt-6 flex justify-start items-center space-x-2">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-white/60 to-transparent rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse"></div>
                  <div className="w-6 h-0.5 bg-gradient-to-r from-white/40 to-transparent rounded-full"></div>
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
