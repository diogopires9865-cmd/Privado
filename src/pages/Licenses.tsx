// ========================================================================
// SW Service Desk v1.0 - Gestão de Software e Licenças
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  Key,
  PlusCircle,
  HardDrive,
  User,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { Modal } from '../components/common/Modal.js';
import { SoftwareLicense } from '../types/index.js';

export function Licenses() {
  const { user } = useAuth();
  const toast = useToast();

  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<SoftwareLicense | null>(null);

  // Formulário de Criação
  const [softwareName, setSoftwareName] = useState('');
  const [vendor, setVendor] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseType, setLicenseType] = useState('SUBSCRIPTION');
  const [totalSeats, setTotalSeats] = useState(5);
  const [expirationDate, setExpirationDate] = useState('');
  const [costPerSeat, setCostPerSeat] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState('');

  // Formulário de Alocação
  const [assetsList, setAssetsList] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const data = await api.getLicenses();
      setLicenses(data);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar licenças.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
    api.getAssets().then(setAssetsList).catch(() => {});
  }, []);

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLicense({
        softwareName,
        vendor,
        licenseKey,
        licenseType,
        totalSeats: Number(totalSeats),
        expirationDate,
        costPerSeat: costPerSeat ? Number(costPerSeat) : null,
        purchaseOrder,
      });

      toast.success('Licença registada com sucesso.');
      setShowCreateModal(false);
      loadLicenses();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registar licença.');
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicense || !selectedAssetId) return;

    try {
      await api.allocateLicense(selectedLicense.id, {
        assetId: Number(selectedAssetId),
      });

      toast.success('Licença associada ao equipamento com sucesso.');
      setShowAllocateModal(false);
      loadLicenses();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alocar licença.');
    }
  };

  const isSupervisorOrAdmin = user && ['supervisor', 'admin'].includes(user.role);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-500" />
            Software & Licenciamento Corporativo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controlo de assentos, conformidade de subscrições e alocação de chaves a computadores da empresa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLicenses}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isSupervisorOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Adicionar Licença
            </button>
          )}
        </div>
      </div>

      {/* Grid de Licenças */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {licenses.map((lic) => {
          const used = lic.real_allocated_seats ?? lic.allocated_seats;
          const pct = Math.min(100, Math.round((used / lic.total_seats) * 100));

          return (
            <div
              key={lic.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                    <Key className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border">
                    {lic.license_type}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug">{lic.software_name}</h3>
                <div className="text-xs text-slate-500">{lic.vendor}</div>

                {lic.license_key && (
                  <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono text-slate-700 truncate">
                    Chave: {lic.license_key}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                {/* Barra de Ocupação de Assentos */}
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-slate-500">Ocupação de Assentos:</span>
                    <span className="font-bold text-slate-800">
                      {used} / {lic.total_seats} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {lic.expiration_date && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Validade: {new Date(lic.expiration_date).toLocaleDateString('pt-PT')}</span>
                  </div>
                )}

                {isSupervisorOrAdmin && (
                  <button
                    onClick={() => {
                      setSelectedLicense(lic);
                      setShowAllocateModal(true);
                    }}
                    disabled={used >= lic.total_seats}
                    className="w-full py-1.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 rounded-lg font-semibold transition-all text-xs disabled:opacity-40"
                  >
                    {used >= lic.total_seats ? 'Capacidade Esgotada' : 'Alocar a Equipamento'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Adicionar Licença */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Adicionar Licença de Software" maxWidth="md">
        <form onSubmit={handleCreateLicense} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Software *</label>
            <input
              type="text"
              required
              value={softwareName}
              onChange={(e) => setSoftwareName(e.target.value)}
              placeholder="Ex: Microsoft 365 E5 ou JetBrains All Products"
              className="w-full p-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fabricante / Fornecedor *</label>
              <input
                type="text"
                required
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Ex: Microsoft"
                className="w-full p-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipo de Licença</label>
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="SUBSCRIPTION">Subscrição (Anual/Mensal)</option>
                <option value="PERPETUAL">Perpétua</option>
                <option value="ENTERPRISE">Enterprise Agreement</option>
                <option value="OEM">OEM</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total de Assentos (Seats) *</label>
              <input
                type="number"
                min={1}
                required
                value={totalSeats}
                onChange={(e) => setTotalSeats(Number(e.target.value))}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data de Expiração</label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chave de Ativação / Serial Key</label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="Ex: XXXX-XXXX-XXXX-XXXX"
              className="w-full p-2 font-mono text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-xs"
            >
              Guardar Licença
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Alocar Licença a Equipamento */}
      <Modal isOpen={showAllocateModal} onClose={() => setShowAllocateModal(false)} title="Vincular Licença a Equipamento" maxWidth="sm">
        {selectedLicense && (
          <form onSubmit={handleAllocate} className="space-y-3 text-xs">
            <p className="text-slate-600">
              Vincular assento da licença <strong>{selectedLicense.software_name}</strong>:
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Equipamento Destino *</label>
              <select
                required
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Selecione o equipamento...</option>
                {assetsList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.asset_tag} - {a.name} ({a.current_user_name || 'Em Stock'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAllocateModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-500 shadow-xs"
              >
                Confirmar Alocação
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
