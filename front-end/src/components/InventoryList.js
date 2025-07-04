import React, { useContext, useMemo } from 'react';
import { InventoryContext } from '../contexts/InventoryContext';

const InventoryList = () => {
  const { items, loading } = useContext(InventoryContext);

  const { summaryByMeat, detailByMeat, summaryByCut } = useMemo(() => {
    const summary = {};
    const detail = {};
    const cuts   = {};

      items.forEach(({ meatType, cutType, quantity, weight }) => {
      if (!summary[meatType]) summary[meatType] = { quantity: 0, weight: 0 };
      summary[meatType].quantity += quantity;
      summary[meatType].weight += weight;

       if (!detail[meatType]) detail[meatType] = {};
      if (!detail[meatType][cutType]) {
        detail[meatType][cutType] = { quantity: 0, weight: 0 };
      }

      detail[meatType][cutType].quantity += quantity;
      detail[meatType][cutType].weight += weight;
      if (!cuts[cutType]) cuts[cutType] = { quantity: 0, weight: 0 };
      cuts[cutType].quantity += quantity;
      cuts[cutType].weight   += weight;
    });

    return { summaryByMeat: summary, detailByMeat: detail, summaryByCut: cuts };
  }, [items]);

     if (loading) {
    return <p className="p-6">Cargando inventario...</p>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Inventario Total por Tipo de Carne</h2>
        {Object.keys(summaryByMeat).length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(summaryByMeat).map(([meat, data]) => (
              <div key={meat} className="border border-gray-200 rounded-lg p-4">
                <p className="text-gray-800 font-medium">{meat}</p>
                <p className="text-gray-700 text-sm">Piezas: {data.quantity}</p>
                <p className="text-gray-700 text-sm">Peso: {data.weight.toFixed(2)} kg</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No hay datos de inventario.</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Inventario Total por Tipo de Corte</h2>
        {Object.keys(summaryByCut).length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(summaryByCut).map(([cut, data]) => (
              <div key={cut} className="border border-gray-200 rounded-lg p-4">
                <p className="text-gray-800 font-medium">{cut}</p>
                <p className="text-gray-700 text-sm">Piezas: {data.quantity}</p>
                <p className="text-gray-700 text-sm">Peso: {data.weight.toFixed(2)} kg</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No hay datos de inventario.</p>
        )}
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-800">Inventario Detallado</h2>
        {Object.keys(detailByMeat).length ? (
          Object.entries(detailByMeat).map(([meat, cuts]) => (
            <div key={meat} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Tipo de Carne: {meat}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(cuts).map(([cut, data]) => (
                  <div key={cut} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-800 font-medium">{cut}</p>
                    <p className="text-gray-700 text-sm">Piezas: {data.quantity}</p>
                    <p className="text-gray-700 text-sm">Peso: {data.weight.toFixed(2)} kg</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No hay datos de inventario detallado.</p>
        )}
      </div>
    </div>
  );
};

export default InventoryList;