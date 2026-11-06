// ========================================================================
// SW Service Desk v1.0 - Catálogo de Serviços e Pedidos Padronizados
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Shield,
  Server,
  Laptop,
  Key,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { Modal } from '../components/common/Modal.js';
import { Badge } from '../components/common/Badge.js';
import { ServiceCatalogItem } from '../types/index.js';

export function ServiceCatalog() {
  const { setActiveView, setSelectedTicketId } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ServiceCatalogItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await api.getCatalogItems();
        setItems(data);
      } catch (err) {
        console.error('Erro ao carregar catálogo:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const handleOpenItem = (item: ServiceCatalogItem) => {
    setSelectedItem(item);
    setFormData({});
    setJustification('');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      const res = await api.submitCatalogRequest(selectedItem.id, {
        formData,
        justification,
      });

      toast.success(res.message);
      setSelectedItem(null);
      setSelectedTicketId(res.ticketId);
      setActiveView('ticket-detail');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao submeter pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const getServiceIcon = (icon: string) => {
    switch (icon) {
      case 'shield':
        return <Shield className="w-6 h-6 text-emerald-600" />;
      case 'server':
        return <Server className="w-6 h-6 text-sky-600" />;
      case 'laptop':
        return <Laptop className="w-6 h-6 text-purple-600" />;
      case 'key':
        return <Key className="w-6 h-6 text-amber-600" />;
      default:
        return <FolderOpen className="w-6 h-6 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-sky-600" />
          Catálogo de Serviços Internos de TI
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Solicite serviços padronizados de infraestrutura cloud, equipamentos e software corporativo para colaboradores internos da SW Cloud Solutions.
        </p>
      </div>

      {/* Grid de Serviços do Catálogo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleOpenItem(item)}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-sky-50 transition-colors">
                  {getServiceIcon(item.icon)}
                </div>
                <div className="flex items-center gap-1.5">
                  {item.requires_approval === 1 ? (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Requer Aprovação
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Atendimento Direto
                    </span>
                  )}
                  <Badge variant="priority" value={item.default_priority} />
                </div>
              </div>

              <h3 className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
                {item.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">{item.category_name}</span>
              <span className="font-semibold text-sky-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Solicitar Serviço <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Formulário Dinâmico */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? `Solicitar: ${selectedItem.name}` : ''}
        maxWidth="lg"
      >
        {selectedItem && (
          <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-slate-600">{selectedItem.description}</p>
              {selectedItem.requires_approval === 1 && (
                <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 font-medium">
                  Este pedido será submetido à aprovação de um supervisor antes de ser executado pela equipa técnica.
                </div>
              )}
            </div>

            {/* Campos Dinâmicos do Formulário */}
            {selectedItem.form_schema?.fields?.map((field) => (
              <div key={field.name}>
                <label className="block font-semibold text-slate-700 mb-1">
                  {field.label} {field.required && '*'}
                </label>
                {field.type === 'select' ? (
                  <select
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Selecione uma opção...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'date' ? (
                  <input
                    type="date"
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                  </input>
                ) : (
                  <input
                    type="text"
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={`Indique ${field.label.toLowerCase()}...`}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
                  />
                )}
              </div>
            ))}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Justificação do Pedido *
              </label>
              <textarea
                required
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Indique a justificação operacional ou projeto a que se destina este serviço..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'A submeter...' : 'Confirmar e Submeter'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
