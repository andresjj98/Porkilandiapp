import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { filterByDateRange } from '../utils/dateFilters';
import { subtractFromInventory } from '../utils/inventoryLogic';


const OrderForm = () => {
  const [orders, setOrders] = useState([]);
  const [posList, setPosList] = useState([]);
  const [cutTypes, setCutTypes] = useState({});
  const [cutNameToIdByMeat, setCutNameToIdByMeat] = useState({});
  const [cutIdToName, setCutIdToName] = useState({});
  const [cutIdToMeatId, setCutIdToMeatId] = useState({});
  const [meatTypeIdToName, setMeatTypeIdToName] = useState({});
  const [productIdMap, setProductIdMap] = useState({});
  const [productInfoById, setProductInfoById] = useState({});
  
  const [cuts, setCuts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [meatTypeNameToId, setMeatTypeNameToId] = useState({});

  const [newOrder, setNewOrder] = useState({
    codigoOrden: '',
    date: '',
    posId: '',
    operatorId: '',
    status: 'pendiente',
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

  const operarioUsers = users.filter(
    user => typeof user.role === 'string' && user.role.toLowerCase() === 'operario'
  );



  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await api.get('/puntos_venta');
        setPosList(data || []);
      } catch (err) {
        console.error('Error loading puntos de venta:', err);
      }

      try {
       const [ordRes, carneRes, prodRes, userRes, factRes, detRes] = await Promise.all([
          api.get('/ordenes'),
          api.get('/tipo_carne'),
          api.get('/productos'),
          api.get('/usuarios'),
          api.get('/facturas'),
          api.get('/detalles_corte')
        ]);

        const typeNameToId = {};
        const typeIdToName = {};
        (carneRes.data || []).forEach(p => {
          typeNameToId[p.nombre] = p.id_tipo_carne;
          typeIdToName[p.id_tipo_carne] = p.nombre;
        });

        const cutTypesMap = {};
        const nameToIdByMeat = {};
        const idToName = {};
        const idToMeat = {};
        const productMap = {};
        const productInfo = {};
        (prodRes.data || []).forEach(p => {
          if (!cutTypesMap[p.tipo_carne]) cutTypesMap[p.tipo_carne] = [];
          if (!cutTypesMap[p.tipo_carne].includes(p.tipo_corte)) {
            cutTypesMap[p.tipo_carne].push(p.tipo_corte);
          }
          if (!nameToIdByMeat[p.tipo_carne]) nameToIdByMeat[p.tipo_carne] = {};
          nameToIdByMeat[p.tipo_carne][p.tipo_corte] = p.id_tipo_corte;
          idToName[p.id_tipo_corte] = p.tipo_corte;
          idToMeat[p.id_tipo_corte] = p.id_tipo_carne;
          if (!productMap[p.tipo_carne]) productMap[p.tipo_carne] = {};
          productMap[p.tipo_carne][p.tipo_corte] = p.id_producto;
          productInfo[p.id_producto] = { meat: p.tipo_carne, cut: p.tipo_corte };
        });

        const invoicesList = factRes.data || [];

        const cutsMap = {};
        (detRes.data || []).forEach(det => {
          cutsMap[det.id_detalle] = {
            id: det.id_detalle,
            invoiceId: det.id_desposte || 0,
            carcassCode: String(det.id_canal),
            cutType: det.id_tipo_corte,
            quantity: det.cantidad,
            weight: parseFloat(det.peso)
          };
        });

        const ordersData = await Promise.all(
          (ordRes.data || []).map(async ord => {
            const { data: detalles } = await api.get(`/detalle_orden?orden=${ord.id_orden}`);
            const items = (detalles || []).map(d => {
              const info = productInfo[d.id_producto] || {};
              return {
                id: d.id_detalle,
                meatType: info.meat || 'Desconocido',
                cutType: info.cut || 'N/A',
                quantity: d.cantidad,
                weight: parseFloat(d.peso_total)
              };
            });
            return {
              id: ord.id_orden,
              orderCode: ord.codigo_orden,
              date: ord.fecha_orden,
              posId: ord.id_pos,
              operatorId: ord.id_usuario,
              status: ord.estado,
              items
            };
          })
        );

        const usersMapped = (userRes.data || []).map(u => ({
          id: u.id,
          fullName: u.nombre,
          role: u.role
        }));

        setMeatTypeNameToId(typeNameToId);
        setMeatTypeIdToName(typeIdToName);
        setCutNameToIdByMeat(nameToIdByMeat);
        setCutIdToName(idToName);
        setCutIdToMeatId(idToMeat);
        setCutTypes(cutTypesMap);
        setProductIdMap(productMap);
        setProductInfoById(productInfo);
        setInvoices(invoicesList);
        setCuts(Object.values(cutsMap));
        setOrders(ordersData);
        setUsers(usersMapped);
      } catch (error) {
        console.error('Error loading initial data for OrderForm:', error);
      }
    };
    loadData();
  }, []);

 useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data } = await api.get('/usuarios');
        const mapped = (data || []).map(u => ({
          id: u.id,
          fullName: u.nombre,
          role: u.role,
        }));
        setUsers(mapped);
      } catch (err) {
        console.error('Error loading users for operators list:', err);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
   const loadLatestCuts = async () => {
      try {
       const { data } = await api.get('/productos');
        const map = {};
        const nameToId = {};
        const idToNameMap = {};
        const idToMeatMap = {};
        const productMap = {};
        const infoMap = {};
        (data || []).forEach(p => {
          if (!map[p.tipo_carne]) map[p.tipo_carne] = [];
          if (!map[p.tipo_carne].includes(p.tipo_corte)) {
            map[p.tipo_carne].push(p.tipo_corte);
          }
          if (!nameToId[p.tipo_carne]) nameToId[p.tipo_carne] = {};
          nameToId[p.tipo_carne][p.tipo_corte] = p.id_tipo_corte;
          idToNameMap[p.id_tipo_corte] = p.tipo_corte;
          idToMeatMap[p.id_tipo_corte] = p.id_tipo_carne;
           if (!productMap[p.tipo_carne]) productMap[p.tipo_carne] = {};
          productMap[p.tipo_carne][p.tipo_corte] = p.id_producto;
          infoMap[p.id_producto] = { meat: p.tipo_carne, cut: p.tipo_corte };
        });
        setCutTypes(map);
        setCutNameToIdByMeat(nameToId);
        setCutIdToName(idToNameMap);
        setCutIdToMeatId(idToMeatMap);
        setProductIdMap(productMap);
        setProductInfoById(infoMap);
      } catch (err) {
        console.error('Error refreshing cut types:', err);
      }
    };
    loadLatestCuts();
  }, []);

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
    if (!newOrder.date || !newOrder.posId || !newOrder.operatorId || newOrder.items.length === 0) {
      alert('Por favor, completa los datos de la orden y agrega al menos un item.');
      return;
    }

    try {
          const orderPayload = {
        codigo_orden: newOrder.codigoOrden,
        fecha_orden: newOrder.date,
        id_usuario: newOrder.operatorId,
        id_pos: newOrder.posId,
        estado: newOrder.status
      };
      const { data } = await api.post('/ordenes', orderPayload);
      const newId = data?.id;

      await Promise.all(newOrder.items.map(item => {
         const productId = productIdMap[item.meatType]?.[item.cutType];
        return api.post('/detalle_orden', {
          id_orden: newId,
          id_producto: productId,
          cantidad: item.quantity || 0,
          peso_total: item.weight || 0
        });
      }));

      setOrders(prev => [...prev, { id: newId, orderCode: newOrder.codigoOrden, date: newOrder.date, posId: newOrder.posId, operatorId: newOrder.operatorId, status: newOrder.status, items: newOrder.items }]);
      setNewOrder({
        codigoOrden: '',
        date: '',
        posId: '',
        operatorId: '',
        status: 'pendiente',
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
         await api.delete(`/ordenes/${id}`);
        setOrders(prev => prev.filter(order => order.id !== id));
        alert('Orden eliminada con éxito!');
      } catch (error) {
        console.error('Error deleting order:', error);
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

      if (editedOrderStatus === 'entregada' && orderToUpdate.status !== 'entregada') {
         const updatedCuts = subtractFromInventory(cuts, invoices, orderToUpdate.items);
         setCuts(updatedCuts);
      }

      const updatedOrder = { ...orderToUpdate, status: editedOrderStatus };
      await api.put(`/ordenes/${orderId}`, {
        codigo_orden: updatedOrder.orderCode,
        fecha_orden: updatedOrder.date,
        id_usuario: updatedOrder.operatorId,
        id_pos: updatedOrder.posId,
        estado: editedOrderStatus
      });
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
    (order.orderCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            <label htmlFor="orderCode" className="block text-sm font-medium text-gray-700">ID de Orden</label>
            <input
              type="text"
              id="orderCode"
              name="codigoOrden"
              placeholder="Ej: PED-2023-001"
              value={newOrder.codigoOrden}
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
             <option value="pendiente">Pendiente</option>
            <option value="enviada">Enviada</option>
            <option value="entregada">Entregada</option>
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
                    <p className="text-gray-800 font-medium">Tipo de Carne: {item.meatType}</p>
                    <p className="text-gray-800 font-medium">Corte: {item.cutType}</p>
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
                    <h3 className="text-xl font-semibold text-gray-800">{order.orderCode}</h3>
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
                          <option value="pendiente">Pendiente</option>
                          <option value="enviada">Enviada</option>
                          <option value="entregada">Entregada</option>
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
                    <p key={item.id} className="text-gray-700 text-sm">- Tipo de Carne: {item.meatType} | Corte: {item.cutType} | Cantidad: {item.quantity !== null ? item.quantity : 'N/A'} | Peso: {item.weight !== null ? `${item.weight} kg` : 'N/A'}</p>
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