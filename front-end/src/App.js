// src/App.js
import React, { useState } from 'react';
import LayoutHeader   from './components/LayoutHeader';
import InvoiceList    from './components/InvoiceList';
import DeboningForm   from './components/DeboningForm';
import InventoryList  from './components/InventoryList';
import OrderForm      from './components/OrderForm';
import ManagementModule from './components/ManagementModule';
import LoginScreen    from './components/LoginScreen';

function App() {
  const [currentPage, setCurrentPage] = useState('invoices');
  const [user,        setUser]        = useState(null);

  /* ---------------------- render condicional ---------------------------- */
  if (!user) {
    /*  ─── Muestra Login mientras no haya usuario ─── */
    return (
      <LoginScreen
        setUser={setUser}
        setCurrentPage={setCurrentPage}
      />
    );
  }

  /* ------------ una vez logeado, muestra el layout normal --------------- */
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <LayoutHeader
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        userRole={user.role}
        onLogout={() => setUser(null)}
      />

      <main className="flex-grow container mx-auto py-6">
        {currentPage === 'invoices'   && <InvoiceList />}
        {currentPage === 'deboning'   && <DeboningForm />}
        {currentPage === 'inventory'  && <InventoryList />}
        {currentPage === 'orders'     && <OrderForm />}
        {currentPage === 'management' && <ManagementModule />}
      </main>
    </div>
  );
}

export default App;
