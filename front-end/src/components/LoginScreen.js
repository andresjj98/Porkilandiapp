import React, { useState, useContext } from 'react';
import api from '../services/api';     // ← usamos el cliente que creaste
import { InventoryContext } from '../contexts/InventoryContext';

const LoginScreen = ({ setUser, setCurrentPage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const { refreshInventory } = useContext(InventoryContext);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      /* ─ 1. llamamos al back ───────────────────────────────────────────── */
      const { data } = await api.post('/auth/login', {
        username,            // el back lo acepta como "username"
        password
      });

      /* ─ 2. guardamos el token ─────────────────────────────────────────── */
      localStorage.setItem('token', data.token);

      /* ─ 3. hacemos que todas las futuras peticiones lleven el token ──── */
      api.defaults.headers.common.Authorization = `Bearer ${data.token}`;

      /* ─ 4. guardamos al usuario en el estado global de tu App ─────────── */
      setUser(data.user);              // { id, username, role }

      /* ─ 5. cargamos el inventario inicial ─────────────────────────────── */
      await refreshInventory();

      /* ─ 6. redirigimos a la vista Facturas (o la que prefieras) ──────── */
      setCurrentPage('invoices');
    } catch (err) {
      console.error(err);
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit}
            className="bg-white p-8 rounded shadow-md w-80">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Iniciar sesión
        </h1>

        {error && <p className="mb-4 text-red-600 text-center">{error}</p>}

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Usuario
        </label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded"
        />

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-6 px-3 py-2 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors"
        >
          Entrar
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
