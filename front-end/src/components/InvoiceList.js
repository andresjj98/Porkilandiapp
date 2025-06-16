// src/components/InvoiceList.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';                // cliente Axios central
import { filterByDateRange } from '../utils/dateFilters';

const sortChannelsNewestFirst = channels =>
  [...channels].sort((a, b) => b.id - a.id);

const InvoiceList = () => {
  /* ---------------------------- estados básicos ---------------------------- */
  const [invoices,        setInvoices]        = useState([]);
  const [suppliers,       setSuppliers]       = useState([]);
  const [users,           setUsers]           = useState([]);
  const [products, setProducts] = useState([]); // NUEVO estado para los tipos de carne
  /* ---------------------------- UI / formularios --------------------------- */
  const [showAddForm,     setShowAddForm]     = useState(false);
  const [showChannelsForm,setShowChannelsForm]= useState(false);
  const [currentInvoiceId,setCurrentInvoiceId]= useState(null);
  const [editingInvoiceId,setEditingInvoiceId]= useState(null);

  const [newInvoice,      setNewInvoice]      = useState({
    number: '', date: '', supplierId: '', operatorId: '', slaughterDate: ''
  });
  const [editedInvoice,   setEditedInvoice]   = useState({ ...newInvoice });

  const [newChannel,      setNewChannel]      = useState({
    code: '', weight: '', type: 'Res', origin: ''
  });
  const [editingChannel,  setEditingChannel]  = useState({
    invoiceId:null, channelId:null,
    data:{ code:'', weight:'', type:'Res', origin:'' }
  });

  const [tempChannels,    setTempChannels]    = useState([]);

  /* ----------------------------- filtros / paginación ---------------------- */
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');
  const [currentPage,setCurrentPage]= useState(1);
  const itemsPerPage = 12;

  /* --------------------------- helpers ------------------------------------- */
// Filtramos “operario” ignorando mayúsculas/minúsculas:
// Filtramos “operario” ignorando mayúsculas/minúsculas:
const operarioUsers = users.filter(u =>
  u.role.toLowerCase() === 'operario'
);

// Para mostrar el nombre del proveedor (ya tienes pos o proveedores):
const getSupplierName = id =>
  suppliers.find(s => s.id_proveedor === id)?.nombre || 'Desconocido';

// Para mostrar el nombre del operario:  
// Tu JSON crudo tiene “nombre” (no fullName), así que devolvemos u.nombre:
const getOperatorName = id =>
  users.find(u => u.id === id)?.nombre || 'Desconocido';
  /* -------------------------- carga inicial -------------------------------- */
   useEffect(() => {
   const loadAll = async () => {
     try {
       // 1) Traer todas las facturas
        const respFacturas = await api.get('/facturas');
          setInvoices(
  (respFacturas.data || []).map(inv => ({
    ...inv,
    date:          inv.date?.split('T')[0]          || '',
    slaughterDate: inv.slaughterDate?.split('T')[0] || ''
  }))
);
          /*id:          f.id_factura,
          number:      f.numero_guia,
          date:        f.fecha,
          supplierId:  f.id_proveedor,
          operatorId:  f.id_usuario,
          slaughterDate: f.fecha_sacrificio,
          // Suponiendo que el back ya te devuelve los canales en `f.canales`
          channels:    f.canales || []
        }));
        setInvoices(mapped);*/

       // 2) Traer todos los proveedores
       const respProveedores = await api.get('/proveedores');
       setSuppliers(respProveedores.data || []);

       // 3) Traer todos los usuarios y filtrar solo aquellos con rol "operario"
       const respUsuarios = await api.get('/usuarios');
const usuariosNorm = (respUsuarios.data || []).map(u => ({
  id:     u.id_usuario,  // si tu API devuelve id_usuario
  nombre: u.nombre,
  role:   u.role
}));
setUsers(usuariosNorm);
      // 4) Traer tipos de carne desde la tabla productos
      const respProductos = await api.get('/productos');
      setProducts(respProductos.data || []);
     } catch (err) {
       console.error('Error cargando datos:', err);
     }
   };
   loadAll();
 }, []);

  /* ---------------------- manejadores de formulario ----------------------- */
  // Después:
const handleInputChange = ({ target: { name, value } }) => {
  setNewInvoice(prev => ({
    ...prev,
    [name]: value       // siempre string
  }));
};

const handleEditedInputChange = ({ target: { name, value } }) => {
  setEditedInvoice(prev => ({
    ...prev,
    [name]: value       // siempre string
  }));
};
  const handleChannelInputChange= e => setNewChannel({    ...newChannel,[e.target.name]:e.target.value });

  /* ------------------------- crear factura ------------------------------- */
  const handleAddInvoice = () => {
    const { number,date,supplierId,operatorId,slaughterDate } = newInvoice;
    if(!number||!date||!supplierId||!operatorId||!slaughterDate){
      return alert('Completa todos los campos de la factura.');
    }
    setCurrentInvoiceId(`temp-${Date.now()}`);
    setTempChannels([]);
    setShowAddForm(false);
    setShowChannelsForm(true);
  };

  /* --------------------- canales temporales ------------------------------ */
  const handleAddTemporaryChannel = () => {
    if(!newChannel.code||!newChannel.weight||!newChannel.type){
      return alert('Completa Código, Peso y Tipo del canal.');
    }
    const ch = { id:`temp-${Date.now()}`, ...newChannel, weight:+newChannel.weight };
    setTempChannels([...tempChannels, ch]);
    setNewChannel({ code:'', weight:'', type:'Res', origin:'' });
  };
  const handleDeleteTemporaryChannel = id =>
    setTempChannels(tempChannels.filter(ch => ch.id !== id));

  /* ------------------- guardar factura + canales ------------------------- */
const handleSaveInvoiceWithChannels = async () => {
  const { number, date, supplierId, operatorId, slaughterDate } = newInvoice;

  // 1) Sin canales no continuar
  if (tempChannels.length === 0) {
    return alert('Agrega al menos un canal.');
  }

  // 2) Campos obligatorios
  if (!number || !date || !supplierId || !operatorId || !slaughterDate) {
    return alert('Completa todos los campos de la factura.');
  }

  // 3) Parseo IDs
  const supplierIdNum = parseInt(supplierId, 10);
  const operatorIdNum = parseInt(operatorId, 10);

  if (isNaN(operatorIdNum)) {
    return alert('Selecciona un Operario válido.');
  }

  // 4) Payload
  const payload = {
    number,
    date,
    supplierId:   supplierIdNum,
    operatorId:   operatorIdNum,
    slaughterDate,
    channels: tempChannels.map(({ code, weight, type, origin }) => ({
      code, weight, type, origin
    }))
  };

  try {
    await api.post('/facturas', payload);
    // recarga
    const resp = await api.get('/facturas');
    setInvoices(resp.data.map(inv => ({
      ...inv,
      date:          inv.date?.split('T')[0]          || '',
      slaughterDate: inv.slaughterDate?.split('T')[0] || ''
    })));
    // reset
    setNewInvoice({ number:'', date:'', supplierId:'', operatorId:'', slaughterDate:'' });
    setTempChannels([]);
    setShowChannelsForm(false);
    alert('Factura guardada con éxito');
  } catch (err) {
    console.error(err);
    const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar factura';
    alert(msg);
  }
};


/* -------------- editar factura (PUT) ----------------------------------- */
const handleSaveEditedInvoice = async () => {
  const { number, date, supplierId, operatorId, slaughterDate, channels = [] } = editedInvoice;

  // 1) Campos obligatorios
  if (!number || !date || !supplierId || !operatorId || !slaughterDate) {
    return alert('Completa todos los campos.');
  }

  // 2) Parseo IDs
  const supplierIdNum = parseInt(supplierId, 10);
  const operatorIdNum = parseInt(operatorId, 10);

  if (isNaN(operatorIdNum)) {
    return alert('Selecciona un Operario válido.');
  }

  // 3) Payload
  const payload = {
    number,
    date,
    supplierId:   supplierIdNum,
    operatorId:   operatorIdNum,
    slaughterDate,
    channels
  };

  try {
    const { data: upd } = await api.put(`/facturas/${editingInvoiceId}`, payload);
    setInvoices(prev => prev.map(i => i.id === editingInvoiceId ? upd : i));
    setEditingInvoiceId(null);
    alert('Factura actualizada con éxito 🎉');
  } catch (err) {
    console.error(err);
    alert('Error actualizando factura');
  }
};


  /* -------------- canales: editar / eliminar ----------------------------- */
  const startEditingChannel = (invoiceId, channel) =>
    setEditingChannel({ invoiceId, channelId:channel.id, data:{...channel} });

  const saveChannelEdit = async () => {
    const { invoiceId, channelId, data } = editingChannel;
    if(!data.code||!data.weight||!data.type) return alert('Completa todos los campos');
    const inv = invoices.find(i => i.id === invoiceId);
    const updatedChannels = inv.channels.map(c => c.id===channelId? {...data,id:channelId}:c);
    try{
      const {data:updInv}= await api.put(`/facturas/${invoiceId}`, {...inv, channels:updatedChannels});
      setInvoices(prev => prev.map(i=>i.id===invoiceId? updInv:i));
      cancelChannelEdit();
      alert('Canal actualizado con éxito 🎉');
    }catch(err){
      console.error(err);
      alert('Error actualizando canal');
    }
  };

  const cancelChannelEdit = () =>
    setEditingChannel({ invoiceId:null, channelId:null, data:{ code:'',weight:'',type:'Res',origin:'' } });

  const handleDeleteChannel = async (invoiceId, channelId) => {
    if(!window.confirm('¿Eliminar este canal?')) return;
    const inv = invoices.find(i=>i.id===invoiceId);
    const updated = inv.channels.filter(c=>c.id!==channelId);
    try{
      const {data:updInv}= await api.put(`/facturas/${invoiceId}`, {...inv, channels:updated});
      setInvoices(prev => prev.map(i=>i.id===invoiceId? updInv:i));
      alert('Canal eliminado con éxito 🗑️');
    }catch(err){
      console.error(err);
      alert('Error eliminando canal');
    }
  };

  /* ---------- limpiar filtros de texto y fecha ---------- */
  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  /* ------------------- utilidades visuales ------------------------------- */
  const getChannelsSummary = ch =>
    Object.entries(ch.reduce((a,c)=>({...a,[c.type]:(a[c.type]||0)+(+c.weight)}),{}));

  const filtered = filterByDateRange(
    invoices.filter(inv => {
      const nv = (inv.number ?? '').toString().toLowerCase();
      const sv = (getSupplierName(inv.supplierId) ?? '').toLowerCase();
      const ov = (getOperatorName(inv.operatorId) ?? '').toLowerCase();
      const st = searchTerm.toLowerCase();
      return nv.includes(st) || sv.includes(st) || ov.includes(st);
    }),
    startDate,
    endDate,
    'date'
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPages = Math.ceil(filtered.length/itemsPerPage);
  const pageItems  = filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);
  const paginatedInvoices = pageItems;   // ← alias para que el JSX siga funcionando

// Cancela el modo edición de factura
const handleCancelEdit = () => {
  setEditingInvoiceId(null);
};

// Elimina una factura
const handleDeleteInvoice = async (id) => {
  if (!window.confirm('¿Estás seguro de que quieres eliminar esta factura?')) return;
  try {
    await api.delete(`/facturas/${id}`);
    const resp = await api.get('/facturas');
    setInvoices(resp.data || []);
    alert('Factura eliminada con éxito 🗑️');
  } catch (err) {
    console.error('Error eliminando factura:', err);
    alert('No se pudo eliminar la factura');
  }
};

// Paginación
const handlePageChange = (page) => {
  setCurrentPage(page);
};

  
  /* ------------------------- renderizado ---------------------------------- */
  /* (el JSX es el mismo que tenías, solo se tocó la lógica)                 */

  /* ------------- por falta de espacio, tu JSX completo permanece igual --- */
  /* Pegalo tal cual desde tu archivo original debajo de esta línea -------- */

  return (<div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Facturas</h2>

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-6 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        {showAddForm ? 'Cancelar' : 'Agregar Nueva Factura'}
      </button>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Nueva Factura</h3>
          <div>
            <label htmlFor="number" className="block text-sm font-medium text-gray-700">Número de Factura</label>
            <input
              type="text"
              id="number"
              name="number"
              placeholder="Ej: FAC-2023-001"
              value={newInvoice.number}
              onChange={handleInputChange}
              className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            />
          </div>
          <div className="mt-3">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Fecha de Factura</label>
            <input
              type="date"
              id="date"
              name="date"
              value={newInvoice.date}
              onChange={handleInputChange}
              className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            />
          </div>
          <div className="mt-3">
            <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">Proveedor</label>
            <select
              id="supplierId"
              name="supplierId"
              value={newInvoice.supplierId}
              onChange={handleInputChange}
              className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            >
              <option value="">Selecciona un Proveedor</option>
              {suppliers.map((supplier, idx) => (
                <option
                  key={`${supplier.id_proveedor}-${idx}`}
                  value={supplier.id_proveedor}
                >
                  {supplier.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3">
            <label htmlFor="operatorId" className="block text-sm font-medium text-gray-700">Operario que Registra</label>
            <select
              id="operatorId"
              name="operatorId"
              value={newInvoice.operatorId}
              onChange={handleInputChange}
              className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            >
               <option value="">Selecciona un Operario</option>
               {operarioUsers.map((user, idx) => (
                 <option key={`${user.id}-${idx}`} value={user.id}>
                   {user.nombre}
                 </option>
               ))}
            </select>
          </div>
          <div className="mt-3">
            <label htmlFor="slaughterDate" className="block text-sm font-medium text-gray-700">Fecha de Sacrificio</label>
            <input
              type="date"
              id="slaughterDate"
              name="slaughterDate"
              value={newInvoice.slaughterDate}
              onChange={handleInputChange}
              className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            />
          </div>
          <button
            onClick={handleAddInvoice}
            className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Guardar Factura y Registrar Canales
          </button>
        </div>
      )}

      {showChannelsForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Registrar Canales para Factura</h3>
           <div className="mt-3">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">Código del Canal</label>
            <input
              type="text"
              id="code"
              name="code"
              placeholder="Ej: C001"
              value={newChannel.code}
              onChange={handleChannelInputChange}
              className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            />
          </div>
          <div className="mt-3">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo de Carne</label>
            <select
              id="type"
              name="type"
              value={newChannel.type}
              onChange={handleChannelInputChange}
              className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            >
              <option value="">Selecciona un Tipo de Corte</option>
             {products.map(p => (
                <option key={p.id_producto} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3">
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Peso (kg)</label>
            <input
              type="number"
              id="weight"
              name="weight"
              placeholder="Ej: 250"
              value={newChannel.weight}
              onChange={handleChannelInputChange}
              className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            />
          </div>
          <button
            onClick={handleAddTemporaryChannel}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Agregar Canal a la Lista
          </button>

          {tempChannels.length > 0 && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Canales Temporales</h4>
              <div className="grid grid-cols-1 gap-3">
                {tempChannels.map(channel => (
                  <div key={channel.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="text-gray-700 font-medium">Código: <span className="font-normal">{channel.code}</span></p>
                      <p className="text-gray-700 font-medium">Tipo: <span className="font-normal">{channel.type}</span></p>
                      <p className="text-gray-700 font-medium">Peso: <span className="font-normal">{channel.weight} kg</span></p>
                    </div>
                    <button
                      onClick={() => handleDeleteTemporaryChannel(channel.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSaveInvoiceWithChannels}
            className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Guardar Factura y Canales
          </button>
          <button
            onClick={() => { setShowChannelsForm(false); setTempChannels([]); setNewInvoice({ number: '', date: '', supplierId: '', operatorId: '', slaughterDate: '' }); }}
            className="w-full mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancelar Registro de Canales
          </button>
        </div>
      )}


      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Filtros de Facturas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search-invoices" className="block text-sm font-medium text-gray-700">Buscar (Número, Proveedor, Operario)</label>
            <input
              type="text"
              id="search-invoices"
              placeholder="Ej: FAC-2023-001, Ganadería, Juan"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            />
          </div>
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Fecha Fin</label>
            <input
              type="date"
              id="end-date"
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


      <div className="grid grid-cols-1 gap-6">
        {paginatedInvoices.length > 0 ? (
          paginatedInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-white p-6 rounded-lg shadow-md">
              {editingInvoiceId === invoice.id ? (
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Editar Factura</h3>
                   <div>
                    <label htmlFor="edit-number" className="block text-sm font-medium text-gray-700">Número de Factura</label>
                    <input
                      type="text"
                      id="edit-number"
                      name="number"
                      placeholder="Ej: FAC-2023-001"
                      value={editedInvoice.number}
                      onChange={handleEditedInputChange}
                      className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
                    />
                  </div>
                  <div className="mt-3">
                    <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700">Fecha de Factura</label>
                    <input
                      type="date"
                      id="edit-date"
                      name="date"
                      value={editedInvoice.date}
                      onChange={handleEditedInputChange}
                      className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
                    />
                  </div>
                  <div className="mt-3">
                    <label htmlFor="edit-supplierId" className="block text-sm font-medium text-gray-700">Proveedor</label>
                    <select
                      id="edit-supplierId"
                      name="supplierId"
                      value={editedInvoice.supplierId}
                      onChange={handleEditedInputChange}
                      className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
                    >
                      <option value="">Selecciona un Proveedor</option>
                      {suppliers.map((s, idx) => (
                        <option
                          key={`${s.id_proveedor}-${idx}`}
                          value={String(s.id_proveedor)}
                        >
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3">
                    <label htmlFor="edit-operatorId" className="block text-sm font-medium text-gray-700">Operario que Registra</label>
                    <select
                      id="edit-operatorId"
                      name="operatorId"
                      value={editedInvoice.operatorId}
                      onChange={handleEditedInputChange}
                      className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
                    >
                       <option value="">Selecciona un Operario</option>
                       {operarioUsers.map((user, idx) => (
                         <option key={`${user.id}-${idx}`} value={user.id}>
                           {user.nombre}
                         </option>
                       ))}
                    </select>
                  </div>
                  <div className="mt-3">
                    <label htmlFor="edit-slaughterDate" className="block text-sm font-medium text-gray-700">Fecha de Sacrificio</label>
                    <input
                      type="date"
                      id="edit-slaughterDate"
                      name="slaughterDate"
                      value={editedInvoice.slaughterDate}
                      onChange={handleEditedInputChange}
                      className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEditedInvoice}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{invoice.number}</h3>
                      <p className="text-gray-600 mt-2">Fecha Factura: {invoice.date}</p>
                      <p className="text-gray-600">Proveedor: {getSupplierName(invoice.supplierId)}</p>
                      <p className="text-gray-600">Operario: {getOperatorName(invoice.operatorId)}</p>
                      <p className="text-gray-600">Fecha Sacrificio: {invoice.slaughterDate}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditInvoice(invoice)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-lg font-medium text-gray-800 mb-2">
                      Canales Registrados ({invoice.channels.length})
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        (Mostrando del más reciente al más antiguo)
                      </span>
                    </h4>

                    {invoice.channels.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                          {sortChannelsNewestFirst(invoice.channels).map((channel) => (
                            <div key={channel.id} className="border border-gray-200 rounded-lg p-3 relative">
                              {editingChannel.channelId === channel.id ? (
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                                    <input
                                      type="text"
                                      value={editingChannel.data.code}
                                      onChange={(e) => setEditingChannel(prev => ({
                                        ...prev,
                                        data: { ...prev.data, code: e.target.value }
                                      }))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select
                                      value={editingChannel.data.type}
                                      onChange={(e) => setEditingChannel(prev => ({
                                        ...prev,
                                        data: { ...prev.data, type: e.target.value }
                                      }))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <option value="">Selecciona un Tipo de Corte</option>
                                        {products.map(p => (
                                          <option key={p.id_producto} value={p.nombre}>
                                            {p.nombre}
                                          </option>
                                        ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                                    <input
                                      type="number"
                                      value={editingChannel.data.weight}
                                      onChange={(e) => setEditingChannel(prev => ({
                                        ...prev,
                                        data: { ...prev.data, weight: e.target.value }
                                      }))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>

                                  <div className="flex justify-end space-x-2 pt-2">
                                    <button
                                      onClick={cancelChannelEdit}
                                      className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={saveChannelEdit}
                                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                    >
                                      Guardar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="space-y-1">
                                    <p className="text-gray-800"><span className="font-medium">Código:</span> {channel.code}</p>
                                    <p className="text-gray-800"><span className="font-medium">Tipo:</span> {channel.type}</p>
                                    <p className="text-gray-800"><span className="font-medium">Peso:</span> {channel.weight} kg</p>
                                  </div>

                                  <div className="flex justify-end space-x-2 mt-3">
                                    <button
                                      onClick={() => startEditingChannel(invoice.id, channel)}
                                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDeleteChannel(invoice.id, channel.id)}
                                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                          <h5 className="text-md font-semibold text-gray-800 mb-2">Resumen de Peso por Tipo</h5>
                          {getChannelsSummary(invoice.channels).map(([type, totalWeight]) => (
                            <p key={type} className="text-gray-700">{type}: {totalWeight.toFixed(2)} kg</p>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500">No hay canales registrados</p>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-600">No hay facturas registradas que coincidan con la búsqueda o rango de fechas.</p>
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

export default InvoiceList;
