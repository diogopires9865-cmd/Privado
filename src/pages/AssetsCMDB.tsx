// ========================================================================
// SW Service Desk v1.0 - CMDB (Inventário de Equipamentos e Ativos de TI)
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  PlusCircle,
  Search,
  Filter,
  User,
  Laptop,
  Server,
  Wifi,
  Monitor,
  Smartphone,
  Layers,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { Asset } from '../types/index.js';

export function AssetsCMDB() {
  const { user, setActiveView, setSelectedAssetId } = useAuth();
  const toast = useToast();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Formulário de Criação
  const [assetTag, setAssetTag] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('LAPTOP');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [operatingSystem, setOperatingSystem] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const data = await api.getAssets(params);
      setAssets(data);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar equipamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAssets();
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetTag || !serialNumber || !name || !brand || !model) {
      toast.warning('Preencha os campos obrigatórios assinalados.');
      return;
    }

    setCreating(true);
    try {
      await api.createAsset({
        assetTag,
        serialNumber,
        name,
        assetType,
        brand,
        model,
        operatingSystem,
        ipAddress,
        macAddress,
        notes,
      });

      toast.success(`Equipamento ${assetTag} registado em stock com sucesso!`);
      setShowCreateModal(false);
      resetForm();
      loadAssets();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registar equipamento.');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setAssetTag('');
    setSerialNumber('');
    setName('');
    setBrand('');
    setModel('');
    setOperatingSystem('');
    setIpAddress('');
    setMacAddress('');
    setNotes('');
  };

  const handleAssetClick = (id: number) => {
    setSelectedAssetId(id);
    setActiveView('asset-detail');
  };

  const isTechnician = user && ['agent', 'supervisor', 'admin'].includes(user.role);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-purple-600" />
            CMDB & Inventário de Equipamentos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão do ciclo de vida de ativos físicos e virtuais, custódia e histórico forense.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAssets}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isTechnician && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Registar Equipamento
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por Asset Tag (SW-NB-...), Serial Number, Marca ou Modelo..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Pesquisar
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium text-[11px] mr-1">Estado:</span>
          {[
            { label: 'Todos', value: '' },
            { label: 'Em Stock', value: 'EM_STOCK' },
            { label: 'Atribuídos', value: 'ATRIBUIDO' },
            { label: 'Em Reparação', value: 'EM_REPARACAO' },
            { label: 'Abatidos', value: 'ABATIDO' },
          ].map((st) => (
            <button
              key={st.value}
              onClick={() => setStatusFilter(st.value)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                statusFilter === st.value
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {st.label}
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          <span className="text-slate-400 font-medium text-[11px] mr-1">Tipo:</span>
          {[
            { label: 'Todos', value: '' },
            { label: 'Laptops', value: 'LAPTOP' },
            { label: 'Servidores', value: 'SERVER' },
            { label: 'Rede', value: 'NETWORK' },
            { label: 'VMs', value: 'VM' },
          ].map((tp) => (
            <button
              key={tp.value}
              onClick={() => setTypeFilter(tp.value)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                typeFilter === tp.value
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Equipamentos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Asset Tag</th>
                <th className="py-3 px-4">Equipamento & Modelo</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Detentor Atual</th>
                <th className="py-3 px-4">IP / Rede</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    A carregar inventário CMDB...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum equipamento encontrado no inventário.
                  </td>
                </tr>
              ) : (
                assets.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => handleAssetClick(a.id)}
                    className="hover:bg-purple-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700 group-hover:text-purple-900">
                      {a.asset_tag}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{a.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {a.brand} {a.model}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        {a.asset_type === 'LAPTOP' && <Laptop className="w-3.5 h-3.5 text-slate-400" />}
                        {a.asset_type === 'SERVER' && <Server className="w-3.5 h-3.5 text-slate-400" />}
                        {a.asset_type === 'NETWORK' && <Wifi className="w-3.5 h-3.5 text-slate-400" />}
                        {a.asset_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{a.serial_number}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="status" value={a.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      {a.current_user_name ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-900">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{a.current_user_name}</span>
                        </div>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                          Disponível em Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {a.ip_address || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-purple-600 group-hover:translate-x-1 inline-flex items-center transition-transform">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registar Novo Ativo no CMDB */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Registar Equipamento no CMDB (Entrada em Stock)"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Asset Tag *</label>
              <input
                type="text"
                required
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value.toUpperCase())}
                placeholder="Ex: SW-NB-0042 ou SW-SRV-005"
                className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Número de Série (Serial) *</label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Ex: PF-2K90A1"
                className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nome Descritivo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: MacBook Pro 16 M3 Max"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipo de Ativo *</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="LAPTOP">Laptop / Portátil</option>
                <option value="DESKTOP">Desktop / Posto Fixo</option>
                <option value="SERVER">Servidor Físico / Baremetal</option>
                <option value="VM">Máquina Virtual Cloud</option>
                <option value="NETWORK">Switch / Router / Firewall</option>
                <option value="MOBILE">Smartphone / Tablet</option>
                <option value="OTHER">Outro Periférico</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fabricante / Marca *</label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Apple, Lenovo, Dell, Fortinet"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Modelo *</label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: ThinkPad T14s Gen 4"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sistema Operativo</label>
              <input
                type="text"
                value={operatingSystem}
                onChange={(e) => setOperatingSystem(e.target.value)}
                placeholder="Ex: Ubuntu 24.04 LTS ou macOS"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Endereço IP Fixo / Lease</label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="Ex: 10.50.10.42"
                className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notas Adicionais de Entrada</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Especificações de hardware (CPU, RAM, Disco) ou estado físico na receção..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
            >
              {creating ? 'A registar...' : 'Confirmar Entrada em Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
