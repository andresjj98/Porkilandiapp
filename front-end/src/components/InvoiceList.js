import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { filterByDateRange } from '../utils/dateFilters';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]); // Inicializar vacío, se carga con useEffect
  const [suppliers, setSuppliers] = useState([]); // Inicializar vacío
  const [users, setUsers] = useState([]); // Inicializar vacío
  const [meatTypes, setMeatTypes] = useState([]); // Tipos de carne desde el backend  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showChannelsForm, setShowChannelsForm] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [newInvoice, setNewInvoice] = useState({
    number: '',
    date: '',
    supplierId: '',
    operatorId: '',
    slaughterDate: ''
  });
  const [editedInvoice, setEditedInvoice] = useState({
    number: '',
    date: '',
    supplierId: '',
    operatorId: '',
    slaughterDate: ''
  });
  const [newChannel, setNewChannel] = useState({
    code: '',
    weight: '',
    type: '',
    origin: '',
    id_tipo_carne: ''
  });

  const [editingChannel, setEditingChannel] = useState({
    invoiceId: null,
    channelId: null,
    data: {
      code: '',
      weight: '',
      type: '',
      origin: '',
      id_tipo_carne: ''
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [tempChannels, setTempChannels] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

 const operarioUsers = users.filter(
    user => typeof user.role === 'string' && user.role.toLowerCase() === 'operario'
  );

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
       const [invRes, supRes, userRes, typeRes] = await Promise.all([
          api.get('/facturas'),
          api.get('/proveedores'),
          api.get('/usuarios'),
           api.get('/tipo_carne')
        ]);

        const invoicesWithChannels = await Promise.all(
          (invRes.data || []).map(async inv => {
            try {
              const { data } = await api.get(`/facturas/${inv.id}`);
              return data;
            } catch (err) {
              console.error('Error loading channels for invoice', inv.id, err);
              return { ...inv, channels: [] };
            }
          })
        );

        const mappedSuppliers = (supRes.data || []).map(s => ({
          id: s.id_proveedor,
          name: s.nombre,
          contact: s.contacto
        }));

        const mappedUsers = (userRes.data || []).map(u => ({
          id: u.id,
          fullName: u.nombre,
          userId: u.numero_id,
          username: u.username,
          email: u.correo,
          role: u.role
        }));

        const mappedMeatTypes = (typeRes.data || []).map(p => ({
          id: p.id_tipo_carne,
          name: p.nombre
        }));
        
        setInvoices(invoicesWithChannels);
        setSuppliers(mappedSuppliers);
        setUsers(mappedUsers);
        setMeatTypes(mappedMeatTypes);        
      } catch (error) {
        console.error('Error loading initial data for InvoiceList:', error);
      }
    };
    loadData();
  }, []); // Se ejecuta solo una vez al montar


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvoice({ ...newInvoice, [name]: value });
  };

  const handleEditedInputChange = (e) => {
    const { name, value } = e.target;
    setEditedInvoice({ ...editedInvoice, [name]: value });
  };

  const handleChannelInputChange = (e) => {
    const { name, value } = e.target;
    setNewChannel({ ...newChannel, [name]: value });
  };

  const handleAddInvoice = () => {
    if (!newInvoice.number || !newInvoice.date || !newInvoice.supplierId || !newInvoice.operatorId || !newInvoice.slaughterDate) {
      alert('Por favor, completa todos los campos de la factura.');
      return;
    }
    setCurrentInvoiceId(`temp-${Date.now()}`);
    setTempChannels([]);
    setShowAddForm(false);
    setShowChannelsForm(true);
  };

  const handleAddTemporaryChannel = () => {
    if (!newChannel.code || !newChannel.weight || !newChannel.id_tipo_carne) {
      alert('Por favor, completa los campos de Código, Peso y Tipo de carne del canal.');
      return;
    }

    const id = `temp-ch-${Date.now()}`;
    const channelToAdd = {
      id,
      ...newChannel,
      type: getMeatTypeNameById(newChannel.id_tipo_carne),      
      weight: parseFloat(newChannel.weight),
    };

    setTempChannels([...tempChannels, channelToAdd]);
    setNewChannel({ code: '', weight: '', type: '', origin: '', id_tipo_carne: '' });
  };

  const handleDeleteTemporaryChannel = (id) => {
    setTempChannels(tempChannels.filter(channel => channel.id !== id));
  };

  const handleSaveInvoiceWithChannels = async () => { // Ahora es asíncrona
    if (tempChannels.length === 0) {
      alert('Por favor, agrega al menos un canal a la factura.');
      return;
    }

    const invoiceToSave = {
      ...newInvoice,
      channels: tempChannels.map(channel => ({ // Mapear canales temporales a formato final
        code: channel.code,
        weight: channel.weight,
        id_tipo_carne: channel.id_tipo_carne,        
        origin: channel.origin,
      })),
    };

    try {
       const { data } = await api.post('/facturas', invoiceToSave);
      if (data.success) {
        const newId = data.id_factura || null;
        const invoiceWithId = { ...invoiceToSave, id: newId, channels: tempChannels };
        setInvoices(prev => [...prev, invoiceWithId]);
        setNewInvoice({ number: '', date: '', supplierId: '', operatorId: '', slaughterDate: '' });
        setTempChannels([]);
        setShowChannelsForm(false);
        setCurrentInvoiceId(null);
        alert('Factura y canales guardados con éxito!');
      } else {
        throw new Error(data.error || 'Error al guardar la factura');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error al guardar la factura. Intenta de nuevo.');
    }
  };


  const handleDeleteInvoice = async (id) => { // Ahora es asíncrona
    if (window.confirm('¿Estás seguro de que quieres eliminar esta factura?')) {
      try {
        await api.delete(`/facturas/${id}`);
        setInvoices(prev => prev.filter(invoice => invoice.id !== id));
        alert('Factura eliminada con éxito!');
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Error al eliminar la factura. Intenta de nuevo.');
      }
    }
  };

  const handleDeleteChannel = async (invoiceId, channelId) => { // Ahora es asíncrona
    if (window.confirm('¿Estás seguro de que quieres eliminar este canal?')) {
      try {
        const invoiceToUpdate = invoices.find(inv => inv.id === invoiceId);
        if (!invoiceToUpdate) return;

        const updatedChannels = invoiceToUpdate.channels.filter(channel => channel.id !== channelId);
        const payload = {
          ...invoiceToUpdate,
          channels: updatedChannels.map(ch => ({
            id: ch.id,
            code: ch.code,
            weight: ch.weight,
            id_tipo_carne: ch.id_tipo_carne,            
            origin: ch.origin
          }))
        };

      await api.put(`/facturas/${invoiceId}`, payload);
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...invoiceToUpdate, channels: updatedChannels } : inv));
        alert('Canal eliminado con éxito!');
      } catch (error) {
        console.error("Error deleting channel:", error);
        alert('Error al eliminar el canal. Intenta de nuevo.');
      }
    }
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoiceId(invoice.id);
    setEditedInvoice({ ...invoice });
  };

  const handleSaveEditedInvoice = async () => { // Ahora es asíncrona
    if (!editedInvoice.number || !editedInvoice.date || !editedInvoice.supplierId || !editedInvoice.operatorId || !editedInvoice.slaughterDate) {
      alert('Por favor, completa todos los campos de la factura.');
      return;
    }

    try {
     const { data: updatedInvoice } = await api.put(`/facturas/${editingInvoiceId}`, editedInvoice);
      setInvoices(prev => prev.map(inv => inv.id === editingInvoiceId ? updatedInvoice : inv));
      setEditingInvoiceId(null);
      setEditedInvoice({ number: '', date: '', supplierId: '', operatorId: '', slaughterDate: '' });
      alert('Factura actualizada con éxito!');
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert('Error al actualizar la factura. Intenta de nuevo.');
    }
  };

  const handleCancelEdit = () => {
    setEditingInvoiceId(null);
    setEditedInvoice({ number: '', date: '', supplierId: '', operatorId: '', slaughterDate: '' });
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(sup => sup.id === supplierId);
    return supplier ? supplier.name : 'Desconocido';
  };

  const getOperatorName = (operatorId) => {
    const operator = users.find(user => user.id === operatorId);
    return operator ? operator.fullName : 'Desconocido';
  };

  const getMeatTypeNameById = (id) => {
    const mt = meatTypes.find(t => String(t.id) === String(id));
    return mt ? mt.name : '';
  };

  const getMeatTypeIdByName = (name) => {
    const mt = meatTypes.find(t => t.name === name);
    return mt ? mt.id : '';
  };

  const getChannelsSummary = (channels) => {
    const summary = channels.reduce((acc, channel) => {
      acc[channel.type] = (acc[channel.type] || 0) + parseFloat(channel.weight);
      return acc;
    }, {});
    return Object.entries(summary);
  };

  const sortChannelsNewestFirst = (channels) => {
     return [...channels].sort((a, b) =>
      String(b.id).localeCompare(String(a.id))
    );
  };

  const startEditingChannel = (invoiceId, channel) => {
    setEditingChannel({
      invoiceId,
      channelId: channel.id,
      data: {
        ...channel,
        id_tipo_carne: getMeatTypeIdByName(channel.type)
      }
    });
  };

  const saveChannelEdit = async () => { // Ahora es asíncrona
    const { invoiceId, channelId, data } = editingChannel;

    if (!data.code || !data.weight || !data.id_tipo_carne) {
      alert('Por favor complete todos los campos del canal');
      return;
    }

    try {
      const invoiceToUpdate = invoices.find(inv => inv.id === invoiceId);
      if (!invoiceToUpdate) return;

      const updatedChannels = invoiceToUpdate.channels.map(channel =>
       channel.id === channelId ? {
          ...data,
          id: channelId,
          type: getMeatTypeNameById(data.id_tipo_carne)
        } : channel
      );
      const payload = {
        ...invoiceToUpdate,
        channels: updatedChannels.map(ch => ({
          id: ch.id,
          code: ch.code,
          weight: ch.weight,
          id_tipo_carne: ch.id_tipo_carne,
          origin: ch.origin
        }))
      };

      await api.put(`/facturas/${invoiceId}`, payload);
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...invoiceToUpdate, channels: updatedChannels } : inv));
      cancelChannelEdit();
      alert('Canal actualizado con éxito!');
    } catch (error) {
      console.error("Error updating channel:", error);
      alert('Error al actualizar el canal. Intenta de nuevo.');
    }
  };

  const cancelChannelEdit = () => {
    setEditingChannel({
      invoiceId: null,
      channelId: null,
     data: { code: '', weight: '', type: '', origin: '', id_tipo_carne: '' }
    });
  };

  const textFilteredInvoices = invoices.filter(invoice =>
    invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSupplierName(invoice.supplierId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getOperatorName(invoice.operatorId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dateFilteredInvoices = filterByDateRange(textFilteredInvoices, startDate, endDate, 'date');

  const sortedInvoices = [...dateFilteredInvoices].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedInvoices = sortedInvoices.slice(startIndex, endIndex);

  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage);

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
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
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
               {operarioUsers.map(user => (
                 <option key={user.id} value={user.id}>
                   {user.fullName}
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
             <label htmlFor="id_tipo_carne" className="block text-sm font-medium text-gray-700">Tipo de Carne</label>
            <select
             id="id_tipo_carne"
              name="id_tipo_carne"
              value={newChannel.id_tipo_carne}
              onChange={handleChannelInputChange}
              className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            >
             <option value="">Selecciona un Tipo</option>
               {meatTypes.map(prod => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
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
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
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
                       {operarioUsers.map(user => (
                         <option key={user.id} value={user.id}>
                           {user.fullName}
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Carne</label>
                                    <select
                                      value={editingChannel.data.id_tipo_carne}
                                      onChange={(e) => setEditingChannel(prev => ({
                                        ...prev,
                                        data: { ...prev.data, id_tipo_carne: e.target.value }
                                      }))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <option value="">Selecciona un Tipo</option>
                                     {meatTypes.map(prod => (
                                        <option key={prod.id} value={prod.id}>
                                          {prod.name}
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