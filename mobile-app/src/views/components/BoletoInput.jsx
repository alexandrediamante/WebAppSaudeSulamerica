import React from 'react';
import { TrendingUp } from 'lucide-react';
import { formatMonthLabel } from '../../utils/formatters';

const BoletoInput = ({ totalBoleto, setTotalBoleto, currentMonth }) => {
  return (
    <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-4 border border-indigo-500 relative overflow-hidden">
       <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
         <TrendingUp size={150} className="-mt-10 -mr-10" />
       </div>
       <div className="z-10 text-indigo-50">
         <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Valor do Boleto da Operadora</p>
         <h2 className="text-lg font-medium">Mês de Referência: {formatMonthLabel(currentMonth)}</h2>
       </div>
       <div className="z-10 bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center gap-3 w-full sm:w-auto">
         <span className="text-indigo-200 text-xl font-bold pl-2">R$</span>
         <input 
           type="number" 
           value={totalBoleto}
           onChange={(e) => setTotalBoleto(parseFloat(e.target.value) || 0)}
           className="text-4xl font-black text-white bg-transparent outline-none w-48"
         />
       </div>
    </div>
  );
};

export default BoletoInput;
