import React from 'react';
import { BarChart3, History, MousePointerClick } from 'lucide-react';
import { formatCur } from '../../utils/formatters';

const HistoricoChart = ({ history, currentMonth, maxChartValue, totalBoleto, onSelectMonth }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                <BarChart3 size={18} className="text-indigo-500" />
                Histórico de Faturamento Anual
            </h3>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <MousePointerClick size={12} />
                Clique para selecionar
            </span>
        </div>
        
        {history.length === 0 ? (
            <div className="h-48 flex items-center justify-center flex-col text-slate-400">
                <History size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">Nenhum histórico salvo ainda.</p>
                <p className="text-xs">Clique em "Gravar Mês" para iniciar seu histórico.</p>
            </div>
        ) : (
            <div className="pt-16">
              <div className="overflow-x-auto pb-2">
                <div className="h-56 flex items-end gap-2 sm:gap-4 min-w-min">
                {history.map((h) => {
                    const heightPercentage = (h.totalBoleto / maxChartValue) * 100;
                    const isCurrent = h.monthYear === currentMonth;
                    
                    return (
                        <div 
                            key={h.id} 
                            className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
                            onClick={() => onSelectMonth && onSelectMonth(h.monthYear)}
                        >
                            <div className="relative flex justify-center w-12 sm:w-16 h-40">
                                {/* Tooltip Hover */}
                                <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                    {formatCur(h.totalBoleto)}
                                    <br/>
                                    Copart: {formatCur(h.items.reduce((acc, i) => acc + i.copart, 0))}
                                    <br/>
                                    <span className="text-emerald-300">Clique para selecionar</span>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                </div>
                                
                                {/* Barra do Gráfico */}
                                <div 
                                    className={`w-full rounded-t-md transition-all duration-500 flex items-end ${isCurrent ? 'bg-indigo-500 ring-4 ring-indigo-200' : 'bg-slate-200 group-hover:bg-indigo-300 group-hover:scale-105'} cursor-pointer`}
                                    style={{ height: `${heightPercentage}%` }}
                                >
                                    {/* Barra interna de coparticipação (visual) */}
                                    <div 
                                       className="w-full bg-indigo-900/20 rounded-t-md" 
                                       style={{ height: `${h.totalBoleto > 0 ? (h.items.reduce((acc, i) => acc + i.copart, 0) / h.totalBoleto) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                            <span className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {h.monthYear.split('-')[1]}/{h.monthYear.split('-')[0].slice(2)}
                            </span>
                        </div>
                    );
                })}
                </div>
              </div>
            </div>
        )}
    </div>
  );
};

export default HistoricoChart;
