"use client";

import { useState, useEffect } from "react";

// 테이블 데이터 타입 정의
type TableRecord = {
  id: number;
  title: string;
  desc: string;
  createdAt: string;
  fileUrl: string;
  category: string;
};

// 토스트 알림 타입
type Toast = {
  message: string;
  type: 'error' | 'success' | 'info';
  id: number;
};

export default function Support() {
  // 검색어와 카테고리 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCategory, setCurrentCategory] = useState("전체");
  
  // 테이블 데이터 상태
  const [tableData, setTableData] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 페이지당 표시할 항목 수
  
  // 토스트 알림 상태
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Google Sheets ID
  const SHEET_ID = "1TnHBUzm-Pefue-B-WOS363wcblYZJY3WLnRY5DG4PIc";
  
  // 토스트 알림 추가 함수
  const addToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { message, type, id }]);
    
    // 3초 후 자동으로 토스트 제거
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };
  
  // Google Sheets 데이터 가져오기
  useEffect(() => {
    const fetchGoogleSheetsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Google Sheets API URL (공개 문서용)
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('데이터를 가져오는데 실패했습니다.');
        }
        
        // Google Sheets API는 JSON이 아닌 특수한 형식으로 응답을 반환합니다.
        // 응답 텍스트를 가져와 파싱해야 합니다.
        const text = await response.text();
        
        // 응답은 "/*O_o*/\ngoogle.visualization.Query.setResponse({...});" 형식입니다.
        // JSON 부분만 추출합니다.
        const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonText);
        
        // 데이터 파싱 (table.rows와 table.cols를 사용하여 데이터 구조화)
        if (data.table && data.table.rows && data.table.cols) {
          const parsedRecords: TableRecord[] = data.table.rows.map((row: any, index: number) => {
            const values = row.c;
            
            // 안전한 값 추출 (null 체크)
            const getValue = (idx: number) => {
              return values[idx] && values[idx].v ? values[idx].v : '';
            };
            
            // Google Drive 파일 URL에서 ID 추출하여 다운로드 URL로 변환
            const fileUrl = getValue(4);
            let downloadUrl = '';
            
            if (fileUrl) {
              // 다양한 형태의 Google Drive URL에서 ID 추출
              let fileId = '';
              
              // 패턴 1: https://drive.google.com/file/d/FILE_ID/view
              if (fileUrl.includes('/file/d/')) {
                const match = fileUrl.match(/\/file\/d\/([^\/]+)/);
                if (match && match[1]) fileId = match[1];
              } 
              // 패턴 2: https://drive.google.com/open?id=FILE_ID
              else if (fileUrl.includes('?id=')) {
                const match = fileUrl.match(/[?&]id=([^&]+)/);
                if (match && match[1]) fileId = match[1];
              }
              // 패턴 3: 직접 파일 ID만 입력한 경우
              else if (!fileUrl.includes('http')) {
                fileId = fileUrl.trim();
              }
              // 그 외의 경우, 원본 URL 사용
              else {
                downloadUrl = fileUrl;
              }
              
              // 파일 ID가 있으면 다운로드 URL 생성
              if (fileId) {
                downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
              }
            }
            
            // 날짜 포맷팅 함수
            const formatDate = (dateString: string): string => {
              if (!dateString) return '';
              
              // "Date(YYYY,MM,DD)" 형식 처리
              const datePattern = /Date\((\d+),\s*(\d+),\s*(\d+)\)/;
              const dateMatch = String(dateString).match(datePattern);
              
              if (dateMatch) {
                // Date(YYYY,MM,DD) 형식에서 추출
                const year = parseInt(dateMatch[1]);
                const month = parseInt(dateMatch[2]) + 1; // JavaScript Date는 월이 0부터 시작하므로 +1
                const day = parseInt(dateMatch[3]);
                
                // YYYY-MM-DD 형식으로 반환
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              }
              
              // 다양한 날짜 형식 처리
              try {
                // ISO 형식(예: 2023-01-01T00:00:00Z) 또는 다른 형식으로 파싱 시도
                const date = new Date(dateString);
                
                // 유효한 날짜인지 확인
                if (isNaN(date.getTime())) {
                  return dateString; // 변환에 실패한 경우 원본 문자열 반환
                }
                
                // YYYY-MM-DD 형식으로 변환
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                
                return `${year}-${month}-${day}`;
              } catch (e) {
                console.error('날짜 변환 실패:', dateString);
                return dateString; // 에러 발생 시 원본 문자열 반환
              }
            };
            
            return {
              id: getValue(0) || index + 1,
              title: getValue(1) || '',
              desc: getValue(2) || '',
              createdAt: formatDate(getValue(3)), // 날짜 포맷팅 적용
              fileUrl: downloadUrl, // 변환된 다운로드 URL 사용
              category: getValue(5) || '기타'
            };
          }).filter((record: TableRecord) => record.title); // 빈 행 필터링
          
          setTableData(parsedRecords);
          
          if (parsedRecords.length === 0) {
            addToast('데이터가 비어있습니다.', 'info');
          }
        } else {
          // 스프레드시트가 예상 형식이 아닌 경우
          throw new Error('스프레드시트 형식이 올바르지 않습니다.');
        }
      } catch (err) {
        console.error('데이터 가져오기 오류:', err);
        setError('데이터를 가져오는 중 오류가 발생했습니다.');
        setTableData([]); // 에러 발생 시 빈 배열 설정
        
        // 토스트 알림 추가
        const errorMessage = err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.';
        addToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGoogleSheetsData();
  }, []);
  
  // 사용 가능한 카테고리 추출 및 중복 제거
  const availableCategories = ["전체", ...Array.from(new Set(tableData.map(item => item.category)))];
  
  // 선택된 카테고리와 검색어에 맞는 데이터 필터링
  const filteredData = tableData.filter(item => 
    (currentCategory === "전체" || item.category === currentCategory) &&
    (item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.desc.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // 페이지네이션을 위한 데이터 계산
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  
  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };
  
  // 카테고리 변경 핸들러
  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category);
    setCurrentPage(1); // 카테고리 변경 시 첫 페이지로 이동
  };

  // 카테고리별 색상 매핑
  const getCategoryColor = (category: string) => {
    switch(category) {
      case "학습자료":
        return "bg-indigo-900 text-indigo-200";
      case "기술문서":
        return "bg-emerald-900 text-emerald-200";
      case "튜토리얼":
        return "bg-amber-900 text-amber-200";
      case "체크리스트":
        return "bg-purple-900 text-purple-200";
      case "기타":
        return "bg-slate-800 text-slate-200";
      default:
        return "bg-blue-900 text-blue-200";
    }
  };

  return (
    <div className="bg-gray-900 max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8 relative">
      <h1 className="text-4xl font-bold text-center mb-8 text-white">자료실</h1>
      <p className="text-center text-lg text-gray-400 mb-12">
        더사운드의 공식 자료와 문서를 확인하실 수 있습니다.
      </p>
      
      {/* 토스트 알림 표시 */}
      <div className="fixed top-8 right-8 z-50 space-y-2">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white flex items-center space-x-2 transition-all duration-300 ${
              toast.type === 'error' ? 'bg-red-600' : 
              toast.type === 'success' ? 'bg-green-600' : 
              'bg-blue-600'
            }`}
          >
            <div>
              {toast.type === 'error' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {toast.type === 'success' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {toast.type === 'info' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p>{toast.message}</p>
          </div>
        ))}
      </div>
      
      {/* 검색 및 필터링 UI */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {availableCategories.map(category => (
            <button 
              key={category}
              onClick={() => handleCategoryChange(category)} 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                currentCategory === category 
                ? "bg-gray-100 text-gray-900 shadow-md" 
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="검색..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 pl-10 border border-gray-700 bg-gray-800 rounded-full text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {/* 자료실 테이블 */}
      <div className="bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-700">
        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-lg font-medium mb-1 text-gray-300">데이터를 가져오는 중...</h3>
            <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
          </div>
        ) : tableData.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium mb-1 text-gray-300">등록된 데이터가 없습니다</h3>
            <p className="text-sm text-gray-500">나중에 다시 확인해주세요</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2a10 10 0 110 20 10 10 0 010-20z" />
            </svg>
            <h3 className="text-lg font-medium mb-1 text-gray-300">검색 결과가 없습니다</h3>
            <p className="text-sm text-gray-500">다른 검색어나 카테고리를 선택해보세요</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr className="bg-gray-900">
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">번호</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">제목</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">설명</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">카테고리</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">등록일</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">문서</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {currentItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-300">{item.id}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-200">{item.title}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-400 max-w-xs truncate">{item.desc}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-400">{item.createdAt}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.fileUrl ? (
                          <a
                            href={item.fileUrl}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-600 rounded-full text-xs font-medium bg-gray-700 text-blue-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors duration-200"
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            다운로드
                          </a>
                        ) : (
                          <span className="text-sm text-gray-500">문서 없음</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* 페이지네이션 UI */}
      {totalPages > 0 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center space-x-1">
            <button 
              className={`p-2 rounded-md bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* 페이지 번호 버튼 동적 생성 */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-md ${
                  currentPage === page 
                  ? "bg-gray-100 text-gray-900 font-medium" 
                  : "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {page}
              </button>
            ))}
            
            <button 
              className={`p-2 rounded-md bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
