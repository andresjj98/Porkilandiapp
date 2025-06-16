import React, { useState, useEffect } from 'react';
//import { getStorage, setStorage } from '../utils/storage';
//import { initialInvoices } from '../mock/invoices';
//import { initialCutTypes } from '../mock/cutTypes';
import { filterByDateRange } from '../utils/dateFilters';
//import { initialUsers } from '../mock/users';
import api from '../services/api';


const DeboningForm = () => {
  const [invoices, setInvoices] = useState([]); // Inicializar vacío
  const [cuts, setCuts] = useState([]); // Inicializar vacío
  const [users, setUsers] = useState([]); // Inicializar vacío
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [availableCarcasses, setAvailableCarcasses] = useState([]);
  const [selectedCarcassCode, setSelectedCarcassCode] = useState('');
  const [currentCutsForCarcass, setCurrentCutsForCarcass] = useState([]);
  const [newCut, setNewCut] = useState({ cutType: '', weight: '', quantity: '' });
  const [productos, setProductos] = useState([]); // Inicializar lista de productos desde el back

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupedCuts, setGroupedCuts] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

 const operarioUsers = users.filter(
    user =>
      typeof user.role === 'string' &&
      user.role.toLowerCase() === 'operario'
  );

  const [cutTypes, setCutTypes] = useState([]);
  const [registeredDeboning, setRegisteredDeboning] = useState([]);

  const loadRegisteredDeboning = async () => {
  try {
    const { data } = await api.get('/despostes');
    setRegisteredDeboning(data);
  } catch (e) {
    console.error('Error cargando despostes:', e);
  }
};


  // Cargar datos al montar el componente
  // AHORA: carga facturas, despostes, usuarios y productos desde tu API
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1) Todas las facturas
        const { data: facturas } = await api.get('/facturas');
        // 2) Despostes ya hechos (para excluirlos)
        const { data: despostes } = await api.get('/despostes');
        const hechosIds = despostes.map(d => d.id_factura);
        // filtramos facturas que aún no tienen desposte
        setInvoices(facturas.filter(f => !hechosIds.includes(f.id_factura)));

        // 3) Todos los usuarios → solo operarios
     const { data: allUsers } = await api.get('/usuarios');
     setUsers(allUsers);
        // 4) Lista de productos (tipos de carne)
        const { data: prods } = await api.get('/productos');
        setProductos(prods || []);
      } catch (err) {
        console.error('Error cargando datos de desposte:', err);
      }
      
      // 5) Traer todos los despostes (con sus detalles de corte si tu back ya los manda)
      await loadRegisteredDeboning();
    };
    loadData();
  }, []);


useEffect(() => {
  // si no hay factura seleccionada, limpiamos
  if (!selectedInvoiceId) {
    setAvailableCarcasses([]);
    setSelectedCarcassCode('');
    setCurrentCutsForCarcass([]);
    return;
  }

  // función asíncrona para cargar los canales de la factura
  const loadCanales = async () => {
    try {
      // GET /api/canales?factura=ID
      const { data } = await api.get(`/canales?factura=${selectedInvoiceId}`);
      setAvailableCarcasses(data || []);
      setSelectedCarcassCode('');
      setCurrentCutsForCarcass([]);
    } catch (err) {
      console.error('Error cargando canales de la factura:', err);
      setAvailableCarcasses([]);
      setSelectedCarcassCode('');
      setCurrentCutsForCarcass([]);
    }
  };

  loadCanales();
}, [selectedInvoiceId]);


useEffect(() => {
  // 1) Si no hay canal seleccionado, limpiamos solo cutTypes
  if (!selectedCarcassCode) {
    setCutTypes([]);
    return;
  }

    // 2) Obtenemos el id numérico del canal
    const canalId = parseInt(selectedCarcassCode, 10);
    // 3) Buscamos el canal en availableCarcasses para extraer id_producto
    const canal = availableCarcasses.find(c => c.id_canal === canalId);
    if (!canal) {
      setCutTypes([]);
      return;
    }

  // 3) Llamamos al endpoint que filtra por id_producto
  api
    .get(`/tipos_corte?producto=${canal.id_producto}`)
    .then(({ data }) => setCutTypes(data))
    .catch(err => {
      console.error('Error cargando tipos de corte:', err);
      setCutTypes([]);
    });
}, [selectedCarcassCode, availableCarcasses]);

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

