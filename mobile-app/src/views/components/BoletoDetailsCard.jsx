import React, { useState } from 'react';
import { FileText, Copy, Check, Calendar, Building2, User, Receipt, Upload } from 'lucide-react';
import { formatCur, formatMonthLabel } from '../../utils/formatters';

const BoletoDetailsCard = ({ boletoData, currentMonth }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyBarcode = () => {
    if (boletoData?.codigoBarras) {
      // Remove espaços, pontos e hífens para copiar versão limpa
      const cleanBarcode = boletoData.codigoBarras.replace(/[\s.\-]/g, '');
      navigator.clipboard.writeText(cleanBarcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isVencido = (vencimento) => {
    if (!vencimento) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    // Handle YYYY-MM-DD format by parsing it as local date
    const [year, month, day] = vencimento.split('-').map(Number);
    const vencimentoDate = new Date(year, month - 1, day);
    return vencimentoDate < hoje;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Handle ISO 8601 datetime strings (e.g., "2026-04-15T14:30:45.123Z")
    if (dateString.includes('T')) {
      return new Date(dateString).toLocaleDateString('pt-BR');
    }
    // Handle YYYY-MM-DD format by parsing it as local date
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
    }
    // Fallback for any other format
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Estado sem dados do boleto
  if (!boletoData) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-slate-200 p-6">
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Receipt className="text-slate-300" size={28} />
          </div>
          <h3 className="text-slate-600 font-semibold mb-2">
            Nenhum boleto importado para este mês
          </h3>
          <p className="text-slate-400 text-sm">
            Importe um boleto PDF acima para ver os detalhes aqui
          </p>
        </div>
      </div>
    );
  }

  const vencido = isVencido(boletoData.vencimento);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Detalhes do Boleto</h3>
              <span className="text-emerald-100 text-xs font-medium">
                Importado em {formatDate(boletoData.importadoEm)}
              </span>
            </div>
          </div>
          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
            {formatMonthLabel(currentMonth)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        {/* Valor Cobrado */}
        <div className="text-center pb-5 border-b border-slate-100">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            Valor Cobrado
          </span>
          <div className="text-3xl font-black text-emerald-600 mt-1">
            {formatCur(boletoData.valorCobrado)}
          </div>
        </div>

        {/* Vencimento */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${vencido ? 'bg-red-50' : 'bg-emerald-50'}`}>
            <Calendar className={vencido ? 'text-red-500' : 'text-emerald-500'} size={18} />
          </div>
          <div className="flex-1">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              Vencimento
            </span>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${vencido ? 'text-red-600' : 'text-slate-700'}`}>
                {formatDate(boletoData.vencimento)}
              </span>
              {vencido && (
                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Vencido
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Código de Barras */}
        <div>
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            Código de Barras
          </span>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs text-slate-600 truncate">
              {boletoData.codigoBarras || '-'}
            </div>
            {boletoData.codigoBarras && (
              <button
                onClick={handleCopyBarcode}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  copied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copiar
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Beneficiário e Pagador */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="text-indigo-500" size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                Beneficiário
              </span>
              <p className="text-slate-700 text-sm font-medium truncate">
                {boletoData.beneficiario || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="text-amber-500" size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                Pagador
              </span>
              <p className="text-slate-700 text-sm font-medium truncate">
                {boletoData.pagador || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoletoDetailsCard;
