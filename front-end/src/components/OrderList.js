import React, { useState, useEffect } from 'react';
import api from '../services/api';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [posList, setPosList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null); // Estado para la orden que se está editando
  const [editedOrderStatus, setEditedOrderStatus] = useState(''); // Estado para el estado editado

  useEffect(() => {
    const loadData = async () => {
      try {
         const [ordRes, posRes, prodRes, typeRes] = await Promise.all([
          api.get('/ordenes'),
          api.get('/puntos_venta'),
          api.get('/productos'),
          api.get('/tipo_carne')
        ]);

        const typeIdToName = {};
        (typeRes.data || []).forEach(p => {
          typeIdToName[p.id_tipo_carne] = p.nombre;
        });

         const cutIdToName = {};
        const cutIdToMeat = {};
        (prodRes.data || []).forEach(p => {
          cutIdToName[p.id_tipo_corte] = p.tipo_corte;
          cutIdToMeat[p.id_tipo_corte] = p.id_tipo_carne;
        });

        const ordersWithDetails = await Promise.all(
          (ordRes.data || []).map(async ord => {
            const { data: detalles } = await api.get(`/detalle_orden?orden=${ord.id_orden}`);
            const items = (detalles || []).map(d => ({
              id: d.id_detalle,
              meatType: typeIdToName[cutIdToMeat[d.id_tipo_corte]] || 'Desconocido',
              cutType: cutIdToName[d.id_tipo_corte] || 'N/A',
              quantity: d.cantidad,
              weight: parseFloat(d.peso_total)
            }));
            return {
              id: ord.id_orden,
              orderId: String(ord.id_orden),
              date: ord.fecha_orden,
              posId: ord.id_pos,
              operatorId: ord.id_usuario,
              status: ord.estado,
              items
            };
          })
        );

        setOrders(ordersWithDetails);
        setPosList((posRes.data || []).map(p => ({ id: p.id, name: p.name })));
      } catch (err) {
        console.error('Error loading orders:', err);
      }
    };
    loadData();
  }, []);

  const getPosName = (posId) => {
    const pos = posList.find(p => p.id === posId);
    return pos ? pos.name : 'Desconocido';
  };

  // Filtrar órdenes según el término de búsqueda
  const filteredOrders = orders.filter(order =>
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getPosName(order.posId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteOrder = async (id) => {
    try {
      await api.delete(`/ordenes/${id}`);
      setOrders(orders.filter(order => order.id !== id));
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const handleStartEditStatus = (order) => { // Iniciar edición de estado
    setEditingOrderId(order.id);
    setEditedOrderStatus(order.status);
  };

 const handleSaveStatus = async (orderId) => { // Guardar estado editado
    try {
      const orderToUpdate = orders.find(o => o.id === orderId);
      if (!orderToUpdate) return;
      await api.put(`/ordenes/${orderId}`, {
        fecha_orden: orderToUpdate.date,
        id_usuario: orderToUpdate.operatorId,
        id_pos: orderToUpdate.posId,
        estado: editedOrderStatus
      });
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status: editedOrderStatus } : order
      );
      setOrders(updatedOrders);
      setEditingOrderId(null); // Salir del modo edición
      setEditedOrderStatus(''); // Limpiar estado editado
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleCancelEditStatus = () => { // Cancelar edición
    setEditingOrderId(null);
    setEditedOrderStatus('');
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Órdenes Registradas</h2>

      <div className="mb-6">
        <label htmlFor="search-orders" className="block text-sm font-medium text-gray-700">Buscar Órdenes (ID, Punto de Venta, Estado)</label>
        <input
          type="text"
          id="search-orders"
          placeholder="Ej: PED-2023-001, Centro, Pendiente"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mt-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
        />
      </div>

      {filteredOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{order.orderId}</h3>
                  <p className="text-gray-600 mt-2">Fecha: {order.date}</p>
                  <p className="text-gray-600">Punto de Venta: {getPosName(order.posId)}</p>
                  {editingOrderId === order.id ? ( // Mostrar selector de estado si se está editando
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
                  ) : ( // Mostrar estado normal si no se está editando
                    <p className="text-gray-600">Estado: {order.status}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {editingOrderId !== order.id && ( // Mostrar botón editar solo si no se está editando
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
                  <p key={item.id} className="text-gray-700 text-sm">- Tipo de Carne: {item.meatType} | Corte: {item.cutType} | Cantidad: {item.quantity !== null ? item.quantity : 'N/A'} | Peso: {item.weight !== null ? `${item.weight} kg` : 'N/A'} | Estado: {item.status}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No hay órdenes registradas que coincidan con la búsqueda.</p>
      )}
    </div>
  );
};

export default OrderList;