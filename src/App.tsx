import { useState } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PlusCircle } from 'lucide-react';
import { BotEditor } from './pages/BotEditor';
import { Login } from './pages/Login';
import { Support } from './pages/Support';
import { useAuth } from './context/AuthContext';
import { cn } from './lib/utils';

function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingBot, setEditingBot] = useState<string | null>(null);

  if (!user) {
    return <Login />;
  }

  // Handle tab changes from Sidebar
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'create') {
      setEditingBot('新規ボット');
    } else {
      setEditingBot(null);
    }
  };

  const handleBack = () => {
    setEditingBot(null);
    setActiveTab('dashboard');
  };

  // Dedicated Support view
  if (activeTab === 'support' && !editingBot) {
    return (
      <DashboardLayout activeTab={activeTab} setActiveTab={handleTabChange}>
        <Support />
      </DashboardLayout>
    );
  }

  if (editingBot) {
    return (
      <DashboardLayout activeTab={activeTab} setActiveTab={handleTabChange}>
        <BotEditor botName={editingBot} onBack={handleBack} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={handleTabChange}>
      <div className="max-w-6xl mx-auto space-y-8">
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">マイボット</h2>
              <p className="text-slate-500 mt-1">LINE AIチャットボットの管理と設定を行います。</p>
            </div>
            <button
              onClick={() => handleTabChange('create')}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/20"
            >
              <PlusCircle size={20} />
              <span>新しくボットを作成</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'サポートボット', color: 'from-primary-500 to-blue-600' },
              { name: 'コンシェルジュAI', color: 'from-purple-500 to-indigo-600' },
              { name: 'HRアシスタント', color: 'from-emerald-500 to-teal-600' },
            ].map((bot, i) => (
              <div
                key={i}
                onClick={() => {
                  setEditingBot(bot.name);
                  setActiveTab('bots');
                }}
                className="glass p-6 rounded-2xl group cursor-pointer hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 border border-transparent hover:border-primary-500/20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white font-bold text-xl uppercase",
                    bot.color
                  )}>
                    {bot.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{bot.name}</h4>
                    <p className="text-sm text-slate-500">LINE公式アカウント連携</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium text-emerald-600">稼働中</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button className="text-sm font-semibold text-primary-600 group-hover:translate-x-1 transition-transform">
                    設定を編集する →
                  </button>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default App;
