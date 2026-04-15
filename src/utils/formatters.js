export const formatCur = (val) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    val,
  );

export const formatMonthLabel = (yyyyMM) => {
  const [year, month] = yyyyMM.split("-");
  const date = new Date(year, month - 1);
  return date
    .toLocaleString("pt-BR", { month: "short", year: "numeric" })
    .toUpperCase();
};
