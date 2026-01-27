import { useState, useEffect } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PlusCircle, Bot as BotIcon } from 'lucide-react';
import { BotEditor } from './pages/BotEditor';
import { LandingPage } from './pages/LandingPage';
import { Support } from './pages/Support';
import { useAuth } from './context/AuthContext';
import { cn } from './lib/utils';
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { signOut } from 'firebase/auth';

interface BotData {
  id: string;
  name: string;
  description: string;
  color: string;
  avatarUrl?: string;
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
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Firestore standard loading with robust state management
  useEffect(() => {
    if (!authLoading && user) {
      console.log("[App] Subscribing to Firestore...");
      const q = query(collection(db, "users", user.uid, "bots"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const botsData: BotData[] = [];
        querySnapshot.forEach((doc) => {
          botsData.push({ id: doc.id, ...doc.data() } as BotData);
        });
        setBots(botsData);
        setIsDataLoaded(true);
      }, (error) => {
        console.error("[App] Firestore load error:", error);
        setIsDataLoaded(true); // Don't block UI forever on error
      });
      return () => unsubscribe();
    } else if (!authLoading && !user) {
      setBots([]);
      setIsDataLoaded(true);
    }
  }, [user, authLoading]);

  const handleLogout = async () => {
    if (confirm("ログアウトしますか？")) {
      await signOut(auth);
      window.location.reload();
    }
  };

  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    if (!isDataLoaded && user) {
      const timer = setTimeout(() => setShowReset(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isDataLoaded, user]);

  if (authLoading || (!isDataLoaded && user)) {
    return (
      <div className="min-h-screen bg-[#071426] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-slate-500 text-sm font-medium animate-pulse">データを読み込み中...</p>
            {showReset && (
              <button
                onClick={handleLogout}
                className="mt-8 text-xs text-slate-600 hover:text-white underline decoration-slate-700 transition-colors"
              >
                読み込みが終わりませんか？ ログアウトしてやり直す
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'dashboard') {
      setEditingBotId(null);
    }
  };

  const handleBack = () => {
    setEditingBotId(null);
    setActiveTab('dashboard');
  };

  const createNewBot = async () => {
    if (!user) return;
    const newId = Date.now().toString();
    const newBot = {
      id: newId,
      name: `新規ボット ${bots.length + 1}`,
      description: '',
      color: 'from-primary-500 to-blue-600',
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, "users", user.uid, "bots", newId), newBot);
      setEditingBotId(newId);
      setActiveTab('bots');
    } catch (e) {
      console.error("Failed to create bot:", e);
    }
  };

  const handleSaveBot = async (updatedBot: BotData) => {
    if (!user) return;
    try {
      // Add a 10s timeout to avoid infinite spinning
      await Promise.race([
        setDoc(doc(db, "users", user.uid, "bots", updatedBot.id), updatedBot, { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]);
    } catch (e) {
      console.error("Failed to save bot:", e);
      throw e;
    }
  };

  const handleDeleteBot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (confirm("このボットを削除しますか？")) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "bots", id));
        if (editingBotId === id) setEditingBotId(null);
      } catch (e) {
        console.error("Failed to delete bot:", e);
      }
    }
  };

  const currentBot = bots.find(b => b.id === editingBotId);

  const renderContent = () => {
    if (activeTab === 'support' && !editingBotId) {
      return <Support />;
    }

    if (currentBot) {
      return (
        <BotEditor
          key={currentBot.id}
          bot={currentBot}
          userId={user.uid}
          onBack={handleBack}
          onSave={handleSaveBot}
        />
      );
    }

    return (
      <section className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">マイボット</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">LINE AIチャットボットの管理</p>
            </div>
            <div className="hidden sm:block h-10 w-px bg-slate-200 dark:bg-slate-800" />
          </div>
          <button
            onClick={createNewBot}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all active:scale-95 shadow-lg shadow-primary-500/20 text-sm sm:text-base w-full sm:w-auto"
          >
            <PlusCircle size={18} className="sm:w-5 sm:h-5" />
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
                className="glass p-5 sm:p-6 rounded-2xl group cursor-pointer hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 border border-transparent hover:border-primary-500/20 relative"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white font-bold text-lg sm:text-xl uppercase overflow-hidden",
                    !bot.avatarUrl && bot.color
                  )}>
                    {bot.avatarUrl ? (
                      <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full object-cover" />
                    ) : (
                      bot.name[0]
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-base sm:text-lg truncate">{bot.name}</h4>
                    <p className="text-[10px] sm:text-sm text-slate-500 truncate">LINE公式アカウント連携</p>
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
                  <button
                    onClick={(e) => handleDeleteBot(bot.id, e)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold text-[10px]"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={handleTabChange}>
      {renderContent()}
    </DashboardLayout>
  );
}

export default App;
