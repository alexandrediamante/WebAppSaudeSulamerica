import React from 'react';
import { ArrowRight, Wallet } from 'lucide-react';
import { formatCur } from '../../utils/formatters';

const RateioCard = ({ totals }) => {
  const { processedItems, diferencaTotal, fator } = totals;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
        <ArrowRight size={18} className="text-emerald-500" />
        Rateio Final (A Pagar)
      </h3>
      
      <div className="space-y-4 flex-grow">
        {processedItems.map(item => (
          <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-start">
              <span className="font-bold text-slate-700 text-sm">{item.label}</span>
              {item.copart > 0 && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Wallet size={10}/> Copart</span>}
            </div>
            <div className="flex justify-between items-end mt-2">
               <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Custo {formatCur(item.subtotalBase)}
               </div>
               <span className="font-black text-emerald-600 text-2xl tracking-tight">
                 {formatCur(item.proporcional)}
               </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
        <div className="flex flex-col">
           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Diferença/Multa</span>
           <span className={`font-black ${diferencaTotal >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
             {diferencaTotal > 0 ? '+' : ''}{formatCur(diferencaTotal)}
           </span>
        </div>
        <div className="text-right">
           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fator Multiplicador</span>
           <p className="font-mono text-sm text-slate-600 font-bold">{fator.toFixed(6)}</p>
        </div>
      </div>
    </div>
  );
};

export default RateioCard;
