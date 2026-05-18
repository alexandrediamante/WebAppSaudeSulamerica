import React from 'react';
import { useDashboard } from '../controllers/useDashboard';
import Header from './components/Header';
import BoletoInput from './components/BoletoInput';
import BoletoUpload from './components/BoletoUpload';
import BoletoHistory from './components/BoletoHistory';
import BoletoDetailsCard from './components/BoletoDetailsCard';
import BeneficiariosTable from './components/BeneficiariosTable';
import RateioCard from './components/RateioCard';
import HistoricoChart from './components/HistoricoChart';


const Dashboard = ({ user, logout }) => {
  const {
    history, currentMonth, setCurrentMonth,
    items, totalBoleto, setTotalBoleto, totals, updateItem,
    isSaving, saveSuccess, handleSave, maxChartValue,
    handleBoletoImport, isUploading, uploadError, boletoData,
    uploadBoleto, clearBoleto, extractionMethod, progress,
    currentBoletoDados, deleteMonth
  } = useDashboard(user);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header 
          currentMonth={currentMonth} setCurrentMonth={setCurrentMonth}
          isSaving={isSaving} saveSuccess={saveSuccess} onSave={handleSave}
          user={user} logout={logout}
        />


        
        {/* Seção de Importação de Boleto */}
        <BoletoUpload
          onUpload={uploadBoleto}
          isUploading={isUploading}
          uploadError={uploadError}
          boletoData={boletoData}
          extractionMethod={extractionMethod}
          progress={progress}
          onConfirm={(data) => {
            handleBoletoImport(data);
            clearBoleto();
          }}
          onCancel={clearBoleto}
        />

        {/* Seção de Rateio e Tabela */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <BoletoInput totalBoleto={totalBoleto} setTotalBoleto={setTotalBoleto} currentMonth={currentMonth} />
            <BeneficiariosTable items={items} updateItem={updateItem} baseTotal={totals.baseTotal} />
          </div>
          <div className="lg:col-span-4">
            <RateioCard totals={totals} />
          </div>
        </div>

        {/* Gráfico de Histórico */}
        <HistoricoChart 
          history={history} 
          currentMonth={currentMonth} 
          maxChartValue={maxChartValue} 
          totalBoleto={totalBoleto}
          onSelectMonth={setCurrentMonth}
        />

        {/* Seção de Histórico e Detalhes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <BoletoHistory
              history={history}
              currentMonth={currentMonth}
              onSelectMonth={setCurrentMonth}
              currentBoletoDados={currentBoletoDados}
              onDeleteMonth={deleteMonth}
            />
          </div>
          <div className="lg:col-span-8">
            <BoletoDetailsCard 
              boletoData={currentBoletoDados} 
              currentMonth={currentMonth} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
