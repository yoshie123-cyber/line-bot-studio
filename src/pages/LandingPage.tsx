import { motion } from 'framer-motion';
import { Sparkles, Zap, ChevronRight, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { cn } from '../lib/utils';

const LineChatAnimation = () => {
    const messages = [
        { type: 'user', text: '冷蔵庫の写真を送るから、レシピを考えて！', delay: 0 },
        { type: 'bot', text: '承知いたしました！お写真を拝見します。', delay: 1.5 },
        { type: 'user', img: '🥬🥩', text: '（写真を送信しました）', delay: 3 },
        { type: 'bot', text: 'ありがとうございます。豚肉、キャベツ、ピーマンがありますね！それなら「回鍋肉」はいかがでしょうか？作り方もお教えできます。', delay: 5 },
        { type: 'user', text: 'いいですね！あと、明日の19時に予約を入れたいです。', delay: 7.5 },
        { type: 'bot', text: '承知いたしました。明日の19時に1名様でご予約を承りました！', delay: 9 },
    ];

    return (
        <div className="w-full max-w-[280px] sm:max-w-[320px] mx-auto bg-[#071426] rounded-[2rem] sm:rounded-[2.5rem] border-[4px] sm:border-[6px] border-slate-800 shadow-2xl overflow-hidden aspect-[9/16] relative flex flex-col">
            {/* Header */}
            <div className="pt-6 sm:pt-8 pb-3 px-4 sm:px-6 bg-[#0b1d33]/90 backdrop-blur-md border-b border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-blue-500 flex items-center justify-center text-xs text-white font-bold">AI</div>
                <div>
                    <div className="text-[10px] font-bold text-white">AIアシスタント</div>
                    <div className="text-[8px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                        応答可能
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden pt-6">
                {messages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20, y: 10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ delay: msg.delay, duration: 0.5 }}
                        className={cn(
                            "flex flex-col gap-1 max-w-[85%]",
                            msg.type === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                    >
                        {msg.img && (
                            <div className="w-24 h-24 rounded-2xl bg-slate-800 flex items-center justify-center text-4xl mb-1 border border-white/10">
                                {msg.img}
                            </div>
                        )}
                        <div className={cn(
                            "px-4 py-2.5 rounded-2xl text-[11px] leading-relaxed shadow-sm",
                            msg.type === 'user'
                                ? "bg-primary-600 text-white rounded-tr-none"
                                : "bg-white/10 text-slate-100 border border-white/5 rounded-tl-none"
                        )}>
                            {msg.text}
                        </div>
                    </motion.div>
                ))}

                {/* Typing indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ delay: 11, duration: 2, repeat: Infinity }}
                    className="mr-auto px-4 py-2.5 bg-white/5 rounded-2xl text-[10px] text-slate-400 italic"
                >
                    AIが考え中...
                </motion.div>
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-slate-800/50 border-t border-white/5 flex gap-2">
                <div className="flex-1 h-8 bg-white/5 rounded-full px-4 flex items-center text-[10px] text-slate-500">
                    メッセージを入力...
                </div>
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                    <Send size={14} />
                </div>
            </div>
        </div>
    );
};

const FEATURED_BOTS = [
    {
        id: '1',
        name: 'デジタル秘書：さくら',
        description: 'スケジュール管理からリサーチまで、多忙なビジネスマンを強力にサポートします。',
        icon: '👩‍💼',
        color: 'from-blue-600 to-indigo-700',
        users: '3.2k+'
    },
    {
        id: '2',
        name: '予約受付：しゅん太',
        description: '飲食店やサロンの空き時間を把握し、人間のようにスムーズな予約応対を行います。',
        icon: '📅',
        color: 'from-emerald-500 to-teal-600',
        users: '1.5k+'
    },
    {
        id: '3',
        name: '採用アシスタント',
        description: '候補者からの質問に24時間答え、面接の自動調整まで完結させます。',
        icon: '🤝',
        color: 'from-amber-500 to-orange-600',
        users: '980'
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

                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-8 border border-blue-100"
                        >
                            <Sparkles size={14} />
                            最新のAIエンジン搭載。ビジネスの自動化をここから。
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
                            className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 mb-12 leading-relaxed"
                        >
                            プログラミングは不要。AIの性格を入力するだけで、<br className="hidden sm:block" />
                            24時間365日働くあなた専属のアシスタントが完成します。
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
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
                            <button
                                onClick={() => document.getElementById('usage-guide')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                使い方を見る
                            </button>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="flex-1 relative w-full mt-12 lg:mt-0"
                    >
                        <div className="absolute inset-0 bg-primary-400/20 blur-[60px] sm:blur-[100px] rounded-full" />
                        <LineChatAnimation />
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
                                <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${bot.color} flex items-center justify-center text-3xl mb-6 shadow-lg shadow-primary-500/10`}>
                                    {bot.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{bot.name}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                    {bot.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center mt-12 hidden">
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
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <Zap size={24} />
                            </div>
                            <h2 className="text-4xl font-bold mb-6 text-slate-900 leading-tight">
                                LINE AIボットを<br />
                                導入する3つのメリット
                            </h2>
                            <div className="space-y-8">
                                {[
                                    { title: '24時間365日の顧客対応', desc: '深夜や休日の問い合わせにもAIが即答。機会損失をゼロにし、顧客満足度を飛躍的に向上させます。' },
                                    { title: '人件費の劇的な削減', desc: '一次対応をAIに任せることで、スタッフはより創造的で重要な業務に集中できるようになります。' },
                                    { title: '高い開封率と成約率', desc: 'メールに比べ圧倒的に開封されやすいLINE。最適なタイミングでの提案で、コンバージョンを最大化します。' }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold mt-1">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                                            <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-500/10 blur-[120px] rounded-full" />
                            <div className="relative bg-white aspect-[4/3] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-8">
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 font-mono">
                                        SYSTEM: あなたは優秀なカスタマーサポートです。
                                    </div>
                                    <div className="flex justify-end">
                                        <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-sm shadow-lg shadow-blue-500/20">
                                            営業時間は？
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="bg-slate-100 text-slate-700 p-3 rounded-2xl rounded-tl-none text-sm animate-pulse">
                                            平日9:00〜18:00となっております...
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    Simulated Admin View
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Usage Guide Section */}
            <section id="usage-guide" className="py-24 px-6 bg-white overflow-hidden relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">かんたん 3ステップで公開</h2>
                        <p className="text-slate-500">専門知識がなくても、以下の手順でボットを稼働させることができます。</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-slate-100 -z-10" />

                        {[
                            { step: '01', title: 'ログインして作成', desc: 'Googleアカウントでログインし、「ボット作成」ボタンをクリックします。' },
                            { step: '02', title: '性格と鍵の設定', desc: 'AIの性格（システムプロンプト）を書き込み、LINEのAPI情報を入力します。' },
                            { step: '03', title: 'URLをコピー＆公開', desc: '表示された専用Webhook URLをLINE側に設定するだけで、運用が開始されます。' }
                        ].map((item, idx) => (
                            <div key={idx} className="text-center group">
                                <div className="w-20 h-20 rounded-full bg-slate-50 group-hover:bg-blue-600 transition-colors flex items-center justify-center border-4 border-white shadow-xl mx-auto mb-6">
                                    <span className="text-2xl font-black text-slate-300 group-hover:text-white">{item.step}</span>
                                </div>
                                <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                                <p className="text-slate-500 text-sm leading-relaxed px-4">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
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
                    <a href="mailto:happystate.inc@gmail.com" className="hover:text-slate-900">お問い合わせ</a>
                </div>
                <p>&copy; 2026 LINE bot studio. All rights reserved.</p>
            </footer>
        </div>
    );
};
