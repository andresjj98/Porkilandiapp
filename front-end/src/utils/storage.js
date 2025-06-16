// Simula una base de datos en memoria para el desarrollo
const inMemoryDb = {
  users: [],
  pos: [],
  suppliers: [],
  cutTypes: {},
  invoices: [],
  cuts: [],
  orders: [],
};

// Función auxiliar para simular latencia de red
const simulateNetworkLatency = (data) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data);
    }, 300); // Simula 300ms de latencia
  });
};

// Simula la carga inicial de datos (como si vinieran de una API al iniciar la app)
// En un entorno real, esto se cargaría desde el backend
export const initializeDb = async () => {
  const storedUsers = localStorage.getItem('users');
  if (storedUsers) {
    inMemoryDb.users = JSON.parse(storedUsers);
  } else {
    // Datos iniciales si no hay nada en localStorage
    inMemoryDb.users = [
      {
        id: 'user-admin-001',
        fullName: 'Administrador Principal',
        username: 'admin',
        userId: 'ADMIN001',
        email: 'admin@ejemplo.com',
        password: 'admin1234',
        role: 'Admin',
      },
      {
        id: 'user-operario-001',
        fullName: 'Operario Ejemplo',
        username: 'operario1',
        userId: 'OP001',
        email: 'operario1@ejemplo.com',
        password: 'password123',
        role: 'Operario',
      },
    ];
    localStorage.setItem('users', JSON.stringify(inMemoryDb.users));
  }

  const storedPos = localStorage.getItem('pos');
  if (storedPos) {
    inMemoryDb.pos = JSON.parse(storedPos);
  } else {
    inMemoryDb.pos = [
      { id: 'pos-001', name: 'Punto de Venta Centro', location: 'Calle Principal 123' },
      { id: 'pos-002', name: 'Punto de Venta Sur', location: 'Avenida Siempre Viva 456' },
    ];
    localStorage.setItem('pos', JSON.stringify(inMemoryDb.pos));
  }

  const storedSuppliers = localStorage.getItem('suppliers');
  if (storedSuppliers) {
    inMemoryDb.suppliers = JSON.parse(storedSuppliers);
  } else {
    inMemoryDb.suppliers = [
      { id: 'sup-001', name: 'Ganadería La Esperanza', contact: 'Juan Pérez', phone: '5512345678' },
      { id: 'sup-002', name: 'Distribuidora El Novillo', contact: 'María García', phone: '3398765432' },
      { id: 'sup-003', name: 'Carnes Finas del Norte', contact: 'Carlos López', phone: '8123456789' },
    ];
    localStorage.setItem('suppliers', JSON.stringify(inMemoryDb.suppliers));
  }

  const storedCutTypes = localStorage.getItem('cutTypes');
  if (storedCutTypes) {
    inMemoryDb.cutTypes = JSON.parse(storedCutTypes);
  } else {
    inMemoryDb.cutTypes = {
      Res: ['Sirloin', 'Ribeye', 'T-Bone', 'Arrachera', 'Filete', 'Aguja'],
      Cerdo: ['Pierna', 'Espalda', 'Costilla', 'Lomo', 'Chuleta'],
      Pollo: ['Pechuga', 'Muslo', 'Pierna', 'Alas'],
      Otro: ['Corte Genérico'],
    };
    localStorage.setItem('cutTypes', JSON.stringify(inMemoryDb.cutTypes));
  }

  const storedInvoices = localStorage.getItem('invoices');
  if (storedInvoices) {
    inMemoryDb.invoices = JSON.parse(storedInvoices);
  } else {
    inMemoryDb.invoices = [];
    localStorage.setItem('invoices', JSON.stringify(inMemoryDb.invoices));
  }

  const storedCuts = localStorage.getItem('cuts');
  if (storedCuts) {
    inMemoryDb.cuts = JSON.parse(storedCuts);
  } else {
    inMemoryDb.cuts = [];
    localStorage.setItem('cuts', JSON.stringify(inMemoryDb.cuts));
  }

  const storedOrders = localStorage.getItem('orders');
  if (storedOrders) {
    inMemoryDb.orders = JSON.parse(storedOrders);
  } else {
    inMemoryDb.orders = [];
    localStorage.setItem('orders', JSON.stringify(inMemoryDb.orders));
  }

  return simulateNetworkLatency(inMemoryDb);
};


