// JCSQE学習アプリ - メインロジック
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js').catch(() => {}); }
(function() {
  'use strict';

  const STORAGE_KEY = 'jcsqe_study_data';
  let state = { mode: null, chapter: null, questions: [], idx: 0, score: 0, answers: [], timer: null, timeLeft: 0 };

  // ── データ永続化 ──
  function loadData() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData(); }
    catch { return defaultData(); }
  }
  function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
  function defaultData() { return { totalAnswered: 0, totalCorrect: 0, chapterStats: {}, weakIds: [], history: [] }; }
  function resetData() {
    if (!confirm('学習データをすべてリセットしますか？')) return;
    localStorage.removeItem(STORAGE_KEY);
    showScreen('home');
  }

  // ── 画面切り替え ──
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'home') updateHomeStats();
    if (state.timer && id !== 'quiz') { clearInterval(state.timer); state.timer = null; }
  }

  // ── ホーム画面統計 ──
  function updateHomeStats() {
    const d = loadData();
    const box = document.getElementById('home-stats');
    if (d.totalAnswered > 0) {
      box.classList.remove('hidden');
      document.getElementById('home-total').textContent = d.totalAnswered;
      document.getElementById('home-rate').textContent = Math.round(d.totalCorrect / d.totalAnswered * 100) + '%';
      document.getElementById('home-weak').textContent = d.weakIds.length;
    } else { box.classList.add('hidden'); }
  }

  // ── 章選択画面 ──
  function buildChapterList() {
    const el = document.getElementById('chapter-list');
    const d = loadData();
    el.innerHTML = '';
    CHAPTERS.forEach(ch => {
      const qs = QUESTIONS.filter(q => q.chapter === ch.id);
      const cs = d.chapterStats[ch.id] || { answered: 0, correct: 0 };
      const pct = cs.answered > 0 ? Math.round(cs.correct / cs.answered * 100) + '%' : '未学習';
      const item = document.createElement('div');
      item.className = 'chapter-item';
      item.innerHTML = `<span class="ch-icon">${ch.icon}</span><span class="ch-name">${ch.name}</span><span class="ch-badge">${qs.length}問 / ${pct}</span>`;
      item.onclick = () => startChapterMode(ch.id);
      el.appendChild(item);
    });
    // 全章ボタン
    const all = document.createElement('div');
    all.className = 'chapter-item';
    all.innerHTML = '<span class="ch-icon">🎲</span><span class="ch-name">全章ランダム</span><span class="ch-badge">' + QUESTIONS.length + '問</span>';
    all.onclick = () => startChapterMode(0);
    el.appendChild(all);
  }

  // ── 分野別学習 ──
  function startChapterMode(chId) {
    state.mode = 'chapter'; state.chapter = chId;
    let qs = chId === 0 ? [...QUESTIONS] : QUESTIONS.filter(q => q.chapter === chId);
    shuffle(qs);
    state.questions = qs; state.idx = 0; state.score = 0; state.answers = [];
    document.getElementById('quiz-timer-box').classList.add('hidden');
    showScreen('quiz');
    renderQuestion();
  }

  // ── 弱点克服 ──
  function startWeakMode() {
    const d = loadData();
    if (d.weakIds.length === 0) { alert('弱点問題はありません！素晴らしいです！'); return; }
    state.mode = 'weak'; state.chapter = null;
    let qs = QUESTIONS.filter(q => d.weakIds.includes(q.id));
    shuffle(qs);
    state.questions = qs; state.idx = 0; state.score = 0; state.answers = [];
    document.getElementById('quiz-timer-box').classList.add('hidden');
    showScreen('quiz');
    renderQuestion();
  }

  // ── 模擬試験 ──
  function startMockExam() {
    if (!confirm('模擬試験を開始します。\n40問・60分制限です。よろしいですか？')) return;
    state.mode = 'mock'; state.chapter = null;
    let qs = [...QUESTIONS]; shuffle(qs); qs = qs.slice(0, 40);
    state.questions = qs; state.idx = 0; state.score = 0; state.answers = [];
    state.timeLeft = 60 * 60;
    document.getElementById('quiz-timer-box').classList.remove('hidden');
    updateTimerDisplay();
    state.timer = setInterval(() => {
      state.timeLeft--;
      updateTimerDisplay();
      if (state.timeLeft <= 0) { clearInterval(state.timer); state.timer = null; finishQuiz(); }
    }, 1000);
    showScreen('quiz');
    renderQuestion();
  }

  function updateTimerDisplay() {
    const m = Math.floor(state.timeLeft / 60), s = state.timeLeft % 60;
    const el = document.getElementById('quiz-timer');
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    el.className = 'timer' + (state.timeLeft <= 60 ? ' danger' : state.timeLeft <= 300 ? ' warning' : '');
  }

  // ── クイズ描画 ──
  function renderQuestion() {
    const q = state.questions[state.idx];
    const total = state.questions.length;
    document.getElementById('quiz-progress').textContent = `${state.idx + 1} / ${total}`;
    document.getElementById('quiz-bar').style.width = ((state.idx + 1) / total * 100) + '%';
    const lvl = document.getElementById('quiz-level');
    lvl.textContent = q.level;
    lvl.className = 'quiz-level ' + q.level.toLowerCase();
    document.getElementById('quiz-question').textContent = q.question;
    document.getElementById('quiz-explanation').classList.add('hidden');
    document.getElementById('quiz-next-box').classList.add('hidden');

    const labels = ['A', 'B', 'C', 'D'];
    const container = document.getElementById('quiz-choices');
    container.innerHTML = '';
    q.choices.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `<span class="choice-label">${labels[i]}</span><span>${c}</span>`;
      btn.onclick = () => selectAnswer(i);
      container.appendChild(btn);
    });

    if (state.mode === 'mock') {
      document.getElementById('quiz-next-btn').textContent = state.idx >= total - 1 ? '結果を見る →' : '次の問題 →';
    } else {
      document.getElementById('quiz-next-btn').textContent = state.idx >= total - 1 ? '結果を見る →' : '次の問題 →';
    }
  }

  function selectAnswer(chosen) {
    const q = state.questions[state.idx];
    const correct = q.answer;
    const isCorrect = chosen === correct;
    const btns = document.querySelectorAll('.choice-btn');

    btns.forEach((btn, i) => {
      btn.classList.add('disabled');
      btn.onclick = null;
      if (i === correct) { btn.classList.add('correct'); btn.classList.add('flash'); }
      if (i === chosen && !isCorrect) { btn.classList.add('wrong'); btn.classList.add('shake'); }
    });

    if (isCorrect) state.score++;
    state.answers.push({ qid: q.id, chosen, correct: isCorrect });

    // 結果保存
    const d = loadData();
    d.totalAnswered++;
    if (isCorrect) d.totalCorrect++;
    if (!d.chapterStats[q.chapter]) d.chapterStats[q.chapter] = { answered: 0, correct: 0 };
    d.chapterStats[q.chapter].answered++;
    if (isCorrect) d.chapterStats[q.chapter].correct++;
    if (!isCorrect && !d.weakIds.includes(q.id)) d.weakIds.push(q.id);
    if (isCorrect && d.weakIds.includes(q.id)) d.weakIds = d.weakIds.filter(id => id !== q.id);
    saveData(d);

    // 模擬試験は解説なしで次へ進む
    if (state.mode === 'mock') {
      setTimeout(() => nextQuestion(), 800);
    } else {
      const labels = ['A', 'B', 'C', 'D'];
      let expHtml = `<div class="exp-summary">${q.explanation}</div>`;
      if (q.choiceDetails) {
        expHtml += '<div class="exp-choices">';
        q.choiceDetails.forEach((d, i) => {
          const isAns = i === q.answer;
          expHtml += `<div class="exp-choice ${isAns ? 'exp-correct' : 'exp-wrong'}"><span class="exp-marker">${isAns ? '✅' : '❌'} ${labels[i]}</span> ${d}</div>`;
        });
        expHtml += '</div>';
      }
      if (q.source) { expHtml += `<div class="exp-source">📖 ${q.source}</div>`; }
      document.getElementById('quiz-explanation-text').innerHTML = expHtml;
      document.getElementById('quiz-explanation').classList.remove('hidden');
      document.getElementById('quiz-next-box').classList.remove('hidden');
    }
  }

  function nextQuestion() {
    state.idx++;
    if (state.idx >= state.questions.length) { finishQuiz(); return; }
    renderQuestion();
  }

  // ── 結果画面 ──
  function finishQuiz() {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    const total = state.questions.length;
    const pct = Math.round(state.score / total * 100);
    document.getElementById('result-score').textContent = pct + '%';
    document.getElementById('result-detail').textContent = `${state.score} / ${total} 正解`;

    const passEl = document.getElementById('result-pass');
    if (pct >= 70) {
      passEl.textContent = '🎉 合格ライン達成！';
      passEl.className = 'result-pass pass';
    } else {
      passEl.textContent = '📖 もう少し！合格ライン: 70%';
      passEl.className = 'result-pass fail';
    }

    // 章別結果
    const chStats = {};
    state.answers.forEach(a => {
      const q = QUESTIONS.find(qq => qq.id === a.qid);
      if (!chStats[q.chapter]) chStats[q.chapter] = { total: 0, correct: 0 };
      chStats[q.chapter].total++;
      if (a.correct) chStats[q.chapter].correct++;
    });

    const statsHtml = Object.keys(chStats).sort().map(chId => {
      const ch = CHAPTERS.find(c => c.id === parseInt(chId));
      const s = chStats[chId];
      const p = Math.round(s.correct / s.total * 100);
      return `<div class="ch-stat-row"><span class="ch-stat-name">${ch.icon} ${ch.name.substring(0, 8)}…</span><div class="ch-stat-bar"><div class="ch-stat-fill ch${chId}-fill" style="width:${p}%">${p}%</div></div></div>`;
    }).join('');
    document.getElementById('result-chapter-stats').innerHTML = statsHtml;

    document.getElementById('result-retry-btn').onclick = () => retryQuiz();
    showScreen('result');
  }

  function retryQuiz() {
    if (state.mode === 'chapter') startChapterMode(state.chapter);
    else if (state.mode === 'weak') startWeakMode();
    else if (state.mode === 'mock') startMockExam();
  }

  // ── ダッシュボード ──
  function showDashboard() {
    const d = loadData();
    document.getElementById('dash-total').textContent = d.totalAnswered;
    document.getElementById('dash-correct').textContent = d.totalCorrect;
    document.getElementById('dash-rate').textContent = d.totalAnswered > 0 ? Math.round(d.totalCorrect / d.totalAnswered * 100) + '%' : '--%';

    const chEl = document.getElementById('dash-chapters');
    chEl.innerHTML = '';
    CHAPTERS.forEach(ch => {
      const s = d.chapterStats[ch.id] || { answered: 0, correct: 0 };
      const p = s.answered > 0 ? Math.round(s.correct / s.answered * 100) : 0;
      chEl.innerHTML += `<div class="ch-stat-row"><span class="ch-stat-name">${ch.icon} 第${ch.id}章</span><div class="ch-stat-bar"><div class="ch-stat-fill ch${ch.id}-fill" style="width:${p}%">${s.answered > 0 ? p + '%' : '未学習'}</div></div></div>`;
    });

    document.getElementById('dash-weak-count').textContent = d.weakIds.length;
    const wl = document.getElementById('dash-weak-list');
    if (d.weakIds.length === 0) {
      wl.innerHTML = '<p style="color:var(--success);">弱点問題なし！🎉</p>';
    } else {
      wl.innerHTML = d.weakIds.map(id => {
        const q = QUESTIONS.find(qq => qq.id === id);
        const ch = CHAPTERS.find(c => c.id === q.chapter);
        return `<p style="margin-bottom:6px;">• [${ch.icon}] ${q.question.substring(0, 40)}…</p>`;
      }).join('');
    }
    showScreen('dashboard');
  }

  // ── ユーティリティ ──
  function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } }

  // ── 試験情報パネル (#15) ──
  const EXAM_SCHEDULE = [
    { date: '2026-06-21', deadline: '2026-05-15', label: '第28回' },
    { date: '2026-11-15', deadline: '2026-10-10', label: '第29回' },
    { date: '2027-06-20', deadline: '2027-05-15', label: '第30回' },
  ];
  function updateExamInfo() {
    const now = new Date();
    const next = EXAM_SCHEDULE.find(e => new Date(e.date) > now);
    if (!next) { document.getElementById('exam-info').classList.add('hidden'); return; }
    const examDate = new Date(next.date);
    const deadlineDate = new Date(next.deadline);
    const daysLeft = Math.ceil((examDate - now) / 86400000);
    const dlLeft = Math.ceil((deadlineDate - now) / 86400000);
    document.getElementById('exam-date').textContent = next.date.replace(/-/g, '/') + ' (' + next.label + ')';
    document.getElementById('exam-deadline').textContent = next.deadline.replace(/-/g, '/') + (dlLeft > 0 ? '' : ' (締切済)');
    const cd = document.getElementById('exam-countdown');
    cd.textContent = '🔥 あと' + daysLeft + '日';
    if (dlLeft <= 7 && dlLeft > 0) document.getElementById('exam-deadline').textContent += ' ⚠️あと' + dlLeft + '日';
  }

  // ── ライトモード切替 (#5) ──
  function toggleTheme() {
    const body = document.body;
    const isLight = body.getAttribute('data-theme') === 'light';
    body.setAttribute('data-theme', isLight ? 'dark' : 'light');
    document.getElementById('theme-toggle').textContent = isLight ? '🌙' : '☀️';
    localStorage.setItem('jcsqe_theme', isLight ? 'dark' : 'light');
  }
  function initTheme() {
    const saved = localStorage.getItem('jcsqe_theme');
    if (saved === 'light') {
      document.body.setAttribute('data-theme', 'light');
      document.getElementById('theme-toggle').textContent = '☀️';
    }
  }

  // ── データエクスポート/インポート (#12) ──
  function exportData() {
    const d = loadData();
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'jcsqe_study_data_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const d = JSON.parse(e.target.result);
        if (d.totalAnswered !== undefined) {
          saveData(d);
          alert('データを取り込みました！');
          showDashboard();
        } else { alert('無効なデータファイルです。'); }
      } catch { alert('ファイルの読み込みに失敗しました。'); }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // ── ショートカットキー (#27) ──
  document.addEventListener('keydown', function(e) {
    const activeScreen = document.querySelector('.screen.active');
    if (!activeScreen) return;
    const screenId = activeScreen.id;

    if (screenId === 'quiz') {
      // 1-4 で選択肢を選択
      if (['1','2','3','4'].includes(e.key)) {
        const btns = document.querySelectorAll('.choice-btn:not(.disabled)');
        const idx = parseInt(e.key) - 1;
        if (btns[idx]) btns[idx].click();
      }
      // Enter/Space で次の問題
      if ((e.key === 'Enter' || e.key === ' ') && !document.getElementById('quiz-next-box').classList.contains('hidden')) {
        e.preventDefault();
        nextQuestion();
      }
    }
    // Esc でホームに戻る
    if (e.key === 'Escape') showScreen('home');
  });

  // ── 初期化 ──
  buildChapterList();
  updateHomeStats();
  updateExamInfo();
  initTheme();

  // グローバルに公開
  window.showScreen = showScreen;
  window.startWeakMode = startWeakMode;
  window.startMockExam = startMockExam;
  window.showDashboard = showDashboard;
  window.nextQuestion = nextQuestion;
  window.retryQuiz = retryQuiz;
  window.resetData = resetData;
  window.toggleTheme = toggleTheme;
  window.exportData = exportData;
  window.importData = importData;
})();
