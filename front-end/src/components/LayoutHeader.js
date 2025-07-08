import React, { useState } from 'react';

const LayoutHeader = ({ currentPage, setCurrentPage, userRole, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const role = String(userRole).toLowerCase();   // ← nuevo

  const allNavItems = [
    { name: 'Facturas',   page: 'invoices'   },
    { name: 'Despostes',  page: 'deboning'   },
    { name: 'Inventario', page: 'inventory'  },
    { name: 'Órdenes',    page: 'orders'     },
    { name: 'Gestión',    page: 'management' },
 ];

  // const navItems = allNavItems.filter(item => item.roles.includes(userRole));
   const navItems = role === 'admin'
    ? allNavItems                                   // admin ve todo
    : allNavItems.filter(item => {                  // otros roles
        if (role === 'operario')
         return ['invoices','deboning','inventory','orders'].includes(item.page);
        if (role === 'punto_venta')
          return ['orders'].includes(item.page);
        return false;
      });

  const handleMenuItemClick = (page) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-gray-800">Trazabilidad Cárnica</h1>

      <div className="md:hidden">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      <nav className="hidden md:flex items-center">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => handleMenuItemClick(item.page)}
            className={`ml-4 px-3 py-1 rounded-lg transition-colors ${
              currentPage === item.page
                ? 'bg-black text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.name}
          </button>
        ))}
        <button
          onClick={onLogout}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Cerrar Sesión
        </button>
      </nav>

      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white shadow-md z-10">
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => handleMenuItemClick(item.page)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  currentPage === item.page
                    ? 'bg-gray-200 text-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </button>
            ))}
            <button
              onClick={onLogout}
              className="w-full text-left px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mt-2"
            >
              Cerrar Sesión
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default LayoutHeader;

// DONE