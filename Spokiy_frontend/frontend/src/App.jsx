import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Diary from './pages/Diary';
import Login from './pages/Login';
import Register from './pages/Register';
import Stats from './pages/Stats';
import Profile from './pages/Profile';
import Materials from './pages/Materials';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  
  // Инициализация темы при запуске приложения
  useEffect(() => {
    // Проверяем, сохранена ли темная тема в памяти браузера
    const savedTheme = localStorage.getItem('theme');
    // Если сохранено 'dark', добавляем класс к body, чтобы цвета сразу стали темными
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }
  }, []);

  return (
    <Router>
      <div className="app-main">
        <Navbar />
        
        <div className="page-content">
          <Routes>
            {/* Головна: Або Дашборд, або Лендінг (залежить від входу) */}
            <Route path="/" element={<Home />} />
            
            {/* Про проєкт: ЗАВЖДИ Лендінг (навіть для залогінених) */}
            <Route path="/about" element={<Home forceLanding={true} />} />
            
            {/* Інші сторінки */}
            <Route path="/diary" element={<Diary />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
