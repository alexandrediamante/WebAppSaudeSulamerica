import React from 'react';
import { Users } from 'lucide-react';
import { formatCur } from '../../utils/formatters';

const BeneficiariosTable = ({ items, updateItem, baseTotal }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
          <Users size={20} />
        </div>
        <h2 className="font-bold text-slate-800 text-lg">Beneficiários do Plano</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50">
              <th className="px-6 py-4 font-bold">Nome / Faixa</th>
              <th className="px-6 py-4 font-bold">Valor Base</th>
              <th className="px-6 py-4 font-bold text-indigo-500">Coparticipação</th>
              <th className="px-6 py-4 font-bold">Subtotal Base</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400 font-medium">{item.subLabel}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-300 text-sm">R$</span>
                    <input 
                      type="number" 
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-slate-100/50 rounded-md p-1 focus:bg-white focus:ring-2 ring-indigo-100 outline-none font-medium text-slate-600"
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <span className="text-indigo-300 text-sm font-bold">R$</span>
                    <input 
                      type="number" 
                      value={item.copart}
                      onChange={(e) => updateItem(item.id, 'copart', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-indigo-50 rounded-md p-1 focus:bg-white focus:ring-2 ring-indigo-200 outline-none font-bold text-indigo-600"
                      placeholder="0,00"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 font-black text-slate-600">
                  {formatCur((item.qty * item.price) + (item.copart || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center px-6">
         <span className="text-sm font-bold text-slate-500 uppercase">Soma Base Original:</span>
         <span className="font-black text-xl text-slate-700">{formatCur(baseTotal)}</span>
      </div>
    </div>
  );
};

export default BeneficiariosTable;
