import { useState, useEffect } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PlusCircle, Bot as BotIcon } from 'lucide-react';
import { BotEditor } from './pages/BotEditor';
import { Login } from './pages/Login';
import { Support } from './pages/Support';
import { useAuth } from './context/AuthContext';
import { cn } from './lib/utils';

interface BotData {
  id: string;
  name: string;
  description: string;
  color: string;
  geminiApiKey?: string;
  lineConfig?: {
    channelSecret: string;
    channelAccessToken: string;
  };
  aiConfig?: {
    systemPrompt: string;
    model: string;
    temperature: number;
  };
}

function App() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingBotId, setEditingBotId] = useState<string | null>(null);
  const [bots, setBots] = useState<BotData[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Initial data loading when user is authenticated
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        try {
          const saved = localStorage.getItem(`bots_${user.uid}`);
          if (saved) {
            setBots(JSON.parse(saved));
          }
        } catch (e) {
          console.error("Failed to load bots from localStorage:", e);
        }
      }
      setIsReady(true);
    }
  }, [user, authLoading]);

  // Sync bots to localStorage
  useEffect(() => {
    if (user && isReady) {
      localStorage.setItem(`bots_${user.uid}`, JSON.stringify(bots));
    }
  }, [bots, user, isReady]);

  if (authLoading || !isReady) {
    return (
      <div className="min-h-screen bg-[#071426] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium animate-pulse">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'create') {
      createNewBot();
    } else {
      setEditingBotId(null);
    }
  };

  const handleBack = () => {
    setEditingBotId(null);
    setActiveTab('dashboard');
  };

  const createNewBot = () => {
    const newId = Date.now().toString();
    const newBot = {
      id: newId,
      name: `新規ボット ${bots.length + 1}`,
      description: '',
      color: 'from-primary-500 to-blue-600'
    };
    setBots([...bots, newBot]);
    setEditingBotId(newId);
    setActiveTab('bots');
  };

  const handleSaveBot = (updatedBot: BotData) => {
    setBots(bots.map(b => b.id === updatedBot.id ? updatedBot : b));
    alert("設定を保存しました。");
  };

  const currentBot = bots.find(b => b.id === editingBotId);

  const renderContent = () => {
    if (activeTab === 'support' && !editingBotId) {
      return <Support />;
    }

    if (currentBot) {
      return <BotEditor bot={currentBot} onBack={handleBack} onSave={handleSaveBot} />;
    }

    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">マイボット</h2>
              <p className="text-slate-500 mt-1">LINE AIチャットボットの管理と設定を行います。</p>
            </div>
            <button
              onClick={createNewBot}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/20"
            >
              <PlusCircle size={20} />
              <span>新しくボットを作成</span>
            </button>
          </div>

          {bots.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 glass rounded-[2.5rem] border-dashed border-2 border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6 text-slate-400">
                <BotIcon size={40} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">ボットがまだありません</h3>
              <p className="text-slate-500 mb-8 max-w-sm text-center">
                右上のボタンから最初のAIチャットボットを作成して、LINE連携を始めましょう。
              </p>
              <button
                onClick={createNewBot}
                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg"
              >
                無料ではじめる
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.map((bot) => (
                <div
                  key={bot.id}
                  onClick={() => {
                    setEditingBotId(bot.id);
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={handleTabChange}>
      {renderContent()}
    </DashboardLayout>
  );
}

export default App;
