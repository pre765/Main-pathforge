(function () {
  const btn = document.getElementById('auto-build-btn');
  const goalInput = document.getElementById('auto-goal');
  const weeksInput = document.getElementById('auto-weeks');
  const domainSelect = document.getElementById('auto-domain');
  const results = document.getElementById('auto-plan-results');

  if (!btn || !goalInput || !weeksInput || !domainSelect || !results) return;

  const token = getAuthToken && getAuthToken();
  const apiBase = (window.PathForgeConfig?.apiBaseUrl || 'http://localhost:5000/api').replace(/\/$/, '');

  if (!token) {
    results.innerHTML = '<p class="placeholder-desc">Sign in to generate a plan.</p>';
    btn.disabled = true;
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

  function renderPlan(plan) {
    results.innerHTML = '';
    if (!plan || !plan.length) {
      results.innerHTML = '<p class="placeholder-desc">No plan generated.</p>';
      return;
    }

    plan.forEach((week) => {
      const card = document.createElement('div');
      card.className = 'auto-week-card';
      const courses = Array.isArray(week.courses) ? week.courses : [];

      card.innerHTML = `
        <h4>Week ${week.week}: ${week.focus}</h4>
        <p>${week.milestone || ''}</p>
        <ul>${(week.roadmapItems || []).map((item) => `<li>${item}</li>`).join('')}</ul>
        <div class="auto-week-courses">
          ${courses.map((course) => `<a class="auto-course-pill" href="${course.url}" target="_blank" rel="noopener noreferrer">${course.title}</a>`).join('')}
        </div>
      `;

      results.appendChild(card);
    });
  }

  async function buildPlan() {
    const goalText = goalInput.value.trim();
    const timeframeWeeks = Number(weeksInput.value);
    const domain = domainSelect.value;

    if (!goalText) {
      alert('Please enter a goal.');
      return;
    }

    btn.disabled = true;
    results.innerHTML = '<p class="placeholder-desc">Generating plan...</p>';

    try {
      const payload = await apiRequest('/ai/roadmap/auto-build', {
        method: 'POST',
        body: { goalText, timeframeWeeks, domain }
      });
      renderPlan(payload.data.plan || []);
    } catch (err) {
      results.innerHTML = '<p class="placeholder-desc">Unable to generate plan.</p>';
    } finally {
      btn.disabled = false;
    }
  }

  btn.addEventListener('click', buildPlan);
})();
