//import React, { useState, useEffect } from 'react';
import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
//import { getStorage, setStorage, createStorage } from '../utils/storage';
//import { initialUsers } from '../mock/users';

const UserManagement = () => {
  //const [users, setUsers] = useState(() => createStorage('users', initialUsers));
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    username: '',
    userId: '',
    email: '',
    password: '',
    role: 'Operario', // Rol por defecto
  });

 /* useEffect(() => {
    setStorage('users', users);
  }, [users]);*/

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

 const loadUsers = async () => {
  try {
const { data } = await api.get('/usuarios');
    setUsers(data.map(u => ({
      id:       u.id,
      fullName: u.nombre,
      userId:   u.numero_id,
      username: u.username,      
      email:    u.correo,
      role:     u.role
    })));
  } catch (err) {
    console.error('Error cargando usuarios:', err);
  }
};

useEffect(() => {
  loadUsers();
}, []);

const handleAddUser = async () => {
  const { fullName, username, userId, email, password, role } = newUser;
  if (!fullName || !username || !userId || !email || !password || !role) {
    return alert('Por favor, completa todos los campos del usuario.');
  }
  try {
    await api.post('/usuarios', {
      nombre: fullName,
      numero_id: userId,
      username,
      correo: email,
      password,
      rol: role.toLowerCase()
    });
    alert('Usuario creado con éxito');
    setNewUser({
      fullName: '',
      username: '',
      userId: '',
      email: '',
      password: '',
      role: 'Operario',
    });
    loadUsers();
    setShowAddForm(false);
  } catch (err) {
    console.error('Error creando usuario:', err);
    alert(err.response?.data?.errors?.map(e => e.msg).join('\n') || 'Error al crear usuario');
  }
};
const handleDeleteUser = async (id) => {
  if (!window.confirm('¿Eliminar este usuario?')) return;
  try {
    await api.delete(`/usuarios/${id}`);
    await loadUsers();   // vuelve a recargar la lista
  } catch (err) {
    console.error('Error eliminando usuario:', err);
    alert('No se pudo eliminar el usuario');
  }
};

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Usuarios</h2>

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-6 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        {showAddForm ? 'Cancelar' : 'Agregar Nuevo Usuario'}
      </button>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Nuevo Usuario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Ej: Juan Pérez"
                value={newUser.fullName}
                onChange={handleInputChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Ej: juanp"
                value={newUser.username}
                onChange={handleInputChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700">Número de ID</label>
              <input
                type="text"
                id="userId"
                name="userId"
                placeholder="Ej: 12345"
                value={newUser.userId}
                onChange={handleInputChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Ej: juan@ejemplo.com"
                value={newUser.email}
                onChange={handleInputChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Contraseña"
                value={newUser.password}
                onChange={handleInputChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rol</label>
              <select
                id="role"
                name="role"
                value={newUser.role}
                onChange={handleInputChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              >
                <option value="Operario">Operario</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleAddUser}
            className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Guardar Usuario
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800">{user.fullName}</h3>
            <p className="text-gray-600 mt-2">Usuario: {user.username}</p>
            <p className="text-gray-600">ID: {user.userId}</p>
            <p className="text-gray-600">Correo: {user.email}</p>
            <p className="text-gray-600">Rol: {user.role}</p>
             {user.id !== ADMIN_ID && ( // No mostrar botón eliminar para el admin de ejemplo
              <button
                onClick={() => handleDeleteUser(user.id)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;