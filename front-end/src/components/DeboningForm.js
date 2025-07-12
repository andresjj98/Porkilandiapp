import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { InventoryContext } from '../contexts/InventoryContext';
import { filterByDateRange } from '../utils/dateFilters';



const DeboningForm = ({ userRole }) => {
  const [invoices, setInvoices] = useState([]); // Inicializar vacío
  const [cuts, setCuts] = useState([]); // Inicializar vacío
  const [despostes, setDespostes] = useState([]);
  const [users, setUsers] = useState([]); // Inicializar vacío
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [availableChannels, setAvailableChannels] = useState([]);
  const [selectedChannelCodes, setSelectedChannelCodes] = useState([]);
  const [currentCuts, setCurrentCuts] = useState([]);
  const [newCut, setNewCut] = useState({ cutType: '', weight: '', quantity: '' });
  const [cutTypes, setCutTypes] = useState({}); // Inicializar vacío
  const [cutTypeNameToId, setCutTypeNameToId] = useState({});
  const [desposteChannelsMap, setDesposteChannelsMap] = useState({});

  const { refreshInventory } = useContext(InventoryContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupedCuts, setGroupedCuts] = useState({});

  const [editingDesposteId, setEditingDesposteId] = useState(null);
  const [editedDesposte, setEditedDesposte] = useState({ invoiceId: '', operatorId: '', date: '' });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const operarioUsers = users.filter(
    user => typeof user.role === 'string' && user.role.toLowerCase() === 'operario'
  );

const loadData = async () => {
    try {
      const [factRes, desRes, detRes, prodRes, userRes] = await Promise.allSettled([
        api.get('/facturas'),
        api.get('/despostes'),
        api.get('/detalles_corte'),
        api.get('/productos'),
        api.get('/usuarios')
      ]);

      const invoicesData = factRes.status === 'fulfilled' ? factRes.value.data : [];
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
      const prodData = prodRes.status === 'fulfilled' ? prodRes.value.data : [];
      (prodData || []).forEach(p => {
        if (!cutTypesByMeat[p.tipo_carne]) cutTypesByMeat[p.tipo_carne] = [];
        if (!cutTypesByMeat[p.tipo_carne].includes(p.tipo_corte)) {
          cutTypesByMeat[p.tipo_carne].push(p.tipo_corte);
        }
        cutNameToId[p.tipo_corte] = p.id_tipo_corte;
        cutIdToName[p.id_tipo_corte] = p.tipo_corte;
      });

      const desposteMap = {};
      const desposteList = desRes.status === 'fulfilled' ? desRes.value.data : [];
      const desCanalMap = {};
      for (const d of desposteList) {
        desposteMap[d.id_desposte] = d;
      try {
          const resp = await api.get(`/desposte_canales?desposte=${d.id_desposte}`);
          desCanalMap[d.id_desposte] = resp.data || [];
        } catch (err) {
          desCanalMap[d.id_desposte] = [];
        }
      }

      const detData = detRes.status === 'fulfilled' ? detRes.value.data : [];
      const mappedCuts = (detData || []).map(det => {
        const des = desposteMap[det.id_desposte] || {};        
        return {
          id: det.id_detalle,
          desposteId: det.id_desposte,
          invoiceId: des.id_factura,
          operatorId: des.id_usuario,
          channelCodes: (desCanalMap[det.id_desposte] || []).map(cid => canalMap[cid]?.code || cid),
          cutType: cutIdToName[det.id_tipo_corte] || String(det.id_tipo_corte),
          weight: parseFloat(det.peso),
          quantity: det.cantidad,
          processingDate: des.fecha
        };
      });

      const userData = userRes.status === 'fulfilled' ? userRes.value.data : [];
      const userList = (userData || []).map(u => ({
        id: u.id,
        fullName: u.nombre,
        role: u.role
      }));

      setCuts(mappedCuts);
      setDespostes(desposteList);
      setDesposteChannelsMap(desCanalMap);
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
        const usedCodes = Object.entries(desposteChannelsMap).flatMap(([_, codes]) => {
          const des = despostes.find(d => d.id_desposte === Number(_));
          return des && des.id_factura === selectedInvoiceId ? codes.map(id => invoice.channels.find(c=>c.id===id)?.code) : [];
        });
        const available = invoice.channels.filter(ch => !usedCodes.includes(ch.code));
        setAvailableChannels(available);
        setSelectedChannelCodes([]);
        setCurrentCuts([]);
      }
    } else {
      setAvailableChannels([]);
      setSelectedChannelCodes([]);
      setCurrentCuts([]);
    }
  }, [selectedInvoiceId, invoices, desposteChannelsMap, despostes]);

  useEffect(() => {
    setCurrentCuts([]);
  }, [selectedChannelCodes.join(',')]);

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

    setCurrentCuts([...currentCuts, cutToAdd]);
    setNewCut({ cutType: '', weight: '', quantity: '' });
  };

  const handleDeleteTemporaryCut = (id) => {
    setCurrentCuts(currentCuts.filter(cut => cut.id !== id));
  };

  const handleRegisterAllCuts = async () => {
    if (currentCuts.length === 0) {
      alert('No hay cortes para registrar.');
      return;
    }
   if (
      selectedInvoiceId === '' ||
      selectedOperatorId === '' ||
      selectedChannelCodes.length === 0
    ) {
      alert('Por favor, selecciona la factura, el operario y al menos un canal.');
      return;
    }

    const invoice = invoices.find(inv => inv.id === selectedInvoiceId);
    const channelIds = invoice ? invoice.channels.filter(c => selectedChannelCodes.includes(c.code)).map(c=>c.id) : [];
      const cutsToSend = currentCuts.map(cut => ({
      cutTypeId: cutTypeNameToId[cut.cutType],
      weight: cut.weight,
      quantity: cut.quantity
    }));

    try {
      await api.post('/despostes', {
        id_factura: selectedInvoiceId,
        id_usuario: selectedOperatorId,
        channelIds,
        cuts: cutsToSend
      });
      await loadData();
      await refreshInventory();
      setCurrentCuts([]);
      setSelectedChannelCodes([]);
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

  const getTotalWeightByInvoice = (invoiceId, cutsList) => {
    return cutsList.reduce((sum, cut) =>
      cut.invoiceId === invoiceId ? sum + cut.weight : sum, 0);
  };

  const getMermaByInvoice = (invoiceId, cutsList) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return 0;

    const channels = invoice.channels;
    const selectedIds = Object.entries(desposteChannelsMap).reduce((acc,[dId,ids])=>{
      const d = despostes.find(ds=>ds.id_desposte===Number(dId));
      if(d && d.id_factura===invoiceId) acc.push(...ids);
      return acc;
   },[]);
    const totalChannelWeight = channels.filter(ch=>selectedIds.includes(ch.id)).reduce((s,ch)=>s+parseFloat(ch.weight),0);
    const cutsWeight = getTotalWeightByInvoice(invoiceId, cutsList);
    return totalChannelWeight - cutsWeight;
  };
const getMermaByMeatType = (invoiceId, cutsList) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return [];

    const channelWeights = invoice.channels.reduce((acc, channel) => {
      acc[channel.type] = (acc[channel.type] || 0) + parseFloat(channel.weight);
      return acc;
    }, {});

    const cutWeights = cutsList.reduce((acc, cut) => {
      if (cut.invoiceId === invoiceId) {
        const type = getSelectedMeatType();
        acc[type] = (acc[type] || 0) + cut.weight;
      }
      return acc;
    }, {});

    const merma = {};
    Object.keys(channelWeights).forEach(type => {
      const channelWeight = channelWeights[type] || 0;
      const cutWeight = cutWeights[type] || 0;
      merma[type] = channelWeight - cutWeight;
    });

    return Object.entries(merma);
  };


  const getSelectedMeatType = () => {
    const invoice = invoices.find(inv => inv.id === selectedInvoiceId);
    if (!invoice) return '';
    const ch = invoice.channels.find(c => selectedChannelCodes.includes(c.code));
    return ch ? ch.type : '';
  };

  const availableCutTypes = selectedChannelCodes.length > 0 ? cutTypes[getSelectedMeatType()] || [] : [];

