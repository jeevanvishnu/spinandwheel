import SpinWheel from './components/SpinWheel';
import AdminView from './components/AdminView';

function App() {
  const path = window.location.pathname;

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-[#fff0f5] via-[#ffe4e1] to-[#ffd1dc]">
      {path === '/admin/view' ? <AdminView /> : <SpinWheel />}
    </main>
  );
}

export default App;
