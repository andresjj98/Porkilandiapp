import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const InventoryContext = createContext({ items: [], refreshInventory: () => {}, loading: true });

export const InventoryProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    try {
      const { data } = await api.get('/inventario/detalles');

      const mapped = (data || []).map(it => ({
        id: it.id_inventario,
        meatType: it.tipo_carne,
        cutType: it.tipo_corte,
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