// Mostrar solo las facturas que tienen al menos un canal pendiente de desposte
  const invoicesWithPendingChannels = invoices.filter(invoice => {
    const usedIds = Object.entries(desposteChannelsMap).reduce((acc,[dId,ids])=>{
      const d = despostes.find(ds=>ds.id_desposte===Number(dId));
      if(d && d.id_factura===invoice.id) acc.push(...ids);
      return acc;
    },[]);
    return invoice.channels.some(ch => !usedIds.includes(ch.id));
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

 const handleEditDesposte = (des) => {
    setEditingDesposteId(des.id_desposte);
    setEditedDesposte({
      invoiceId: des.id_factura,
      operatorId: des.id_usuario,
      date: des.fecha
    });
  };

  const handleEditedDesposteChange = (e) => {
    const { name, value } = e.target;
    setEditedDesposte(prev => ({ ...prev, [name]: value }));
  };

  const handleCancelEditDesposte = () => {
    setEditingDesposteId(null);
    setEditedDesposte({ invoiceId: '', operatorId: '', date: '' });
  };

  const handleSaveEditedDesposte = async () => {
    if (!editedDesposte.invoiceId || !editedDesposte.operatorId || !editedDesposte.date) {
      alert('Por favor, completa todos los campos.');
      return;
    }
    try {
      await api.put(`/despostes/${editingDesposteId}`, {
        id_factura: editedDesposte.invoiceId,
        id_usuario: editedDesposte.operatorId,
        fecha: editedDesposte.date
      });
      await loadData();
      await refreshInventory();
      handleCancelEditDesposte();
      alert('Desposte actualizado con éxito!');
    } catch (error) {
      console.error('Error updating deboning:', error);
      alert('Error al actualizar el desposte. Intenta de nuevo.');
    }
  };

  const handleDeleteDesposte = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este desposte?')) {
      try {
        await api.delete(`/despostes/${id}`);
        await loadData();
        await refreshInventory();
        alert('Desposte eliminado con éxito!');
      } catch (error) {
        console.error('Error deleting deboning:', error);
        alert('Error al eliminar el desposte. Intenta de nuevo.');
      }
    }
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
             {invoicesWithPendingChannels.map(invoice => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.number} ({invoice.date})
              </option>
            ))}
          </select>
            {invoicesWithPendingChannels.length === 0 && (
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
           <label className="block text-sm font-medium text-gray-700">Seleccionar Canales a Despostar</label>
          <div className="mt-2 space-y-1">
            {availableChannels.map(ch => (
              <label key={ch.code} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedChannelCodes.includes(ch.code)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedChannelCodes([...selectedChannelCodes, ch.code]);
                    } else {
                      setSelectedChannelCodes(selectedChannelCodes.filter(c => c !== ch.code));
                    }
                  }}
                />
                <span>{`Código: ${ch.code} (${ch.type}, ${ch.weight}kg)`}</span>
              </label>
            ))}
          {selectedInvoiceId && availableChannels.length === 0 && (
              <p className="text-sm text-gray-500">No hay canales disponibles para despostar en esta factura.</p>
            )}
          </div>
        </div>

        {selectedChannelCodes.length > 0 && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Registrar Cortes para Canales {selectedChannelCodes.join(', ')}</h4>

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

        {currentCuts.length > 0 && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Cortes Temporales para Canales {selectedChannelCodes.join(', ')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCuts.map(cut => (
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
              <p className="text-gray-700">Total Despostado: {getTotalWeightSummary(currentCuts)} kg</p>
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

                  {Object.entries(cutsList.reduce((acc, cut) => {
                    if (!acc[cut.desposteId]) acc[cut.desposteId] = [];
                    acc[cut.desposteId].push(cut);
                    return acc;
                  }, {})).map(([desId, desCuts]) => {
                    const des = despostes.find(d => d.id_desposte === Number(desId)) || {};
                    return (
                      <div key={desId} className="mb-6 border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-gray-700 font-medium">Desposte ID: {desId}</p>
                            <p className="text-gray-600 text-sm">Operario: {getOperatorName(des.id_usuario)}</p>
                            <p className="text-gray-600 text-sm">Fecha: {des.fecha}</p>
                          </div>
                          {userRole === 'admin' && (
                            <div className="flex space-x-2">
                              <button onClick={() => handleEditDesposte(des)} className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">Editar</button>
                              <button onClick={() => handleDeleteDesposte(desId)} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">Eliminar</button>
                            </div>
                          )}
                        </div>

                        {editingDesposteId === Number(desId) ? (
                          <div className="space-y-3 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Factura</label>
                              <select name="invoiceId" value={editedDesposte.invoiceId} onChange={handleEditedDesposteChange} className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition">
                                <option value="">Selecciona una Factura</option>
                                {invoices.map(inv => (
                                  <option key={inv.id} value={inv.id}>{inv.number}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Operario</label>
                              <select name="operatorId" value={editedDesposte.operatorId} onChange={handleEditedDesposteChange} className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition">
                                <option value="">Selecciona un Operario</option>
                                {operarioUsers.map(u => (
                                  <option key={u.id} value={u.id}>{u.fullName}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Fecha</label>
                              <input type="date" name="date" value={editedDesposte.date} onChange={handleEditedDesposteChange} className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition" />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <button onClick={handleCancelEditDesposte} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">Cancelar</button>
                              <button onClick={handleSaveEditedDesposte} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Guardar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {desCuts.map(cut => (
                              <div key={cut.id} className="border border-gray-200 rounded-lg p-3">
                                <p className="text-gray-700 font-medium">Corte: <span className="font-normal">{cut.cutType}</span></p>
                                <p className="text-gray-700 font-medium">Canales: <span className="font-normal">{cut.channelCodes.join(', ')}</span></p>
                                <p className="text-gray-700 font-medium">Peso: <span className="font-normal">{cut.weight} kg</span></p>
                                <p className="text-gray-700 font-medium">Cantidad: <span className="font-normal">{cut.quantity} piezas</span></p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <h5 className="text-md font-semibold text-gray-800 mb-2">Resumen de Peso por Tipo de Corte en esta Factura</h5>
                    {getCutsSummary(cutsList).map(([type, totalWeight]) => (
                      <p key={type} className="text-gray-700">{type}: {totalWeight.toFixed(2)} kg</p>
                    ))}

                    <h5 className="text-md font-semibold text-gray-800 mt-4 mb-2">Resumen de Peso Total y Merma</h5>
                    <p className="text-gray-700">Total Despostado: {getTotalWeightByInvoice(invoiceId, cutsList).toFixed(2)} kg</p>
                    <p className="text-gray-700">Merma: <span className={`${getMermaByInvoice(invoiceId, cutsList) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{getMermaByInvoice(invoiceId, cutsList).toFixed(2)} kg</span></p>
                    <h5 className="text-md font-semibold text-gray-800 mt-4 mb-2">Merma Total por Tipo de Carne</h5>
                    {invoiceId && getMermaByMeatType(invoiceId, cutsList).map(([type, mermaWeight]) => (
                      <p key={`${type}-total-merma`} className="text-gray-700">
                        {type}: <span className={`${mermaWeight >= 0 ? 'text-green-600' : 'text-red-600'}`}>{mermaWeight.toFixed(2)} kg</span>
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