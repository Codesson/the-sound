import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import waveSound from "../assets/images/wave-sound.png";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`fixed w-full flex flex-row justify-between items-center p-4 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-lg shadow-slate-900/20" 
          : "bg-transparent"
      }`}>
      <Link to="/" className="flex flex-row items-center gap-4 hover:scale-105 transition-all duration-300 cursor-pointer">
        <div className="relative">
          <img 
            src={waveSound} 
            alt="로고" 
            width={40} 
            height={40}
            className="drop-shadow-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-sm"></div>
        </div>
        <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          The Sound
        </span>
      </Link>
      
      <nav className="flex flex-row gap-8 text-base mr-8">
        <Link 
          to="/introduce" 
          className={`transition-all duration-300 hover:scale-105 relative group ${
            isActive('/introduce') 
              ? 'text-white font-semibold' 
              : 'text-gray-300 hover:text-white'
          }`}
        >
          회사소개
          <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${
            isActive('/introduce') ? 'w-full' : 'w-0 group-hover:w-full'
          }`}></span>
        </Link>
        <Link 
          to="/products" 
          className={`transition-all duration-300 hover:scale-105 relative group ${
            isActive('/products') 
              ? 'text-white font-semibold' 
              : 'text-gray-300 hover:text-white'
          }`}
        >
          제품소개
          <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${
            isActive('/products') ? 'w-full' : 'w-0 group-hover:w-full'
          }`}></span>
        </Link>
        <Link 
          to="/portfolio" 
          className={`transition-all duration-300 hover:scale-105 relative group ${
            isActive('/portfolio') 
              ? 'text-white font-semibold' 
              : 'text-gray-300 hover:text-white'
          }`}
        >
          시공사례
          <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${
            isActive('/portfolio') ? 'w-full' : 'w-0 group-hover:w-full'
          }`}></span>
        </Link>
        <Link 
          to="/questions" 
          className={`transition-all duration-300 hover:scale-105 relative group ${
            isActive('/questions') 
              ? 'text-white font-semibold' 
              : 'text-gray-300 hover:text-white'
          }`}
        >
          문의사항
          <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${
            isActive('/questions') ? 'w-full' : 'w-0 group-hover:w-full'
          }`}></span>
        </Link>
        <Link 
          to="/support" 
          className={`transition-all duration-300 hover:scale-105 relative group ${
            isActive('/support') 
              ? 'text-white font-semibold' 
              : 'text-gray-300 hover:text-white'
          }`}
        >
          고객지원
          <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${
            isActive('/support') ? 'w-full' : 'w-0 group-hover:w-full'
          }`}></span>
        </Link>
      </nav>
    </div>
  );
}
