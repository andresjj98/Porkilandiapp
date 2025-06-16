export const initialInvoices = [
  {
    id: 'inv-001',
    number: 'FAC-2023-001',
    date: '2023-10-26',
    supplierId: 'sup-001',
    operator: 'Luis Hernández',
    slaughterDate: '2023-10-25',
    channels: [
      { id: 'ch-001', invoiceId: 'inv-001', code: 'C001', weight: 300, type: 'Res', origin: 'Jalisco' }, // Agregado campo 'code'
      { id: 'ch-002', invoiceId: 'inv-001', code: 'C002', weight: 320, type: 'Res', origin: 'Jalisco' }, // Agregado campo 'code'
    ],
  },
  {
    id: 'inv-002',
    number: 'FAC-2023-002',
    date: '2023-10-25',
    supplierId: 'sup-002',
    operator: 'Ana Gómez',
    slaughterDate: '2023-10-24',
    channels: [
      { id: 'ch-003', invoiceId: 'inv-002', code: 'C003', weight: 150, type: 'Cerdo', origin: 'Sonora' }, // Agregado campo 'code'
    ],
  },
];