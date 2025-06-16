import React, { useState, useEffect } from 'react';
import { getStorage, setStorage } from '../utils/storage';
import { initialOrders } from '../mock/orders';
import { initialPos } from '../mock/pos';
import { initialCutTypes } from '../mock/cutTypes';
import { subtractFromInventory } from '../utils/inventoryLogic';
import { filterByDateRange } from '../utils/dateFilters';
import { initialUsers } from '../mock/users';


const OrderForm = () => {
  const [orders, setOrders] = useState([]);
  const [posList, setPosList] = useState([]);
  const [cutTypes, setCutTypes] = useState({});
  const [cuts, setCuts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);


  const [newOrder, setNewOrder] = useState({
    orderId: '',
    date: '',
    posId: '',
    operatorId: '',
    status: 'Pendiente',
    items: [],
  });

  const [newItem, setNewItem] = useState({
    meatType: '',
    cutType: '',
    quantity: '',
    weight: '',
  });

  const [availableCutTypes, setAvailableCutTypes] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editedOrderStatus, setEditedOrderStatus] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const operarioUsers = users.filter(user => user.role === 'Operario');


  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedOrders = await getStorage('orders');
        setOrders(loadedOrders || []);
        const loadedPos = await getStorage('pos');
        setPosList(loadedPos || []);
        const loadedCutTypes = await getStorage('cutTypes');
        setCutTypes(loadedCutTypes || {});
        const loadedCuts = await getStorage('cuts');
        setCuts(loadedCuts || []);
        const loadedInvoices = await getStorage('invoices');
        setInvoices(loadedInvoices || []);
        const loadedUsers = await getStorage('users');
        setUsers(loadedUsers || []);
      } catch (error) {
        console.error("Error loading initial data for OrderForm:", error);
      }
    };
    loadData();
  }, []);


  useEffect(() => {
    // Actualizar cutTypes si cambian en el módulo de gestión
    const loadCutTypes = async () => {
      const loadedCutTypes = await getStorage('cutTypes');
      setCutTypes(loadedCutTypes || {});
    };
    loadCutTypes();
  }, [cutTypes]);


  useEffect(() => {
    if (newItem.meatType) {
      setAvailableCutTypes(cutTypes[newItem.meatType] || []);
    } else {
      setAvailableCutTypes([]);
    }
    setNewItem(prev => ({ ...prev, cutType: '' }));
  }, [newItem.meatType, cutTypes]);


  const handleOrderInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrder({ ...newOrder, [name]: value });
  };

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleAddItem = () => {
    if (!newItem.meatType || !newItem.cutType || (!newItem.quantity && !newItem.weight)) {
      alert('Por favor, completa al menos el tipo de carne, corte y cantidad o peso del item.');
      return;
    }

    const itemToAdd = {
      id: `item-${Date.now()}`,
      ...newItem,
      quantity: newItem.quantity ? parseInt(newItem.quantity, 10) : null,
      weight: newItem.weight ? parseFloat(newItem.weight) : null,
    };

    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, itemToAdd],
    });

    setNewItem({ meatType: '', cutType: '', quantity: '', weight: '' });
  };

  const handleDeleteItem = (itemId) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter(item => item.id !== itemId),
    });
  };

  const handleSaveOrder = async () => {
    if (!newOrder.orderId || !newOrder.date || !newOrder.posId || !newOrder.operatorId || newOrder.items.length === 0) {
      alert('Por favor, completa los datos de la orden y agrega al menos un item.');
      return;
    }

    try {
      const savedOrder = await apiPost('orders', newOrder);
      setOrders(prev => [...prev, savedOrder]);
      setNewOrder({
        orderId: '',
        date: '',
        posId: '',
        operatorId: '',
        status: 'Pendiente',
        items: [],
      });
      setNewItem({ meatType: '', cutType: '', quantity: '', weight: '' });
      alert('Orden guardada con éxito!');
    } catch (error) {
      console.error("Error saving order:", error);
      alert('Error al guardar la orden. Intenta de nuevo.');
    }
  };

  const getPosName = (posId) => {
    const pos = posList.find(p => p.id === posId);
    return pos ? pos.name : 'Desconocido';
  };

  const getOperatorName = (operatorId) => {
    const operator = users.find(user => user.id === operatorId);
    return operator ? operator.fullName : 'Desconocido';
  };


  const handleDeleteOrder = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta orden?')) {
      try {
        await apiDelete('orders', id);
        setOrders(prev => prev.filter(order => order.id !== id));
        alert('Orden eliminada con éxito!');
      } catch (error) {
        console.error("Error deleting order:", error);
        alert('Error al eliminar la orden. Intenta de nuevo.');
      }
    }
  };

  const handleStartEditStatus = (order) => {
    setEditingOrderId(order.id);
    setEditedOrderStatus(order.status);
  };

  const handleSaveStatus = async (orderId) => {
    try {
      const orderToUpdate = orders.find(order => order.id === orderId);
      if (!orderToUpdate) return;

      if (editedOrderStatus === 'Completado' && orderToUpdate.status !== 'Completado') {
         const updatedCuts = subtractFromInventory(cuts, invoices, orderToUpdate.items);
         await setStorage('cuts', updatedCuts);
         setCuts(updatedCuts);
      }

      const updatedOrder = { ...orderToUpdate, status: editedOrderStatus };
      await apiPut('orders', orderId, updatedOrder);
      setOrders(prev => prev.map(order => order.id === orderId ? updatedOrder : order));
      setEditingOrderId(null);
      setEditedOrderStatus('');
      alert('Estado de la orden actualizado con éxito!');
    } catch (error) {
      console.error("Error updating order status:", error);
      alert('Error al actualizar el estado de la orden. Intenta de nuevo.');
    }
  };

  const handleCancelEditStatus = () => {
    setEditingOrderId(null);
    setEditedOrderStatus('');
  };

  const textFilteredOrders = orders.filter(order =>
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getPosName(order.posId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getOperatorName(order.operatorId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dateFilteredOrders = filterByDateRange(textFilteredOrders, startDate, endDate, 'date');

  const sortedOrders = [...dateFilteredOrders].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Registro de Órdenes</h2>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Nueva Orden</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">ID de Orden</label>
            <input
              type="text"
              id="orderId"
              name="orderId"
              placeholder="Ej: PED-2023-001"
              value={newOrder.orderId}
              onChange={handleOrderInputChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            />
          </div>
          <div>
            <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700">Fecha</label>
            <input
              type="date"
              id="orderDate"
              name="date"
              value={newOrder.date}
              onChange={handleOrderInputChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            />
          </div>
          <div>
            <label htmlFor="posId" className="block text-sm font-medium text-gray-700">Punto de Venta</label>
            <select
              id="posId"
              name="posId"
              value={newOrder.posId}
              onChange={handleOrderInputChange}
              className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            >
              <option value="">Selecciona un Punto de Venta</option>
              {posList.map(pos => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="operatorId" className="block text-sm font-medium text-gray-700">Operario que Registra</label>
            <select
              id="operatorId"
              name="operatorId"
              value={newOrder.operatorId}
              onChange={handleOrderInputChange}
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
          <div>
            <label htmlFor="orderStatus" className="block text-sm font-medium text-gray-700">Estado del Pedido</label>
            <select
              id="orderStatus"
              name="status"
              value={newOrder.status}
              onChange={handleOrderInputChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Agregar Items al Pedido</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="itemMeatType" className="block text-sm font-medium text-gray-700">Tipo de Carne</label>
              <select
                id="itemMeatType"
                name="meatType"
                value={newItem.meatType}
                onChange={handleItemInputChange}
                className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              >
                <option value="">Selecciona Tipo</option>
                {Object.keys(cutTypes).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="itemCutType" className="block text-sm font-medium text-gray-700">Corte</label>
              <select
                id="itemCutType"
                name="cutType"
                value={newItem.cutType}
                onChange={handleItemInputChange}
                className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
                disabled={!newItem.meatType}
              >
                <option value="">Selecciona Corte</option>
                {cutTypes[newItem.meatType]?.map(cut => (
                  <option key={cut} value={cut}>{cut}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="itemQuantity" className="block text-sm font-medium text-gray-700">Cantidad (opcional)</label>
              <input
                type="number"
                id="itemQuantity"
                name="quantity"
                placeholder="Ej: 5"
                value={newItem.quantity}
                onChange={handleItemInputChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>
            <div>
              <label htmlFor="itemWeight" className="block text-sm font-medium text-gray-700">Peso (kg) (opcional)</label>
              <input
                type="number"
                id="itemWeight"
                name="weight"
                placeholder="Ej: 25"
                value={newItem.weight}
                onChange={handleItemInputChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>
          </div>
          <button
            onClick={handleAddItem}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Agregar Item al Pedido
          </button>
        </div>

        {newOrder.items.length > 0 && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Items del Pedido</h4>
            <div className="grid grid-cols-1 gap-3">
              {newOrder.items.map(item => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-gray-800 font-medium">{item.meatType} - {item.cutType}</p>
                    <p className="text-gray-700 text-sm">
                      Cantidad: {item.quantity !== null ? `${item.quantity} piezas` : 'N/A'} |
                      Peso: {item.weight !== null ? `${item.weight} kg` : 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
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
          onClick={handleSaveOrder}
          className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Guardar Orden
        </button>
      </div>

      {/* Sección de Visualización de Órdenes Integrada */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Órdenes Registradas</h2>

        <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Filtros de Órdenes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search-orders" className="block text-sm font-medium text-gray-700">Buscar (ID, Punto de Venta, Operario, Estado)</label>
              <input
                type="text"
                id="search-orders"
                placeholder="Ej: PED-2023-001, Centro, Juan, Pendiente"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>
             <div>
              <label htmlFor="start-date-orders" className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
              <input
                type="date"
                id="start-date-orders"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>
            <div>
              <label htmlFor="end-date-orders" className="block text-sm font-medium text-gray-700">Fecha Fin</label>
              <input
                type="date"
                id="end-date-orders"
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

        {paginatedOrders.length > 0 ? (
          <div className="space-y-6">
            {paginatedOrders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{order.orderId}</h3>
                    <p className="text-gray-600 mt-2">Fecha: {order.date}</p>
                    <p className="text-gray-600">Punto de Venta: {getPosName(order.posId)}</p>
                    <p className="text-gray-600">Operario: {getOperatorName(order.operatorId)}</p>
                    {editingOrderId === order.id ? (
                      <div className="mt-2">
                        <label htmlFor={`edit-status-${order.id}`} className="block text-sm font-medium text-gray-700">Estado:</label>
                        <select
                          id={`edit-status-${order.id}`}
                          value={editedOrderStatus}
                          onChange={(e) => setEditedOrderStatus(e.target.value)}
                          className="mt-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En Proceso">En Proceso</option>
                          <option value="Completado">Completado</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={handleCancelEditStatus}
                            className="px-2 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveStatus(order.id)}
                            className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">Estado: {order.status}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {editingOrderId !== order.id && (
                      <button
                        onClick={() => handleStartEditStatus(order)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Editar Estado
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Eliminar Orden
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-lg font-medium text-gray-800 mb-2">Items:</h4>
                  {order.items.map(item => (
                    <p key={item.id} className="text-gray-700 text-sm">- {item.meatType} - {item.cutType} | Cantidad: {item.quantity !== null ? item.quantity : 'N/A'} | Peso: {item.weight !== null ? `${item.weight} kg` : 'N/A'}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No hay órdenes registradas que coincidan con la búsqueda o rango de fechas.</p>
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

export default OrderForm;