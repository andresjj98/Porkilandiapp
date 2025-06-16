export const initialOrders = [
  {
    id: 'ord-001',
    orderId: 'PED-2023-001',
    date: '2023-10-28',
    posId: 'pos-001',
    status: 'Pendiente',
    items: [
      { meatType: 'Res', cutType: 'Sirloin', quantity: 5, weight: 25 }, // Eliminado campo status
      { meatType: 'Cerdo', cutType: 'Pierna', quantity: 10, weight: 40 }, // Eliminado campo status
    ],
  },
  {
    id: 'ord-002',
    orderId: 'PED-2023-002',
    date: '2023-10-28',
    posId: 'pos-002',
    status: 'En Proceso',
    items: [
      { meatType: 'Res', cutType: 'Ribeye', quantity: 3, weight: 18 }, // Eliminado campo status
    ],
  },
];