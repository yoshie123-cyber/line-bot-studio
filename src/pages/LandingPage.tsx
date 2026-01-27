import { motion } from 'framer-motion';
import { Bot, Sparkles, Zap, MessageSquare, ChevronRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const FEATURED_BOTS = [
    {
        id: '1',
        name: 'AI 英語コーチ',
        description: 'あなたのレベルに合わせて英会話の練習相手になります。',
        icon: '🇬🇧',
        color: 'from-blue-500 to-indigo-600',
        users: '1.2k+'
    },
    {
        id: '2',
        name: '占い師 ミラ',
        description: '毎日の運勢や悩みをタロットと占星術で占います。',
        icon: '🔮',
        color: 'from-purple-500 to-pink-600',
        users: '850'
    },
    {
        id: '3',
        name: '料理の鉄人助手',
        description: '冷蔵庫の余り物から最高のレシピを提案します。',
        icon: '🍳',
        color: 'from-orange-500 to-red-600',
        users: '2.1k+'
    }
];

export const LandingPage = () => {
    const { loginWithGoogle } = useAuth();
    const [isLoginLoading, setIsLoginLoading] = useState(false);

    const handleStart = async () => {
        setIsLoginLoading(true);
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoginLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-['Inter'] selection:bg-primary-100 selection:text-primary-700">
            {/* Header / Nav */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20">
                            LB
                        </div>
                        <span className="text-xl font-black tracking-tighter text-slate-900">LINEボットスタジオ</span>
                    </div>
                    <button
                        onClick={handleStart}
                        className="text-sm font-bold px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                        ログイン / 新規登録
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-primary-50/50 to-transparent -z-10" />

                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-xs font-bold mb-8 border border-primary-100"
                    >
                        <Sparkles size={14} />
                        Gemini & GPT-4 対応の最新ボット作成プラットフォーム
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl sm:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1]"
                    >
                        誰でも、数分で。<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">魔法のようなLINEボット</span>を。
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        プログラミングは不要。AIの性格を入力するだけで、<br />
                        24時間365日働くあなた専属のアシスタントが完成します。
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button
                            onClick={handleStart}
                            disabled={isLoginLoading}
                            className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/25 flex items-center justify-center gap-2 group"
                        >
                            {isLoginLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    無料でボットを作成する
                                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                            使い方を見る
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Showcase Section */}
            <section className="py-20 bg-slate-50/50 px-6 border-y border-slate-100">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">注目のボットたち</h2>
                        <p className="text-slate-500">LINEボットスタジオで作られた個性豊かなAIたちをご紹介します。</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {FEATURED_BOTS.map((bot, idx) => (
                            <motion.div
                                key={bot.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-white relative group"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${bot.color} flex items-center justify-center text-3xl mb-6 shadow-lg shadow-primary-500/10`}>
                                    {bot.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{bot.name}</h3>
                                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                    {bot.description}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                                        <MessageSquare size={14} />
                                        {bot.users} Users
                                    </div>
                                    <button className="flex items-center gap-1.5 text-primary-600 font-bold text-sm hover:underline">
                                        LINEで追加
                                        <ExternalLink size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <button className="text-slate-500 font-bold hover:text-slate-800 transition-colors flex items-center gap-2 mx-auto">
                            すべてのボットを見る
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                                <Zap size={24} />
                            </div>
                            <h2 className="text-4xl font-bold mb-6 text-slate-900">
                                最新のGemini 2.0に対応。<br />
                                驚くほど自然な対話を。
                            </h2>
                            <ul className="space-y-4">
                                {[
                                    'Google Gemini / OpenAI GPT-4 両対応',
                                    'リッチメッセージ（ボタン・リンク）作成',
                                    'スマホ1台で完結する簡単エディタ',
                                    '独自のWebhook URLを自動発行'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-500/10 blur-[120px] rounded-full" />
                            <div className="relative bg-slate-900 aspect-video rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                                <div className="text-slate-500 flex flex-col items-center gap-4">
                                    <Bot size={48} className="animate-bounce" />
                                    <p className="text-xs font-mono tracking-widest uppercase">Admin Dashboard Preview</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto bg-gradient-to-tr from-slate-900 to-slate-800 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px]" />
                    <h2 className="text-3xl sm:text-4xl font-bold mb-6">さあ、あなただけのAIを公開しましょう</h2>
                    <p className="text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed text-sm">
                        今すぐ無料で始められます。Googleアカウントひとつで、<br />
                        世界にたったひとつのLINEボットを。
                    </p>
                    <button
                        onClick={handleStart}
                        className="px-10 py-5 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-xl shadow-black/20"
                    >
                        無料で今すぐ始める
                    </button>
                </div>
            </section>

            <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-sm">
                <div className="flex items-center justify-center gap-8 mb-6 font-bold text-slate-500">
                    <button className="hover:text-slate-900">利用規約</button>
                    <button className="hover:text-slate-900">プライバシーポリシー</button>
                    <button className="hover:text-slate-900">お問い合わせ</button>
                </div>
                <p>&copy; 2026 LINE bot studio. All rights reserved.</p>
            </footer>
        </div>
    );
};
