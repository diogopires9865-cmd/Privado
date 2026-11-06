// ========================================================================
// SW Service Desk v1.0 - Configurações Administrativas, SLAs e Backups
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Database,
  ShieldCheck,
  PlusCircle,
  Download,
  Upload,
  RefreshCw,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { Modal } from '../components/common/Modal.js';
import { Badge } from '../components/common/Badge.js';
import { SLAPolicy } from '../types/index.js';

export function Settings() {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'sla' | 'backups' | '2fa'>('users');

  // Estado Utilizadores
  const [usersList, setUsersList] = useState<any[]>([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');

  // Estado SLA
  const [slaPolicies, setSlaPolicies] = useState<SLAPolicy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<SLAPolicy | null>(null);
  const [firstRespMin, setFirstRespMin] = useState(60);
  const [resolMin, setResolMin] = useState(480);

  // Estado Backups
  const [backups, setBackups] = useState<any[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreSql, setRestoreSql] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Estado 2FA
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [secretBase32, setSecretBase32] = useState<string | null>(null);
  const [twoFactorCodeInput, setTwoFactorCodeInput] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    loadUsers();
    loadSla();
    loadBackups();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsersList(data);
    } catch {}
  };

  const loadSla = async () => {
    try {
      const data = await api.getSLAPolicies();
      setSlaPolicies(data);
    } catch {}
  };

  const loadBackups = async () => {
    try {
      const data = await api.getBackups();
      setBackups(data);
    } catch {}
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        email: newUserEmail,
        password: newUserPassword,
        fullName: newUserFullName,
        role: newUserRole,
      });
      toast.success('Utilizador criado com sucesso.');
      setShowCreateUserModal(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar utilizador.');
    }
  };

  const handleSaveSlaPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) return;
    try {
      await api.updateSLAPolicy(selectedPolicy.id, {
        firstResponseMinutes: Number(firstRespMin),
        resolutionMinutes: Number(resolMin),
        businessHoursOnly: selectedPolicy.business_hours_only === 1,
        isActive: 1,
      });
      toast.success('Política de SLA atualizada.');
      setSelectedPolicy(null);
      loadSla();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar SLA.');
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.createBackup();
      toast.success(res.message);
      loadBackups();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar backup.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreSql.trim()) return;
    try {
      const res = await api.restoreBackup(restoreSql.trim());
      toast.success(res.message);
      setShowRestoreModal(false);
      setRestoreSql('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao restaurar backup.');
    }
  };

  const handleStart2FASetup = async () => {
    try {
      const res = await api.setup2FA();
      setQrCodeData(res.qrCode);
      setSecretBase32(res.secret);
      setRecoveryCodes(res.recoveryCodes || []);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao configurar 2FA.');
    }
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.verify2FA(twoFactorCodeInput.trim());
      toast.success('Autenticação de dois fatores ativada com sucesso!');
      setQrCodeData(null);
      setTwoFactorCodeInput('');
      refreshProfile();
    } catch (err: any) {
      toast.error(err.message || 'Código 2FA inválido.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Painel de Configurações Administrativas
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gestão de acessos RBAC, calendários operacionais de SLA, backups de base de dados e segurança 2FA.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 text-xs">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'users'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Utilizadores & Equipas
        </button>

        <button
          onClick={() => setActiveTab('sla')}
          className={`pb-3 px-4 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'sla'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" /> Políticas de SLA
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`pb-3 px-4 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'backups'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" /> Backups & Restauro
        </button>

        <button
          onClick={() => setActiveTab('2fa')}
          className={`pb-3 px-4 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === '2fa'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Segurança 2FA Pessoal
        </button>
      </div>

      {/* TAB 1: Utilizadores */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-700">Utilizadores Registados ({usersList.length})</span>
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <PlusCircle className="w-4 h-4" /> Criar Utilizador
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Nome Completo</th>
                  <th className="py-2.5 px-4">Email Corporativo</th>
                  <th className="py-2.5 px-4">Papel (RBAC)</th>
                  <th className="py-2.5 px-4">Departamento</th>
                  <th className="py-2.5 px-4">2FA</th>
                  <th className="py-2.5 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{u.full_name}</td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="role" value={u.role} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.department_name || '-'}</td>
                    <td className="py-3 px-4">
                      {u.two_factor_enabled === 1 ? (
                        <span className="text-emerald-700 font-semibold">Ativo</span>
                      ) : (
                        <span className="text-slate-400">Inativo</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.is_active === 1 ? (
                        <span className="text-emerald-600 font-semibold">Ativo</span>
                      ) : (
                        <span className="text-rose-600">Inativo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Políticas de SLA */}
      {activeTab === 'sla' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slaPolicies.map((p) => (
              <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <Badge variant="priority" value={p.priority} />
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {p.business_hours_only === 1 ? 'Horário 8x5 Útil' : 'Ininterrupto 24x7'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                <p className="text-slate-600">{p.description}</p>

                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Primeira Resposta:</span>
                    <span className="font-bold text-slate-800">{p.first_response_minutes} minutos</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Tempo de Resolução:</span>
                    <span className="font-bold text-slate-800">{p.resolution_minutes} minutos ({p.resolution_minutes / 60}h)</span>
                  </div>
                </div>

                {user?.role !== 'user' && (
                  <button
                    onClick={() => {
                      setSelectedPolicy(p);
                      setFirstRespMin(p.first_response_minutes);
                      setResolMin(p.resolution_minutes);
                    }}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                  >
                    Ajustar Prazos de SLA
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Backups & Restauro */}
      {activeTab === 'backups' && (
        <div className="space-y-5">
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <strong>Cópias de Segurança da Base de Dados (MySQL / MariaDB):</strong>
              <p className="mt-0.5 text-sky-800">
                Gera um snapshot consistente contendo todo o esquema DDL e os dados de todas as 21 tabelas relacionais.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleCreateBackup}
                disabled={backupLoading}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {backupLoading ? 'A gerar...' : 'Gerar Novo Backup'}
              </button>
              <button
                onClick={() => setShowRestoreModal(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-xs flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" /> Restaurar Backup
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 font-bold text-xs text-slate-900 border-b border-slate-100">
              Snapshots de Backup Disponíveis ({backups.length})
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Nome do Ficheiro</th>
                  <th className="py-2.5 px-4">Dimensão</th>
                  <th className="py-2.5 px-4">Data de Criação</th>
                  <th className="py-2.5 px-4 text-right">Descarregar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backups.map((b) => (
                  <tr key={b.filename} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{b.filename}</td>
                    <td className="py-3 px-4 text-slate-600">{Math.round(b.sizeBytes / 1024)} KB</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(b.createdAt).toLocaleString('pt-PT')}</td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/api/v1/admin/backups/${b.filename}`}
                        download
                        className="text-sky-600 hover:text-sky-800 font-semibold"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Segurança 2FA */}
      {activeTab === '2fa' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 max-w-xl text-xs">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">Autenticação de Dois Fatores (TOTP RFC 6238)</h2>
          </div>

          <p className="text-slate-600 leading-relaxed">
            Proteja a sua conta corporativa exigindo um código de autenticação único de 6 dígitos gerado pela sua aplicação (Microsoft Authenticator ou Google Authenticator) em cada início de sessão.
          </p>

          {user?.twoFactorEnabled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                O 2FA está ATIVADO na sua conta.
              </div>
              <p className="text-[11px] text-emerald-800">
                A sua palavra-passe e o código TOTP são validados a cada início de sessão para garantir a segurança dos acessos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {!qrCodeData ? (
                <button
                  onClick={handleStart2FASetup}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  Configurar 2FA Agora
                </button>
              ) : (
                <form onSubmit={handleConfirm2FA} className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-center">
                    <span className="font-bold text-slate-800 block mb-2">1. Leia este código QR com a sua aplicação de autenticação:</span>
                    <img src={qrCodeData} alt="QR Code 2FA" className="mx-auto border p-2 bg-white rounded-lg shadow-xs" />
                    <span className="text-[11px] font-mono text-slate-500 mt-2 block">Chave manual: {secretBase32}</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      2. Introduza o código de 6 dígitos gerado para confirmar:
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={twoFactorCodeInput}
                      onChange={(e) => setTwoFactorCodeInput(e.target.value)}
                      placeholder="123456"
                      className="w-full p-2.5 text-center font-mono text-sm border border-slate-300 rounded-lg bg-white tracking-widest"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-xs"
                  >
                    Ativar 2FA na Minha Conta
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Ajustar SLA */}
      <Modal isOpen={!!selectedPolicy} onClose={() => setSelectedPolicy(null)} title="Ajustar Prazos de SLA" maxWidth="sm">
        <form onSubmit={handleSaveSlaPolicy} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Primeira Resposta (Minutos)</label>
            <input
              type="number"
              min={5}
              required
              value={firstRespMin}
              onChange={(e) => setFirstRespMin(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Resolução Definitiva (Minutos)</label>
            <input
              type="number"
              min={30}
              required
              value={resolMin}
              onChange={(e) => setResolMin(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setSelectedPolicy(null)} className="px-3 py-1.5 text-slate-600">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-1.5 bg-sky-600 text-white font-semibold rounded-lg">
              Guardar SLA
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Restaurar Backup */}
      <Modal isOpen={showRestoreModal} onClose={() => setShowRestoreModal(false)} title="Restauro de Base de Dados SQL" maxWidth="lg">
        <form onSubmit={handleRestore} className="space-y-3 text-xs">
          <p className="text-slate-600">
            Cole abaixo o conteúdo do snapshot SQL de backup gerado pelo sistema:
          </p>
          <textarea
            required
            rows={10}
            value={restoreSql}
            onChange={(e) => setRestoreSql(e.target.value)}
            placeholder="INSERT INTO ..."
            className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg"
          />
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setShowRestoreModal(false)} className="px-3 py-1.5 text-slate-600">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-500">
              Executar Restauro
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Criar Utilizador */}
      <Modal isOpen={showCreateUserModal} onClose={() => setShowCreateUserModal(false)} title="Criar Novo Utilizador (RBAC)" maxWidth="sm">
        <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              value={newUserFullName}
              onChange={(e) => setNewUserFullName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Corporativo *</label>
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Palavra-passe Inicial *</label>
            <input
              type="password"
              required
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Papel de Acesso *</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="user">Utilizador / Colaborador Comum</option>
              <option value="agent">Técnico de Suporte Cloud (Agent)</option>
              <option value="supervisor">Supervisor ITSM / Coordenador</option>
              <option value="admin">Administrador de Sistema (Admin)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setShowCreateUserModal(false)} className="px-3 py-1.5 text-slate-600">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-1.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500">
              Criar Utilizador
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
