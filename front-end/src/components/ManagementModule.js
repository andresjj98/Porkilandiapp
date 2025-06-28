import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ManagementModule = () => {
  const [users, setUsers] = useState([]);
  const [posList, setPosList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [cutTypes, setCutTypes] = useState({});
  const [loading, setLoading] = useState(true);

  const [activeForm, setActiveForm] = useState(null);

  const [newUser, setNewUser] = useState({ fullName: '', username: '', userId: '', email: '', password: '', role: 'Operario' });
  const [newPos, setNewPos] = useState({ name: '', location: '' });
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: ''});
  const [newMeatType, setNewMeatType] = useState('');
  const [newCut, setNewCut] = useState({ meatType: '', cutName: '' });

 
  const loadData = async () => {
    try {
      setLoading(true);
        const [
  { data: usersFromApi },
  { data: posFromApi },
  { data: suppliersFromApi },
  { data: meatTypesFromApi },
  { data: productsFromApi }
] = await Promise.all([
  api.get('/usuarios'),
  api.get('/puntos_venta'),
  api.get('/proveedores'),
  api.get('/tipo_carne'),
  api.get('/productos')
]);
        // guardo la respuesta tal cual llega
       setUsers(
  usersFromApi.map(u => ({
    id:       u.id,         // viene de SELECT u.id_usuario AS id
    fullName: u.nombre,
    username: u.username,
    userId:   u.numero_id,
    email:    u.correo,
    role:     u.role        // viene de JOIN roles AS role
  }))
);
        
      setSuppliers(
        suppliersFromApi.map(s => ({
          id:      s.id_proveedor,
          name:    s.nombre,
          contact: s.contacto
        }))
      );
      setPosList(
        posFromApi.map(p => ({
          id: p.id,
         name: p.nombre,
          location: p.direccion
        }))
      );

      
      const cutTypesMap = meatTypesFromApi.reduce((acc, prod) => {
        acc[prod.nombre] = [];
        return acc;
      }, {});

      productsFromApi.forEach(prod => {
        if (cutTypesMap[prod.tipo_carne]) {
          if (!cutTypesMap[prod.tipo_carne].includes(prod.tipo_corte)) {
            cutTypesMap[prod.tipo_carne].push(prod.tipo_corte);
          }
        }
      });
      
      setCutTypes(cutTypesMap);

    } catch (error) {
      console.error("Error loading initial data for ManagementModule:", error);
      } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);


  // --- Funciones para Usuarios ---
  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.username || !newUser.userId || !newUser.email || !newUser.password || !newUser.role) {
      alert('Por favor, completa todos los campos del usuario.');
      return;
    }
    const userExists = users.some(user => user.username === newUser.username || user.userId === newUser.userId);
    if (userExists) {
      alert('El nombre de usuario o ID ya existen.');
      return;
    }

    
    try {
 const { data: created } = await api.post('/usuarios', {
   nombre:    newUser.fullName,
   numero_id: newUser.userId,
   username:  newUser.username,
   correo:    newUser.email,
   password:  newUser.password,
   rol:       newUser.role.toLowerCase()
 });
 // 2) Refrescar lista entera
 await loadData();
    // 2) Feedback al usuario
    alert('Usuario guardado con éxito 🎉');

   // 3) (Opcional) limpiar formulario / cerrar sección
    setNewUser({ fullName: '', username: '', userId: '', email: '', password: '', role: 'Operario' });
    setActiveForm(null);
    } catch (error) {
      console.error("Error saving user:", error);
      alert('Error al guardar el usuario. Intenta de nuevo.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === 'user-admin-001') {
      alert('No se puede eliminar al usuario administrador principal.');
      return;
    }
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
 // 1) Llamada al backend
 await api.delete(`/usuarios/${id}`);
 // 2) Refrescar lista
 await loadData();
      } catch (error) {
      console.error("Error deleting user:", error);
      alert('Error al eliminar el usuario. Intenta de nuevo.');
      }
    }
  };

  // --- Funciones para Puntos de Venta ---
  const handlePosInputChange = (e) => {
    const { name, value } = e.target;
    setNewPos({ ...newPos, [name]: value });
  };

  const handleAddPos = async () => {
  if (!newPos.name || !newPos.location) {
    alert('Por favor, completa todos los campos del punto de venta.');
    return;
  }
  try {
    // 1) Envío correcto del campo "direccion"
    await api.post('/puntos_venta', {
      nombre: newPos.name,
      direccion: newPos.location
    });
    // 2) Confirmación al usuario
    alert('Punto de venta guardado con éxito!');
    // 3) Volver a cargar la lista
    await loadData();
    // 5) Limpiar form y cerrar sección
    setNewPos({ name: '', location: '' });
    setActiveForm(null);
  } catch (error) {
    console.error("Error saving POS:", error);
    alert('Error al guardar el punto de venta. Intenta de nuevo.');
  }
};

  const handleDeletePos = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este punto de venta?')) {
      try {
 await api.delete(`/puntos_venta/${id}`);
 await loadData();
      } catch (error) {
        console.error("Error deleting POS:", error);
        alert('Error al eliminar el punto de venta. Intenta de nuevo.');
      }
    }
  };

  // --- Funciones para Proveedores ---
