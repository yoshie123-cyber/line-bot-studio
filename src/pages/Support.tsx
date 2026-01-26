import {
    HelpCircle,
    MessageCircle,
    Mail,
    BookOpen,
    ChevronRight
} from 'lucide-react';

export const Support = () => {
    const faqs = [
        { q: 'LINE連携がうまくいきません', a: 'Messaging APIのチャネルアクセストークン（長期）が正しく入力されているか確認してください。' },
        { q: 'AIの応答が遅いです', a: 'モデルによって応答速度が異なります。GPT-3.5 Turboは高速ですが、GPT-4oなどは少し時間がかかる場合があります。' },
        { q: 'Webhook URLはどこに設定しますか？', a: 'LINE Developersコンソールの「Messaging API設定」タブ内にあるWebhook URL欄に貼り付けてください。' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">サポートセンター</h2>
                <p className="text-slate-500">お困りの際はこちらのヘルプをご確認いただくか、直接お問い合わせください。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { icon: BookOpen, label: 'ドキュメント', desc: '詳細な使い方ガイド' },
                    { icon: MessageCircle, label: 'チャット相談', desc: 'オペレーターに相談' },
                    { icon: Mail, label: 'メール', desc: '24時間受付' },
                ].map((item, i) => (
                    <div key={i} className="glass p-6 rounded-2xl hover:border-primary-500/50 transition-all cursor-pointer group">
                        <div className="p-3 bg-primary-500/10 rounded-xl w-fit mb-4 text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                            <item.icon size={24} />
                        </div>
                        <h3 className="font-bold mb-1">{item.label}</h3>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                ))}
            </div>

            <section className="glass rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="font-bold flex items-center gap-2">
                        <HelpCircle size={18} className="text-primary-600" />
                        よくある質問 (FAQ)
                    </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {faqs.map((faq, i) => (
                        <div key={i} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200">{faq.q}</h4>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="text-center">
                <button className="text-sm font-medium text-slate-400 hover:text-primary-500 transition-colors">
                    さらに表示する
                </button>
            </div>
        </div>
    );
};
