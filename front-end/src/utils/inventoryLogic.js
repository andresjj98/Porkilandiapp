// Función para restar productos del inventario usando lógica UEPS
export const subtractFromInventory = (cuts, invoices, orderItems) => {
  // Clonar los cortes para no modificar el estado directamente
  const updatedCuts = [...cuts];

  // Ordenar los cortes por fecha de procesamiento descendente (UEPS)
  const sortedCuts = [...updatedCuts].sort((a, b) => {
    const dateA = new Date(a.processingDate);
    const dateB = new Date(b.processingDate);
    return dateB - dateA; // Más reciente primero
  });

  // Crear un mapa de cortes disponibles por tipo de corte y origen (factura)
  const availableCutsMap = sortedCuts.reduce((acc, cut) => {
    const invoice = invoices.find(inv => inv.id === cut.invoiceId);
    const originInvoiceNumber = invoice ? invoice.number : 'Desconocida';
    const key = `${cut.cutType}-${originInvoiceNumber}`;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(cut);
    return acc;
  }, {});

  // Procesar cada item de la orden
  for (const item of orderItems) {
    const requestedQuantity = item.quantity || 0;
    const requestedWeight = item.weight || 0;

    // Buscar cortes disponibles que coincidan con el tipo de carne y corte solicitado
    // Aquí la lógica UEPS ya está aplicada por el ordenamiento inicial
    const matchingCuts = Object.entries(availableCutsMap)
      .filter(([key]) => key.startsWith(`${item.cutType}-`)) // Filtrar por tipo de corte
      .flatMap(([key, cuts]) => cuts); // Aplanar la lista de cortes

    let remainingQuantity = requestedQuantity;
    let remainingWeight = requestedWeight;

    // Restar del inventario usando los cortes encontrados (ya ordenados por UEPS)
    for (const cut of matchingCuts) {
      if (remainingQuantity <= 0 && remainingWeight <= 0) break; // Ya surtimos lo necesario

      // Lógica para restar por cantidad
      if (requestedQuantity > 0 && cut.quantity > 0) {
        const quantityToSubtract = Math.min(remainingQuantity, cut.quantity);
        cut.quantity -= quantityToSubtract;
        remainingQuantity -= quantityToSubtract;
      }

      // Lógica para restar por peso
      if (requestedWeight > 0 && cut.weight > 0) {
        const weightToSubtract = Math.min(remainingWeight, cut.weight);
        cut.weight -= weightToSubtract;
        remainingWeight -= weightToSubtract;
      }
    }
  }

  // Filtrar cortes con cantidad o peso cero si es necesario (opcional)
  // const finalCuts = updatedCuts.filter(cut => cut.quantity > 0 || cut.weight > 0);

  return updatedCuts; // Devolver los cortes actualizados
};