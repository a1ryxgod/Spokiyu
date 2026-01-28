import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Menu, X, LogOut, Shield } from 'lucide-react';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
    window.location.reload();
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="navbar">
      {/* ЛОГОТИП: Теперь всегда ведет на /about (Лендинг) */}
      <Link to="/about" className="navbar-brand" onClick={closeMenu}>
        <Brain className="brand-logo-icon" size={32} />
        <span>Спокій</span>
      </Link>

      {/* БУРГЕР МЕНЮ */}
      <div className="mobile-menu-icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </div>

      {/* ССЫЛКИ */}
      <ul className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
        
        {token ? (
            <>
                <li><Link to="/" onClick={closeMenu}>Головна</Link></li>
                <li><Link to="/diary" onClick={closeMenu}>Щоденник</Link></li>
                <li><Link to="/materials" onClick={closeMenu}>Матеріали</Link></li>
                <li><Link to="/stats" onClick={closeMenu}>Статистика</Link></li>
                <li><Link to="/profile" onClick={closeMenu}>Профіль</Link></li>
                {username === 'admin' && (
                  <li><Link to="/admin" onClick={closeMenu} style={{color: '#d32f2f', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}><Shield size={16} /> Панель</Link></li>
                )}
                <li>
                  <button onClick={handleLogout} className="nav-btn-logout">
                    <LogOut size={16} /> Вихід
                  </button>
                </li>
            </>
        ) : (
            <>
                <li><Link to="/about" onClick={closeMenu}>Про проєкт</Link></li>
                <li><Link to="/login" onClick={closeMenu}>Вхід</Link></li>
                <li>
                    <Link 
                        to="/register" 
                        onClick={closeMenu}
                        className="nav-btn-register"
                    >
                        Реєстрація
                    </Link>
                </li>
            </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
