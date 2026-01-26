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
        } catch (err) {
            alert("ログインに失敗しました。Firebaseの設定を確認してください。");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#071426] p-6 text-white font-['Inter']">
            {/* Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-600/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-700" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-blue-600" />

                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-lg shadow-primary-500/20">
                            LB
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 underline underline-offset-8 decoration-primary-500/30">LINEボットスタジオ</h1>
                        <p className="text-slate-400">Googleアカウントで安全にログイン</p>
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full group relative flex items-center justify-center gap-4 bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-white/5 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                            ) : (
                                <>
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                    <span>Googleでログイン</span>
                                </>
                            )}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0b1d33] px-2 text-slate-500">Security First</span></div>
                        </div>

                        <p className="text-[11px] text-center text-slate-500 leading-relaxed px-4">
                            Googleでログインすることで、<br />
                            あなたのボット設定はあなただけが管理できます。
                        </p>
                    </div>

                    <div className="mt-8 text-center border-t border-white/5 pt-8">
                        <p className="text-sm text-slate-400">
                            お困りの方は <button className="text-primary-500 font-bold hover:text-primary-400">サポート</button> まで
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
