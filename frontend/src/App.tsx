import { useEffect } from 'react';
import SpinWheel from './components/SpinWheel';
import AdminView from './components/AdminView';
import AdminSpin from './components/AdminSpin';

function App() {
  const path = window.location.pathname;

  useEffect(() => {
    const interval = setInterval(() => {
      // Using the API URL from .env or fallback to the provided string format
      const apiUrl = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/health` 
        : "https://spinandwheel.onrender.com/api/health";
        
      fetch(apiUrl)
        .catch((err) => console.log("Keep-alive failed:", err));

    }, 5 * 60 * 1000); // every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-[#fff0f5] via-[#ffe4e1] to-[#ffd1dc]">
      {path === '/admin/view' ? (
        <AdminView />
      ) : path === '/admin/spin' ? (
        <AdminSpin />
      ) : (
        <SpinWheel />
      )}
    </main>
  );
}

export default App;
