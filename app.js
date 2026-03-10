// JCSQE学習アプリ - メインロジック
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js').catch(() => {}); }
(function() {
  'use strict';

  const STORAGE_KEY = 'jcsqe_study_data';
  let state = { mode: null, chapter: null, questions: [], idx: 0, score: 0, answers: [], timer: null, timeLeft: 0 };
  let comboCount = 0;

  // ── データ永続化 ──
  function loadData() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData(); }
    catch { return defaultData(); }
  }
  function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
  function defaultData() { return { totalAnswered: 0, totalCorrect: 0, chapterStats: {}, weakIds: [], history: [], mockHistory: [], dailyActivity: {}, bookmarks: [], streak: { lastDate: null, count: 0 }, xp: 0 }; }
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

  // ── ホーム画面統計 + 合格予測 + ストリーク + レベル ──
  function updateHomeStats() {
    const d = loadData();
    const box = document.getElementById('home-stats');
    if (d.totalAnswered > 0) {
      box.classList.remove('hidden');
      document.getElementById('home-total').textContent = d.totalAnswered;
      const rate = Math.round(d.totalCorrect / d.totalAnswered * 100);
      document.getElementById('home-rate').textContent = rate + '%';
      document.getElementById('home-weak').textContent = d.weakIds.length;
      // ストリーク (#2)
      const streak = d.streak || { count: 0 };
      document.getElementById('home-streak').textContent = '🔥 ' + streak.count + '日連続';
      // レベル (#21)
      const xp = d.xp || 0;
      const level = Math.floor(xp / 50) + 1;
      const titles = ['初心者','見習い','エンジニア','マスター','マエストロ'];
      const title = titles[Math.min(Math.floor((level-1)/5), titles.length-1)];
      document.getElementById('home-level').textContent = '⭐ Lv.' + level + ' ' + title;
      // 合格予測
      const chapCount = Object.keys(d.chapterStats).length;
      const coverage = Math.min(chapCount / 5, 1);
      const volume = Math.min(d.totalAnswered / 200, 1);
      const predict = Math.round(rate * 0.5 + coverage * 25 + volume * 25);
      const clamped = Math.min(Math.max(predict, 0), 100);
      const pEl = document.getElementById('home-predict');
      pEl.classList.remove('hidden');
      const fill = document.getElementById('predict-fill');
      fill.style.width = clamped + '%';
      fill.style.background = clamped >= 70 ? 'linear-gradient(90deg, var(--success), #34d399)' : 'linear-gradient(90deg, var(--warning), var(--danger))';
      document.getElementById('predict-value').textContent = clamped + '%';
      document.getElementById('predict-value').style.color = clamped >= 70 ? 'var(--success)' : 'var(--danger)';
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
    updateBookmarkBtn();

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
    if (state.mode === 'spaced') updateSpacedRepetition(q.id, isCorrect);

    // 結果保存
    const d = loadData();
    d.totalAnswered++;
    if (isCorrect) d.totalCorrect++;
    if (!d.chapterStats[q.chapter]) d.chapterStats[q.chapter] = { answered: 0, correct: 0 };
    d.chapterStats[q.chapter].answered++;
    if (isCorrect) d.chapterStats[q.chapter].correct++;
    if (!isCorrect && !d.weakIds.includes(q.id)) d.weakIds.push(q.id);
    if (isCorrect && d.weakIds.includes(q.id)) d.weakIds = d.weakIds.filter(id => id !== q.id);
    // 日別アクティビティ記録 (#23)
    if (!d.dailyActivity) d.dailyActivity = {};
    const today = new Date().toISOString().slice(0, 10);
    d.dailyActivity[today] = (d.dailyActivity[today] || 0) + 1;
    // ストリーク更新 (#2)
    if (!d.streak) d.streak = { lastDate: null, count: 0 };
    if (d.streak.lastDate !== today) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      d.streak.count = (d.streak.lastDate === yesterday.toISOString().slice(0, 10)) ? d.streak.count + 1 : 1;
      d.streak.lastDate = today;
    }
    // XP獲得 (#21)
    if (!d.xp) d.xp = 0;
    d.xp += isCorrect ? 10 : 2;
    saveData(d);
    // 紙吹雪 & コンボ (#6)
    if (isCorrect && state.mode !== 'mock') {
      comboCount++;
      showConfetti();
      if (comboCount >= 3) showCombo(comboCount);
    } else { comboCount = 0; }
    // ブックマーク状態更新
    updateBookmarkBtn();


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

    // 模擬試験履歴保存 (#4)
    if (state.mode === 'mock') {
      const d = loadData();
      if (!d.mockHistory) d.mockHistory = [];
      d.mockHistory.push({ date: new Date().toISOString(), score: state.score, total, pct });
      if (d.mockHistory.length > 20) d.mockHistory = d.mockHistory.slice(-20);
      saveData(d);
    }
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

    // リングチャート (#7)
    const colors = ['#6366f1','#8b5cf6','#06b6d4','#f59e0b','#10b981'];
    const ringsEl = document.getElementById('dash-rings');
    ringsEl.innerHTML = '';
    CHAPTERS.forEach((ch, i) => {
      const s = d.chapterStats[ch.id] || { answered: 0, correct: 0 };
      const p = s.answered > 0 ? Math.round(s.correct / s.answered * 100) : 0;
      const r = 32, circ = 2 * Math.PI * r, offset = circ - (p / 100) * circ;
      ringsEl.innerHTML += `<div class="ring-chart"><svg viewBox="0 0 80 80"><circle class="ring-bg" cx="40" cy="40" r="${r}"/><circle class="ring-fg" cx="40" cy="40" r="${r}" stroke="${colors[i]}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/></svg><div class="ring-pct" style="color:${colors[i]}">${s.answered > 0 ? p + '%' : '--'}</div><div class="ring-label">第${ch.id}章</div></div>`;
    });

    // 模擬試験履歴 (#4)
    const mh = d.mockHistory || [];
    const ml = document.getElementById('dash-mock-list');
    if (mh.length === 0) { ml.innerHTML = '<p style="color:var(--text-muted);">まだ模擬試験を受けていません</p>'; }
    else { ml.innerHTML = mh.slice(-5).reverse().map(m => `<div class="mock-item"><span class="mock-date">${m.date.slice(0,10)}</span><span class="mock-score ${m.pct >= 70 ? 'pass' : 'fail'}">${m.pct}% (${m.score}/${m.total})</span></div>`).join(''); }

    // 苦手分野分析 (#24)
    const aEl = document.getElementById('dash-analysis');
    let aHtml = '';
    CHAPTERS.forEach(ch => {
      const s = d.chapterStats[ch.id] || { answered: 0, correct: 0 };
      if (s.answered === 0) return;
      const p = Math.round(s.correct / s.answered * 100);
      if (p >= 80) aHtml += `<div class="analysis-item analysis-strong">✅ 第${ch.id}章 ${ch.name.substring(0,10)} — 得意 (${p}%)</div>`;
      else if (p < 60) aHtml += `<div class="analysis-item analysis-weak">⚠️ 第${ch.id}章 ${ch.name.substring(0,10)} — 要強化 (${p}%)</div>`;
    });
    aEl.innerHTML = aHtml || '<p style="color:var(--text-muted);">データが不足しています。もう少し学習を進めてください。</p>';

    // 学習ヒートマップ (#23)
    const hmEl = document.getElementById('dash-heatmap');
    const act = d.dailyActivity || {};
    let hmHtml = '<div class="heatmap-grid">';
    for (let i = 89; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      const cnt = act[key] || 0;
      const lvl = cnt === 0 ? '' : cnt <= 5 ? 'l1' : cnt <= 15 ? 'l2' : cnt <= 30 ? 'l3' : 'l4';
      hmHtml += `<div class="heatmap-cell ${lvl}" title="${key}: ${cnt}問"></div>`;
    }
    hmHtml += '</div><div class="heatmap-legend">少 <div class="heatmap-cell"></div><div class="heatmap-cell l1"></div><div class="heatmap-cell l2"></div><div class="heatmap-cell l3"></div><div class="heatmap-cell l4"></div> 多（過去90日）</div>';
    hmEl.innerHTML = hmHtml;

    // 弱点問題
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

  // 印刷用まとめ (#26)
  function printSummary() { showDashboard(); setTimeout(() => window.print(), 300); }

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
  renderGlossary();
  generateStudyPlan();

  // ── 間隔反復 (#1) ──
  function startSpacedMode() {
    const d = loadData();
    const sr = d.spacedRepetition || {};
    const now = Date.now();
    // 復習すべき問題: nextReview が今日以前のもの
    let dueQs = QUESTIONS.filter(q => {
      const info = sr[q.id];
      if (!info) return true; // 未学習は対象
      return info.nextReview <= now;
    });
    if (dueQs.length === 0) { alert('今日の復習はすべて完了！🎉 明日また来てください。'); return; }
    shuffle(dueQs);
    dueQs = dueQs.slice(0, 20); // 最大20問
    state.mode = 'spaced'; state.chapter = null;
    state.questions = dueQs; state.idx = 0; state.score = 0; state.answers = [];
    document.getElementById('quiz-timer-box').classList.add('hidden');
    showScreen('quiz');
    renderQuestion();
  }

  // 間隔反復のスケジュール更新（回答後に呼ぶ）
  function updateSpacedRepetition(qId, isCorrect) {
    const d = loadData();
    if (!d.spacedRepetition) d.spacedRepetition = {};
    const info = d.spacedRepetition[qId] || { interval: 1, ease: 2.5 };
    if (isCorrect) {
      info.interval = Math.round(info.interval * info.ease);
      info.ease = Math.min(info.ease + 0.1, 3.0);
    } else {
      info.interval = 1;
      info.ease = Math.max(info.ease - 0.2, 1.3);
    }
    info.nextReview = Date.now() + info.interval * 86400000;
    d.spacedRepetition[qId] = info;
    saveData(d);
  }

  // ── 用語集 (#8) ──
  function renderGlossary(filter) {
    const el = document.getElementById('glossary-list');
    if (!el || typeof GLOSSARY === 'undefined') return;
    const f = (filter || '').toLowerCase();
    const items = GLOSSARY.filter(g => !f || g.term.toLowerCase().includes(f) || g.reading.includes(f) || g.desc.includes(f));
    el.innerHTML = items.map(g =>
      `<div style="padding:12px;margin-bottom:8px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-sm);cursor:pointer;" onclick="this.querySelector('.g-desc').classList.toggle('hidden')">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;">${g.term}</span>
          <span style="font-size:0.7rem;padding:2px 8px;border-radius:12px;background:var(--ch${g.chapter});color:#fff;">第${g.chapter}章</span>
        </div>
        <div class="g-desc hidden" style="margin-top:8px;font-size:0.85rem;color:var(--text-secondary);line-height:1.7;">${g.desc}</div>
      </div>`
    ).join('');
    if (items.length === 0) el.innerHTML = '<p style="color:var(--text-muted);">該当する用語が見つかりません</p>';
  }
  function filterGlossary() {
    renderGlossary(document.getElementById('glossary-search').value);
  }

  // ── 学習計画ジェネレータ (#25) ──
  function generateStudyPlan() {
    const el = document.getElementById('plan-result');
    if (!el) return;
    const d = loadData();
    const now = new Date();
    const next = EXAM_SCHEDULE.find(e => new Date(e.date) > now);
    if (!next) { el.innerHTML = '<p style="color:var(--text-muted);">次回の試験日程が設定されていません</p>'; return; }
    const daysLeft = Math.ceil((new Date(next.date) - now) / 86400000);
    const totalQs = QUESTIONS.length;
    const perDay = Math.max(Math.ceil(totalQs * 2 / daysLeft), 3); // 2周を目標
    let html = `<div style="margin-bottom:16px;">
      <p><strong>📅 試験日:</strong> ${next.date} (${next.label})</p>
      <p><strong>⏱️ 残り:</strong> ${daysLeft}日</p>
      <p><strong>🎯 目標:</strong> 全${totalQs}問を2周</p>
      <p><strong>📝 1日の目安:</strong> <span style="font-size:1.2rem;font-weight:900;color:var(--accent-light);">${perDay}問</span>/日</p>
    </div>`;
    html += '<h4 style="margin-bottom:8px;">章別の推奨学習順</h4>';
    CHAPTERS.forEach(ch => {
      const s = d.chapterStats[ch.id] || { answered: 0, correct: 0 };
      const p = s.answered > 0 ? Math.round(s.correct / s.answered * 100) : 0;
      const priority = p < 60 ? '🔴 最優先' : p < 80 ? '🟡 要復習' : '🟢 維持';
      html += `<div style="padding:8px 0;border-bottom:1px solid var(--border-glass);display:flex;justify-content:space-between;"><span>${ch.icon} 第${ch.id}章</span><span>${priority} (${s.answered > 0 ? p + '%' : '未学習'})</span></div>`;
    });
    el.innerHTML = html;
  }

  // ── 紙吹雪エフェクト (#6) ──
  function showConfetti() {
    const c = document.createElement('div'); c.className = 'confetti-container';
    const colors = ['#6366f1','#8b5cf6','#06b6d4','#f59e0b','#10b981','#ef4444','#ec4899'];
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div'); p.className = 'confetti';
      p.style.left = Math.random() * 100 + '%'; p.style.top = '-10px';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDelay = Math.random() * 0.3 + 's';
      p.style.animationDuration = (1 + Math.random()) + 's';
      c.appendChild(p);
    }
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2000);
  }

  function showCombo(count) {
    const msgs = { 3: '🔥 Nice!', 5: '⚡ Excellent!', 10: '💎 Perfect!' };
    const msg = count >= 10 ? msgs[10] : count >= 5 ? msgs[5] : msgs[3];
    const el = document.createElement('div'); el.className = 'combo-toast';
    el.textContent = msg + ' x' + count;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  // ── ブックマーク (#3) ──
  function toggleBookmark() {
    if (!state.questions[state.idx]) return;
    const qId = state.questions[state.idx].id;
    const d = loadData();
    if (!d.bookmarks) d.bookmarks = [];
    if (d.bookmarks.includes(qId)) { d.bookmarks = d.bookmarks.filter(id => id !== qId); }
    else { d.bookmarks.push(qId); }
    saveData(d);
    updateBookmarkBtn();
  }

  function updateBookmarkBtn() {
    if (!state.questions[state.idx]) return;
    const qId = state.questions[state.idx].id;
    const d = loadData();
    const btn = document.getElementById('quiz-bookmark');
    if (btn) {
      const isBookmarked = (d.bookmarks || []).includes(qId);
      btn.textContent = isBookmarked ? '★' : '☆';
      btn.classList.toggle('active', isBookmarked);
    }
  }

  // ── デイリーチャレンジ (#20) ──
  function startDailyChallenge() {
    const today = new Date().toISOString().slice(0, 10);
    const seed = today.split('-').join('');
    // 日付ベースで5問を選出（同じ日は同じ問題）
    let qs = [...QUESTIONS];
    // 簡易シード付きシャッフル
    for (let i = qs.length - 1; i > 0; i--) {
      const j = (parseInt(seed) * (i + 1) * 9301 + 49297) % qs.length;
      [qs[i], qs[j < 0 ? 0 : j]] = [qs[j < 0 ? 0 : j], qs[i]];
    }
    qs = qs.slice(0, 5);
    state.mode = 'daily'; state.chapter = null;
    state.questions = qs; state.idx = 0; state.score = 0; state.answers = [];
    comboCount = 0;
    document.getElementById('quiz-timer-box').classList.add('hidden');
    showScreen('quiz');
    renderQuestion();
  }

  // グローバルに公開
  window.showScreen = showScreen;
  window.startWeakMode = startWeakMode;
  window.startMockExam = startMockExam;
  window.startSpacedMode = startSpacedMode;
  window.startDailyChallenge = startDailyChallenge;
  window.showDashboard = showDashboard;
  window.nextQuestion = nextQuestion;
  window.retryQuiz = retryQuiz;
  window.resetData = resetData;
  window.toggleTheme = toggleTheme;
  window.exportData = exportData;
  window.importData = importData;
  window.printSummary = printSummary;
  window.filterGlossary = filterGlossary;
  window.toggleBookmark = toggleBookmark;
})();
