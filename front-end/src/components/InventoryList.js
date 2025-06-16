import React, { useState, useEffect } from 'react';
import { getStorage } from '../utils/storage';
import { initialInvoices } from '../mock/invoices';
import { initialUsers } from '../mock/users';

const InventoryList = () => {
  const [cuts, setCuts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState({});
  const [totalWeightByMeatType, setTotalWeightByMeatType] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedCuts = await getStorage('cuts');
        setCuts(loadedCuts || []);
        const loadedInvoices = await getStorage('invoices');
        setInvoices(loadedInvoices || []);
        const loadedUsers = await getStorage('users');
        setUsers(loadedUsers || []);
      } catch (error) {
        console.error("Error loading initial data for InventoryList:", error);
      }
    };
    loadData();
  }, []);


  useEffect(() => {
    const groupedInventory = cuts.reduce((acc, cut) => {
      const invoice = invoices.find(inv => inv.id === cut.invoiceId);
      const channel = invoice ? invoice.channels.find(ch => ch.code === cut.carcassCode) : null;
      const meatType = channel ? channel.type : 'Desconocido';
      const originInvoiceNumber = invoice ? invoice.number : 'Desconocida';

      if (!acc[meatType]) {
        acc[meatType] = {};
      }

      const key = `${cut.cutType}-${originInvoiceNumber}`;

      if (!acc[meatType][key]) {
        acc[meatType][key] = {
          cutType: cut.cutType,
          totalWeight: 0,
          totalQuantity: 0,
          origins: new Set(),
        };
      }

      acc[meatType][key].totalWeight += cut.weight;
      acc[meatType][key].totalQuantity += cut.quantity;
      acc[meatType][key].origins.add(originInvoiceNumber);

      return acc;
    }, {});

    Object.keys(groupedInventory).forEach(meatType => {
      Object.keys(groupedInventory[meatType]).forEach(key => {
        groupedInventory[meatType][key].origins = Array.from(groupedInventory[meatType][key].origins);
      });
    });

    setInventory(groupedInventory);

    const totalByMeatType = cuts.reduce((acc, cut) => {
      const invoice = invoices.find(inv => inv.id === cut.invoiceId);
      const channel = invoice ? invoice.channels.find(ch => ch.code === cut.carcassCode) : null;
      const meatType = channel ? channel.type : 'Desconocido';

      acc[meatType] = (acc[meatType] || 0) + cut.weight;
      return acc;
    }, {});
    setTotalWeightByMeatType(totalByMeatType);

  }, [cuts, invoices]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Inventario de Cortes</h2>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Total de Kilos por Tipo de Carne</h3>
        {Object.keys(totalWeightByMeatType).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(totalWeightByMeatType).map(([meatType, totalWeight]) => (
              <div key={meatType} className="border border-gray-200 rounded-lg p-4">
                <p className="text-gray-800 font-medium">{meatType}: <span className="font-normal">{totalWeight.toFixed(2)} kg</span></p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No hay datos de inventario para mostrar el resumen.</p>
        )}
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Detalle de Inventario por Tipo de Carne y Factura</h2>
      {Object.keys(inventory).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(inventory).map(([meatType, cutsByInvoice]) => (
            <div key={meatType} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Tipo de Carne: {meatType}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(cutsByInvoice).map(([key, item]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-800 font-medium">Corte: <span className="font-normal">{item.cutType}</span></p>
                    <p className="text-gray-800 font-medium">Cantidad Total: <span className="font-normal">{item.totalQuantity} piezas</span></p>
                    <p className="text-gray-800 font-medium">Peso Total: <span className="font-normal">{item.totalWeight.toFixed(2)} kg</span></p>
                    <p className="text-gray-600 text-sm mt-2">Origen (Facturas): {item.origins.join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No hay cortes en el inventario detallado aún.</p>
      )}
    </div>
  );
};

export default InventoryList;