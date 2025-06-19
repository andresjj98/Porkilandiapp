import React, { useState, useEffect } from 'react';
import { getStorage } from '../utils/storage';
import { initialInvoices } from '../mock/invoices';

const DeboningList = () => {
  const [cuts, setCuts] = useState(() => getStorage('cuts') || []);
  const [invoices, setInvoices] = useState(() => getStorage('invoices') || initialInvoices);
  const [groupedCuts, setGroupedCuts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const grouped = cuts.reduce((acc, cut) => {
      const invoiceNumber = getInvoiceNumber(cut.invoiceId);
      if (!acc[invoiceNumber]) {
        acc[invoiceNumber] = [];
      }
      acc[invoiceNumber].push(cut);
      return acc;
    }, {});

    const filteredGrouped = Object.entries(grouped).reduce((acc, [invoiceNumber, cutsList]) => {
      if (invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) {
        acc[invoiceNumber] = cutsList;
      }
      return acc;
    }, {});

    setGroupedCuts(filteredGrouped);
  }, [cuts, invoices, searchTerm]);

  const getInvoiceNumber = (invoiceId) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    return invoice ? invoice.number : 'Desconocida';
  };

  const getCutsSummary = (cutsList) => {
    const summary = cutsList.reduce((acc, cut) => {
      acc[cut.cutType] = (acc[cut.cutType] || 0) + cut.weight;
      return acc;
    }, {});
    return Object.entries(summary);
  };

  const getTotalWeightByMeatType = (cutsList) => {
    const summary = cutsList.reduce((acc, cut) => {
      const invoice = invoices.find(inv => inv.id === cut.invoiceId);
      const channel = invoice ? invoice.channels.find(ch => ch.code === cut.carcassCode) : null;
      const meatType = channel ? channel.type : 'Desconocido';

      acc[meatType] = (acc[meatType] || 0) + cut.weight;
      return acc;
    }, {});
    return Object.entries(summary);
  };

  const getMermaByMeatType = (invoiceId, cutsList) => { // Nueva función para calcular la merma
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return {};

    // Total de peso de canales por tipo de carne en la factura
    const totalChannelWeight = invoice.channels.reduce((acc, channel) => {
      acc[channel.type] = (acc[channel.type] || 0) + channel.weight;
      return acc;
    }, {});

    // Total de peso despostado por tipo de carne de los cortes asociados a esta factura
    const totalCutWeight = cutsList.reduce((acc, cut) => {
      const channel = invoice.channels.find(ch => ch.code === cut.carcassCode);
      const meatType = channel ? channel.type : 'Desconocido';
      acc[meatType] = (acc[meatType] || 0) + cut.weight;
      return acc;
    }, {});

    // Calcular la merma por tipo de carne
    const merma = {};
    Object.keys(totalChannelWeight).forEach(meatType => {
      const channelWeight = totalChannelWeight[meatType] || 0;
      const cutWeight = totalCutWeight[meatType] || 0;
      merma[meatType] = channelWeight - cutWeight;
    });

    return Object.entries(merma);
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Despostes Registrados por Factura</h2>

      <div className="mb-6">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700">Buscar por Número de Factura</label>
        <input
          type="text"
          id="search"
          placeholder="Ej: FAC-2023-001"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
        />
      </div>

      {Object.keys(groupedCuts).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedCuts).map(([invoiceNumber, cutsList]) => {
            const invoice = invoices.find(inv => inv.number === invoiceNumber); // Encontrar la factura por número
            const invoiceId = invoice ? invoice.id : null; // Obtener el ID de la factura

            return (
              <div key={invoiceNumber} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Factura: {invoiceNumber}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cutsList.map(cut => (
                    <div key={cut.id} className="border border-gray-200 rounded-lg p-3">
                      <p className="text-gray-700 font-medium">Corte: <span className="font-normal">{cut.cutType}</span></p>
                      <p className="text-gray-700 font-medium">Canal Código: <span className="font-normal">{cut.carcassCode}</span></p>
                      <p className="text-gray-700 font-medium">Peso: <span className="font-normal">{cut.weight} kg</span></p>
                      <p className="text-gray-700 font-medium">Cantidad: <span className="font-normal">{cut.quantity} piezas</span></p>
                      <p className="text-gray-600 text-sm">Operario: {cut.operator}</p>
                      <p className="text-gray-600 text-sm">Fecha: {cut.processingDate}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h5 className="text-md font-semibold text-gray-800 mb-2">Resumen de Peso por Tipo de Corte en esta Factura</h5>
                  {getCutsSummary(cutsList).map(([type, totalWeight]) => (
                    <p key={type} className="text-gray-700">{type}: {totalWeight.toFixed(2)} kg</p>
                  ))}

                  <h5 className="text-md font-semibold text-gray-800 mt-4 mb-2">Total Kilos Despostado y Merma por Tipo de Carne</h5> {/* Título modificado */}
                  {getTotalWeightByMeatType(cutsList).map(([meatType, totalWeight]) => (
                    <p key={meatType} className="text-gray-700">{meatType} (Despostado): {totalWeight.toFixed(2)} kg</p>
                  ))}
                   {invoiceId && getMermaByMeatType(invoiceId, cutsList).map(([meatType, mermaWeight]) => ( // Mostrar merma
                    <p key={`${meatType}-merma`} className="text-gray-700">
                      {meatType} (Merma): <span className={`${mermaWeight >= 0 ? 'text-green-600' : 'text-red-600'}`}>{mermaWeight.toFixed(2)} kg</span>
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-600">No hay despostes registrados que coincidan con la búsqueda.</p>
      )}
    </div>
  );
};

export default DeboningList;

// DONE