import React from 'react';
import { useDashboard } from '../controllers/useDashboard';
import AuthWarning from './components/AuthWarning';
import Header from './components/Header';
import BoletoInput from './components/BoletoInput';
import BeneficiariosTable from './components/BeneficiariosTable';
import RateioCard from './components/RateioCard';
import HistoricoChart from './components/HistoricoChart';

const Dashboard = () => {
  const {
    authError, history, currentMonth, setCurrentMonth,
    items, totalBoleto, setTotalBoleto, totals, updateItem,
    isSaving, saveSuccess, handleSave, maxChartValue
  } = useDashboard();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {authError && <AuthWarning />}
        <Header 
          currentMonth={currentMonth} setCurrentMonth={setCurrentMonth}
          isSaving={isSaving} saveSuccess={saveSuccess} onSave={handleSave}
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <BoletoInput totalBoleto={totalBoleto} setTotalBoleto={setTotalBoleto} currentMonth={currentMonth} />
            <BeneficiariosTable items={items} updateItem={updateItem} baseTotal={totals.baseTotal} />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <RateioCard totals={totals} />
          </div>
        </div>
        <HistoricoChart history={history} currentMonth={currentMonth} maxChartValue={maxChartValue} totalBoleto={totalBoleto} />
      </div>
    </div>
  );
};

export default Dashboard;
