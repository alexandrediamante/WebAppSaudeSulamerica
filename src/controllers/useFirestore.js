import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db, appId } from "../config/firebase";

export function useFirestore(user) {
  const [history, setHistory] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Busca do Histórico
  useEffect(() => {
    if (!user) return;
    const historyRef = collection(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "history",
    );
    const unsubscribe = onSnapshot(
      historyRef,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.sort((a, b) => a.monthYear.localeCompare(b.monthYear));
        setHistory(data);
      },
      (error) => {
        console.error("Erro ao buscar histórico:", error);
      },
    );
    return () => unsubscribe();
  }, [user]);

  // Salvar Fechamento
  const saveFechamento = async (
    currentMonth,
    totalBoleto,
    totals,
    boletoInfo = null,
  ) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const docRef = doc(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "history",
        currentMonth,
      );
      const payload = {
        monthYear: currentMonth,
        totalBoleto,
        baseTotal: totals.baseTotal,
        diferencaTotal: totals.diferencaTotal,
        fator: totals.fator,
        items: totals.processedItems.map((i) => ({
          id: i.id,
          label: i.label,
          price: i.price,
          copart: i.copart,
          proporcional: i.proporcional,
        })),
        updatedAt: new Date().toISOString(),
        boleto: boletoInfo
          ? {
              valorCobrado: boletoInfo.valorCobrado,
              codigoBarras: boletoInfo.codigoBarras,
              numeroDocumento: boletoInfo.numeroDocumento,
              nossoNumero: boletoInfo.nossoNumero,
              beneficiario: boletoInfo.beneficiario,
              pagador: boletoInfo.pagador,
              importadoEm: boletoInfo.importadoEm,
            }
          : null,
      };
      await setDoc(docRef, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar! Verifique as regras do Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  return { history, isSaving, saveSuccess, saveFechamento };
}
