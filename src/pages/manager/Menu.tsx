import { useNavigate } from "react-router-dom";
import { ManagerUser } from "../../utils/managerAuth";

interface MenuProps {
    managerUser: ManagerUser | null;
    onLogout: () => void;
}

export default function Menu({ managerUser, onLogout }: MenuProps) {
    const navigate = useNavigate();

    return (
        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">관리자 시스템</h2>
                {managerUser && (
                    <div className="mb-4">
                        <p className="text-gray-300">환영합니다, <span className="text-blue-400 font-medium">{managerUser.name}</span>님!</p>
                        <p className="text-sm text-gray-500">{managerUser.email}</p>
                    </div>
                )}
                <p className="text-gray-400">관리할 항목을 선택하세요</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={() => navigate('/manager/support')}
                    className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl p-8 transition-all duration-300 hover:scale-105"
                >
                    <h3 className="text-2xl font-semibold text-white mb-2">고객 지원 자료 관리</h3>
                    <p className="text-gray-300">고객 지원 자료를 업로드하고 관리할 수 있습니다</p>
                </button>
                
                <button 
                    onClick={() => navigate('/manager/portfolio')}
                    className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl p-8 transition-all duration-300 hover:scale-105"
                >
                    <h3 className="text-2xl font-semibold text-white mb-2">시공사례 관리</h3>
                    <p className="text-gray-300">시공 사례를 확인하고 관리할 수 있습니다</p>
                </button>
                
                <button
                    onClick={() => navigate('/manager/products')}
                    className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl p-8 transition-all duration-300 hover:scale-105"
                >
                    <h3 className="text-2xl font-semibold text-white mb-2">제품 관리</h3>
                    <p className="text-gray-300">제품 정보를 확인하고 관리할 수 있습니다</p>
                </button>
            </div>

            <div className="mt-8 text-center">
                <button
                    onClick={onLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                >
                    로그아웃
                </button>
            </div>
        </div>
    );
}

