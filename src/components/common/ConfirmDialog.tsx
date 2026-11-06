// ========================================================================
// SW Service Desk v1.0 - Diálogo de Confirmação Humana Obrigatória
// Empresa: SW Cloud Solutions
// ========================================================================

import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Modal } from './Modal.js';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isAiAction?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar Ação',
  cancelLabel = 'Cancelar',
  isDestructive = false,
  isAiAction = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-full shrink-0 ${
              isDestructive
                ? 'bg-rose-100 text-rose-600'
                : isAiAction
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-amber-100 text-amber-600'
            }`}
          >
            {isAiAction ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
            {isAiAction && (
              <div className="mt-2 text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 rounded p-2">
                <strong>Salvaguarda de IA da SW Cloud Solutions:</strong> Nenhuma alteração é aplicada diretamente ao ticket ou ativo sem a sua validação e clique de confirmação expressa.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 mt-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-xs transition-colors ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-500'
                : isAiAction
                ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
