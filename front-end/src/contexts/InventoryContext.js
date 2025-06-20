import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const InventoryContext = createContext({ items: [], refreshInventory: () => {}, loading: true });

export const InventoryProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    try {
      const [{ data: productos }, { data: inventario }] = await Promise.all([
        api.get('/productos'),
        api.get('/inventario'),
      ]);

      const prodMap = {};
      (productos || []).forEach(p => {
        prodMap[p.id_producto] = p.nombre;
      });

      const mapped = (inventario || []).map(it => ({
        id: it.id_inventario,
        productId: it.id_producto,
        productName: prodMap[it.id_producto] || 'Desconocido',
        quantity: it.cantidad,
        weight: parseFloat(it.peso_total),
        status: it.estado,
        origin: it.origen || '',
      }));

      setItems(mapped);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  return (
    <InventoryContext.Provider value={{ items, refreshInventory: loadInventory, loading }}>
      {children}
    </InventoryContext.Provider>
  );
};