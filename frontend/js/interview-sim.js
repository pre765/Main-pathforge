(function () {
  const token = getAuthToken && getAuthToken();
  const apiBase = (window.PathForgeConfig?.apiBaseUrl || 'http://localhost:5000/api').replace(/\/$/, '');

  const btnGenerate = document.getElementById('btn-generate-question');
  const btnScore = document.getElementById('btn-score-answer');
  const questionText = document.getElementById('mock-question-text');
  const answerInput = document.getElementById('mock-answer');
  const domainSelect = document.getElementById('ai-mock-domain');
  const typeSelect = document.getElementById('ai-mock-type');
  const difficultySelect = document.getElementById('ai-mock-difficulty');

  const feedbackWrap = document.getElementById('ai-mock-feedback');
  const feedbackSummary = document.getElementById('ai-mock-summary');
  const feedbackStrengths = document.getElementById('ai-mock-strengths');
  const feedbackImprovements = document.getElementById('ai-mock-improvements');
  const scoreGrid = document.getElementById('ai-mock-score-grid');

  const heatmapGrid = document.getElementById('ai-heatmap-grid');
  const heatmapLegend = document.getElementById('ai-heatmap-legend');

  if (!btnGenerate || !btnScore || !questionText || !answerInput || !domainSelect) return;

  if (!token) {
    questionText.textContent = 'Sign in to use AI mock interview features.';
    btnGenerate.disabled = true;
    btnScore.disabled = true;
    return;
  }

  async function apiRequest(path, options = {}) {
    const res = await fetch(`${apiBase}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {})
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload.success === false) {
      throw new Error(payload.message || 'Request failed');
    }
    return payload;
  }

  function renderList(listEl, items, label) {
    listEl.innerHTML = '';
    if (!items || !items.length) {
      listEl.innerHTML = `<li>${label} not available.</li>`;
      return;
    }
    items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      listEl.appendChild(li);
    });
  }

  function renderScores(scores) {
    scoreGrid.innerHTML = '';
    Object.entries(scores || {}).forEach(([key, value]) => {
      const card = document.createElement('div');
      card.className = 'mock-score-card';
      card.innerHTML = `<div>${key.replace(/([A-Z])/g, ' $1')}</div><strong>${value}/5</strong>`;
      scoreGrid.appendChild(card);
    });
  }

  async function generateQuestion() {
    btnGenerate.disabled = true;
    try {
      const payload = await apiRequest('/ai/interview/question', {
        method: 'POST',
        body: {
          domain: domainSelect.value,
          type: typeSelect.value,
          difficulty: difficultySelect.value
        }
      });
      questionText.textContent = payload.data.question;
    } catch (err) {
      questionText.textContent = 'Unable to generate a question.';
    } finally {
      btnGenerate.disabled = false;
    }
  }

  async function scoreAnswer() {
    const question = questionText.textContent.trim();
    const response = answerInput.value.trim();

    if (!question || question.includes('Generate Question')) {
      alert('Generate a question first.');
      return;
    }
    if (!response) {
      alert('Please write an answer.');
      return;
    }

    btnScore.disabled = true;
    try {
      const payload = await apiRequest('/ai/interview/score', {
        method: 'POST',
        body: {
          domain: domainSelect.value,
          question,
          response
        }
      });

      const data = payload.data;
      feedbackWrap.hidden = false;
      feedbackSummary.textContent = data.summary || 'Feedback ready.';
      renderList(feedbackStrengths, data.strengths, 'Strengths');
      renderList(feedbackImprovements, data.improvements, 'Improvements');
      renderScores(data.scores);
      await loadHeatmap();
    } catch (err) {
      alert(err.message || 'Failed to score response.');
    } finally {
      btnScore.disabled = false;
    }
  }

  function scoreToColor(value) {
    const pct = Math.max(0, Math.min(5, value)) / 5;
    const hue = 120 * pct;
    return `hsl(${hue}, 70%, 35%)`;
  }

  function renderHeatmap(data) {
    heatmapGrid.innerHTML = '';
    const competencies = data.competencies || [];
    const attempts = data.attempts || [];

    if (!competencies.length || !attempts.length) {
      heatmapGrid.innerHTML = '<p class="placeholder-desc">No interview attempts yet.</p>';
      heatmapLegend.innerHTML = '';
      return;
    }

    competencies.forEach((key) => {
      const row = document.createElement('div');
      row.className = 'heatmap-row';

      const label = document.createElement('div');
      label.className = 'heatmap-label';
      label.textContent = key.replace(/([A-Z])/g, ' $1');
      row.appendChild(label);

      attempts.forEach((attempt) => {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        const value = Number(attempt.scores?.[key] || 0);
        cell.style.background = scoreToColor(value);
        cell.title = `${value}/5`;
        row.appendChild(cell);
      });

      heatmapGrid.appendChild(row);
    });

    heatmapLegend.innerHTML = `
      <span><span class="legend-swatch" style="background:hsl(0,70%,35%)"></span>0</span>
      <span><span class="legend-swatch" style="background:hsl(60,70%,35%)"></span>2</span>
      <span><span class="legend-swatch" style="background:hsl(120,70%,35%)"></span>5</span>
    `;
  }

  async function loadHeatmap() {
    try {
      const payload = await apiRequest('/ai/interview/heatmap?limit=8');
      renderHeatmap(payload.data);
    } catch (_) {
      heatmapGrid.innerHTML = '<p class="placeholder-desc">Unable to load heatmap.</p>';
    }
  }

  btnGenerate.addEventListener('click', generateQuestion);
  btnScore.addEventListener('click', scoreAnswer);
  loadHeatmap();
})();
