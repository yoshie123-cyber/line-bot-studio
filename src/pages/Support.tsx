import {
    Mail,
    BookOpen
} from 'lucide-react';

export const Support = () => {
    const steps = [
        { title: '1. LINE情報の取得', detail: 'LINE Developersコンソールから「Channel Secret」と「アクセストークン」をコピーします。' },
        { title: '2. Gemini APIキーの取得', detail: 'Google AI StudioからAPIキーを発行してコピーします。' },
        { title: '3. ボットの設定', detail: '本ツールの「ボット編集」画面に取得した3つの情報を入力して「保存」をクリックします。' },
        { title: '4. Webhook URLの設定', detail: '編集画面に表示される「Webhook URL」をコピーし、LINE Developersの「Webhook URL」欄に貼り付けて保存します。' },
        { title: '5. Webhookを有効化', detail: 'LINE Developers画面で「Webhookの利用」をONにします。' },
        { title: '6. 動作確認', detail: '公式アカウントにメッセージを送信し、AIから返信が来れば完了です！' }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">スタートアップガイド</h2>
                <p className="text-slate-500">ボットを動かすための手順をまとめました。</p>
            </div>

            <section className="glass rounded-2xl overflow-hidden shadow-sm border border-slate-200/50">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="font-bold flex items-center gap-2">
                        <BookOpen size={18} className="text-primary-600" />
                        導入手順
                    </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {steps.map((step, i) => (
                        <div key={i} className="p-6">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{step.title}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">{step.detail}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="glass p-8 rounded-2xl text-center space-y-4 border border-primary-100/50 bg-primary-50/10">
                <div className="p-3 bg-primary-500/10 rounded-full w-fit mx-auto text-primary-600">
                    <Mail size={24} />
                </div>
                <div className="space-y-1">
                    <h3 className="font-bold text-lg">解決しない場合はこちら</h3>
                    <p className="text-slate-500 text-sm">
                        設定方法がわからない、不具合があるなどの場合は下記メールアドレスまでお気軽にご連絡ください。
                    </p>
                </div>
                <a
                    href="mailto:happystate.inc@gmail.com"
                    className="inline-block font-mono font-bold text-primary-600 text-lg hover:underline transition-all"
                >
                    happystate.inc@gmail.com
                </a>
            </div>
        </div>
    );
};
