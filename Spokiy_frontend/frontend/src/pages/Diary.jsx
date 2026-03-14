import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Если файл лежит в src/pages, то путь к App.css в src/ будет ../App.css
import '../App.css'; 

const AVAILABLE_TAGS = [
  '😴 Сон', '💻 Робота', '🎓 Навчання', '🏃 Спорт', 
  '🍔 Їжа', '🎮 Відпочинок', '👨‍👩‍👧‍👦 Сім’я', '❤️ Побачення'
];

function Diary() {
  const getLocalDateString = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // --- CALENDAR & MODAL STATE ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState(getLocalDateString(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- FORM STATE ---
  const [text, setText] = useState('');
  const [moodLevel, setMoodLevel] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState('');
  
  const [history, setHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const authConfig = { headers: { 'Authorization': `Token ${token}` } };

  // EMOJI HELPERS
  const getMoodEmoji = (level) => {
    if (level <= 2) return '😭';
    if (level <= 4) return '😔';
    if (level <= 6) return '😐';
    if (level <= 8) return '🙂';
    return '🤩';
  };

  const getMoodLabel = (level) => {
    if (level <= 2) return 'Жахливо';
    if (level <= 4) return 'Так собі';
    if (level <= 6) return 'Нормально';
    if (level <= 8) return 'Добре';
    return 'Чудово!';
  };

  // API: Загрузка
  const fetchHistory = async () => {
    if (!token) return;
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/mood-records/', authConfig);
      setHistory(response.data);
    } catch (error) {
      if (error.response?.status === 401) navigate('/login');
    }
  };

  useEffect(() => {
    if (!token) navigate('/login');
    else fetchHistory();
  }, [token]);

  // API: Удаление
  const handleDelete = async (id) => {
    if(!window.confirm("Видалити цей запис?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/mood-records/${id}/`, authConfig);
      fetchHistory();
    } catch (error) { alert("Помилка видалення"); }
  };

  // API: Отправка (С УЧЕТОМ ДАТЫ)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 1. Формируем текст с тегами
    let finalText = text;
    if (selectedTags.length > 0) {
      finalText += "\n\n" + selectedTags.map(t => `#${t.split(' ')[1]}`).join(' ');
    }

    // 2. Собираем данные
    const payload = {
      text: finalText,
      mood_level: moodLevel
    };

    // 3. Если выбрана дата - добавляем её
    if (showDatePicker && customDate) {
      payload.date = customDate;
    }

    try {
      await axios.post('http://127.0.0.1:8000/api/mood-records/', payload, authConfig);
      
      // Сброс формы
      setText('');
      setMoodLevel(5);
      setSelectedTags([]);
      setShowDatePicker(false);
      setCustomDate('');
      
      fetchHistory();
    } catch (error) { 
      alert("Помилка збереження"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
    else setSelectedTags([...selectedTags, tag]);
  };

  // --- CALENDAR LOGIC ---
  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let firstDay = new Date(year, month, 1).getDay();
  const startingDay = firstDay === 0 ? 6 : firstDay - 1; // Make Monday = 0

  // Filter history by selected date
  const filteredHistory = history.filter(item => {
    if (!selectedDateFilter) return true;
    return item.date.startsWith(selectedDateFilter); // API returns ISO 8601 strings
  });

  const calculateDailyAvg = (items) => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, curr) => acc + curr.mood_level, 0);
    return (sum / items.length).toFixed(1);
  };

  const selectedAvg = calculateDailyAvg(filteredHistory);

  // Текущая дата для max атрибута
  const nowISO = new Date().toISOString().slice(0, 16);

  // Formatting header date
  const displayDateHeader = () => {
    if (!selectedDateFilter) return 'Всі записи';
    const d = new Date(selectedDateFilter);
    if (getLocalDateString(d) === getLocalDateString(new Date())) return 'Сьогодні';
    return d.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="diary-page-wrapper" style={{paddingTop: '30px', paddingBottom: '70px'}}>
      
      {/* --- MODAL OVERLAY --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, fontSize: '1.6rem'}}>Як ти зараз?</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              
              {/* Слайдер */}
              <div style={{textAlign: 'center', margin: '15px 0 25px 0'}}>
                <div style={{fontSize: '4.5rem', marginBottom:'10px', transition:'0.2s', lineHeight: 1}}>
                  {getMoodEmoji(moodLevel)}
                </div>
                <div style={{color: '#2E7D32', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '10px'}}>
                  {getMoodLabel(moodLevel)} ({moodLevel}/10)
                </div>
                <input 
                  type="range" min="1" max="10" 
                  value={moodLevel} 
                  onChange={(e) => setMoodLevel(parseInt(e.target.value))} 
                />
              </div>

              {/* Теги */}
              <div className="tags-container" style={{justifyContent: 'center', marginBottom: '25px'}}>
                {AVAILABLE_TAGS.map(tag => (
                  <div 
                    key={tag} 
                    className={`tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </div>
                ))}
              </div>

              {/* Текст */}
              <textarea 
                rows="4" 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                placeholder="Опишіть свої думки..." 
                required 
                style={{marginBottom: '20px'}}
              />

              {/* --- ВЫБОР ДАТЫ --- */}
              <div style={{marginBottom: '20px'}}>
                <button 
                  type="button" 
                  className={`date-picker-btn ${showDatePicker ? 'active' : ''}`}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  {showDatePicker ? (
                    <><span>✖</span> Скасувати дату</>
                  ) : (
                    <><span>📅</span> Це було в інший час?</>
                  )}
                </button>

                {showDatePicker && (
                  <div className="date-picker-dropdown">
                    <label>Час події</label>
                    <input 
                      type="datetime-local" 
                      max={nowISO}
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      required={showDatePicker}
                    />
                    <div className="date-hint">* Збережеться в хронології за вказаним часом</div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={isSubmitting} style={{width: '100%', opacity: isSubmitting ? 0.7 : 1}}>
                {isSubmitting ? 'Зберігаємо...' : 'Записати'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MAIN DASHBOARD GRID --- */}
      <div className="dashboard-grid">
        
        {/* === ЛЕВАЯ КОЛОНКА: НАВИГАЦИЯ & АНАЛИТИКА === */}
        <aside className="dashboard-sidebar">
          
          <button className="write-post-btn" onClick={() => setIsModalOpen(true)}>
            <span style={{fontSize: '1.2rem', marginRight: '8px'}}>✍️</span> Новий запис
          </button>

          <div className="card widget-card calendar-widget">
            <div className="calendar-header">
              <button onClick={handlePrevMonth} className="cal-nav-btn">&lt;</button>
              <h4 style={{textTransform: 'capitalize', margin: 0}}>{currentMonth.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}</h4>
              <button onClick={handleNextMonth} className="cal-nav-btn">&gt;</button>
            </div>
            
            <div className="calendar-grid">
              {['Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
                <div key={d} className="cal-weekday">{d}</div>
              ))}
              
              {Array(startingDay).fill(null).map((_, i) => (
                <div key={`empty-${i}`} className="cal-day empty"></div>
              ))}
              
              {Array(daysInMonth).fill(null).map((_, i) => {
                const dayNum = i + 1;
                const dStr = getLocalDateString(new Date(year, month, dayNum));
                
                // Збираємо середній настрій дня для кольорової точки
                const daysItems = history.filter(item => item.date.startsWith(dStr));
                const averageMood = calculateDailyAvg(daysItems);
                
                let dotColor = null;
                if (daysItems.length > 0) {
                  if (averageMood <= 3) dotColor = '#EF4444';
                  else if (averageMood <= 6) dotColor = '#F59E0B';
                  else dotColor = 'var(--primary-color)';
                }

                const isSelected = selectedDateFilter === dStr;
                const isToday = dStr === getLocalDateString(new Date());

                return (
                  <div 
                    key={dayNum} 
                    className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => setSelectedDateFilter(dStr)}
                  >
                    <span>{dayNum}</span>
                    {dotColor && <div className="cal-dot" style={{backgroundColor: dotColor}}></div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card widget-card stats-widget">
            <h4 style={{margin: '0 0 15px 0', fontSize: '1rem', color: 'var(--text-secondary)'}}>Статистика за {displayDateHeader()}</h4>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <div style={{fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, color: 'var(--text-main)'}}>
                {selectedAvg > 0 ? selectedAvg : '-'}
              </div>
              <div style={{color: 'var(--text-tertiary)', fontSize: '0.9rem', lineHeight: 1.2}}>
                 Середній показник <br/> настрою
              </div>
            </div>
            <div style={{marginTop: '20px'}}>
              {/* Тут можна додати топ тегів або іншу аналітику */}
              <button 
                className="btn-text" 
                style={{fontSize: '0.9rem'}}
                onClick={() => setSelectedDateFilter('')}
              >
                🔗 Показати всі записи
              </button>
            </div>
          </div>
        </aside>

        {/* === ПРАВАЯ КОЛОНКА: ЧИСТАЯ ЛЕНТА === */}
        <main className="dashboard-feed">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', borderBottom: '2px solid var(--input-border)', paddingBottom: '16px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2rem', fontWeight: '800', textTransform: 'capitalize' }}>
              {displayDateHeader()}
            </h3>
            <span style={{color: 'var(--text-tertiary)', fontWeight: '600'}}>
              Записів: {filteredHistory.length}
            </span>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="empty-state card" style={{padding: '80px 20px', background: 'transparent', border: '1px dashed var(--input-border)', boxShadow: 'none'}}>
              <span style={{fontSize:'3.5rem', display:'block', marginBottom:'16px', opacity: 0.5}}>🍃</span>
              <p style={{fontSize: '1.2rem', color: 'var(--text-secondary)'}}>На цей день немає записів.</p>
              <button className="btn-small" style={{marginTop: '15px'}} onClick={() => setIsModalOpen(true)}>Створити запис</button>
            </div>
          ) : (
            <div className="clean-feed">
              {filteredHistory.map((item) => (
                <div key={item.id} className="feed-card hover-lift">
                  
                  <div className="feed-card-header">
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <div className="feed-emoji">{getMoodEmoji(item.mood_level)}</div>
                      <div>
                        <div className="feed-time">{new Date(item.date).toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'})}</div>
                        <div className="feed-ai-badge" style={{
                          backgroundColor: item.sentiment_score > 0 ? '#E8F5E9' : (item.sentiment_score < 0 ? '#FFEBEE' : '#F8FAFC'),
                          color: item.sentiment_score > 0 ? '#059669' : (item.sentiment_score < 0 ? '#DC2626' : '#64748B'),
                          border: `1px solid ${item.sentiment_score > 0 ? '#C8E6C9' : (item.sentiment_score < 0 ? '#FFCDD2' : '#E2E8F0')}`
                        }}>
                          AI: {item.sentiment_score > 0 ? '+' : ''}{item.sentiment_score?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <button className="delete-btn-subtle" onClick={() => handleDelete(item.id)} title="Видалити">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>

                  <p className="feed-text">{item.text}</p>
                  
                  {item.recommendation && (
                    <div className="feed-insight">
                      <span style={{fontSize: '1.1rem'}}>💡</span> 
                      <p>{item.recommendation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}

export default Diary;