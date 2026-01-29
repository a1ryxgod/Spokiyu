import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // Новое состояние для email
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/register/', {
        username: username,
        email: email, // Передаем email
        password: password
      });
      alert("Успішно! Тепер увійдіть.");
      navigate('/login');
    } catch (error) {
      alert("Помилка реєстрації. Спробуйте інший логін або email.");
    }
  };

  return (
    <div className="split-screen">
      {/* Ліва частина - Декор */}
      <div className="split-left">
        <h1 className='main-text'>Ласкаво просимо</h1>
        <p>Створіть свій особистий простір для турботи про ментальне здоров'я вже сьогодні.</p>
      </div>

      {/* Права частина - Форма */}
      <div className="split-right">
        <div className="auth-form-wrapper">
          <h2>Створити акаунт</h2>
          <form onSubmit={handleRegister}>
            <div style={{marginBottom: '20px'}}>
              <label>Придумайте логін</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ваш унікальний нікнейм"
                required
              />
            </div>
            <div style={{marginBottom: '20px'}}>
              <label>Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ваша електронна пошта"
                required
              />
            </div>
            <div style={{marginBottom: '20px'}}>
              <label>Придумайте пароль</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Надійний пароль"
                required
              />
            </div>
            <button type="submit">Зареєструватися</button>
          </form>

          <p style={{marginTop: '20px', textAlign: 'center', color: '#666'}}>
            Вже є акаунт? <Link to="/login" style={{color: '#2E7D32', fontWeight: 'bold'}}>Увійти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;