// Función para filtrar una lista de elementos por un rango de fechas
export const filterByDateRange = (items, startDate, endDate, dateKey) => {
  if (!startDate && !endDate) {
    return items; // Si no hay fechas, devolver todos los items
  }

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  return items.filter(item => {
    const itemDate = new Date(item[dateKey]);

    if (start && end) {
      return itemDate >= start && itemDate <= end;
    } else if (start) {
      return itemDate >= start;
    } else if (end) {
      return itemDate <= end;
    }
    return true; // Debería ser cubierto por el primer if, pero por seguridad
  });
};