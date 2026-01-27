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
                        <div className="text-right hidden sm:block">
                            <span className="block text-sm font-bold text-slate-800 dark:text-slate-200 leading-none mb-1">{user?.displayName}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">{user?.email} (ID: {user?.uid.slice(0, 6)}...)</span>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 bg-slate-100 dark:bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-xl transition-all group border border-slate-200 dark:border-slate-800"
                            title="ログアウト"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                <div className="p-8 flex-1">
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
