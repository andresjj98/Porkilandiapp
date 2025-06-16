import React, { useState, useEffect } from 'react';
import { createStorage, getStorage, setStorage } from '../utils/storage'; // Importar createStorage
import { initialCarcasses } from '../mock/carcasses';
import { initialInvoices } from '../mock/invoices'; // Import invoices to link

const CarcassList = () => {
  const [carcasses, setCarcasses] = useState(() => createStorage('carcasses', initialCarcasses));
  const [invoices, setInvoices] = useState(() => getStorage('invoices') || initialInvoices);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCarcass, setNewCarcass] = useState({ channelId: '', entryDate: '', weight: '', status: 'En Almacén' });

  useEffect(() => {
    setStorage('carcasses', carcasses);
  }, [carcasses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCarcass({ ...newCarcass, [name]: value });
  };

  const handleAddCarcass = () => {
    if (!newCarcass.channelId || !newCarcass.entryDate || !newCarcass.weight) {
      alert('Por favor, completa todos los campos.');
      return;
    }
    const id = `car-${Date.now()}`;
    setCarcasses([...carcasses, { id, ...newCarcass }]);
    setNewCarcass({ channelId: '', entryDate: '', weight: '', status: 'En Almacén' });
    setShowAddForm(false);
  };

  const handleDeleteCarcass = (id) => {
    setCarcasses(carcasses.filter(carcass => carcass.id !== id));
  };

  const getInvoiceNumber = (channelId) => {
    const invoice = invoices.find(inv => inv.channels.some(ch => ch.id === channelId));
    return invoice ? invoice.number : 'Desconocida';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Canales</h2>

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-6 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        {showAddForm ? 'Cancelar' : 'Agregar Nuevo Canal'}
      </button>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Nuevo Canal</h3>
          <select
            name="channelId"
            value={newCarcass.channelId}
            onChange={handleInputChange}
            className="w-full mt-3 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          >
            <option value="">Selecciona un Canal de Factura</option>
            {invoices.flatMap(invoice => invoice.channels.map(channel => (
              <option key={channel.id} value={channel.id}>
                {`Factura ${invoice.number} - Canal ${channel.id} (${channel.type}, ${channel.weight}kg)`}
              </option>
            )))}
          </select>
          <input
            type="date"
            name="entryDate"
            placeholder="Fecha de Entrada"
            value={newCarcass.entryDate}
            onChange={handleInputChange}
            className="w-full mt-3 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          />
          <input
            type="number"
            name="weight"
            placeholder="Peso (kg)"
            value={newCarcass.weight}
            onChange={handleInputChange}
            className="w-full mt-3 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          />
           <select
            name="status"
            value={newCarcass.status}
            onChange={handleInputChange}
            className="w-full mt-3 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          >
            <option value="En Almacén">En Almacén</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Despostado">Despostado</option>
            <option value="Vendido">Vendido</option>
          </select>
          <button
            onClick={handleAddCarcass}
            className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Guardar Canal
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {carcasses.map((carcass) => (
          <div key={carcass.id} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800">Canal ID: {carcass.id}</h3>
            <p className="text-gray-600 mt-2">Factura: {getInvoiceNumber(carcass.channelId)}</p>
            <p className="text-gray-600">Fecha Entrada: {carcass.entryDate}</p>
            <p className="text-gray-600">Peso: {carcass.weight} kg</p>
            <p className="text-gray-600">Estado: {carcass.status}</p>
            <button
              onClick={() => handleDeleteCarcass(carcass.id)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarcassList;

// DONE