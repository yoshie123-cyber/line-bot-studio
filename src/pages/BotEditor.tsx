import { useState } from 'react';
import {
    Save,
    Send,
    Cpu,
    Globe,
    ArrowLeft,
    Bot,
    Key
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getGeminiResponse } from '../lib/gemini';

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

interface BotEditorProps {
    bot: BotData;
    userId: string;
    onBack: () => void;
    onSave: (bot: BotData) => Promise<void>;
}

export const BotEditor: React.FC<BotEditorProps> = ({ bot, userId, onBack, onSave }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'こんにちは！何かお手伝いできることはありますか？' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Dynamic Webhook URL based on current domain and IDs
    const webhookUrl = `${window.location.origin}/api/webhook?uid=${userId}&bid=${bot.id}`;

    // Local form state
    const [name, setName] = useState(bot.name);
    const [description, setDescription] = useState(bot.description);
    const [geminiApiKey, setGeminiApiKey] = useState(bot.geminiApiKey || '');
    const [channelSecret, setChannelSecret] = useState(bot.lineConfig?.channelSecret || '');
    const [channelAccessToken, setChannelAccessToken] = useState(bot.lineConfig?.channelAccessToken || '');
    const [systemPrompt, setSystemPrompt] = useState(bot.aiConfig?.systemPrompt || '');
    const [model, setModel] = useState(bot.aiConfig?.model || 'Gemini 1.5 Flash (無料枠)');
    const [temperature, setTemperature] = useState(bot.aiConfig?.temperature || 0.7);
    const [avatarUrl, setAvatarUrl] = useState(bot.avatarUrl || '');
    const [isSyncing, setIsSyncing] = useState(false);

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [copyStatus, setCopyStatus] = useState(false);

    const handleCopyWebhook = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 2000);
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg = inputText;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInputText('');
        setIsTyping(true);

        try {
            if (geminiApiKey) {
                // Real AI Call
                const response = await getGeminiResponse(geminiApiKey, systemPrompt, userMsg);
                setMessages(prev => [...prev, { role: 'bot', text: response }]);
            } else {
                // Fallback Mock logic (Previous natural mock)
                setTimeout(() => {
                    let mockReply = '';
                    const lowerInput = userMsg.toLowerCase();
                    const hasGreeting = /こんにちは|こんばんは|おはよう|おは|hello|hi/.test(lowerInput);

                    if (hasGreeting) {
                        mockReply = `こんにちは！${name}です。お声がけいただきありがとうございます。本物のAIを体験するには、AI設定からGeminiのAPIキーを入力してください！`;
                    } else {
                        mockReply = `「${userMsg}」についてですね。現在はシミュレーターモードですが、APIキーを設定すればGeminiが本物の知能で回答します。`;
                    }
                    setIsTyping(false);
                    setMessages(prev => [...prev, { role: 'bot', text: mockReply }]);
                }, 1500);
                return; // Early return for mock
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'bot', text: `エラーが発生しました: ${error.message || 'APIキーが無効か、通信エラーです。'}` }]);
        } finally {
            if (geminiApiKey) setIsTyping(false);
        }
    };

    const handleSave = async () => {
        setSaveStatus('saving');
        try {
            await onSave({
                ...bot,
                name,
                description,
                geminiApiKey,
                lineConfig: {
                    channelSecret,
                    channelAccessToken
                },
                aiConfig: {
                    systemPrompt,
                    model,
                    temperature
                },
                avatarUrl
            });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            setSaveStatus('idle');
            alert("保存に失敗しました。");
        }
    };

    const tabs = [
        { id: 'basic', icon: Bot, label: '基本情報' },
        { id: 'line', icon: Globe, label: 'LINE連携' },
        { id: 'ai', icon: Cpu, label: 'AI設定' },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-3xl font-bold tracking-tight">{name} <span className="text-slate-400 text-base font-normal">/ 編集</span></h2>
                <button
                    onClick={handleSave}
                    disabled={saveStatus !== 'idle'}
                    className={cn(
                        "ml-auto flex items-center gap-2 px-6 py-3 rounded-xl transition-all shadow-lg font-bold min-w-[140px] justify-center",
                        saveStatus === 'saved'
                            ? "bg-emerald-500 text-white shadow-emerald-500/20"
                            : "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20",
                        saveStatus === 'saving' && "opacity-80 cursor-wait"
                    )}
                >
                    {saveStatus === 'saving' ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>保存中...</span>
                        </>
                    ) : saveStatus === 'saved' ? (
                        <>
                            <Bot size={18} className="animate-bounce" />
                            <span>保存完了！</span>
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            <span>設定を保存</span>
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Settings Panel */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="glass rounded-2xl p-2 flex gap-1 mb-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                    activeTab === tab.id
                                        ? "bg-white dark:bg-slate-800 shadow-sm text-primary-600"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <tab.icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="glass rounded-2xl p-8 min-h-[500px]">
                        {activeTab === 'basic' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">ボット名</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">説明</label>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 transition-all min-h-[120px]"
                                        placeholder="このボットの役割を入力してください。"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <label className="block text-sm font-semibold mb-4">ボットアイコン</label>
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "w-20 h-20 rounded-2xl bg-gradient-to-tr flex items-center justify-center text-white font-bold text-3xl uppercase overflow-hidden shadow-inner",
                                            !avatarUrl && bot.color
                                        )}>
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Icon Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                name[0]
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <input
                                                type="text"
                                                placeholder="アイコンのURLを直接入力"
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                                                value={avatarUrl}
                                                onChange={(e) => setAvatarUrl(e.target.value)}
                                            />
                                            <button
                                                onClick={async () => {
                                                    if (!channelAccessToken) {
                                                        alert("公式アカウント情報を取得するには、先に「LINE連携」タブでアクセストークンを入力してください。");
                                                        return;
                                                    }
                                                    setIsSyncing(true);
                                                    try {
                                                        const res = await fetch(`/api/line-info?token=${encodeURIComponent(channelAccessToken)}`);
                                                        const data = await res.json();
                                                        if (data.pictureUrl) {
                                                            setAvatarUrl(data.pictureUrl);
                                                            if (data.displayName && !name.includes(data.displayName)) {
                                                                setName(data.displayName);
                                                            }
                                                        } else {
                                                            alert("アイコンが設定されていないか、トークンが無効です。");
                                                        }
                                                    } catch (e) {
                                                        alert("取得に失敗しました。アクセストークンを確認してください。");
                                                    } finally {
                                                        setIsSyncing(false);
                                                    }
                                                }}
                                                disabled={isSyncing}
                                                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                            >
                                                {isSyncing ? (
                                                    <div className="w-3 h-3 border-2 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
                                                ) : (
                                                    <Globe size={14} />
                                                )}
                                                <span>LINE公式アカウントからアイコンと名前を取得</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'line' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                                        <Globe size={14} className="text-slate-400" />
                                        <span>LINE Webhook URL</span>
                                    </label>
                                    <div className="flex items-center gap-2 p-4 bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900 rounded-xl mb-6">
                                        <code className="flex-1 text-xs text-primary-700 dark:text-primary-300 break-all font-mono">
                                            {webhookUrl}
                                        </code>
                                        <button
                                            onClick={handleCopyWebhook}
                                            className={cn(
                                                "px-3 py-1 border rounded-lg text-[10px] font-bold transition-all",
                                                copyStatus
                                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                                    : "bg-white dark:bg-slate-800 border-primary-200 dark:border-primary-800 text-primary-600 hover:bg-primary-50"
                                            )}
                                        >
                                            {copyStatus ? 'コピー完了！' : 'コピー'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Channel Secret</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••••••••••"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20"
                                        value={channelSecret}
                                        onChange={(e) => setChannelSecret(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Channel Access Token</label>
                                    <textarea
                                        placeholder="発行されたアクセストークンを入力してください"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[100px]"
                                        value={channelAccessToken}
                                        onChange={(e) => setChannelAccessToken(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="space-y-6">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                                            <Key size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Google Gemini APIキー</h4>
                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-500">
                                                無料で利用可能です。<a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline hover:opacity-80">ここから取得</a>
                                            </p>
                                        </div>
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="AI Studioで取得したキーを貼り付け"
                                        className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                                        value={geminiApiKey}
                                        onChange={(e) => setGeminiApiKey(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">システムプロンプト（ボットの性格設定）</label>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[200px] font-mono text-sm leading-relaxed"
                                        placeholder="あなたは高級不動産の接客アシスタントです。丁寧な言葉遣いで答え、お客様に寄り添った提案をしてください..."
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">AIモデル</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20"
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                        >
                                            <option>Gemini 1.5 Flash (無料枠)</option>
                                            <option>Gemini 1.5 Pro (高性能)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Temperature（創造性）</label>
                                        <div className="flex items-center gap-4 mt-4">
                                            <input
                                                type="range"
                                                min="0"
                                                max="2"
                                                step="0.1"
                                                className="flex-1"
                                                value={temperature}
                                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                            />
                                            <span className="text-sm font-bold w-8">{temperature}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Simulator Panel */}
                <div className="lg:col-span-5">
                    <div className="sticky top-24">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 px-1">ライブシミュレーター</h3>
                        <div className="relative mx-auto w-full max-w-[360px] aspect-[9/18.5] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 w-full h-12 bg-slate-800 flex items-center justify-between px-8 text-white/50 text-xs">
                                <span>9:41</span>
                                <div className="flex gap-1.5">
                                    <div className="w-4 h-2 bg-white/50 rounded-full" />
                                </div>
                            </div>

                            <div className="flex flex-col h-full bg-[#071426]">
                                {/* Simulator Header */}
                                <div className="pt-12 pb-4 px-6 border-b border-white/5 bg-[#0b1d33]/80 backdrop-blur-md relative">
                                    <div className={cn(
                                        "absolute top-14 right-6 px-1.5 py-0.5 border rounded text-[8px] font-bold uppercase tracking-widest",
                                        geminiApiKey
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                            : "bg-primary-500/10 border-primary-500/20 text-primary-400"
                                    )}>
                                        {geminiApiKey ? 'Live AI' : 'Simulated'}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-xs uppercase overflow-hidden">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                                            ) : (
                                                name[0]
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-white text-sm font-bold">{name}</h4>
                                            <p className="text-emerald-500 text-[10px] font-medium">オンライン</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={cn(
                                            "flex",
                                            msg.role === 'user' ? "justify-end" : "justify-start"
                                        )}>
                                            <div className={cn(
                                                "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2",
                                                msg.role === 'user'
                                                    ? "bg-primary-600 text-white rounded-tr-none shadow-lg shadow-primary-500/20"
                                                    : "bg-slate-800 text-slate-100 rounded-tl-none"
                                            )}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-slate-800 text-slate-400 px-4 py-2.5 rounded-2xl rounded-tl-none flex gap-1 animate-pulse">
                                                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:0s]" />
                                                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Chat Input */}
                                <div className="p-4 bg-[#0b1d33]/80 backdrop-blur-md border-t border-white/5">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                            disabled={isTyping}
                                            placeholder={geminiApiKey ? "AIとチャットする..." : "メッセージを入力..."}
                                            className="flex-1 bg-slate-800 text-white rounded-full px-4 py-2 text-sm outline-none border border-white/10 focus:border-primary-500/50 transition-colors disabled:opacity-50"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={isTyping}
                                            className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
