import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import waveSound from "../assets/images/wave-sound.png";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

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

  return (
    <div className={`fixed w-full flex flex-row justify-between p-4 z-10 bg-black ${
        isScrolled ? "border-b-neutral-600 shadow-md" : ""
      }`}>
      <div className="flex flex-row items-center gap-4">
        <img src={waveSound} alt="로고" width={36} height={36} />
        <span className="text-2xl font-bold">The Sound</span>
      </div>
      <ul className="flex flex-row gap-6 text-base mr-8">
        <li>
          <Link to="/introduce">회사소개</Link>
        </li>
        <li>
          <Link to="/products">제품소개</Link>
        </li>
        <li>
          <Link to="/portfolio">시공사례</Link>
        </li>
        <li>
          <Link to="/questions">문의사항</Link>
        </li>
        <li>
          <Link to="/support">고객지원</Link>
        </li>
        {/* <li>
          <Link to="/store">Store</Link>
        </li> */}
      </ul>
    </div>
  );
}
