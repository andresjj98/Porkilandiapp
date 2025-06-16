import React, { useState, useEffect } from 'react';
import { createStorage, getStorage, setStorage } from '../utils/storage'; // Importar createStorage
import { initialCuts } from '../mock/cuts';
import { initialCarcasses } from '../mock/carcasses'; // Import carcasses to link

const CutList = () => {
  const [cuts, setCuts] = useState(() => createStorage('cuts', initialCuts));
  const [carcasses, setCarcasses] = useState(() => getStorage('carcasses') || initialCarcasses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCut, setNewCut] = useState({ carcassId: '', cutType: '', weight: '', processingDate: '' });

  useEffect(() => {
    setStorage('cuts', cuts);
  }, [cuts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCut({ ...newCut, [name]: value });
  };

  const handleAddCut = () => {
    if (!newCut.carcassId || !newCut.cutType || !newCut.weight || !newCut.processingDate) {
      alert('Por favor, completa todos los campos.');
      return;
    }
    const id = `cut-${Date.now()}`;
    setCuts([...cuts, { id, ...newCut }]);
    setNewCut({ carcassId: '', cutType: '', weight: '', processingDate: '' });
    setShowAddForm(false);
  };

  const handleDeleteCut = (id) => {
    setCuts(cuts.filter(cut => cut.id !== id));
  };

  const getCarcassInfo = (carcassId) => {
    const carcass = carcasses.find(car => car.id === carcassId);
    return carcass ? `Canal ID: ${carcass.id} (${carcass.weight}kg)` : 'Canal Desconocido';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Despostes</h2>

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-6 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        {showAddForm ? 'Cancelar' : 'Agregar Nuevo Desposte'}
      </button>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Nuevo Desposte</h3>
          <select
            name="carcassId"
            value={newCut.carcassId}
            onChange={handleInputChange}
            className="w-full mt-3 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          >
            <option value="">Selecciona un Canal</option>
            {carcasses.map(carcass => (
              <option key={carcass.id} value={carcass.id}>
                {`Canal ID: ${carcass.id} (${carcass.weight}kg)`}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="cutType"
            placeholder="Tipo de Corte"
            value={newCut.cutType}
            onChange={handleInputChange}
            className="w-full mt-3 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          />
          <input
            type="number"
            name="weight"
            placeholder="Peso (kg)"
            value={newCut.weight}
            onChange={handleInputChange}
            className="w-full mt-3 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          />
          <input
            type="date"
            name="processingDate"
            placeholder="Fecha de Procesamiento"
            value={newCut.processingDate}
            onChange={handleInputChange}
            className="w-full mt-3 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          />
          <button
            onClick={handleAddCut}
            className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Guardar Desposte
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cuts.map((cut) => (
          <div key={cut.id} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800">{cut.cutType}</h3>
            <p className="text-gray-600 mt-2">{getCarcassInfo(cut.carcassId)}</p>
            <p className="text-gray-600">Peso: {cut.weight} kg</p>
            <p className="text-gray-600">Fecha Procesamiento: {cut.processingDate}</p>
            <button
              onClick={() => handleDeleteCut(cut.id)}
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

export default CutList;

// DONE