import { useState } from 'react';
import {
    Save,
    Send,
    Cpu,
    Globe,
    ArrowLeft,
    Bot
} from 'lucide-react';
import { cn } from '../lib/utils';

interface BotData {
    id: string;
    name: string;
    description: string;
    color: string;
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
    onBack: () => void;
    onSave: (bot: BotData) => void;
}

export const BotEditor: React.FC<BotEditorProps> = ({ bot, onBack, onSave }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'こんにちは！何かお手伝いできることはありますか？' }
    ]);
    const [inputText, setInputText] = useState('');

    // Local form state
    const [name, setName] = useState(bot.name);
    const [description, setDescription] = useState(bot.description);
    const [channelSecret, setChannelSecret] = useState(bot.lineConfig?.channelSecret || '');
    const [channelAccessToken, setChannelAccessToken] = useState(bot.lineConfig?.channelAccessToken || '');
    const [systemPrompt, setSystemPrompt] = useState(bot.aiConfig?.systemPrompt || '');
    const [model, setModel] = useState(bot.aiConfig?.model || 'GPT-5.0 (最新)');
    const [temperature, setTemperature] = useState(bot.aiConfig?.temperature || 0.7);

    const handleSend = () => {
        if (!inputText.trim()) return;
        setMessages([...messages, { role: 'user', text: inputText }]);
        const currentInput = inputText;
        setInputText('');

        // Improved Fake response that "reflects" settings
        setTimeout(() => {
            const mockReply = `（シミュレーター応答）\n設定された性格「${systemPrompt.substring(0, 30)}${systemPrompt.length > 30 ? '...' : ''}」に基づき、「${currentInput}」への回答を生成しました。モデル: ${model}`;
            setMessages(prev => [...prev, { role: 'bot', text: mockReply }]);
        }, 800);
    };

    const handleSave = () => {
        onSave({
            ...bot,
            name,
            description,
            lineConfig: {
                channelSecret,
                channelAccessToken
            },
            aiConfig: {
                systemPrompt,
                model,
                temperature
            }
        });
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
                    className="ml-auto flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 font-bold"
                >
                    <Save size={18} />
                    <span>設定を保存</span>
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
                            </div>
                        )}

                        {activeTab === 'line' && (
                            <div className="space-y-6">
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
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl">
                                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                                        Webhook URL: <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">https://line-bot-studio.vercel.app/api/webhook</code>
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">システムプロンプト（ボットの性格設定）</label>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[250px] font-mono text-sm leading-relaxed"
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
                                            <option>GPT-5.0 (最新)</option>
                                            <option>GPT-4o</option>
                                            <option>GPT-4 Turbo</option>
                                            <option>GPT-3.5 Turbo</option>
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
                                <div className="pt-12 pb-4 px-6 border-b border-white/5 bg-[#0b1d33]/80 backdrop-blur-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-xs uppercase">
                                            {name[0]}
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
                                                "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                                                msg.role === 'user'
                                                    ? "bg-primary-600 text-white rounded-tr-none shadow-lg shadow-primary-500/20"
                                                    : "bg-slate-800 text-slate-100 rounded-tl-none"
                                            )}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Chat Input */}
                                <div className="p-4 bg-[#0b1d33]/80 backdrop-blur-md border-t border-white/5">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                            placeholder="メッセージを入力してください..."
                                            className="flex-1 bg-slate-800 text-white rounded-full px-4 py-2 text-sm outline-none border border-white/10 focus:border-primary-500/50 transition-colors"
                                        />
                                        <button
                                            onClick={handleSend}
                                            className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
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
        </div>
    );
};
