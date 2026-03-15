import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css';

// eslint-disable-next-line react/prop-types
function Home({ forceLanding = false }) {
  const token = localStorage.getItem('token');

  // --- СТАТИСТИКА ---
  const [weekCount, setWeekCount] = useState(0);
  const [avgMood, setAvgMood] = useState(0);
  const [lastRecord, setLastRecord] = useState(null);

  useEffect(() => {
    if (!token) return;
    axios.get('http://127.0.0.1:8000/api/mood-records/', {
      headers: { 'Authorization': `Token ${token}` }
    }).then(res => {
      const records = res.data;
      // Фильтруем записи за последние 7 дней
      const now = new Date();
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      const weekRecords = records.filter(r => {
        const d = new Date(r.date);
        return d >= weekAgo && d <= now;
      });
      setWeekCount(weekRecords.length);
      // Средний настрой за неделю
      if (weekRecords.length > 0) {
        const avg = weekRecords.reduce((sum, r) => sum + r.mood_level, 0) / weekRecords.length;
        setAvgMood(avg.toFixed(1));
      } else {
        setAvgMood(0);
      }
      // Последняя запись
      if (records.length > 0) {
        // Сортируем по дате
        const sorted = records.sort((a, b) => new Date(b.date) - new Date(a.date));
        setLastRecord(sorted[0]);
      } else {
        setLastRecord(null);
      }
    });
  }, [token]);

  const showDashboard = token && !forceLanding;

  // --- АНІМАЦІЇ НА СУВІЙ ---
  useEffect(() => {
    if (showDashboard) return;
    
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };
    
    // Create an intersection observer to add the 'visible' class
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    // Select all elements that should animate on scroll
    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));
    
    return () => elements.forEach(el => observer.unobserve(el));
  }, [showDashboard]);

  // =================================================================
  // ВАРІАНТ 1: ДАШБОРД (СТРУКТУРОВАНИЙ ВИГЛЯД)
  // =================================================================
  if (showDashboard) {
    return (
      <div className="dashboard-container">
        {/* 1. ШАПКА НА ВСЮ ШИРИНУ */}
        <header className="dashboard-header">
          <div>
            <h1>Вітаємо, <span>користувач!</span> 👋</h1>
            <p>Бажаємо гарного дня і гармонії!</p>
          </div>
          <div className="date-display">
            {new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </header>

        {/* 2. ОСНОВНА СІТКА (GRID) */}
        <div className="dashboard-grid">
          
          {/* ЛІВА КОЛОНКА (ОСНОВНА) */}
          <div className="main-column">
            
            {/* Статистика */}
            <div className="dashboard-stats">
              <div className="stat-card blue">
                <div className="stat-icon">📅</div>
                <div className="stat-value">{weekCount} записів</div>
                <div className="stat-label">За тиждень</div>
              </div>
              <div className="stat-card orange">
                <div className="stat-icon">😊</div>
                <div className="stat-value">{avgMood}</div>
                <div className="stat-label">Середній настрій</div>
              </div>
              <div className="stat-card green">
                <div className="stat-icon">🔒</div>
                <div className="stat-value">100%</div>
                <div className="stat-label">Приватність</div>
              </div>
            </div>

            {/* Меню швидких дій */}
            <h3 className="section-heading">Швидкі дії</h3>
            <div className="dashboard-menu">
              {/* 1. Записати */}
              <Link to="/diary" className="menu-card action-card">
                <div className="card-icon">✏️</div>
                <div className="card-info">
                  <h3>Записати думку</h3>
                  <p>Як ви почуваєтесь?</p>
                </div>
              </Link>
              
              {/* 2. Матеріали (НОВЕ) */}
              <Link to="/materials" className="menu-card green-card">
                <div className="card-icon">📚</div>
                <div className="card-info">
                  <h3>База знань</h3>
                  <p>Поради та вправи</p>
                </div>
              </Link>

              {/* 3. Статистика */}
              <Link to="/stats" className="menu-card blue-card">
                <div className="card-icon">📊</div>
                <div className="card-info">
                  <h3>Аналітика</h3>
                  <p>Графіки настрою</p>
                </div>
              </Link>

              {/* 4. Профіль */}
              <Link to="/profile" className="menu-card orange-card">
                <div className="card-icon">⚙️</div>
                <div className="card-info">
                  <h3>Налаштування</h3>
                  <p>Профіль</p>
                </div>
              </Link>
            </div>
          </div>

          {/* ПРАВА КОЛОНКА (САЙДБАР) */}
          <div className="sidebar-column">
            
            {/* Віджет: Останній запис */}
            <div className="widget-card last-record-widget">
              <h4>📝 Останній запис</h4>
              {lastRecord ? (
                <>
                  <div className="record-header">
                    <span className="mood-emoji">{lastRecord.mood_level <= 2 ? '😭' : lastRecord.mood_level <= 4 ? '😔' : lastRecord.mood_level <= 6 ? '😐' : lastRecord.mood_level <= 8 ? '🙂' : '🤩'}</span>
                    <div className="record-meta">
                      <span className="record-rating-badge">Настрій: {lastRecord.mood_level}</span>
                      <span className="record-date">{new Date(lastRecord.date).toLocaleDateString('uk-UA', {day:'numeric', month:'short'})}</span>
                    </div>
                  </div>
                  <p className="record-text">{lastRecord.text.length > 80 ? lastRecord.text.substring(0, 80) + '...' : lastRecord.text}</p>
                  <Link to="/diary" className="btn-text">Читати повністю →</Link>
                </>
              ) : (
                <div className="empty-state">
                  <p>Ще немає записів</p>
                  <Link to="/diary" className="btn-small">Створити</Link>
                </div>
              )}
            </div>

            {/* Віджет: Порада */}
            <div className="widget-card promo-widget">
              <div className="promo-icon">💡</div>
              <h4>Порада дня</h4>
              <p>Робіть глибокий вдих на 4 секунди, затримайте на 4, видих на 4. Це миттєво знижує стрес.</p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // =================================================================
  // ВАРІАНТ 2: ЛЕНДИНГ - PREMIUM REDESIGN
  // =================================================================
  return (
    <div className="landing-view">
      
      {/* 1. HERO SECTION */}
      <section className="landing-hero">
        {/* Ambient floating glows for premium feel */}
        <div className="ambient-glow glow-1"></div>
        <div className="ambient-glow glow-2"></div>

        <div className="container hero-content">
          <div className="hero-text-wrapper reveal-on-scroll reveal-fade-up">
            <h1 className="main-text">Знайдіть свій внутрішній <span>«Спокій»</span> </h1>
            <p>Інтелектуальна система підтримки ментального здоров'я.<br/>Використовуйте силу AI для розуміння власних емоцій та боротьби зі стресом.</p>
          </div>
          
          <div className="hero-buttons reveal-on-scroll reveal-fade-up delay-200">
            {token ? (
               <Link to="/" className="btn-white">Перейти в кабінет</Link>
            ) : (
              <>
                <Link to="/register" className="btn-white">Спробувати безкоштовно</Link>
                <Link to="/login" className="btn-outline">Увійти</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. STATS BANNER (Unified Glass Banner instead of cards) */}
      <section className="section-stats-banner">
        <div className="container reveal-on-scroll reveal-scale">
          <div className="glass-banner">
            <div className="stat-banner-item">
              <h3>70%</h3>
              <p>Студентів відчувають стрес</p>
            </div>
            <div className="stat-banner-divider"></div>
            <div className="stat-banner-item">
              <h3>24/7</h3>
              <p>Доступний самоаналіз</p>
            </div>
            <div className="stat-banner-divider"></div>
            <div className="stat-banner-item">
              <h3>100%</h3>
              <p>Анонімність та безпека</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM & SOLUTION (Split Layout) */}
      <section className="section-split-problem">
        <div className="container split-container">
          <div className="split-content-left reveal-on-scroll reveal-slide-left">
            <h2 className="section-title text-left">Чому це важливо?</h2>
            <p className="lead-text">
              В сучасному світі інформаційний шум та високий темп життя призводять до вигорання. 
              Ми часто ігноруємо сигнали нашої психіки, доки не стає занадто пізно.
            </p>
          </div>
          <div className="split-content-right reveal-on-scroll reveal-slide-right delay-200">
            <div className="solution-floating-card hover-lift">
              <span className="quote-icon">💬</span>
              <p>
                <strong>«Спокій»</strong> допомагає вчасно помітити негативні тенденції. 
                Це ваш кишеньковий психологічний помічник, який завжди готовий вислухати та проаналізувати 
                ваш емоційний стан без зайвих суджень.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. AUDIENCE (Unified Bento Grid) */}
      <section className="section-bento-audience">
        <div className="container">
          <h2 className="section-title reveal-on-scroll reveal-fade-up">Для кого цей застосунок?</h2>
          
          <div className="bento-grid">
            {/* Карточка 1: Широкая (Main focus) */}
            <div className="bento-card reveal-on-scroll reveal-fade-up hover-lift">
              <div className="bento-content">
                <span className="landing-icon floating-icon">💻</span>
                <h3>IT-сфера та Офіс</h3>
                <p>Для тих, хто працює з високим когнітивним навантаженням, жорсткими дедлайнами та постійними дзвінками. Відстежуйте рівень вигорання до того, як воно накриє з головою.</p>
              </div>
              <div className="bento-decor bento-decor-1"></div>
            </div>

            {/* Карточка 2: Средняя (Справа сверху) */}
            <div className="bento-card bento-student reveal-on-scroll reveal-fade-up delay-200 hover-lift">
              <div className="bento-content">
                <span className="landing-icon floating-icon">🎓</span>
                <h3>Студенти</h3>
                <p>Допомога під час складних сесій та боротьби з прокрастинацією.</p>
              </div>
            </div>

            {/* Карточка 3: Средняя (Справа снизу) */}
            <div className="bento-card bento-creative reveal-on-scroll reveal-fade-up delay-300 hover-lift">
              <div className="bento-content">
                <span className="landing-icon floating-icon">🎨</span>
                <h3>Креативний клас</h3>
                <p>Інструмент для подолання криз та пошуку ресурсу.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (Premium Steps Cards) */}
      <section className="section-process-steps">
        <div className="container">
          <h2 className="section-title reveal-on-scroll reveal-fade-up">Як це працює?</h2>
          
          <div className="process-grid">
            
            {/* Step 1 */}
            <div className="process-card hover-lift reveal-on-scroll reveal-fade-up">
              <div className="process-step-badge">1</div>
              <h3>Вільний запис думок</h3>
              <p>Опишіть свій стан у вільній формі. Не потрібно підбирати слова чи обирати шкали з десятка варіантів. Це ваш безпечний простір.</p>
              <div className="process-visual hover-zoom-inner">
                <div className="mock-lines">
                    <div className="line l-long pulse-width"></div>
                    <div className="line l-medium pulse-width delay-200"></div>
                    <div className="line l-short pulse-width delay-400"></div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="process-card hover-lift reveal-on-scroll reveal-fade-up delay-200">
              <div className="process-step-badge">2</div>
              <h3>Інтелектуальний аналіз</h3>
              <p>Сучасні алгоритми AI визначать ваш емоційний тон та прихований рівень напруги. Система розпізнає патерни тривоги.</p>
              <div className="process-visual chart-visual hover-zoom-inner">
                 <div className="bar b1 animate-bar"></div>
                 <div className="bar b2 animate-bar delay-200"></div>
                 <div className="bar b3 animate-bar delay-300"></div>
                 <div className="bar b4 animate-bar delay-400"></div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="process-card hover-lift reveal-on-scroll reveal-fade-up delay-400">
              <div className="process-step-badge">3</div>
              <h3>Персональні рекомендації</h3>
              <p>Застосунок миттєво надасть вам пораду, підбере дихальну практику або запропонує статтю для відновлення балансу.</p>
              <div className="process-visual insight-visual hover-zoom-inner">
                 <div className="insight-icon floating-icon">💡</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS (Editorial Style) */}
      <section className="section-editorial-testimonials">
        <div className="container">
          <h2 className="section-title reveal-on-scroll reveal-fade-up">Що кажуть користувачі</h2>
          <div className="editorial-grid">
            <div className="editorial-card offset-up hover-lift reveal-on-scroll reveal-fade-up">
              <div className="quote-mark">"</div>
              <p className="editorial-text">Цей додаток допоміг мені пережити найскладнішу сесію року. Просто записуючи свої страхи, я відчувала миттєве полегшення, а графіка прогресу мотивувала рухатись далі.</p>
              <div className="editorial-author">
                <strong>Олена М.</strong>
                <span>Студентка архітектури</span>
              </div>
            </div>
            
            <div className="editorial-card offset-down hover-lift reveal-on-scroll reveal-fade-up delay-200">
              <div className="quote-mark">"</div>
              <p className="editorial-text">Дуже зручно слідкувати за статистикою. Я помітив завдяки Спокію, що мій настрій постійно падає в середу ввечері, і повністю змінив свій робочий графік.</p>
              <div className="editorial-author">
                <strong>Максим В.</strong>
                <span>QA Engineer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="landing-footer">
        <div className="container footer-content">
          <div className="footer-col brand-col">
            <h3>Спокій</h3>
            <p>Дипломний проєкт 2025.<br/>Інтелектуальний вебзастосунок для підтримки ментального здоров'я та боротьби з вигоранням.</p>
          </div>
          <div className="footer-col">
            <h4>Навігація</h4>
            <div className="footer-links">
              <Link to="/about">Про проєкт</Link>
              {token ? (
                 <Link to="/">Мій кабінет</Link>
              ) : (
                <>
                  <Link to="/login">Вхід</Link>
                  <Link to="/register">Реєстрація</Link>
                </>
              )}
            </div>
          </div>
          <div className="footer-col">
            <h4>Контакти</h4>
            <div className="footer-contacts">
              <p><span>📧</span> support@spokiy.app</p>
              <p><span>📍</span> Київ, Україна</p>
              <p><span>💬</span> Telegram: @spokiyu</p>
            </div>
          </div>
        </div>
        <div className="footer-copyright">
          © 2025 Спокій. Всі права захищені. 
        </div>
      </footer>
    </div>
  );
}

export default Home;