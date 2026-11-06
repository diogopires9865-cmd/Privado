// ========================================================================
// SW Service Desk v1.0 - Ecrã de Login Seguro com Suporte a 2FA
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState } from 'react';
import { Cloud, Lock, Mail, KeyRound, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

export function Login() {
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password, requires2FA ? twoFactorCode : undefined);
      if (res.requires2FA) {
        setRequires2FA(true);
        toast.info('Introduza o código de 6 dígitos gerado pela sua aplicação de autenticação.');
      } else {
        toast.success(`Bem-vindo, ${res.user?.fullName}!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logótipo e Cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 text-white shadow-xl shadow-sky-600/30 mb-4">
            <Cloud className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SW Service Desk Interno</h1>
          <p className="text-xs text-sky-400 font-medium tracking-wide mt-1 uppercase">
            SW Cloud Solutions &bull; Portal Interno de Atendimento
          </p>
        </div>

        {/* Cartão de Autenticação */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Corporativo</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="utilizador@swcloudsolutions.pt"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Palavra-passe</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {requires2FA && (
              <div className="animate-in fade-in duration-200 p-3 bg-sky-950/40 border border-sky-800/60 rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  Código de Autenticação 2FA (TOTP)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono tracking-widest bg-slate-950 border border-sky-700/80 rounded-lg text-white placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Insira o código de 6 dígitos da sua aplicação de autenticação (ex.: Microsoft Authenticator).
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 disabled:opacity-50"
            >
              {loading ? (
                'A validar credenciais...'
              ) : requires2FA ? (
                <>
                  Validar Código 2FA <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Iniciar Sessão Segura <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Rodapé de Segurança */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Protegido com Bcrypt (salt 12) &bull; Sessões JWT com revogação remota</span>
        </div>
      </div>
    </div>
  );
}
