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
                <header className="sticky top-0 z-30 w-full glass border-b px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Mobile Spacer (for Sidebar button) */}
                        <div className="w-10 lg:hidden shrink-0" />
                        <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 truncate">
                            {activeTab === 'dashboard' ? 'ホーム' :
                                activeTab === 'bots' ? 'マイボット' :
                                    activeTab === 'create' ? 'ボット作成' :
                                        activeTab === 'support' ? 'サポート' : '設定'}
                            <span className="ml-2 text-[8px] font-normal text-slate-300">v1.6.3-diagnostic-ui</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                            <span className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-none mb-0.5 sm:mb-1 truncate max-w-[100px] sm:max-w-none">{user?.displayName}</span>
                            <span className="block text-[8px] sm:text-[10px] text-slate-400 font-mono truncate max-w-[100px] sm:max-w-none">{user?.email}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg sm:rounded-xl transition-all group border border-slate-200 dark:border-slate-800"
                            title="ログアウト"
                        >
                            <LogOut size={16} className="sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </header>

                <div className="p-4 sm:p-8 flex-1">
                    {children}
                </div>

                <footer className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} LINEボットスタジオ. All Rights Reserved.
                    </p>
                    <div className="mt-2 flex justify-center gap-4">
                        <button onClick={() => setActiveTab('support')} className="text-[10px] text-slate-400 hover:text-primary-500 transition-colors underline underline-offset-2">利用規約</button>
                        <button onClick={() => setActiveTab('support')} className="text-[10px] text-slate-400 hover:text-primary-500 transition-colors underline underline-offset-2">プライバシーポリシー</button>
                    </div>
                </footer>
            </main>
        </div>
    );
};
