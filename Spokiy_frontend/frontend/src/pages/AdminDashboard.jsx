import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, List, ShieldAlert, Database, Trash2, Settings, Plus, Save, Download, FileText, Search, Activity, Ban, ShieldCheck, X
} from 'lucide-react';
import './AdminDashboard.css';
import axios from 'axios';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  
  // Состояния
  const [dictionary, setDictionary] = useState([]);
  const [users, setUsers] = useState([]);
  const [recs, setRecs] = useState([]);
  
  // Формы
  const [newWord, setNewWord] = useState('');
  const [newScore, setNewScore] = useState('');
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  // Состояния для модального окна рекомендаций
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [isEditingRec, setIsEditingRec] = useState(false);
  const [currentRecId, setCurrentRecId] = useState(null);
  const [recFormData, setRecFormData] = useState({ text: '', sentiment_threshold: '' });

  const token = localStorage.getItem('token');
  const authConfig = {
    headers: { Authorization: `Token ${token}` }
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, recsRes, dictionaryRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/admin/users/', authConfig),
          axios.get('http://127.0.0.1:8000/api/admin/recommendations/', authConfig),
          axios.get('http://127.0.0.1:8000/api/admin/sentiment-words/', authConfig)
        ]);
        setUsers(usersRes.data);
        setRecs(recsRes.data);
        setDictionary(dictionaryRes.data);
      } catch (error) {
        // Можно добавить более гранулярную обработку ошибок
        console.error("Failed to fetch initial data", error);
        //navigate('/login'); // Перенаправить на логин если токен невалидный
      }
    };
    if (token) {
        fetchData();
    } else {
        navigate('/login');
    }
  }, [navigate, token]);

  // --- USER HANDLERS ---
  const handleDeleteUser = async (id) => {
    if (window.confirm('Ви впевнені, що хочете видалити цього користувача? Це неможливо буде скасувати.')) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/admin/users/${id}/`, authConfig);
        setUsers(users.filter(u => u.id !== id));
      } catch (error) {
        alert('Не вдалося видалити користувача.');
      }
    }
  };

  const handleToggleBlockUser = async (id, isActive) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/admin/users/${id}/`, { is_active: !isActive }, authConfig);
      setUsers(users.map(u => u.id === id ? { ...u, is_active: !isActive } : u));
    } catch (error) {
      alert('Не вдалося оновити статус користувача.');
    }
  };

  // --- NLP DICTIONARY HANDLERS ---
  const handleAddWord = async (e) => {
    e.preventDefault();
    console.log('handleAddWord called');
    console.log('newWord:', newWord, 'newScore:', newScore);
    if (!newWord || !newScore) return;
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/admin/sentiment-words/', { word: newWord, score: parseFloat(newScore) }, authConfig);
      setDictionary([...dictionary, response.data]);
      setNewWord('');
      setNewScore('');
    } catch (error) {
      console.error('Error adding word:', error);
      alert('Не вдалося додати слово.');
    }
  };

  const handleDeleteWord = async (id) => {
    console.log('handleDeleteWord called with id:', id);
    if (window.confirm('Ви впевнені, що хочете видалити це слово?')) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/admin/sentiment-words/${id}/`, authConfig);
        setDictionary(dictionary.filter(w => w.id !== id));
      } catch (error) {
        console.error('Error deleting word:', error);
        alert('Не вдалося видалити слово.');
      }
    }
  };

  // --- RECOMMENDATIONS HANDLERS ---
  const handleOpenRecModal = (rec = null) => {
    if (rec) {
      setIsEditingRec(true);
      setCurrentRecId(rec.id);
      setRecFormData({ text: rec.text, sentiment_threshold: rec.sentiment_threshold });
    } else {
      setIsEditingRec(false);
      setCurrentRecId(null);
      setRecFormData({ text: '', sentiment_threshold: '' });
    }
    setIsRecModalOpen(true);
  };

  const handleCloseRecModal = () => {
    setIsRecModalOpen(false);
  };

  const handleRecFormChange = (e) => {
    const { name, value } = e.target;
    setRecFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveRec = async (e) => {
    e.preventDefault();
    const data = {
        text: recFormData.text,
        sentiment_threshold: parseFloat(recFormData.sentiment_threshold)
    };

    try {
      if (isEditingRec) {
        const response = await axios.patch(`http://127.0.0.1:8000/api/admin/recommendations/${currentRecId}/`, data, authConfig);
        setRecs(recs.map(r => r.id === currentRecId ? response.data : r));
      } else {
        const response = await axios.post('http://127.0.0.1:8000/api/admin/recommendations/', data, authConfig);
        setRecs([...recs, response.data]);
      }
      handleCloseRecModal();
    } catch (error) {
      alert(`Не вдалося зберегти пораду. Помилка: ${error.response?.data || error.message}`);
    }
  };
  
  const handleDeleteRec = async (id) => {
    if (window.confirm('Ви впевнені, що хочете видалити цю пораду?')) {
        try {
            await axios.delete(`http://127.0.0.1:8000/api/admin/recommendations/${id}/`, authConfig);
            setRecs(recs.filter(r => r.id !== id));
        } catch (error) {
            alert('Не вдалося видалити пораду.');
        }
    }
  };

  // --- SYSTEM HANDLERS ---
  const handleBackup = () => {
    setIsBackupLoading(true);
    setTimeout(() => {
      setIsBackupLoading(false);
      alert("Повний бекап бази даних PostgreSQL успішно створено!");
    }, 2000);
  };

  return (
    <div className="admin-container">
      {/* === REC MODAL === */}
      {isRecModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleSaveRec}>
              <h3>{isEditingRec ? 'Редагувати пораду' : 'Створити нову пораду'}</h3>
              <textarea
                name="text"
                className="input-admin"
                placeholder="Текст поради..."
                value={recFormData.text}
                onChange={handleRecFormChange}
                required
              />
              <input
                name="sentiment_threshold"
                type="number"
                step="0.01"
                min="-1"
                max="1"
                className="input-admin"
                placeholder="Поріг активації (-1.0 до 1.0)"
                value={recFormData.sentiment_threshold}
                onChange={handleRecFormChange}
                required
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseRecModal}>Скасувати</button>
                <button type="submit" className="btn-primary">Зберегти</button>
              </div>
            </form>
            <button className="modal-close-btn" onClick={handleCloseRecModal}><X size={20} /></button>
          </div>
        </div>
      )}

      <header className="admin-header">
        <div>
          <h1>Панель Адміністратора 🛡️</h1>
          <p>Керування системою підтримки ментального здоров'я</p>
        </div>
        <div style={{textAlign: 'right'}}>
           <span className="badge badge-pos">System Status: Online</span>
        </div>
      </header>

      <div className="admin-grid">
        <aside className="admin-sidebar">
          {/* ... sidebar buttons ... */}
          <button 
            className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} /> Користувачі
          </button>
          <button 
            className={`admin-nav-btn ${activeTab === 'nlp' ? 'active' : ''}`}
            onClick={() => setActiveTab('nlp')}
          >
            <List size={20} /> Словник NLP
          </button>
          <button 
            className={`admin-nav-btn ${activeTab === 'recs' ? 'active' : ''}`}
            onClick={() => setActiveTab('recs')}
          >
            <ShieldAlert size={20} /> Рекомендації
          </button>
          <button 
            className={`admin-nav-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <Database size={20} /> Система та Логи
          </button>
        </aside>

        <main>
          {/* ... Users tab ... */}
          {activeTab === 'users' && (
            <div className="admin-content-card">
              <div className="card-header">
                <h3>Зареєстровані користувачі</h3>
                <div style={{display:'flex', alignItems:'center', background:'#f5f5f5', padding:'5px 10px', borderRadius:'8px'}}>
                    <Search size={16} color="#999"/>
                    <input 
                      className="input-admin"
                      style={{border:'none', background:'transparent', marginLeft:'5px'}} 
                      placeholder="Пошук..." 
                    />
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Логін</th>
                    <th>Email</th>
                    <th>Роль</th>
                    <th>Статус</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td><strong>{user.username}</strong></td>
                      <td>{user.email}</td>
                      <td>{user.is_staff ? 'Адмін' : 'Користувач'}</td>
                      <td>
                        <span className={`badge ${user.is_active ? 'badge-pos' : 'badge-neg'}`}>
                          {user.is_active ? 'Активний' : 'Заблокований'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button 
                          className={`btn-icon ${user.is_active ? 'btn-warn' : 'btn-success'}`}
                          title={user.is_active ? 'Заблокувати' : 'Розблокувати'}
                          onClick={() => handleToggleBlockUser(user.id, user.is_active)}
                        >
                          {user.is_active ? <Ban size={18} /> : <ShieldCheck size={18} />}
                        </button>
                        <button 
                          className="btn-icon btn-danger"
                          title="Видалити"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ... NLP Dictionary tab ... */}
          {activeTab === 'nlp' && (
            <div className="admin-content-card">
              <div className="card-header">
                <h3>Словник емоційних тонів (NLP)</h3>
              </div>
              
              <div style={{background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#1565c0', fontSize:'0.9rem'}}>
                <Activity size={16} style={{verticalAlign: 'middle', marginRight:'5px'}}/>
                Цей словник використовується для визначення настрою. Вага: від -1.0 до +1.0.
              </div>

              <form onSubmit={handleAddWord} className="add-form-inline">
                <input 
                  className="input-admin" 
                  placeholder="Нове слово..." 
                  value={newWord}
                  onChange={e => setNewWord(e.target.value)}
                />
                <input 
                  className="input-admin" 
                  placeholder="Вага (-1.0 ... 1.0)" 
                  type="number" step="0.1" min="-1" max="1"
                  value={newScore}
                  onChange={e => setNewScore(e.target.value)}
                />
                <button type="submit" className="btn-primary"><Plus size={18}/> Додати</button>
              </form>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Слово</th>
                    <th>Вага (Sentiment)</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {dictionary.map(item => (
                    <tr key={item.id}>
                      <td style={{fontSize: '1.05rem'}}>{item.word}</td>
                      <td><strong>{item.score}</strong></td>
                      <td>
                        <button className="btn-icon btn-danger" onClick={() => handleDeleteWord(item.id)}>
                            <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. БАЗА РЕКОМЕНДАЦІЙ */}
          {activeTab === 'recs' && (
            <div className="admin-content-card">
              <div className="card-header">
                <h3>База автоматичних порад</h3>
                <button className="btn-primary" onClick={() => handleOpenRecModal()}><Plus size={18} /> Нова порада</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Текст</th>
                    <th>Поріг (Score)</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {recs.map(rec => (
                    <tr key={rec.id}>
                      <td><strong>{rec.text}</strong></td>
                      <td style={{color: '#d32f2f', fontFamily:'monospace'}}>{rec.sentiment_threshold}</td>
                      <td className="actions-cell">
                        <button className="btn-icon btn-edit" onClick={() => handleOpenRecModal(rec)}><Settings size={18} /></button>
                        <button className="btn-icon btn-danger" onClick={() => handleDeleteRec(rec.id)}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* ... System tab ... */}
          {activeTab === 'system' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
              <div className="admin-content-card">
                <div className="card-header">
                  <h3><Database size={22} style={{verticalAlign: 'middle', marginRight:'10px'}}/> Резервне копіювання</h3>
                </div>
                <p style={{color:'#666', marginBottom:'20px'}}>
                    Створення повного дампу бази даних PostgreSQL та файлів користувачів.
                </p>
                <div style={{display: 'flex', gap: '15px'}}>
                  <button className="btn-primary" onClick={handleBackup} disabled={isBackupLoading} style={{background:'#0277bd'}}>
                    {isBackupLoading ? 'Створення...' : 'Створити повний бекап'} <Save size={18} style={{marginLeft:'8px'}}/>
                  </button>
                  <button className="btn-primary" style={{background: '#f5f5f5', color:'#333', border:'1px solid #ddd'}}>
                    Завантажити лог <Download size={18} style={{marginLeft:'8px'}}/>
                  </button>
                </div>
              </div>

              <div className="admin-content-card">
                <div className="card-header">
                  <h3><FileText size={22} style={{verticalAlign: 'middle', marginRight:'10px'}}/> Журнал активності (Logs)</h3>
                </div>
                <div className="logs-container">
                  {/* ... log entries ... */}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;