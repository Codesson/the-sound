import React, { useEffect, useRef } from "react";

export default function Organization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정
    canvas.width = 1200;
    canvas.height = 800;

    // 그라데이션 배경
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(0.5, '#1e293b');
    bgGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 현대적인 박스 그리기 함수
    const drawModernBox = (x: number, y: number, width: number, height: number, text: string, level: number = 0) => {
      const cornerRadius = 16;
      
      // 멀티 레이어 그림자 효과
      ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;

      // 레벨별 현대적 색상 정의
      let gradient;
      let borderGradient;
      let textColor = '#ffffff';
      
      if (level === 0) { // CEO - 블루 그라데이션
        gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(0.5, '#2563eb');
        gradient.addColorStop(1, '#1d4ed8');
        
        borderGradient = ctx.createLinearGradient(x, y, x, y + height);
        borderGradient.addColorStop(0, '#60a5fa');
        borderGradient.addColorStop(1, '#3b82f6');
      } else if (level === 1) { // 팀장급 - 퍼플 그라데이션
        gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(0.5, '#7c3aed');
        gradient.addColorStop(1, '#6d28d9');
        
        borderGradient = ctx.createLinearGradient(x, y, x, y + height);
        borderGradient.addColorStop(0, '#a78bfa');
        borderGradient.addColorStop(1, '#8b5cf6');
      } else { // 일반팀 - 시안 그라데이션
        gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#0891b2');
        gradient.addColorStop(1, '#0e7490');
        
        borderGradient = ctx.createLinearGradient(x, y, x, y + height);
        borderGradient.addColorStop(0, '#67e8f9');
        borderGradient.addColorStop(1, '#06b6d4');
      }

      // 둥근 모서리 박스 그리기
      ctx.beginPath();
      ctx.moveTo(x + cornerRadius, y);
      ctx.lineTo(x + width - cornerRadius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
      ctx.lineTo(x + width, y + height - cornerRadius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
      ctx.lineTo(x + cornerRadius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
      ctx.lineTo(x, y + cornerRadius);
      ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
      ctx.closePath();

      ctx.fillStyle = gradient;
      ctx.fill();

      // 글로우 테두리
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 3;
      ctx.stroke();

      // 내부 하이라이트
      ctx.beginPath();
      ctx.moveTo(x + cornerRadius, y + 2);
      ctx.lineTo(x + width - cornerRadius, y + 2);
      ctx.quadraticCurveTo(x + width - 2, y + 2, x + width - 2, y + cornerRadius);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 텍스트 그림자
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // 텍스트
      ctx.fillStyle = textColor;
      ctx.font = `bold ${level === 0 ? 28 : level === 1 ? 22 : 18}px 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + width/2, y + height/2);

      // 그림자 리셋
      ctx.shadowColor = 'transparent';
    };

    // 연결선 그리기 함수 (현대적 네온 스타일)
    const drawModernLine = (x1: number, y1: number, x2: number, y2: number) => {
      // 글로우 효과를 위한 다중 선
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    // 전체 조직도 높이 계산 및 중앙 정렬을 위한 오프셋
    const orgChartHeight = 100 + 160 + 90 + 130 + 80; // CEO높이 + 간격 + 팀장높이 + 간격 + 팀원높이
    const verticalOffset = (canvas.height - orgChartHeight) / 2;
    
    // 노드 위치 계산 - 중앙 정렬 적용
    const margin = 60;
    const centerX = canvas.width / 2;
    
    // CEO (최상위) - 가운데 배치
    const ceoWidth = 300;
    const ceoHeight = 100;
    const ceoX = centerX - ceoWidth/2;
    const ceoY = verticalOffset;
    drawModernBox(ceoX, ceoY, ceoWidth, ceoHeight, 'CEO', 0);

    // 3단계 하위 팀들 - 마지막 줄 5개 요소를 동일한 간격으로 전체 가운데 배치
    const subTeamWidth = 200;
    const subTeamHeight = 80;

    // 5개 팀을 전체 폭에 걸쳐 균등하게 배치
    const totalWidth = canvas.width - 2 * margin;
    const spacing = (totalWidth - 5 * subTeamWidth) / 4;
    
    const team1X = margin;
    const team2X = team1X + subTeamWidth + spacing;
    const team3X = team2X + subTeamWidth + spacing;
    const team4X = team3X + subTeamWidth + spacing;
    const team5X = team4X + subTeamWidth + spacing;

    // 2단계 팀들 - 영업팀을 유통관리와 시공관리 사이에 배치
    const teamWidth = 240;
    const teamHeight = 90;
    const teamY = ceoY + ceoHeight + 160;
    const subTeamY = teamY + teamHeight + 130;
    
    // 영업팀을 유통관리와 시공관리 중간에 배치
    const salesX = (team1X + team2X + subTeamWidth) / 2 - teamWidth / 2;
    // 지원팀을 기술팀 바로 위에 배치
    const supportX = team4X + subTeamWidth/2 - teamWidth/2;
    
    drawModernBox(salesX, teamY, teamWidth, teamHeight, '영업팀', 1);
    drawModernBox(supportX, teamY, teamWidth, teamHeight, '지원팀', 1);

    drawModernBox(team1X, subTeamY, subTeamWidth, subTeamHeight, '유통관리', 2);
    drawModernBox(team2X, subTeamY, subTeamWidth, subTeamHeight, '시공관리', 2);
    drawModernBox(team3X, subTeamY, subTeamWidth, subTeamHeight, '설계팀', 2);
    drawModernBox(team4X, subTeamY, subTeamWidth, subTeamHeight, '기술팀', 2);
    drawModernBox(team5X, subTeamY, subTeamWidth, subTeamHeight, '시공팀', 2);

    // CEO에서 중간 허브까지 연결
    const hubY = ceoY + ceoHeight + 80;
    drawModernLine(centerX, ceoY + ceoHeight, centerX, hubY);
    
    // 중간 허브에서 각 팀으로 연결
    drawModernLine(centerX, hubY, salesX + teamWidth/2, hubY);
    drawModernLine(centerX, hubY, supportX + teamWidth/2, hubY);
    drawModernLine(salesX + teamWidth/2, hubY, salesX + teamWidth/2, teamY);
    drawModernLine(supportX + teamWidth/2, hubY, supportX + teamWidth/2, teamY);

    // 연결선 - 영업팀에서 첫 2개 팀으로
    const salesCenterX = salesX + teamWidth/2;
    const salesHubY = teamY + teamHeight + 65;
    drawModernLine(salesCenterX, teamY + teamHeight, salesCenterX, salesHubY);
    drawModernLine(team1X + subTeamWidth/2, salesHubY, team2X + subTeamWidth/2, salesHubY);
    drawModernLine(team1X + subTeamWidth/2, salesHubY, team1X + subTeamWidth/2, subTeamY);
    drawModernLine(team2X + subTeamWidth/2, salesHubY, team2X + subTeamWidth/2, subTeamY);

    // 연결선 - 지원팀에서 나머지 3개 팀으로
    const supportCenterX = supportX + teamWidth/2;
    const supportHubY = teamY + teamHeight + 65;
    drawModernLine(supportCenterX, teamY + teamHeight, supportCenterX, supportHubY);
    drawModernLine(team3X + subTeamWidth/2, supportHubY, team5X + subTeamWidth/2, supportHubY);
    drawModernLine(team3X + subTeamWidth/2, supportHubY, team3X + subTeamWidth/2, subTeamY);
    drawModernLine(team4X + subTeamWidth/2, supportHubY, team4X + subTeamWidth/2, subTeamY);
    drawModernLine(team5X + subTeamWidth/2, supportHubY, team5X + subTeamWidth/2, subTeamY);

  }, []);

  return (
    <section className="flex flex-col justify-center items-center py-24 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-white mb-4 tracking-wide">
            조직 구성도
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="canvas-container w-full max-w-7xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 rounded-3xl blur-2xl"></div>
            <canvas 
              ref={canvasRef}
              className="relative rounded-3xl shadow-2xl border border-white/10 backdrop-blur-sm"
              style={{ 
                width: '100%', 
                height: 'auto',
                maxHeight: '80vh'
              }}
            />
          </div>
        </div>
      </div>
      
      <style>{`
        .canvas-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0 20px;
        }
        
        @media (max-width: 1024px) {
          canvas {
            max-height: 70vh !important;
          }
        }
        
        @media (max-width: 768px) {
          canvas {
            max-height: 60vh !important;
          }
        }
      `}</style>
    </section>
  );
}