const handleRegisterAllCuts = async () => {
  if (currentCutsForCarcass.length === 0) {
    return alert('No hay cortes para registrar.');
  }
  if (!selectedInvoiceId || !selectedOperatorId || !selectedCarcassCode) {
    return alert('Por favor, selecciona factura, operario y canal.');
  }

  // Armo el array de detalles con los nombres que valida el backend:
  const cutsPayload = currentCutsForCarcass.map(cut => ({
    canalId:      Number(selectedCarcassCode),
    cutTypeId:    Number(cut.cutType),    // Debe ser el id_tipo_corte
    weight:       cut.weight,
    quantity:     cut.quantity
  }));

  try {
    // Un solo POST con todo
    const { data: res } = await api.post('/despostes', {
      id_factura: Number(selectedInvoiceId),
      id_usuario: Number(selectedOperatorId),
      cuts:       cutsPayload
    });
    await loadRegisteredDeboning();
    // Limpio estado y muestro éxito
    setCurrentCutsForCarcass([]);
    setSelectedCarcassCode('');
    setNewCut({ cutType:'', weight:'', quantity:'' });
    alert('Desposte y cortes registrados con éxito!');

  } catch (err) {
    console.error('Error registrando desposte y cortes:', err);
    const msg = err.response?.data?.errors
      ? err.response.data.errors.map(e=>e.msg).join('\n')
      : 'Hubo un error al guardar en la BD.';
    alert(msg);
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
    const op = users.find(u => u.id_usuario === operatorId);
    return op ? op.nombre : 'Desconocido';
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

  // Ahora, todos los productos (ej: “Res”, “Cerdo”, “Pollo”, etc.) aparecerán:
  const availableCutTypes = selectedCarcassCode ? productos.map(p => p.nombre) : [];

  const invoicesWithoutDeboning = invoices.filter(invoice => {
    const hasDeboning = cuts.some(cut => cut.invoiceId === invoice.id);
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
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
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
            onChange={(e) => setSelectedOperatorId(parseInt(e.target.value, 10))}
            className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          >
            <option value="">Selecciona un Operario</option>
            {operarioUsers.map(u => (
            <option key={u.id} value={u.id}>
              {u.nombre}
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
            {availableCarcasses.map(c => (
  <option key={c.id_canal} value={c.id_canal}>
    {`Código: ${c.codigo_canal} (` +
      `${productos.find(p => p.id_producto === c.id_producto)?.nombre || 'Desconocido'}, ` +
      `${c.peso} kg)` }
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
                {cutTypes.map(tc => (
    <option key={tc.id_tipo_corte} value={tc.id_tipo_corte}>
      {tc.nombre_corte}
    </option>
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


{registeredDeboning.length > 0 ? (
  <div className="space-y-6">
    {registeredDeboning
      .filter(d => {
  const invoice = invoices.find(inv => inv.id === d.id_factura);
  // con el segundo `?` protegemos tambien el número:
  const num = invoice?.number?.toLowerCase() || '';
  return (
    num.includes(searchTerm.toLowerCase()) &&
    (!startDate || d.fecha >= startDate) &&
    (!endDate   || d.fecha <= endDate)
  );
})
      .map(d => {
        const invoice = invoices.find(inv => inv.id === d.id_factura);
        return (
          <div key={d.id_desposte} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold text-gray-800">
                Factura:  {invoice?.number || '—'}
              </h3>
              <p className="text-gray-600 text-sm">{d.fecha}</p>
            </div>
            <p className="text-gray-700 mb-2">
              Operario: {getOperatorName(d.id_usuario)}
            </p>
            <h4 className="font-medium text-gray-800 mb-1">Cortes:</h4>
           {(d.detalles || []).length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {d.detalles.map(det => (
      <div key={det.id_detalle} className="border border-gray-200 rounded-lg p-4 bg-white">
        <p className="text-gray-700"><span className="font-medium">Corte:</span> {det.nombre_corte}</p>
        <p className="text-gray-700"><span className="font-medium">Canal Código:</span> {det.codigo_canal || det.id_canal}</p>
        <p className="text-gray-700"><span className="font-medium">Peso:</span> {det.peso} kg</p>
        <p className="text-gray-700"><span className="font-medium">Cantidad:</span> {det.cantidad} piezas</p>
        <p className="text-gray-600 text-sm"><span className="font-medium">Operario:</span> {getOperatorName(d.id_usuario)}</p>
        <p className="text-gray-600 text-sm"><span className="font-medium">Fecha:</span> {d.fecha.split('T')[0]}</p>
      </div>
    ))}
  </div>
) : (
  <p className="text-gray-500">No hay cortes registrados</p>
)}
          </div>
        );
      })
    }
  </div>
) : (
  <p className="text-gray-600">
    No hay despostes registrados que coincidan con la búsqueda o rango de fechas.
  </p>
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