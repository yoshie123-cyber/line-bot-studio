import { useState } from 'react';
import {
    Save,
    Send,
    Cpu,
    Globe,
    ArrowLeft,
    Bot,
    Key,
    Grid,
    Image as ImageIcon
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
    richMenu?: {
        layout: 'six' | 'three';
        backgroundImageUrl: string;
        chatBarText: string;
        buttons: Array<{
            label: string;
            type: 'uri' | 'message';
            value: string;
        }>;
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

    // Rich Menu state
    const [richMenuLayout, setRichMenuLayout] = useState<'six' | 'three'>(bot.richMenu?.layout || 'six');
    const [richMenuBg, setRichMenuBg] = useState(bot.richMenu?.backgroundImageUrl || '');
    const [richMenuChatBar, setRichMenuChatBar] = useState(bot.richMenu?.chatBarText || 'メニュー');
    const [richMenuButtons, setRichMenuButtons] = useState<Array<{ label: string, type: 'uri' | 'message', value: string }>>(
        bot.richMenu?.buttons || [
            { label: 'ボタン1', type: 'message', value: 'こんにちは' },
            { label: 'ボタン2', type: 'message', value: '助けて' },
            { label: 'ボタン3', type: 'uri', value: 'https://example.com' },
            { label: 'ボタン4', type: 'message', value: '予約' },
            { label: 'ボタン5', type: 'message', value: 'アクセス' },
            { label: 'ボタン6', type: 'message', value: '終了' },
        ]
    );
    const [selectedButtonIdx, setSelectedButtonIdx] = useState<number | null>(null);

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
                avatarUrl,
                richMenu: {
                    layout: richMenuLayout,
                    backgroundImageUrl: richMenuBg,
                    chatBarText: richMenuChatBar,
                    buttons: richMenuButtons
                }
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
        { id: 'richmenu', icon: Grid, label: 'リッチメニュー' },
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
                                    <div className="mt-3 flex justify-end">
                                        <a
                                            href={`${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}diag=1`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
                                        >
                                            <Globe size={12} />
                                            <span>AI接続状態を詳しく診断する（別タブで開く）</span>
                                        </a>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">システムプロンプト（ボットの性格設定）</label>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[200px] font-mono text-sm leading-relaxed"
                                        placeholder="あなたは高級不動産の接客アシスタントです。丁寧な言葉遣いで答え、お客様に寄り添った提案をしてください..."
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                    />
                                    <div className="mt-3 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl">
                                        <h4 className="text-xs font-bold text-primary-700 dark:text-primary-300 mb-2 flex items-center gap-1.5">
                                            <Globe size={12} />
                                            便利：リッチなメッセージ（ボタン・リンク）の送り方
                                        </h4>
                                        <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                                            以下の「合言葉」をプロンプトに含めるようAIに指示すると、LINE上で綺麗なボタンが表示されます。
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-primary-200 dark:border-primary-700">
                                                <p className="text-[9px] font-bold text-slate-400 mb-1">🔗 リンクボタン</p>
                                                <code className="text-[10px] text-primary-600 font-mono">[LINK:名前|URL]</code>
                                            </div>
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-primary-200 dark:border-primary-700">
                                                <p className="text-[9px] font-bold text-slate-400 mb-1">🔘 返信ボタン</p>
                                                <code className="text-[10px] text-primary-600 font-mono">[BUTTON:名前|送信内容]</code>
                                            </div>
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-primary-200 dark:border-primary-700 sm:col-span-2">
                                                <p className="text-[9px] font-bold text-slate-400 mb-1">✨ 高度なFlex Message（カード・画像など）</p>
                                                <div className="flex flex-col gap-1.5">
                                                    <code className="text-[10px] text-primary-600 font-mono">[FLEX:{"{"}JSON内容{"}"}]</code>
                                                    <p className="text-[8px] text-slate-500">
                                                        <a href="https://developers.line.biz/flex-simulator/" target="_blank" className="underline hover:text-primary-600">Flex Message Simulator</a> で作ったJSONを丸ごと貼り付けて、豪華なレイアウトを作成できます。
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">AIモデル</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20"
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                        >
                                            <option>gemini-2.0-flash (推奨・高速)</option>
                                            <option>gemini-1.5-flash-latest</option>
                                            <option>gemini-pro-latest</option>
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

                        {activeTab === 'richmenu' && (
                            <div className="space-y-8">
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold flex items-center gap-2">
                                            <ImageIcon size={16} className="text-slate-400" />
                                            <span>リッチメニューのデザイン</span>
                                        </h4>
                                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
                                            <button
                                                onClick={() => setRichMenuLayout('six')}
                                                className={cn(
                                                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                                    richMenuLayout === 'six' ? "bg-white dark:bg-slate-800 shadow-sm text-primary-600" : "text-slate-400"
                                                )}
                                            >
                                                6枠 (2x3)
                                            </button>
                                            <button
                                                onClick={() => setRichMenuLayout('three')}
                                                className={cn(
                                                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                                    richMenuLayout === 'three' ? "bg-white dark:bg-slate-800 shadow-sm text-primary-600" : "text-slate-400"
                                                )}
                                            >
                                                3枠 (1x3)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        {/* Visual Designer */}
                                        <div className="md:col-span-12">
                                            <div className="relative aspect-[2500/1686] w-full max-w-[500px] mx-auto bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-inner group">
                                                {richMenuBg && (
                                                    <img src={richMenuBg} className="absolute inset-0 w-full h-full object-cover" alt="Rich Menu BG" />
                                                )}
                                                <div className={cn(
                                                    "absolute inset-0 grid gap-px bg-slate-300/30",
                                                    richMenuLayout === 'six' ? "grid-cols-3 grid-rows-2" : "grid-cols-3 grid-rows-1 h-1/2 bottom-0"
                                                )}>
                                                    {(richMenuLayout === 'six' ? [0, 1, 2, 3, 4, 5] : [0, 1, 2]).map((idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setSelectedButtonIdx(idx)}
                                                            className={cn(
                                                                "relative flex flex-col items-center justify-center p-2 transition-all hover:bg-primary-500/10 backdrop-blur-[2px]",
                                                                selectedButtonIdx === idx ? "bg-primary-500/20 border-2 border-primary-500 z-10 scale-[1.02] shadow-lg" : "border border-white/10"
                                                            )}
                                                        >
                                                            <div className="absolute top-1 left-1.5 text-[10px] font-black text-white/50 bg-black/20 px-1 rounded">{idx + 1}</div>
                                                            <span className="text-[10px] font-bold text-white drop-shadow-md text-center line-clamp-2">
                                                                {richMenuButtons[idx]?.label || '未設定'}
                                                            </span>
                                                            <span className="text-[8px] text-white/70 drop-shadow-sm mt-1">
                                                                {richMenuButtons[idx]?.type === 'uri' ? '🔗 リンク' : '💬 文字送信'}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Editor Section */}
                                        <div className="md:col-span-12 glass p-6 rounded-xl border border-primary-100 dark:border-primary-900/30">
                                            {selectedButtonIdx !== null ? (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="text-xs font-bold text-primary-700">配置 {selectedButtonIdx + 1} の設定</h5>
                                                        <span className="text-[10px] text-slate-400">現在選択中</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">ラベル（管理用）</label>
                                                            <input
                                                                type="text"
                                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
                                                                value={richMenuButtons[selectedButtonIdx].label}
                                                                onChange={(e) => {
                                                                    const newButtons = [...richMenuButtons];
                                                                    newButtons[selectedButtonIdx].label = e.target.value;
                                                                    setRichMenuButtons(newButtons);
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">アクション</label>
                                                            <select
                                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
                                                                value={richMenuButtons[selectedButtonIdx].type}
                                                                onChange={(e) => {
                                                                    const newButtons = [...richMenuButtons];
                                                                    newButtons[selectedButtonIdx].type = e.target.value as 'uri' | 'message';
                                                                    setRichMenuButtons(newButtons);
                                                                }}
                                                            >
                                                                <option value="message">文字を送る</option>
                                                                <option value="uri">URLを開く</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                                                {richMenuButtons[selectedButtonIdx].type === 'uri' ? 'URL' : '送信内容'}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
                                                                value={richMenuButtons[selectedButtonIdx].value}
                                                                onChange={(e) => {
                                                                    const newButtons = [...richMenuButtons];
                                                                    newButtons[selectedButtonIdx].value = e.target.value;
                                                                    setRichMenuButtons(newButtons);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                                    <Grid size={32} className="mb-2 opacity-20" />
                                                    <p className="text-xs">上のグリッドをクリックして、ボタンを設定してください。</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                                            <ImageIcon size={14} className="text-slate-400" />
                                            <span>背景画像 URL</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="https://example.com/menu-bg.png"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 text-sm font-mono"
                                            value={richMenuBg}
                                            onChange={(e) => setRichMenuBg(e.target.value)}
                                        />
                                        <p className="text-[10px] text-slate-500 mt-2">推奨サイズ: 2500 × 1686 px (PNG/JPG)</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">メニューバーの文字</label>
                                        <input
                                            type="text"
                                            placeholder="メニューを開く"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 text-sm"
                                            value={richMenuChatBar}
                                            onChange={(e) => setRichMenuChatBar(e.target.value)}
                                        />
                                        <p className="text-[10px] text-slate-500 mt-2">LINE画面下部のバーに表示されるテキストです。</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-primary-50 dark:bg-primary-950/30 rounded-2xl border border-primary-100 dark:border-primary-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-primary-900 dark:text-primary-100">LINE公式アカウントに反映</h4>
                                        <p className="text-xs text-primary-700 dark:text-primary-400 mt-1">
                                            現在の設定をLINE Messaging APIを通じて公式アカウントに即座に反映します。
                                        </p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!channelAccessToken) {
                                                alert("公式アカウントと同期するには、先に「LINE連携」タブでアクセストークンを入力してください。");
                                                return;
                                            }
                                            setIsSyncing(true);
                                            try {
                                                // We'll implement this endpoint next
                                                const res = await fetch('/api/rich-menu', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        token: channelAccessToken,
                                                        richMenu: {
                                                            layout: richMenuLayout,
                                                            backgroundImageUrl: richMenuBg,
                                                            chatBarText: richMenuChatBar,
                                                            buttons: richMenuButtons
                                                        }
                                                    })
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    alert("反映が完了しました！LINEで確認してください。");
                                                } else {
                                                    alert(`失敗しました: ${data.error || '不明なエラー'}`);
                                                }
                                            } catch (e) {
                                                alert("通信エラーが発生しました。");
                                            } finally {
                                                setIsSyncing(false);
                                            }
                                        }}
                                        disabled={isSyncing}
                                        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/20 flex items-center gap-2 shrink-0 disabled:opacity-50"
                                    >
                                        <Globe size={18} />
                                        <span>{isSyncing ? '同期中...' : 'LINEに即時反映する'}</span>
                                    </button>
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
