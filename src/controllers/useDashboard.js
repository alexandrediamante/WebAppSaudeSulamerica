import { useState, useMemo, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useFirestore } from "./useFirestore";
import { useBoleto } from "./useBoleto";
import {
  initialBeneficiarios,
  DEFAULT_TOTAL_BOLETO,
} from "../models/beneficiarios";
import { calcularRateio } from "../models/rateio";

export function useDashboard() {
  const { user, authError } = useAuth();
  const { history, isSaving, saveSuccess, saveFechamento } = useFirestore(user);
  const {
    isUploading,
    uploadError,
    boletoData,
    uploadBoleto,
    clearBoleto,
    extractionMethod,
    progress,
  } = useBoleto();
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [items, setItems] = useState(initialBeneficiarios);
  const [totalBoleto, setTotalBoleto] = useState(DEFAULT_TOTAL_BOLETO);
  const [currentBoleto, setCurrentBoleto] = useState(null);
  const [currentBoletoDados, setCurrentBoletoDados] = useState(null);

  // Carregar dados se selecionar mês antigo
  useEffect(() => {
    const monthData = history.find((h) => h.monthYear === currentMonth);
    if (monthData) {
      setTotalBoleto(monthData.totalBoleto);
      setItems((prevItems) =>
        prevItems.map((item) => {
          const savedItem = monthData.items.find((i) => i.id === item.id);
          return savedItem
            ? { ...item, copart: savedItem.copart, price: savedItem.price }
            : item;
        }),
      );
      // Carregar dados do boleto do histórico
      if (monthData.boleto) {
        setCurrentBoletoDados(monthData.boleto);
      } else {
        setCurrentBoletoDados(null);
      }
    } else {
      setItems((prevItems) =>
        prevItems.map((item) => ({ ...item, copart: 0 })),
      );
      setCurrentBoletoDados(null);
    }
  }, [currentMonth, history]);

  const totals = useMemo(
    () => calcularRateio(items, totalBoleto),
    [items, totalBoleto],
  );

  const updateItem = (id, field, value) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleBoletoImport = (boletoData) => {
    setTotalBoleto(boletoData.valorCobrado);
    if (boletoData.mesReferencia) {
      setCurrentMonth(boletoData.mesReferencia);
    }
    setCurrentBoleto(boletoData);
    setCurrentBoletoDados(boletoData);
  };

  const handleSave = () =>
    saveFechamento(currentMonth, totalBoleto, totals, currentBoleto);

  const maxChartValue =
    Math.max(...history.map((h) => h.totalBoleto), totalBoleto, 2000) * 1.1;

  return {
    user,
    authError,
    history,
    currentMonth,
    setCurrentMonth,
    items,
    totalBoleto,
    setTotalBoleto,
    totals,
    updateItem,
    isSaving,
    saveSuccess,
    handleSave,
    maxChartValue,
    handleBoletoImport,
    currentBoleto,
    currentBoletoDados,
    setCurrentMonth,
    isUploading,
    uploadError,
    boletoData,
    uploadBoleto,
    clearBoleto,
    extractionMethod,
    progress,
  };
}
