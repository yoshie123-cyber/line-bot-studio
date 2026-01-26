import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeTab, setActiveTab }) => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="lg:ml-64 min-h-screen">
                <header className="sticky top-0 z-30 w-full glass border-b px-8 py-4 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {activeTab === 'dashboard' ? 'ダッシュボード' :
                            activeTab === 'bots' ? 'マイボット' :
                                activeTab === 'create' ? 'ボット作成' :
                                    activeTab === 'support' ? 'サポート' : '設定'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{user?.name}</span>
                        <button
                            onClick={logout}
                            className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-colors group relative"
                            title="ログアウト"
                        >
                            <LogOut size={20} />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-blue-600 shadow-md" />
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};
