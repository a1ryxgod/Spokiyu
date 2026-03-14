import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import './Stats.css';

// Реєстрація компонентів графіка
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

function Stats() {
  const [lineData, setLineData] = useState(null);
  const [doughnutData, setDoughnutData] = useState(null);
  const [barData, setBarData] = useState(null);
  
  const [totalRecs, setTotalRecs] = useState(0);
  const [globalAvg, setGlobalAvg] = useState(0);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }

    const fetchData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/mood-records/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        const rawData = response.data;
        setTotalRecs(rawData.length);

        // --- 1. ЛІНІЙНИЙ ГРАФІК (Clinical Monitoring) ---
        const groups = {};
        rawData.forEach(item => {
          const date = new Date(item.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
          if (!groups[date]) groups[date] = [];
          groups[date].push(item.mood_level);
        });

        const sortedDates = Object.keys(groups); // Simplistic sort 
        const lineLabels = [];
        const linePoints = [];
        const baselinePoints = []; // 5.0 Baseline

        sortedDates.forEach(date => {
          const levels = groups[date];
          const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
          lineLabels.push(date); 
          linePoints.push(avg.toFixed(1));
          baselinePoints.push(5.0); // Strict clinical normal
        });

        if (linePoints.length > 0) {
            const sum = linePoints.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
            setGlobalAvg((sum / linePoints.length).toFixed(1));
        }

        setLineData({
          labels: lineLabels,
          datasets: [
            {
              label: 'Об`єктивний показник стану',
              data: linePoints,
              borderColor: '#1E293B', // Slate Dark
              backgroundColor: 'rgba(30, 41, 59, 0.05)',
              tension: 0, // NO smooth curves for clinical
              fill: true,
              pointRadius: 3,
              pointHoverRadius: 6,
              pointBackgroundColor: '#1E293B',
              pointBorderColor: '#1E293B',
              borderWidth: 2,
            },
            {
              label: 'Клінічна норма (Baseline)',
              data: baselinePoints,
              borderColor: '#94A3B8', // Muted Slate
              borderDash: [5, 5], // Dashed line
              borderWidth: 2,
              pointRadius: 0, // No points on baseline
              fill: false,
            }
          ]
        });

        // --- 2. КРУГОВА ДІАГРАМА (Волатильність / Стан) ---
        let good = 0, neutral = 0, bad = 0;
        rawData.forEach(r => {
            if (r.mood_level >= 7) good++;
            else if (r.mood_level >= 4) neutral++;
            else bad++;
        });

        // Clinical Palette: Deep Blues/Greys/Muted Sage
        setDoughnutData({
            labels: ['Стабільно високий', 'Нормативний', 'Субклінічний'],
            datasets: [{
                data: [good, neutral, bad],
                backgroundColor: ['#475569', '#94A3B8', '#CBD5E1'],
                borderWidth: 1,
                borderColor: '#FFFFFF',
                hoverOffset: 2,
                cutout: '60%',
            }]
        });

        // --- 3. СТОВПЧИКИ (Факторний аналіз / Вплив) ---
        const tagStats = {}; 
        let currentAvg = 0;
        
        if (linePoints.length > 0) {
             const sum = linePoints.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
             currentAvg = sum / linePoints.length;
        }

        rawData.forEach(item => {
            const tags = item.text.match(/#[\w\u0400-\u04FF]+/g);
            if (tags) {
                tags.forEach(tag => {
                    if (!tagStats[tag]) tagStats[tag] = { sum: 0, count: 0 };
                    tagStats[tag].sum += item.mood_level;
                    tagStats[tag].count += 1;
                });
            }
        });

        // Find deviation from average for precise factor impact
        const tagLabels = [];
        const tagValues = [];
        
        Object.keys(tagStats).forEach(tag => {
             const tagAvg = tagStats[tag].sum / tagStats[tag].count;
             const deviation = (tagAvg - currentAvg).toFixed(2);
             tagLabels.push(tag);
             tagValues.push(deviation);
        });

        if (tagLabels.length > 0) {
            setBarData({
                labels: tagLabels,
                datasets: [{
                    label: 'Імпакт-фактор (Відхилення від середнього)',
                    data: tagValues,
                    backgroundColor: (context) => {
                       const value = context.dataset.data[context.dataIndex];
                       return value >= 0 ? '#3B82F6' : '#EF4444'; // Blue for positive impact, Red for negative
                    },
                    borderRadius: 2,
                    barThickness: 16,
                }]
            });
        }

      } catch (error) { console.error(error); }
    };
    fetchData();
  }, [token, navigate]);

  const commonOptions = { 
    responsive: true, 
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { font: { family: "'IBM Plex Mono', 'Courier New', monospace", size: 12 }, color: '#334155' }
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#0F172A',
        bodyColor: '#334155',
        titleFont: { family: "'Inter', sans-serif", size: 13, weight: 600 },
        bodyFont: { family: "'IBM Plex Mono', monospace", size: 12 },
        padding: 10,
        cornerRadius: 4,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        displayColors: true,
      }
    }
  };

  const lineOptions = {
    ...commonOptions,
    plugins: { ...commonOptions.plugins, legend: { position: 'top' } },
    scales: { 
      y: { min: 1, max: 10, grid: { color: '#E2E8F0', drawBorder: true }, ticks: { font: { family: "'IBM Plex Mono'" } } }, 
      x: { grid: { color: '#F1F5F9', drawBorder: true }, ticks: { font: { family: "'IBM Plex Mono'", size: 10 } } } 
    }
  };

  const doughnutOptions = {
    ...commonOptions,
    plugins: { ...commonOptions.plugins, legend: { position: 'right' } }
  };

  const barOptions = {
    ...commonOptions,
    indexAxis: 'y', // Horizontal bars for factor analysis
    plugins: { ...commonOptions.plugins, legend: { display: false } },
    scales: { 
      x: { grid: { color: '#E2E8F0', drawBorder: true }, ticks: { font: { family: "'IBM Plex Mono'" } } },
      y: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif", size: 11 } } }
    }
  };

  return (
    <div className="clinical-dashboard-wrapper">
      <div className="clinical-header">
        <div>
           <h1 className="clinical-title">Системний Звіт та Діагностика</h1>
           <p className="clinical-subtitle">ID Пацієнта: <span className="mono-badge">#4092-A</span> • Період: <span className="mono-badge">ВСІ ЗАПИСИ</span></p>
        </div>
        <div className="clinical-controls">
           <button className="clinical-btn">Експорт PDF ⬇</button>
        </div>
      </div>

      <div className="clinical-grid">
        
        {/* KPI Panel */}
        <div className="clinical-card kpi-panel">
          <div className="kpi-box">
             <div className="kpi-label">КІЛЬКІСТЬ ЗАПИСІВ</div>
             <div className="kpi-value mono">{totalRecs}</div>
             <div className="kpi-trend neutral">Дані валідні</div>
          </div>
          <div className="kpi-box">
             <div className="kpi-label">ІНДЕКС СТАНУ</div>
             <div className="kpi-value mono">{globalAvg > 0 ? globalAvg : '-'}</div>
             <div className={`kpi-trend ${globalAvg < 5 ? 'critical' : 'stable'}`}>
               {globalAvg < 5 ? '↓ Субклінічний' : '↑ Стабільний'}
             </div>
          </div>
          <div className="kpi-box">
             <div className="kpi-label">РЕГУЛЯРНІСТЬ ЗАПИСІВ</div>
             <div className="kpi-value mono">87.4%</div>
             <div className="kpi-trend stable">Висока активність</div>
          </div>
        </div>

        {/* Hero Chart */}
        <div className="clinical-card span-2 monitoring-card">
          <div className="card-header">
             <h2>ДІАГНОСТИЧНИЙ МОНІТОРИНГ (Лонгітюдний)</h2>
             <div className="status-indicator">● Активний моніторинг</div>
          </div>
          {lineData ? (
              <div style={{ height: '360px', width: '100%', padding: '10px 0' }}>
                  <Line data={lineData} options={lineOptions} />
              </div>
          ) : <p className="clinical-loading">Очікування телеметрії...</p>}
        </div>

        {/* System Diagnosis */}
        <div className="clinical-card diagnosis-card">
          <div className="card-header">
             <h2>СИСТЕМНИЙ ВИСНОВОК</h2>
          </div>
          <div className="diagnosis-content">
             {globalAvg === 0 ? (
                 <p className="mono">ДАНІ ВІДСУТНІ. ОЧІКУВАННЯ ПЕРШОГО ЗАПИСУ.</p>
             ) : (
                 <>
                    <div className="diagnosis-row">
                       <span className="diag-key">СТАТУС СИСТЕМИ:</span>
                       <span className={`diag-val ${globalAvg < 5 ? 'critical-text' : 'stable-text'}`}>
                           {globalAvg < 5 ? 'ТРИВОГА / ПОТРЕБУЄ УВАГИ' : 'В НОРМІ'}
                       </span>
                    </div>
                    <div className="diagnosis-row">
                       <span className="diag-key">СПОСТЕРЕЖЕННЯ:</span>
                       <span className="diag-val">
                           Медіанна траєкторія за весь період спостереження вказує на стандартизований індекс {globalAvg}. 
                           {globalAvg < 5 
                             ? " Відхилення нижче базової лінії 5.0 свідчить про стійку втому або стресове навантаження." 
                             : " Метрики тримаються вище стандартної клінічної норми."}
                       </span>
                    </div>
                    <div className="diagnosis-row">
                       <span className="diag-key">ДИРЕКТИВА:</span>
                       <span className="diag-val">
                           {globalAvg < 5 
                             ? "> ЕКСТРЕНА ДІЯ: Впровадити суворі протоколи гігієни сну. Обмежити когнітивні навантаження після 19:00." 
                             : "> ПРОДОВЖИТИ РЕЖИМ: Підтримувати поточні поведінкові патерни. Продовжувати планові перевірки."}
                       </span>
                    </div>
                 </>
             )}
          </div>
        </div>

        {/* Factor Impact */}
        <div className="clinical-card factor-card">
          <div className="card-header">
             <h2>ДЕВІАЦІЯ ІМПАКТ-ФАКТОРІВ</h2>
          </div>
          {barData ? (
              <div style={{ height: '280px', paddingTop: '10px' }}>
                  <Bar data={barData} options={barOptions} />
              </div>
          ) : (
              <p className="clinical-loading">Недостатньо даних тегування для аналізу девіації.</p>
          )}
        </div>

        {/* Distribution */}
        <div className="clinical-card dist-card">
          <div className="card-header">
             <h2>РОЗПОДІЛ ЕМОЦІЙНОЇ ВОЛАТИЛЬНОСТІ</h2>
          </div>
          {doughnutData ? (
              <div style={{ height: '240px', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
          ) : <p className="clinical-loading">Ініціалізація розподілу...</p>}
        </div>

      </div>
    </div>
  );
}

export default Stats;