const handleSupplierInputChange = (e) => {
  const { name, value } = e.target;
  setNewSupplier({ ...newSupplier, [name]: value });
};

const handleAddSupplier = async () => {
  if (!newSupplier.name || !newSupplier.contact) {
    alert('Por favor, completa todos los campos del proveedor.');
    return;
  }
  try {
    // 1) Inserto en BD
    await api.post('/proveedores', {
      nombre:   newSupplier.name,
      contacto: newSupplier.contact
    });

    // 2) Feedback al usuario
    alert('Proveedor guardado con éxito 🎉');

    // 3) Refrescar la lista desde el backend
    await loadData();
    // 4) Limpiar formulario y cerrar sección
    setNewSupplier({ name: '', contact: '' });
    setActiveForm(null);
  } catch (error) {
    console.error("Error saving supplier:", error);
    alert('Error al guardar el proveedor. Intenta de nuevo.');
  }
};

const handleDeleteSupplier = async (id) => {
  if (!window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) return;
  try {
    // 1) Borro en BD
    await api.delete(`/proveedores/${id}`);

    // 2) Refresco lista
    const { data: allSup } = await api.get('/proveedores');
    setSuppliers(
      allSup.map(s => ({
        id:      s.id_proveedor,
        name:    s.nombre,
        contact: s.contacto
      }))
    );

    alert('Proveedor eliminado con éxito');
  } catch (error) {
    console.error("Error deleting supplier:", error);
    alert('Error al eliminar el proveedor. Intenta de nuevo.');
  }
};

  // --- Funciones para Tipos de Carne ---
  const handleMeatTypeInputChange = (e) => {
    setNewMeatType(e.target.value);
  };

  const handleAddMeatType = async () => {
    if (!newMeatType) {
      alert('Por favor, ingresa el nombre del tipo de carne.');
      return;
    }
    if (cutTypes.hasOwnProperty(newMeatType)) {
      alert('Este tipo de carne ya existe.');
      return;
    }
    try {
      const updatedCutTypes = { ...cutTypes, [newMeatType]: [] };
 // 1) Crear en BD
 await api.post('/tipo_carne', { nombre: newMeatType });
 alert('Tipo de carne guardado con éxito 🎉');
 // 2) Refrescar lista
 await loadData();
 // 4) Limpiar formulario y cerrar sección
    setNewMeatType('');
    setActiveForm(null);
    } catch (error) {
      console.error("Error saving meat type:", error);
      alert('Error al guardar el tipo de carne. Intenta de nuevo.');
    }
  };

  const handleDeleteMeatType = async (meatType) => {
    if (cutTypes[meatType] && cutTypes[meatType].length > 0) {
        alert(`No se puede eliminar el tipo de carne "${meatType}" porque tiene cortes asociados.`);
        return;
    }
    if (window.confirm(`¿Estás seguro de que quieres eliminar el tipo de carne "${meatType}"?`)) {
      try {
// 1) Obtener id_tipo_carne
 const { data: types } = await api.get('/tipo_carne');
 const prod = types.find(p => p.nombre === meatType);
 if (!prod) throw new Error('Tipo no encontrado');
 // 2) Borrar en BD
 await api.delete(`/tipo_carne/${prod.id_tipo_carne}`);
 alert('Tipo de carne eliminado con éxito');
 // 3) Refrescar lista
  await loadData();
      } catch (error) {
        console.error("Error deleting meat type:", error);
        alert('Error al eliminar el tipo de carne. Intenta de nuevo.');
      }
    }
  };

  // --- Funciones para Tipos de Corte ---
  const handleCutInputChange = (e) => {
    const { name, value } = e.target;
    setNewCut({ ...newCut, [name]: value });
  };

  const handleAddCut = async () => {
    if (!newCut.meatType || !newCut.cutName) {
      alert('Por favor, selecciona un tipo de carne e ingresa el nombre del corte.');
      return;
    }
    if (cutTypes[newCut.meatType] && cutTypes[newCut.meatType].includes(newCut.cutName)) {
        alert(`El corte "${newCut.cutName}" ya existe para este tipo de carne.`);
        return;
    }
    try {
 // 1) Buscar id_tipo_carne
 const { data: types } = await api.get('/tipo_carne');
 const prod = types.find(p => p.nombre === newCut.meatType);
 if (!prod) throw new Error('Tipo de carne no válido');
 // 2) Insertar en BD
 await api.post('/tipos_corte/crear', {
   nombre_corte: newCut.cutName,
   id_tipo_carne:  prod.id_tipo_carne
 });
  alert('Tipo de corte guardado con éxito 🎉');
 // 3) Refrescar esa lista de cortes
 await loadData();
     // 5) Limpiar formulario y cerrar sección
    setNewCut({ meatType: '', cutName: '' });
    setActiveForm(null);
    } catch (error) {
      console.error("Error saving cut type:", error);
      alert('Error al guardar el tipo de corte. Intenta de nuevo.');
    }
  };

  const handleDeleteCut = async (meatType, cutName) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el corte "${cutName}" de "${meatType}"?`)) {
      try {
  // 1) Buscar id_tipo_corte a partir de los productos
        const { data: products } = await api.get('/productos');
        const prod = products.find(p => p.tipo_carne === meatType && p.tipo_corte === cutName);
        if (!prod) throw new Error('Corte no encontrado');
        // 2) Borrar en BD
        await api.delete(`/tipos_corte/${prod.id_tipo_corte}`);
        alert('Corte eliminado con éxito');
        // 3) Refrescar esa lista
        await loadData();
      } catch (error) {
        console.error("Error deleting cut type:", error);
        alert('Error al eliminar el corte. Intenta de nuevo.');
      }
    }
  };

if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-700">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión Centralizada</h2>

      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={() => setActiveForm(activeForm === 'user' ? null : 'user')}
          className={`px-4 py-2 rounded-lg transition-colors ${activeForm === 'user' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          {activeForm === 'user' ? 'Cancelar Usuario' : 'Gestionar Usuarios'}
        </button>
        <button
          onClick={() => setActiveForm(activeForm === 'pos' ? null : 'pos')}
          className={`px-4 py-2 rounded-lg transition-colors ${activeForm === 'pos' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          {activeForm === 'pos' ? 'Cancelar Punto de Venta' : 'Gestionar Puntos de Venta'}
        </button>
        <button
          onClick={() => setActiveForm(activeForm === 'supplier' ? null : 'supplier')}
          className={`px-4 py-2 rounded-lg transition-colors ${activeForm === 'supplier' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          {activeForm === 'supplier' ? 'Cancelar Proveedor' : 'Gestionar Proveedores'}
        </button>
        <button
          onClick={() => setActiveForm(activeForm === 'meatType' ? null : 'meatType')}
          className={`px-4 py-2 rounded-lg transition-colors ${activeForm === 'meatType' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          {activeForm === 'meatType' ? 'Cancelar Tipo de Carne' : 'Gestionar Tipos de Carne'}
        </button>
         <button
          onClick={() => setActiveForm(activeForm === 'cutType' ? null : 'cutType')}
          className={`px-4 py-2 rounded-lg transition-colors ${activeForm === 'cutType' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          {activeForm === 'cutType' ? 'Cancelar Tipo de Corte' : 'Gestionar Tipos de Corte'}
        </button>
      </div>

      {activeForm === 'user' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Nuevo Usuario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <input type="text" id="fullName" name="fullName" placeholder="Ej: Juan Pérez" value={newUser.fullName} onChange={handleUserInputChange} className="w-full mt-1 px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
              <input type="text" id="username" name="username" placeholder="Ej: juanp" value={newUser.username} onChange={handleUserInputChange} className="w-full mt-1 px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700">Número de ID</label>
              <input type="text" id="userId" name="userId" placeholder="Ej: 12345" value={newUser.userId} onChange={handleUserInputChange} className="w-full mt-1 px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo</label>
              <input type="email" id="email" name="email" placeholder="Ej: juan@ejemplo.com" value={newUser.email} onChange={handleUserInputChange} className="w-full mt-1 px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input type="password" id="password" name="password" placeholder="Contraseña" value={newUser.password} onChange={handleUserInputChange} className="w-full mt-1 px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rol</label>
              <select id="role" name="role" value={newUser.role} onChange={handleUserInputChange} className="w-full mt-1 px-4 py-2 border rounded-lg">
                <option value="Operario">Operario</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <button onClick={handleAddUser} className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Guardar Usuario</button>
        </div>
      )}

      {activeForm === 'pos' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Nuevo Punto de Venta</h3>
          <div>
            <label htmlFor="posName" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input type="text" id="posName" name="name" placeholder="Ej: Sucursal Centro" value={newPos.name} onChange={handlePosInputChange} className="w-full mt-1 px-4 py-2 border rounded-lg" />
          </div>
          <div className="mt-3">
            <label htmlFor="posLocation" className="block text-sm font-medium text-gray-700">Ubicación</label>
            <input type="text" id="posLocation" name="location" placeholder="Ej: Calle Falsa 123" value={newPos.location} onChange={handlePosInputChange} className="w-full mt-1 px-4 py-2 border rounded-lg" />
          </div>
          <button onClick={handleAddPos} className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Guardar Punto de Venta</button>
        </div>
      )}

      {activeForm === 'supplier' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Nuevo Proveedor</h3>
          <div>
            <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input type="text" id="supplierName" name="name" placeholder="Ej: Ganadería La Esperanza" value={newSupplier.name} onChange={handleSupplierInputChange} className="w-full mt-1 px-4 py-2 border rounded-lg" />
          </div>
          <div className="mt-3">
            <label htmlFor="supplierContact" className="block text-sm font-medium text-gray-700">Contacto</label>
            <input type="text" id="supplierContact" name="contact" placeholder="Ej: Juan Pérez" value={newSupplier.contact} onChange={handleSupplierInputChange} className="w-full mt-1 px-4 py-2 border rounded-lg" />
          </div>

          <button onClick={handleAddSupplier} className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Guardar Proveedor</button>
        </div>
      )}

      {activeForm === 'meatType' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Nuevo Tipo de Carne</h3>
          <div>
            <label htmlFor="meatTypeName" className="block text-sm font-medium text-gray-700">Nombre del Tipo de Carne</label>
            <input type="text" id="meatTypeName" name="name" placeholder="Ej: Pescado" value={newMeatType} onChange={handleMeatTypeInputChange} className="w-full mt-1 px-4 py-2 border rounded-lg" />
          </div>
          <button onClick={handleAddMeatType} className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Guardar Tipo de Carne</button>
        </div>
      )}

       {activeForm === 'cutType' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Nuevo Tipo de Corte</h3>
          <div>
            <label htmlFor="cutMeatType" className="block text-sm font-medium text-gray-700">Tipo de Carne</label>
            <select id="cutMeatType" name="meatType" value={newCut.meatType} onChange={handleCutInputChange} className="w-full mt-1 px-4 py-2 border rounded-lg">
              <option value="">Selecciona Tipo de Carne</option>
              {Object.keys(cutTypes).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="mt-3">
            <label htmlFor="cutName" className="block text-sm font-medium text-gray-700">Nombre del Corte</label>
            <input type="text" id="cutName" name="cutName" placeholder="Ej: Filete Mignon" value={newCut.cutName} onChange={handleCutInputChange} className="w-full mt-1 px-4 py-2 border rounded-lg" />
          </div>
          <button onClick={handleAddCut} className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Guardar Tipo de Corte</button>
        </div>
      )}


      
      <div className="space-y-8 mt-8">
        {/* Lista de Usuarios */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Usuarios Existentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map(u => {
        const user = {
          id:       u.id,         // o u.id_usuario según tu API
          fullName: u.nombre,
          username: u.username,
          userId:   u.numero_id,
          email:    u.correo,
          role:     u.role
        };
        return (
              <div key={user.id} className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold text-gray-800">{user.fullName}</h4>
                <p className="text-gray-600 mt-2">Usuario: {user.username}</p>
                <p className="text-gray-600">ID: {user.userId}</p>
                <p className="text-gray-600">Correo: {user.email}</p>
                <p className="text-gray-600">Rol: {user.role}</p>
                {user.id !== 'user-admin-001' && (
                  <button onClick={() => handleDeleteUser(user.id)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
                )}
              </div>
              );             
            })}
          </div>
        </div>

        {/* Lista de Puntos de Venta */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Puntos de Venta Existentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posList.map(pv => (
              <div key={pv.id} className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold text-gray-800">{pv.name}</h4>
                <p className="text-gray-600 mt-2">Ubicación: {pv.location}</p>
                <button onClick={() => handleDeletePos(pv.id)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Proveedores */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Proveedores Existentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(supplier => (
              <div key={supplier.id} className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold text-gray-800">{supplier.name}</h4>
                <p className="text-gray-600 mt-2">Contacto: {supplier.contact}</p>            
                <button onClick={() => handleDeleteSupplier(supplier.id)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Tipos de Carne y sus Cortes */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Tipos de Carne y Cortes Existentes</h3>
          <div className="space-y-4">
            {Object.entries(cutTypes).map(([meatType, cuts]) => (
              <div key={meatType} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold text-gray-800">Tipo de Carne: {meatType}</h4>
                     <button onClick={() => handleDeleteMeatType(meatType)} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Eliminar Tipo</button>
                </div>
                {cuts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cuts.map(cut => (
                            <div key={cut} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                                <p className="text-gray-700">{cut}</p>
                                <button onClick={() => handleDeleteCut(meatType, cut)} className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs">Eliminar Corte</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No hay cortes registrados para este tipo de carne.</p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManagementModule;