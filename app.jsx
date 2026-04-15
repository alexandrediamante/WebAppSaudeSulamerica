import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Receipt, Users, ArrowRight, TrendingUp, Wallet, Save, BarChart3, Calendar, CheckCircle2, History, AlertTriangle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

// Configuração oficial apontando para o SEU banco de dados (Produção)
const firebaseConfig = {
  apiKey: "AIzaSyABXz150ZFa8ZLdjYsDkCBW5n_le-TknVE",
  authDomain: "sulamericaplanosaude-d20b9.firebaseapp.com",
  projectId: "sulamericaplanosaude-d20b9",
  storageBucket: "sulamericaplanosaude-d20b9.firebasestorage.app",
  messagingSenderId: "132711736973",
  appId: "1:132711736973:web:83a22446ad3c2cd79424c4",
  measurementId: "G-QVXY5GN3YX"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'rateio-diamante-app';

const App = () => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Beneficiários Fixos da Família Diamante
  const [items, setItems] = useState([
    { id: 'patricia', label: 'Patricia Diamante', subLabel: 'Faixa 44 a 48', qty: 1, price: 808.01, copart: 0 },
    { id: 'rebeca', label: 'Rebeca Diamante', subLabel: 'Faixa 0 a 18', qty: 1, price: 316.52, copart: 0 },
    { id: 'arthur', label: 'Arthur Diamante', subLabel: 'Faixa 0 a 18', qty: 1, price: 316.52, copart: 0 }
  ]);
  const [totalBoleto, setTotalBoleto] = useState(1441.05);

  // 1. Autenticação Resiliente
  useEffect(() => {
    let unsubscribe = () => {};
    
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
        unsubscribe = onAuthStateChanged(auth, setUser);
      } catch (error) {
        console.error("Erro na autenticação:", error);
        setAuthError(true);
        // Fallback: Modo Desenvolvedor. 
        // Cria um usuário fake para não travar a aplicação.
        setUser({ uid: 'familia-diamante-dev' });
      }
    };
    initAuth();
    
    return () => unsubscribe();
  }, []);

  // 2. Busca do Histórico no Banco
  useEffect(() => {
    if (!user) return;
    
    const historyRef = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
    
    const unsubscribe = onSnapshot(historyRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordena por data
      data.sort((a, b) => a.monthYear.localeCompare(b.monthYear));
      setHistory(data);
    }, (error) => {
      console.error("Erro ao buscar histórico (verifique as Regras do Firestore):", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Carregar dados se selecionar mês antigo
  useEffect(() => {
    const monthData = history.find(h => h.monthYear === currentMonth);
    if (monthData) {
      setTotalBoleto(monthData.totalBoleto);
      setItems(prevItems => prevItems.map(item => {
        const savedItem = monthData.items.find(i => i.id === item.id);
        return savedItem ? { ...item, copart: savedItem.copart, price: savedItem.price } : item;
      }));
    } else {
      setItems(prevItems => prevItems.map(item => ({ ...item, copart: 0 })));
    }
  }, [currentMonth, history]);

  // Cálculos automáticos de Rateio (Memoized)
  const totals = useMemo(() => {
    const baseTotal = items.reduce((acc, item) => acc + (item.qty * item.price) + (item.copart || 0), 0);
    const fator = baseTotal > 0 ? totalBoleto / baseTotal : 1;
    const diferencaTotal = totalBoleto - baseTotal;
    
    const processedItems = items.map(item => {
      const subtotalBase = (item.qty * item.price) + (item.copart || 0);
      const proporcional = subtotalBase * fator;
      return {
        ...item,
        subtotalBase,
        proporcional
      };
    });

    return { baseTotal, fator, diferencaTotal, processedItems };
  }, [items, totalBoleto]);

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // 3. Função para Salvar o Fechamento
  const saveFechamento = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'history', currentMonth);
      
      const payload = {
        monthYear: currentMonth,
        totalBoleto: totalBoleto,
        baseTotal: totals.baseTotal,
        diferencaTotal: totals.diferencaTotal,
        fator: totals.fator,
        items: totals.processedItems.map(i => ({
          id: i.id,
          label: i.label,
          price: i.price,
          copart: i.copart,
          proporcional: i.proporcional
        })),
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, payload);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar. Verifique se as Regras do Firestore estão como 'if true;':", error);
      alert("Erro ao salvar! Verifique as regras do Firestore (if true).");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCur = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatMonthLabel = (yyyyMM) => {
    const [year, month] = yyyyMM.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase();
  };

  const maxChartValue = Math.max(...history.map(h => h.totalBoleto), totalBoleto, 2000) * 1.1;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Alerta de Modo de Desenvolvimento */}
        {authError && (
          <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-r-xl flex gap-3 text-amber-800 shadow-sm">
            <AlertTriangle size={24} className="text-amber-500 shrink-0" />
            <div>
              <p className="font-bold text-sm">Aviso de Autenticação (Firebase Auth não configurado)</p>
              <p className="text-xs mt-1">O sistema entrou em modo de desenvolvimento. Lembre-se de alterar as Regras do Firestore para <code className="bg-amber-200 px-1 rounded">allow read, write: if true;</code> para conseguir salvar os dados.</p>
            </div>
          </div>
        )}

        {/* Header Dashboard */}
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
              onClick={saveFechamento}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl ${saveSuccess ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'}`}
            >
              {saveSuccess ? <CheckCircle2 size={20} /> : <Save size={20} />}
              {isSaving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Gravar Mês'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Coluna Esquerda: Lançamentos e Total do Boleto */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Input do Boleto */}
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

            {/* Tabela de Beneficiários */}
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
                 <span className="font-black text-xl text-slate-700">{formatCur(totals.baseTotal)}</span>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Rateio Final e Gráfico */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Card Rateio Final */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
              <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                <ArrowRight size={18} className="text-emerald-500" />
                Rateio Final (A Pagar)
              </h3>
              
              <div className="space-y-4 flex-grow">
                {totals.processedItems.map(item => (
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
                   <span className={`font-black ${totals.diferencaTotal >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                     {totals.diferencaTotal > 0 ? '+' : ''}{formatCur(totals.diferencaTotal)}
                   </span>
                </div>
                <div className="text-right">
                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fator Multiplicador</span>
                   <p className="font-mono text-sm text-slate-600 font-bold">{totals.fator.toFixed(6)}</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Linha Inferior: Gráfico de Histórico */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                <BarChart3 size={18} className="text-indigo-500" />
                Histórico de Faturamento Anual
            </h3>
            
            {history.length === 0 ? (
                <div className="h-48 flex items-center justify-center flex-col text-slate-400">
                    <History size={32} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">Nenhum histórico salvo ainda.</p>
                    <p className="text-xs">Clique em "Gravar Mês" para iniciar seu histórico.</p>
                </div>
            ) : (
                <div className="h-56 flex items-end gap-2 sm:gap-4 overflow-x-auto pb-2 pt-6">
                    {history.map((h) => {
                        const heightPercentage = (h.totalBoleto / maxChartValue) * 100;
                        const isCurrent = h.monthYear === currentMonth;
                        
                        return (
                            <div key={h.id} className="flex flex-col items-center flex-shrink-0 group">
                                <div className="relative flex justify-center w-12 sm:w-16 h-40">
                                    {/* Tooltip Hover */}
                                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                                        {formatCur(h.totalBoleto)}
                                        <br/>
                                        Copart: {formatCur(h.items.reduce((acc, i) => acc + i.copart, 0))}
                                    </div>
                                    
                                    {/* Barra do Gráfico */}
                                    <div 
                                        className={`w-full rounded-t-md transition-all duration-500 flex items-end ${isCurrent ? 'bg-indigo-500' : 'bg-slate-200 group-hover:bg-indigo-300'}`}
                                        style={{ height: `${heightPercentage}%` }}
                                    >
                                        {/* Barra interna de coparticipação (visual) */}
                                        <div 
                                           className="w-full bg-indigo-900/20 rounded-t-md" 
                                           style={{ height: `${(h.items.reduce((acc, i) => acc + i.copart, 0) / h.totalBoleto) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <span className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {h.monthYear.split('-')[1]}/{h.monthYear.split('-')[0].slice(2)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default App;