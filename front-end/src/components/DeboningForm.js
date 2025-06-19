import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { filterByDateRange } from '../utils/dateFilters';



const DeboningForm = () => {
  const [invoices, setInvoices] = useState([]); // Inicializar vacío
  const [cuts, setCuts] = useState([]); // Inicializar vacío
  const [despostes, setDespostes] = useState([]);
  const [users, setUsers] = useState([]); // Inicializar vacío
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [availableCarcasses, setAvailableCarcasses] = useState([]);
  const [selectedCarcassCode, setSelectedCarcassCode] = useState('');
  const [currentCutsForCarcass, setCurrentCutsForCarcass] = useState([]);
  const [newCut, setNewCut] = useState({ cutType: '', weight: '', quantity: '' });
  const [cutTypes, setCutTypes] = useState({}); // Inicializar vacío
  const [cutTypeNameToId, setCutTypeNameToId] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupedCuts, setGroupedCuts] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const operarioUsers = users.filter(
    user => typeof user.role === 'string' && user.role.toLowerCase() === 'operario'
  );

const loadData = async () => {
    try {
      const [factRes, desRes, detRes, tipoRes, userRes] = await Promise.all([
        api.get('/facturas'),
        api.get('/despostes'),
        api.get('/detalles_corte'),
        api.get('/tipos_corte'),
        api.get('/usuarios')
      ]);

      const invoicesData = factRes.data || [];
      setInvoices(invoicesData);

      const canalMap = {};
      invoicesData.forEach(inv => {
        (inv.channels || []).forEach(ch => {
          canalMap[ch.id] = { code: ch.code, type: ch.type, invoiceId: inv.id };
        });
      });

      const cutTypesByMeat = {};
      const cutNameToId = {};
      const cutIdToName = {};
      (tipoRes.data || []).forEach(t => {
        if (!cutTypesByMeat[t.producto]) cutTypesByMeat[t.producto] = [];
        cutTypesByMeat[t.producto].push(t.nombre_corte);
        cutNameToId[t.nombre_corte] = t.id_tipo_corte;
        cutIdToName[t.id_tipo_corte] = t.nombre_corte;
      });

      const desposteMap = {};
      const desposteList = desRes.data || [];
      desposteList.forEach(d => {
        desposteMap[d.id_desposte] = d;
      });

      const mappedCuts = (detRes.data || []).map(det => {
        const des = desposteMap[det.id_desposte] || {};
        const canal = canalMap[det.id_canal] || {};
        return {
          id: det.id_detalle,
          invoiceId: canal.invoiceId || des.id_factura,
          operatorId: des.id_usuario,
          carcassCode: canal.code || String(det.id_canal),
          cutType: cutIdToName[det.id_tipo_corte] || String(det.id_tipo_corte),
          weight: parseFloat(det.peso),
          quantity: det.cantidad,
          processingDate: des.fecha
        };
      });

      const userList = (userRes.data || []).map(u => ({
        id: u.id,
        fullName: u.nombre,
        role: u.role
      }));

      setCuts(mappedCuts);
      setDespostes(desposteList);
      setUsers(userList);
      setCutTypes(cutTypesByMeat);
      setCutTypeNameToId(cutNameToId);
    } catch (error) {
      console.error('Error loading initial data for DeboningForm:', error);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
  
    loadData();
  }, []);


  useEffect(() => {
    if (selectedInvoiceId) {
      const invoice = invoices.find(inv => inv.id === selectedInvoiceId);
      if (invoice) {
        const despostedCarcassCodes = cuts
          .filter(cut => cut.invoiceId === selectedInvoiceId)
          .map(cut => cut.carcassCode);

        const available = invoice.channels.filter(channel =>
          !despostedCarcassCodes.includes(channel.code)
        );
        setAvailableCarcasses(available);
        setSelectedCarcassCode('');
        setCurrentCutsForCarcass([]);
      }
    } else {
      setAvailableCarcasses([]);
      setSelectedCarcassCode('');
        setCurrentCutsForCarcass([]);
    }
  }, [selectedInvoiceId, invoices, cuts]);

  useEffect(() => {
    setCurrentCutsForCarcass([]);
  }, [selectedCarcassCode]);

  useEffect(() => {
    const dateFilteredCuts = filterByDateRange(cuts, startDate, endDate, 'processingDate');

    const grouped = dateFilteredCuts.reduce((acc, cut) => {
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
  }, [cuts, invoices, searchTerm, startDate, endDate]);


  const handleNewCutChange = (e) => {
    const { name, value } = e.target;
    setNewCut({ ...newCut, [name]: value });
  };

  const handleAddTemporaryCut = () => {
    if (!newCut.cutType || !newCut.weight || !newCut.quantity) {
      alert('Por favor, completa todos los campos del corte.');
      return;
    }

    const id = `temp-cut-${Date.now()}`;
    const cutToAdd = {
      id,
      cutType: newCut.cutType,
      weight: parseFloat(newCut.weight),
      quantity: parseInt(newCut.quantity, 10),
    };

    setCurrentCutsForCarcass([...currentCutsForCarcass, cutToAdd]);
    setNewCut({ cutType: '', weight: '', quantity: '' });
  };

  const handleDeleteTemporaryCut = (id) => {
    setCurrentCutsForCarcass(currentCutsForCarcass.filter(cut => cut.id !== id));
  };

  const handleRegisterAllCuts = async () => {
    if (currentCutsForCarcass.length === 0) {
      alert('No hay cortes para registrar.');
      return;
    }
    if (!selectedInvoiceId || !selectedOperatorId || !selectedCarcassCode) {
       alert('Por favor, selecciona la factura, el operario y el canal.');
       return;
    }

    const invoice = invoices.find(inv => inv.id === selectedInvoiceId);
    const channel = invoice ? invoice.channels.find(c => c.code === selectedCarcassCode) : null;
    if (!channel) {
      alert('Canal no encontrado en la factura seleccionada.');
      return;
    }

     const cutsToSend = currentCutsForCarcass.map(cut => ({
      canalId: channel.id,
      cutTypeId: cutTypeNameToId[cut.cutType],
      weight: cut.weight,
      quantity: cut.quantity
    }));

    try {
      await api.post('/despostes', {
        id_factura: selectedInvoiceId,
        id_usuario: selectedOperatorId,
        cuts: cutsToSend
      });
      await loadData();
      setCurrentCutsForCarcass([]);
      setSelectedCarcassCode('');
      setNewCut({ cutType: '', weight: '', quantity: '' });
      alert('Cortes registrados con éxito!');
    } catch (error) {
      console.error('Error registering cuts:', error);
      alert('Error al registrar los cortes. Intenta de nuevo.');
    }
  };


  const getTotalWeightSummary = (cutsList) => {
    const totalWeight = cutsList.reduce((sum, cut) => sum + parseFloat(cut.weight), 0);
    return totalWeight.toFixed(2);
  };

  const getInvoiceNumber = (invoiceId) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    return invoice ? invoice.number : 'Desconocida';
  };

  const getOperatorName = (operatorId) => {
    const operator = users.find(user => user.id === operatorId);
    return operator ? operator.fullName : 'Desconocido';
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

  const getMermaByMeatType = (invoiceId, cutsList) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return {};

    const totalChannelWeight = invoice.channels.reduce((acc, channel) => {
      acc[channel.type] = (acc[channel.type] || 0) + channel.weight;
      return acc;
    }, {});

    const totalCutWeight = cutsList.reduce((acc, cut) => {
      const channel = invoice.channels.find(ch => ch.code === cut.carcassCode);
      if (channel) {
         acc[channel.type] = (acc[channel.type] || 0) + cut.weight;
      }
      return acc;
    }, {});

    const merma = {};
    Object.keys(totalChannelWeight).forEach(meatType => {
      const channelWeight = totalChannelWeight[meatType] || 0;
      const cutWeight = totalCutWeight[meatType] || 0;
      merma[meatType] = channelWeight - cutWeight;
    });

     Object.keys(totalCutWeight).forEach(meatType => {
        if (!merma.hasOwnProperty(meatType)) {
             merma[meatType] = -(totalCutWeight[meatType] || 0);
        }
     });


    return Object.entries(merma);
  };


  const getCarcassType = (carcassCode) => {
    const invoice = invoices.find(inv => inv.id === selectedInvoiceId);
    if (invoice) {
      const channel = invoice.channels.find(ch => ch.code === carcassCode);
      return channel ? channel.type : 'Desconocido';
    }
    return 'Desconocido';
  };

  const availableCutTypes = selectedCarcassCode ? cutTypes[getCarcassType(selectedCarcassCode)] || [] : [];

  const invoicesWithoutDeboning = invoices.filter(invoice => {
    const hasDeboning = despostes.some(d => d.id_factura === invoice.id);
    return !hasDeboning;
  });

  const groupedCutsArray = Object.entries(groupedCuts);

  const sortedGroupedCuts = groupedCutsArray.sort(([, cutsA], [, cutsB]) => {
      const dateA = cutsA.length > 0 ? new Date(cutsA[0].processingDate) : new Date(0);
      const dateB = cutsB.length > 0 ? new Date(cutsB[0].processingDate) : new Date(0);
      return dateB - dateA;
  });


  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedGroupedCuts = sortedGroupedCuts.slice(startIndex, endIndex);

  const totalPages = Math.ceil(sortedGroupedCuts.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Registro de Despostes</h2>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Nuevo Desposte</h3>

        <div className="mt-3">
          <label htmlFor="invoice" className="block text-sm font-medium text-gray-700">Seleccionar Factura Pendiente de Desposte</label>
          <select
            id="invoice"
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(Number(e.target.value))}
            className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          >
            <option value="">Selecciona una Factura</option>
            {invoicesWithoutDeboning.map(invoice => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.number} ({invoice.date})
              </option>
            ))}
          </select>
           {invoicesWithoutDeboning.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">No hay facturas pendientes de desposte.</p>
          )}
        </div>

        <div className="mt-3">
          <label htmlFor="operatorId" className="block text-sm font-medium text-gray-700">Operario que Desposta</label>
          <select
            id="operatorId"
            name="operatorId"
            value={selectedOperatorId}
            onChange={(e) => setSelectedOperatorId(Number(e.target.value))}
            className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          >
            <option value="">Selecciona un Operario</option>
            {operarioUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3">
          <label htmlFor="carcass" className="block text-sm font-medium text-gray-700">Seleccionar Canal a Despostar</label>
          <select
            id="carcass"
            value={selectedCarcassCode}
            onChange={(e) => setSelectedCarcassCode(e.target.value)}
            className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            disabled={!selectedInvoiceId || availableCarcasses.length === 0}
          >
            <option value="">Selecciona un Canal</option>
            {availableCarcasses.map(carcass => (
              <option key={carcass.code} value={carcass.code}>
                {`Código: ${carcass.code} (${carcass.type}, ${carcass.weight}kg)`}
              </option>
            ))}
          </select>
           {selectedInvoiceId && availableCarcasses.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">No hay canales disponibles para despostar en esta factura.</p>
          )}
        </div>

        {selectedCarcassCode && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Registrar Cortes para Canal {selectedCarcassCode} ({getCarcassType(selectedCarcassCode)})</h4>

            <div className="mt-3">
              <label htmlFor="cutType" className="block text-sm font-medium text-gray-700">Tipo de Corte</label>
              <select
                id="cutType"
                name="cutType"
                value={newCut.cutType}
                onChange={handleNewCutChange}
                className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              >
                <option value="">Selecciona un Tipo de Corte</option>
                {availableCutTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label htmlFor="cutWeight" className="block text-sm font-medium text-gray-700">Peso del Corte (kg)</label>
              <input
                type="number"
                id="cutWeight"
                name="weight"
                placeholder="Ej: 50"
                value={newCut.weight}
                onChange={handleNewCutChange}
                className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>

             <div className="mt-3">
              <label htmlFor="cutQuantity" className="block text-sm font-medium text-gray-700">Cantidad de Piezas</label>
              <input
                type="number"
                id="cutQuantity"
                name="quantity"
                placeholder="Ej: 2"
                value={newCut.quantity}
                onChange={handleNewCutChange}
                className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>

            <button
              onClick={handleAddTemporaryCut}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Agregar Corte a la Lista
            </button>
          </div>
        )}

        {currentCutsForCarcass.length > 0 && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Cortes Temporales para Canal {selectedCarcassCode}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCutsForCarcass.map(cut => (
                <div key={cut.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-gray-700 font-medium">{cut.cutType}: <span className="font-normal">{cut.weight} kg</span></p>
                    <p className="text-gray-700 font-medium">Cantidad: <span className="font-normal">{cut.quantity} piezas</span></p>
                  </div>
                  <button
                    onClick={() => handleDeleteTemporaryCut(cut.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <h5 className="text-md font-semibold text-gray-800 mb-2">Resumen de Peso Total Temporal</h5>
              <p className="text-gray-700">Total Despostado: {getTotalWeightSummary(currentCutsForCarcass)} kg</p>
            </div>

            <button
              onClick={handleRegisterAllCuts}
              className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Registrar Todos los Cortes
            </button>
          </div>
        )}
      </div>

      {/* Sección de Visualización de Despostes Integrada */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Despostes Registrados por Factura</h2>

        <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Filtros de Despostes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search-deboning" className="block text-sm font-medium text-gray-700">Buscar (Número Factura)</label>
              <input
                type="text"
                id="search-deboning"
                placeholder="Ej: FAC-2023-001"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>
             <div>
              <label htmlFor="start-date-deboning" className="block text-sm font-medium text-gray-700">Fecha Inicio Desposte</label>
              <input
                type="date"
                id="start-date-deboning"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>
            <div>
              <label htmlFor="end-date-deboning" className="block text-sm font-medium text-gray-700">Fecha Fin Desposte</label>
              <input
                type="date"
                id="end-date-deboning"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>
          </div>
           <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>


        {paginatedGroupedCuts.length > 0 ? (
          <div className="space-y-8">
            {paginatedGroupedCuts.map(([invoiceNumber, cutsList]) => {
              const invoice = invoices.find(inv => inv.number === invoiceNumber);
              const invoiceId = invoice ? invoice.id : null;

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
                        <p className="text-gray-600 text-sm">Operario: {getOperatorName(cut.operatorId)}</p>
                        <p className="text-gray-600 text-sm">Fecha: {cut.processingDate}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <h5 className="text-md font-semibold text-gray-800 mb-2">Resumen de Peso por Tipo de Corte en esta Factura</h5>
                    {getCutsSummary(cutsList).map(([type, totalWeight]) => (
                      <p key={type} className="text-gray-700">{type}: {totalWeight.toFixed(2)} kg</p>
                    ))}

                    <h5 className="text-md font-semibold text-gray-800 mt-4 mb-2">Total Kilos Despostado y Merma por Tipo de Carne</h5>
                    {getTotalWeightByMeatType(cutsList).map(([meatType, totalWeight]) => (
                      <p key={meatType} className="text-gray-700">{meatType} (Despostado): {totalWeight.toFixed(2)} kg</p>
                    ))}
                     {invoiceId && getMermaByMeatType(invoiceId, cutsList).map(([meatType, mermaWeight]) => (
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
          <p className="text-gray-600">No hay despostes registrados que coincidan con la búsqueda o rango de fechas.</p>
        )}
      </div>

       {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === index + 1
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeboningForm;