import React, { useState, useContext } from 'react';
import api from '../services/api';     // ← usamos el cliente que creaste
import { InventoryContext } from '../contexts/InventoryContext';

const LoginScreen = ({ setUser, setCurrentPage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="relative mb-6">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-600"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            )}
          </button>
        </div>

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
