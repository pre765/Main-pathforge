(function () {
  const grid = document.getElementById('recommended-courses-grid');
  const select = document.getElementById('courses-domain-select');
  const progressWrap = document.getElementById('courses-progress');
  const progressFill = document.getElementById('courses-progress-fill');
  const progressText = document.getElementById('courses-progress-text');
  const section = document.getElementById('courses-section');

  if (!grid || !select) return;

  const token = getAuthToken && getAuthToken();
  const apiBase = (window.PathForgeConfig?.apiBaseUrl || 'http://localhost:5000/api').replace(/\/$/, '');

  if (!token) {
    if (section) section.style.display = 'none';
    return;
  }

  const freeBadgeSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.5 6H21l-5 4 2 6-6-3.5L6 18l2-6-5-4h6.5L12 2z"/></svg>';

  function setProgress(data) {
    if (!progressWrap) return;
    if (!data || typeof data.progressPercentage !== 'number') {
      progressWrap.hidden = true;
      return;
    }
    progressWrap.hidden = false;
    progressFill.style.width = `${data.progressPercentage}%`;
    progressText.textContent = `${data.progressPercentage}% complete`;
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

  function renderCourses(courses) {
    grid.innerHTML = '';
    if (!courses || !courses.length) {
      grid.innerHTML = '<p class="courses-subtitle">No courses available.</p>';
      return;
    }

    courses.forEach((course) => {
      const card = document.createElement('div');
      card.className = 'course-card';

      const header = document.createElement('div');
      header.className = 'course-card-header';
      header.innerHTML = `<span class="course-domain">${course.domain}</span>` +
        (course.isFree ? `<span class="free-badge">${freeBadgeSvg} Free</span>` : '');

      const title = document.createElement('h4');
      title.className = 'course-title';
      title.textContent = course.title;

      const provider = document.createElement('div');
      provider.className = 'course-provider';
      provider.textContent = course.provider;

      const actions = document.createElement('div');
      actions.className = 'course-actions';

      const link = document.createElement('a');
      link.className = 'course-link';
      link.href = course.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open course';

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'course-toggle' + (course.completed ? ' completed' : '');
      toggle.textContent = course.completed ? 'Completed' : 'Mark complete';
      toggle.addEventListener('click', async () => {
        toggle.disabled = true;
        try {
          const result = await apiRequest('/student/recommended-courses', {
            method: 'PATCH',
            body: { courseId: course.id }
          });
          course.completed = !course.completed;
          toggle.classList.toggle('completed', course.completed);
          toggle.textContent = course.completed ? 'Completed' : 'Mark complete';
          setProgress(result.data);
        } catch (err) {
          alert(err.message || 'Unable to update progress.');
        } finally {
          toggle.disabled = false;
        }
      });

      actions.appendChild(link);
      actions.appendChild(toggle);

      card.appendChild(header);
      card.appendChild(title);
      card.appendChild(provider);
      card.appendChild(actions);
      grid.appendChild(card);
    });
  }

  async function loadCourses() {
    const domain = select.value;
    const query = domain && domain !== 'all' ? `?domain=${encodeURIComponent(domain)}` : '';
    try {
      const payload = await apiRequest(`/student/recommended-courses${query}`);
      if (payload.data.mode === 'single') {
        renderCourses(payload.data.courses);
        setProgress(payload.data);
        return;
      }

      const courses = payload.data.domains.flatMap((entry) => entry.courses);
      renderCourses(courses);
      progressWrap.hidden = true;
    } catch (err) {
      grid.innerHTML = '<p class="courses-subtitle">Unable to load courses right now.</p>';
      if (progressWrap) progressWrap.hidden = true;
    }
  }

  select.addEventListener('change', loadCourses);
  loadCourses();
})();
