// ========================================================================
// SW Service Desk v1.0 - Registos Imutáveis de Auditoria de Segurança
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Filter, User, Terminal } from 'lucide-react';
import { api } from '../services/api';

export function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      setLogs(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            Registos de Auditoria & Segurança Forense
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rastreabilidade imutável de todas as mutações de dados, acessos administrativos e operações de serviço.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          title="Atualizar lista"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabela de Auditoria */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Ação Executada</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">ID Recurso</th>
                <th className="py-3 px-4">Endereço IP</th>
                <th className="py-3 px-4 text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    A carregar registos de auditoria...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum registo de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString('pt-PT')}
                    </td>
                    <td className="py-3 px-4">
                      {l.user_name ? (
                        <div>
                          <div className="font-semibold text-slate-900">{l.user_name}</div>
                          <div className="text-[10px] text-slate-400">{l.user_email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sistema / Anónimo</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{l.action}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border">
                        {l.resource_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{l.resource_id || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{l.ip_address}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Ver Payload
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes Forenses */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                Payload Forense do Evento #{selectedLog.id}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-700">Ação:</span> {selectedLog.action}
              </div>
              <div>
                <span className="font-semibold text-slate-700">User-Agent:</span>{' '}
                <span className="font-mono text-slate-600 text-[11px]">{selectedLog.user_agent}</span>
              </div>

              {selectedLog.new_values_json && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Dados Submetidos (Payload):</span>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto max-h-60">
                    {JSON.stringify(JSON.parse(selectedLog.new_values_json), null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
