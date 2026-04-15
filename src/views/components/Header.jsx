import React from 'react';
import { Calculator, Calendar, Save, CheckCircle2 } from 'lucide-react';

const Header = ({ currentMonth, setCurrentMonth, isSaving, saveSuccess, onSave }) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
      <div>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
          <Calculator className="text-indigo-600" size={32} />
          Família Diamante
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Dashboard Financeiro de Saúde</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-slate-50 p-2 rounded-xl flex items-center gap-3 border border-slate-100">
          <Calendar className="text-slate-400 ml-2" size={20} />
          <input 
            type="month" 
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="bg-transparent font-bold text-slate-700 outline-none p-1 cursor-pointer"
          />
        </div>
        
        <button 
          onClick={onSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl ${saveSuccess ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'}`}
        >
          {saveSuccess ? <CheckCircle2 size={20} /> : <Save size={20} />}
          {isSaving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Gravar Mês'}
        </button>
      </div>
    </header>
  );
};

export default Header;