// Simula una llamada GET a la API
export const apiGet = async (entity) => {
  if (!inMemoryDb[entity]) {
    throw new Error(`Entidad ${entity} no encontrada en la base de datos simulada.`);
  }
  return simulateNetworkLatency(inMemoryDb[entity]);
};

// Simula una llamada POST a la API
export const apiPost = async (entity, data) => {
  if (!inMemoryDb[entity]) {
    throw new Error(`Entidad ${entity} no encontrada en la base de datos simulada.`);
  }
  const newId = `${entity.slice(0, -1)}-${Date.now()}`; // Genera un ID simple
  const newItem = { id: newId, ...data };
  inMemoryDb[entity].push(newItem);
  localStorage.setItem(entity, JSON.stringify(inMemoryDb[entity]));
  return simulateNetworkLatency(newItem);
};

// Simula una llamada PUT a la API
export const apiPut = async (entity, id, data) => {
  if (!inMemoryDb[entity]) {
    throw new Error(`Entidad ${entity} no encontrada en la base de datos simulada.`);
  }
  const index = inMemoryDb[entity].findIndex(item => item.id === id);
  if (index === -1) {
    throw new Error(`Item con ID ${id} no encontrado en la entidad ${entity}.`);
  }
  const updatedItem = { ...inMemoryDb[entity][index], ...data, id: id };
  inMemoryDb[entity][index] = updatedItem;
  localStorage.setItem(entity, JSON.stringify(inMemoryDb[entity]));
  return simulateNetworkLatency(updatedItem);
};

// Simula una llamada DELETE a la API
export const apiDelete = async (entity, id) => {
  if (!inMemoryDb[entity]) {
    throw new Error(`Entidad ${entity} no encontrada en la base de datos simulada.`);
  }
  const initialLength = inMemoryDb[entity].length;
  inMemoryDb[entity] = inMemoryDb[entity].filter(item => item.id !== id);
  if (inMemoryDb[entity].length === initialLength) {
    throw new Error(`Item con ID ${id} no encontrado en la entidad ${entity}.`);
  }
  localStorage.setItem(entity, JSON.stringify(inMemoryDb[entity]));
  return simulateNetworkLatency({ message: 'Eliminado con éxito' });
};

// Funciones de compatibilidad para los componentes existentes
// Ahora estas funciones llamarán a las simulaciones de API
export const getStorage = async (key) => {
  try {
    const data = await apiGet(key);
    return data;
  } catch (error) {
    console.error(`Error al obtener ${key}:`, error);
    return null; // O manejar el error de otra forma
  }
};

export const setStorage = async (key, value) => {
  try {
    // Para setStorage, simulamos una actualización completa de la entidad
    // En un backend real, esto sería más granular (PUT para un item, etc.)
    // Aquí, simplemente actualizamos la "base de datos" en memoria
    inMemoryDb[key] = value;
    localStorage.setItem(key, JSON.stringify(value));
    return simulateNetworkLatency({ message: 'Datos guardados' });
  } catch (error) {
    console.error(`Error al guardar ${key}:`, error);
    throw error;
  }
};

export const createStorage = async (key, initialValue) => {
  // Esta función ahora solo asegura que la entidad exista en la DB simulada
  // y devuelve los datos actuales. La inicialización se hace en initializeDb.
  const data = await apiGet(key);
  if (!data || data.length === 0) {
    // Si no hay datos, se asume que es la primera vez y se "crea" con el valor inicial
    // Esto es una simplificación para el frontend. En el backend, la creación es explícita.
    inMemoryDb[key] = initialValue;
    localStorage.setItem(key, JSON.stringify(initialValue));
    return simulateNetworkLatency(initialValue);
  }
  return simulateNetworkLatency(data);
};