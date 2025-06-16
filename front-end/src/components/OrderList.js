import React, { useState, useEffect } from 'react';
import { getStorage, setStorage } from '../utils/storage'; // Importar setStorage
import { initialOrders } from '../mock/orders';
import { initialPos } from '../mock/pos';

const OrderList = () => {
  const [orders, setOrders] = useState(() => getStorage('orders') || initialOrders);
  const [posList, setPosList] = useState(() => getStorage('pos') || initialPos);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null); // Estado para la orden que se está editando
  const [editedOrderStatus, setEditedOrderStatus] = useState(''); // Estado para el estado editado

  useEffect(() => {
    setStorage('orders', orders); // Guardar órdenes en localStorage
  }, [orders]);

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

  const handleDeleteOrder = (id) => {
    setOrders(orders.filter(order => order.id !== id));
  };

  const handleStartEditStatus = (order) => { // Iniciar edición de estado
    setEditingOrderId(order.id);
    setEditedOrderStatus(order.status);
  };

  const handleSaveStatus = (orderId) => { // Guardar estado editado
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return { ...order, status: editedOrderStatus };
      }
      return order;
    });
    setOrders(updatedOrders);
    setEditingOrderId(null); // Salir del modo edición
    setEditedOrderStatus(''); // Limpiar estado editado
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
                  <p key={item.id} className="text-gray-700 text-sm">- {item.meatType} - {item.cutType} | Cantidad: {item.quantity !== null ? item.quantity : 'N/A'} | Peso: {item.weight !== null ? `${item.weight} kg` : 'N/A'} | Estado: {item.status}</p>
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

// DONE