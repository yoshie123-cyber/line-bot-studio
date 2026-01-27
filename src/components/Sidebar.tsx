import { useState } from 'react';
import {
    LayoutDashboard,
    MessageSquare,
    Settings,
    PlusCircle,
    HelpCircle,
    Menu,
    X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    const [isOpen, setIsOpen] = useState(true);

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'ダッシュボード' },
        { id: 'bots', icon: MessageSquare, label: 'マイボット' },
        { id: 'create', icon: PlusCircle, label: 'ボット作成' },
        { id: 'support', icon: HelpCircle, label: '使い方ガイド' },
        { id: 'settings', icon: Settings, label: '設定' },
    ];

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className="fixed top-4 left-4 z-50 p-2 glass rounded-lg lg:hidden"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 glass border-r transition-transform duration-300 lg:translate-x-0",
                !isOpen && "-translate-x-full"
            )}>
                <div className="flex flex-col h-full p-4">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className="flex items-center gap-3 px-2 py-6 hover:opacity-80 transition-opacity text-left w-full"
                    >
                        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20">
                            LB
                        </div>
                        <span className="text-xl font-bold gradient-text">LINEボットスタジオ</span>
                    </button>

                    <nav className="flex-1 space-y-1 mt-4">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                    activeTab === item.id
                                        ? "bg-primary-500/10 text-primary-600 font-bold shadow-sm"
                                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                <item.icon size={20} className={cn(activeTab === item.id && "text-primary-600")} />
                                <span>{item.id === 'dashboard' ? 'ホーム' : item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>
        </>
    );
};
