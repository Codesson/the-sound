"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";

export default function Questions() {
  // Discord 웹훅 URL - 실제 웹훅 URL로 변경해야 합니다
  const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN";
  
  // 폼 상태 관리
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  
  // 이미지 파일 상태 관리
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // 폼 제출 상태 관리
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 입력 핸들러
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 이미지 변경 핸들러
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setImagePreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 파일을 Base64 문자열로 변환하는 함수
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to Base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // 현재 날짜와 시간
      const now = new Date();
      const dateTimeString = now.toLocaleString('ko-KR');
      
      // Discord에 보낼 메시지 생성
      let messageContent = `**📬 새로운 문의가 접수되었습니다**\n\n`;
      messageContent += `**접수시간**: ${dateTimeString}\n`;
      messageContent += `**이름**: ${formData.name}\n`;
      messageContent += `**이메일**: ${formData.email}\n`;
      messageContent += `**연락처**: ${formData.phone}\n`;
      messageContent += `**문의내용**:\n\`\`\`${formData.message}\`\`\`\n`;
      
      // Discord 웹훅으로 전송할 데이터
      const webhookData: any = {
        content: messageContent,
        username: "문의 알림 봇",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/1370/1370907.png" // 봇 아이콘 URL
      };
      
      // 이미지가 있는 경우 첨부 파일로 추가
      if (imageFile) {
        // 이미지 미리보기 URL을 사용하여 Discord에 알려줌
        webhookData.content += `\n**첨부 이미지**: 이미지가 첨부되었습니다. 크기 제한으로 표시되지 않을 수 있습니다.`;
      }
      
      // Discord 웹훅으로 데이터 전송
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(webhookData)
      });
      
      if (response.ok) {
        // 이미지가 있는 경우 추가 요청 보내기 (Discord는 첨부 파일을 위한 별도 API 필요)
        if (imageFile && imageFile.size <= 8 * 1024 * 1024) { // 8MB 이하만 지원
          const fileFormData = new FormData();
          fileFormData.append('file', imageFile);
          fileFormData.append('content', `${formData.name}님의 첨부 이미지`);
          
          await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            body: fileFormData
          });
        }
        
        // 폼 초기화
        setFormData({ name: "", email: "", phone: "", message: "" });
        handleRemoveImage();
        
        // 사용자에게 성공 메시지 표시
        setSubmitResult({
          success: true,
          message: "문의가 성공적으로 전송되었습니다. 빠른 시일 내에 답변 드리겠습니다.",
        });
      } else {
        throw new Error("Discord 웹훅 전송 오류");
      }
    } catch (error) {
      console.error("폼 제출 오류:", error);
      setSubmitResult({
        success: false,
        message: "문의 전송 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-20 px-4">
      <h1 className="text-center text-4xl mb-2">문의하기</h1>
      <div className="sub-title mb-12 text-xl text-center">
        궁금한 점이나 상담이 필요하시면 언제든지 문의해주세요
      </div>

      <div className="w-full max-w-3xl">
        {submitResult && (
          <div 
            className={`mb-8 p-4 rounded-md ${
              submitResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {submitResult.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이름 입력 */}
          <div>
            <label htmlFor="name" className="block mb-2 font-medium text-gray-800">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-600 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              placeholder="홍길동"
            />
          </div>

          {/* 이메일 입력 */}
          <div>
            <label htmlFor="email" className="block mb-2 font-medium text-gray-800">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-600 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              placeholder="example@email.com"
            />
          </div>

          {/* 연락처 입력 */}
          <div>
            <label htmlFor="phone" className="block mb-2 font-medium text-gray-800">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-600 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              placeholder="010-1234-5678"
            />
          </div>

          {/* 문의 내용 */}
          <div>
            <label htmlFor="message" className="block mb-2 font-medium text-gray-800">
              문의 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full p-3 border border-gray-600 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              placeholder="문의하실 내용을 상세히 적어주세요"
            />
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label htmlFor="image" className="block mb-2 font-medium text-gray-800">
              이미지 첨부 (선택사항)
            </label>
            <div className="flex flex-col space-y-4">
              <input
                type="file"
                id="image"
                name="image"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 border border-gray-600 bg-gray-800 rounded-md text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                이미지 선택하기
              </button>

              {imagePreview && (
                <div className="relative mt-4">
                  <div className="w-full h-64 relative overflow-hidden rounded-md">
                    <img
                      src={imagePreview}
                      alt="첨부 이미지 미리보기"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 focus:outline-none"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              최대 8MB, JPG, PNG, GIF 형식만 가능합니다.
            </p>
          </div>

          {/* 개인정보 수집 동의 */}
          <div className="mt-8">
            <div className="flex items-start">
              <input
                id="privacy"
                name="privacy"
                type="checkbox"
                required
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-800 rounded mt-1"
              />
              <label htmlFor="privacy" className="ml-3 text-sm text-gray-800">
                <span>
                  개인정보 수집 및 이용에 동의합니다. 수집된 정보는 문의 답변 목적으로만 사용됩니다.{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 bg-blue-600 text-white rounded-md font-bold text-lg transition ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "전송 중..." : "문의하기"}
            </button>
          </div>
        </form>

        {/* 추가 연락처 정보 */}
        <div className="mt-16 border-t pt-12">
          <h2 className="text-2xl font-bold mb-6">다른 방법으로 문의하기</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                fill="currentColor"
                className="mb-4 text-blue-600"
                viewBox="0 0 16 16"
              >
                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.708 2.825L15 11.105V5.383zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741zM1 11.105l4.708-2.897L1 5.383v5.722z" />
              </svg>
              <h3 className="text-lg font-medium mb-2">이메일</h3>
              <p className="text-gray-800 text-center">lundella@naver.com</p>
            </div>

            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                fill="currentColor"
                className="mb-4 text-blue-600"
                viewBox="0 0 16 16"
              >
                <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
              </svg>
              <h3 className="text-lg font-medium mb-2">전화</h3>
              <p className="text-gray-800 text-center">02-123-4567</p>
            </div>

            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                fill="currentColor"
                className="mb-4 text-blue-600"
                viewBox="0 0 16 16"
              >
                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
              </svg>
              <h3 className="text-lg font-medium mb-2">주소</h3>
              <p className="text-gray-800 text-center">
                서울특별시 강남구 테헤란로 123<br />
                더사운드 빌딩 5층
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
