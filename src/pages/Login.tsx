import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

import { motion } from 'framer-motion';

export const Login = () => {
    const { loginWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await loginWithGoogle();
        } catch (err: any) {
            console.error(err);
            alert(`ログインに失敗しました。\nエラー内容: ${err.message || err.code || '不明なエラー'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-['Inter'] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-100/50 rounded-full blur-[100px]" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-100/50 rounded-full blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-500 via-blue-500 to-emerald-500" />

                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-600 to-blue-600 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-8 shadow-2xl shadow-primary-500/30"
                        >
                            LB
                        </motion.div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tighter whitespace-nowrap">
                            LINEボットスタジオ
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Googleアカウントで安全にログイン</p>
                    </div>

                    <div className="space-y-8">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full group relative flex items-center justify-center gap-4 bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 px-6 rounded-2xl transition-all border border-slate-200 hover:border-slate-300 hover:shadow-lg shadow-sm active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                            ) : (
                                <>
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                    <span className="text-base">Googleでログイン</span>
                                </>
                            )}
                        </button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center px-4"><div className="w-full border-t border-slate-100"></div></div>
                            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400"><span className="bg-white px-3">Security & Privacy</span></div>
                        </div>

                        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                            <p className="text-[11px] text-center text-slate-500 leading-relaxed font-medium">
                                ログインすることで、あなた専用の<br />
                                セキュアな管理環境が作成されます。<br />
                                第三者に設定が公開されることはありません。
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 text-center pt-8 border-t border-slate-50">
                        <p className="text-xs text-slate-400 font-medium">
                            お困りの方は <button className="text-primary-600 font-bold hover:underline decoration-2">サポート窓口</button> まで
                        </p>
                    </div>
                </div>

                <p className="text-center mt-8 text-slate-400 text-xs font-bold tracking-widest uppercase">
                    &copy; 2026 LINE bot studio
                </p>
            </motion.div>
        </div>
    );
};
