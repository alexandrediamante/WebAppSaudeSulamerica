import React, { useState } from 'react';
import { Receipt, ChevronDown, Calendar, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { formatCur, formatMonthLabel } from '../../utils/formatters';

const BoletoHistory = ({ history, currentMonth, onSelectMonth, currentBoletoDados, onDeleteMonth }) => {
  const [deletingMonth, setDeletingMonth] = useState(null);
  // Ordena todo o histórico por mês (mais recente primeiro)
  const historicoOrdenado = [...history].sort((a, b) => {
    if (a.monthYear < b.monthYear) return 1;
    if (a.monthYear > b.monthYear) return -1;
    return 0;
  });

  const handleDeleteClick = (e, monthYear) => {
    e.stopPropagation();
    setDeletingMonth(monthYear);
  };

  const handleConfirmDelete = async () => {
    if (deletingMonth) {
      await onDeleteMonth(deletingMonth);
      setDeletingMonth(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingMonth(null);
  };

  const hasBoleto = (item) => {
    // Check if boleto exists in history
    if (item.boleto && item.boleto.valorCobrado) return true;
    // Check if current month has boleto data in state but not yet saved to history
    if (item.monthYear === currentMonth && currentBoletoDados !== null) return true;
    return false;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
          <Calendar size={16} className="text-indigo-500" />
          Navegador de Meses
        </h3>
      </div>

      {/* Lista de meses */}
      <div className="max-h-64 overflow-y-auto">
        {historicoOrdenado.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-sm">
            Nenhum histórico disponível
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {historicoOrdenado.map((item) => {
              const isSelected = item.monthYear === currentMonth;
              const temBoleto = hasBoleto(item);

              return (
                <button
                  key={item.monthYear}
                  onClick={() => onSelectMonth(item.monthYear)}
                  className={`group w-full px-4 py-3 flex items-center justify-between transition-all hover:bg-slate-50 ${
                    isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Indicador de boleto */}
                    {temBoleto ? (
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Receipt size={14} className="text-emerald-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Circle size={14} className="text-slate-300" />
                      </div>
                    )}

                    <div className="text-left">
                      <span className={`block font-semibold text-sm ${
                        isSelected ? 'text-indigo-700' : 'text-slate-700'
                      }`}>
                        {formatMonthLabel(item.monthYear)}
                      </span>
                      <span className={`text-xs ${
                        temBoleto ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {temBoleto 
                          ? `Boleto: ${formatCur(item.boleto?.valorCobrado || currentBoletoDados?.valorCobrado)}` 
                          : 'Sem boleto importado'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Indicador de seleção ou botão de delete */}
                  {isSelected ? (
                    <CheckCircle2 size={18} className="text-indigo-500" />
                  ) : (
                    <button
                      onClick={(e) => handleDeleteClick(e, item.monthYear)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-600"
                      title="Excluir mês"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer com resumo */}
      {historicoOrdenado.length > 0 && (
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>{historicoOrdenado.length} meses no histórico</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            {historicoOrdenado.filter(h => hasBoleto(h)).length} com boleto
          </span>
        </div>
      )}

      {/* Modal de confirmação */}
      {deletingMonth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="font-bold text-slate-800">Confirmar exclusão</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Tem certeza que deseja excluir os dados de{' '}
              <span className="font-semibold text-slate-800">
                {formatMonthLabel(deletingMonth)}
              </span>
              ? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoletoHistory;
