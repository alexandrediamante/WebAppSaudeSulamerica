export function calcularRateio(items, totalBoleto) {
  const baseTotal = items.reduce(
    (acc, item) => acc + item.qty * item.price + (item.copart || 0),
    0,
  );
  const fator = baseTotal > 0 ? totalBoleto / baseTotal : 1;
  const diferencaTotal = totalBoleto - baseTotal;

  const processedItems = items.map((item) => {
    const subtotalBase = item.qty * item.price + (item.copart || 0);
    const proporcional = subtotalBase * fator;
    return { ...item, subtotalBase, proporcional };
  });

  return { baseTotal, fator, diferencaTotal, processedItems };
}
