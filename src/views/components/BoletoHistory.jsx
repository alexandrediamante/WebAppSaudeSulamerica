import React from 'react';
import { Receipt, ChevronDown } from 'lucide-react';
import { formatCur, formatMonthLabel } from '../../utils/formatters';

const BoletoHistory = ({ history, currentMonth, onSelectMonth }) => {
  // Filtra apenas os items que têm campo boleto com dados
  const boletosImportados = history.filter(item => item.boleto && item.boleto.valorCobrado);

  // Se não há boletos importados, não renderiza nada
  if (boletosImportados.length === 0) {
    return null;
  }

  // Ordena por mês (mais recente primeiro)
  const boletosOrdenados = [...boletosImportados].sort((a, b) => {
    if (a.monthYear < b.monthYear) return 1;
    if (a.monthYear > b.monthYear) return -1;
    return 0;
  });

  const handleChange = (e) => {
    const selectedMonth = e.target.value;
    if (selectedMonth) {
      onSelectMonth(selectedMonth);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="bg-slate-50 p-2 rounded-xl flex items-center gap-3 border border-slate-100">
        <Receipt className="text-indigo-500 ml-2" size={20} />
        <div className="relative">
          <select
            value={currentMonth}
            onChange={handleChange}
            className="appearance-none bg-transparent font-bold text-slate-700 outline-none py-1 pl-1 pr-8 cursor-pointer min-w-[200px]"
          >
            <option value="">Boletos Importados</option>
            {boletosOrdenados.map((item) => (
              <option key={item.monthYear} value={item.monthYear}>
                {formatMonthLabel(item.monthYear)} - {formatCur(item.boleto.valorCobrado)} - Cod: {item.boleto.codigoBarras ? item.boleto.codigoBarras.substring(0, 8) : 'N/A'}...
              </option>
            ))}
          </select>
          <ChevronDown 
            className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
            size={16} 
          />
        </div>
      </div>
    </div>
  );
};

export default BoletoHistory;
