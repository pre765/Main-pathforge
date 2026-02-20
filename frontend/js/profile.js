/* Profile page - load user data and render charts (multi-path support) */
(function() {
    const user = getFullUser();

    function redirectToLogin() {
        window.location.href = 'login.html';
    }

    if (!user) {
        redirectToLogin();
        return;
    }

    let paths = getSelectedPaths();
    if (paths.length === 0) paths = ['General'];

    if (!user.progressPerPath) user.progressPerPath = {};
    paths.forEach((path, i) => {
        if (!user.progressPerPath[path]) {
            user.progressPerPath[path] = getDefaultProgress(i * 7 + path.length);
        }
    });
    const users = getUsers();
    if (users[user.email]) {
        users[user.email].progressPerPath = user.progressPerPath;
        saveUsers(users);
    }

    /* Update profile info */
    const initial = user.name.charAt(0).toUpperCase();
    document.getElementById('avatar').textContent = initial;
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;

    // Calculate completed topics based on ticked subtopics
    if (!user.completedSubtopics) user.completedSubtopics = {};
    let totalCompleted = 0;
    let totalTopics = 0;
    const roadmapsData = getRoadmapsData();
    
    paths.forEach((pathName) => {
        const phases = roadmapsData[pathName] || roadmapsData['General'] || [];
        phases.forEach((phase) => {
            if (phase.subSteps && phase.subSteps.length) {
                totalTopics += phase.subSteps.length;
                phase.subSteps.forEach((_, subIdx) => {
                    const key = pathName + '_' + phase.phase + '_' + subIdx;
                    if (user.completedSubtopics[pathName] && user.completedSubtopics[pathName][key]) {
                        totalCompleted++;
                    }
                });
            }
        });
    });

    document.getElementById('stat-courses').textContent = totalCompleted + '/' + totalTopics;

    if (user.joinedAt) {
        const date = new Date(user.joinedAt);
        document.getElementById('member-since').textContent =
            date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    const totalPct = totalTopics ? Math.round((totalCompleted / totalTopics) * 100) : 0;
    const level =
        totalPct >= 80 ? 'Expert' : totalPct >= 50 ? 'Intermediate' : 'Beginner';
    document.getElementById('user-level').textContent = level;

    document.getElementById('paths-section').style.display = 'block';
    const listEl = document.getElementById('paths-list');
    const displayPaths = paths[0] === 'General' ? [] : paths;
    listEl.innerHTML = '';
    displayPaths.forEach((path) => {
        const tag = document.createElement('span');
        tag.className = 'path-tag';
        tag.textContent = path;
        listEl.appendChild(tag);
    });

    /* Account dropdown */
    const toggleBtn = document.getElementById('account-toggle-btn');
    const dropdown = document.getElementById('account-dropdown');
    const wrap = document.querySelector('.account-toggle-wrap');
    function closeDropdown() {
        dropdown.hidden = true;
        toggleBtn.setAttribute('aria-expanded', 'false');
        if (wrap) wrap.setAttribute('data-open', 'false');
    }
    function openDropdown() {
        dropdown.hidden = false;
        toggleBtn.setAttribute('aria-expanded', 'true');
        if (wrap) wrap.setAttribute('data-open', 'true');
    }
    toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (dropdown.hidden) {
            openDropdown();
        } else {
            closeDropdown();
        }
    });
    document.addEventListener('click', function(e) {
        if (wrap && !wrap.contains(e.target)) closeDropdown();
    });
    dropdown.addEventListener('click', function(e) { e.stopPropagation(); });

    document.getElementById('menu-logout').addEventListener('click', function(e) {
        e.preventDefault();
        logOut();
        redirectToLogin();
    });
    document.getElementById('menu-signout').addEventListener('click', function(e) {
        e.preventDefault();
        signOut();
        redirectToLogin();
    });
    document.getElementById('menu-delete-profile').addEventListener('click', function() {
        if (!confirm('Clear all your progress and profile data? This cannot be undone.')) return;
        deleteProfile();
        closeDropdown();
        window.location.reload();
    });
    document.getElementById('menu-delete-account').addEventListener('click', function() {
        if (!confirm('Permanently delete your account and all data? This cannot be undone.')) return;
        deleteAccount();
        redirectToLogin();
    });

    /* Tabs */
    const tabs = [
        { id: 'tab-dashboard', panelId: 'panel-dashboard' },
        { id: 'tab-posts', panelId: 'panel-posts' },
    ];
    function switchToTab(panelId) {
        const t = tabs.find((x) => x.panelId === panelId);
        if (!t) return;
        const tabEl = document.getElementById(t.id);
        const panelEl = document.getElementById(t.panelId);
        tabs.forEach((other) => {
            const oTab = document.getElementById(other.id);
            const oPanel = document.getElementById(other.panelId);
            oTab.classList.remove('active');
            oTab.setAttribute('aria-selected', 'false');
            oPanel.hidden = other.panelId !== t.panelId;
        });
        tabEl.classList.add('active');
        tabEl.setAttribute('aria-selected', 'true');
        panelEl.hidden = false;
        if (t.panelId === 'panel-posts') renderPosts();
    }

    tabs.forEach((t) => {
        const tabEl = document.getElementById(t.id);
        const panelEl = document.getElementById(t.panelId);
        tabEl.addEventListener('click', function() {
            switchToTab(t.panelId);
        });
    });

    function getDemoPosts(currentUser) {
        const name = currentUser ? currentUser.name : 'User';
        const initial = name.charAt(0).toUpperCase();
        return [
            {
                author: name,
                initial: initial,
                headline: 'Learning Web Development',
                time: '2h',
                body: 'Just completed my first React project! Huge thanks to everyone who shared resources. The roadmap here really helped me stay on track.\n\n#WebDev #LearningInPublic',
                isCurrentUser: true,
                hasImage: false,
            },
            {
                author: 'Alex Chen',
                initial: 'A',
                headline: 'Data Scientist at TechCorp',
                time: '1d',
                body: 'Reflecting on my journey from zero to landing a role in data science. Consistency over intensity — 1 hour every day for a year changed everything.',
                isCurrentUser: false,
                hasImage: false,
            },
            {
                author: name,
                initial: initial,
                headline: 'Building in public',
                time: '3d',
                body: 'Started the Cloud Computing path this week. First milestone: understanding IAM and VPCs. The demi-roadmap in the Roadmap tab is super clear.',
                isCurrentUser: true,
                hasImage: true,
            },
            {
                author: 'Sam Rivera',
                initial: 'S',
                headline: 'Security Researcher',
                time: '5d',
                body: 'If you\'re new to cyber security: start with networking basics, then Linux. Don\'t skip the fundamentals. Happy to answer DMs.',
                isCurrentUser: false,
                hasImage: false,
            },
            {
                author: name,
                initial: initial,
                headline: 'Aspiring developer',
                time: '1w',
                body: 'Signed up and chose my path. Dashboard looks clean and the roadmap for my path is exactly what I needed. Let\'s go!',
                isCurrentUser: true,
                hasImage: false,
            },
        ];
    }

    function renderPosts() {
        const feed = document.getElementById('posts-feed');
        const posts = getDemoPosts(user);
        const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
        feed.innerHTML = '';
        var composer = document.createElement('div');
        composer.className = 'post-composer';
        composer.innerHTML =
            '<div class="post-composer-inner">' +
            '<div class="post-composer-avatar">' + escapeHtml(initial) + '</div>' +
            '<div class="post-composer-input-wrap">' +
            '<input type="text" class="post-composer-input" placeholder="Start a post" id="post-composer-input" maxlength="500">' +
            '</div></div>' +
            '<div class="post-composer-actions">' +
            '<button type="button" class="post-composer-btn" title="Photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> Photo</button>' +
            '<button type="button" class="post-composer-btn" title="Video"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> Video</button>' +
            '<button type="button" class="post-composer-btn" title="Article"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Article</button>' +
            '<button type="button" class="post-composer-btn post-composer-submit" id="post-composer-submit">Post</button>' +
            '</div>';
        feed.appendChild(composer);
        var submitBtn = document.getElementById('post-composer-submit');
        var inputEl = document.getElementById('post-composer-input');
        if (submitBtn && inputEl) {
            submitBtn.addEventListener('click', function() {
                var text = (inputEl.value || '').trim();
                if (text) {
                    inputEl.value = '';
                    var newPost = {
                        author: user.name,
                        initial: initial,
                        headline: 'Building in public',
                        time: 'Just now',
                        body: text,
                        isCurrentUser: true,
                        hasImage: false,
                    };
                    var card = document.createElement('div');
                    card.className = 'post-card is-current-user';
                    card.innerHTML =
                        '<div class="post-card-header"><div class="post-avatar">' + escapeHtml(newPost.initial) + '</div>' +
                        '<div class="post-meta"><div class="post-author">' + escapeHtml(newPost.author) + ' <span class="your-post-badge">· Your post</span></div>' +
                        '<div class="post-headline">' + escapeHtml(newPost.headline) + '</div><div class="post-time">' + escapeHtml(newPost.time) + '</div></div></div>' +
                        '<div class="post-body">' + escapeHtml(newPost.body) + '</div>' +
                        '<div class="post-actions"><button type="button" class="post-action-btn">Like</button><button type="button" class="post-action-btn">Comment</button><button type="button" class="post-action-btn">Share</button></div>';
                    feed.insertBefore(card, feed.children[1]);
                }
            });
        }
        posts.forEach((post) => {
            const card = document.createElement('div');
            card.className = 'post-card' + (post.isCurrentUser ? ' is-current-user' : '');
            const yourBadge = post.isCurrentUser ? ' <span class="your-post-badge">· Your post</span>' : '';
            let imgHtml = '';
            if (post.hasImage) {
                imgHtml = '<div class="post-image-placeholder">Image</div>';
            }
            card.innerHTML =
                '<div class="post-card-header">' +
                '<div class="post-avatar">' + escapeHtml(post.initial) + '</div>' +
                '<div class="post-meta">' +
                '<div class="post-author">' + escapeHtml(post.author) + yourBadge + '</div>' +
                '<div class="post-headline">' + escapeHtml(post.headline) + '</div>' +
                '<div class="post-time">' + escapeHtml(post.time) + '</div>' +
                '</div></div>' +
                '<div class="post-body">' + escapeHtml(post.body) + '</div>' +
                imgHtml +
                '<div class="post-actions">' +
                '<button type="button" class="post-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Like</button>' +
                '<button type="button" class="post-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Comment</button>' +
                '<button type="button" class="post-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share</button>' +
                '</div>';
            feed.appendChild(card);
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /* Chart colors - different color per path */
    const pathColors = [
        'rgba(0, 255, 136, 0.9)',
        'rgba(0, 212, 255, 0.9)',
        'rgba(255, 0, 170, 0.9)',
        'rgba(191, 95, 255, 0.9)',
        'rgba(255, 170, 0, 0.9)',
        'rgba(0, 255, 200, 0.9)',
    ];
    const pathFillColors = [
        'rgba(0, 255, 136, 0.2)',
        'rgba(0, 212, 255, 0.2)',
        'rgba(255, 0, 170, 0.2)',
        'rgba(191, 95, 255, 0.2)',
        'rgba(255, 170, 0, 0.2)',
        'rgba(0, 255, 200, 0.2)',
    ];

    /* Pie Chart - Path focus distribution (completed topics per path) */
    const pathCompleted = paths.map((p) => {
        let completed = 0;
        let total = 0;
        const phases = roadmapsData[p] || roadmapsData['General'] || [];
        if (user.completedSubtopics[p]) {
            phases.forEach((phase) => {
                if (phase.subSteps && phase.subSteps.length) {
                    total += phase.subSteps.length;
                    phase.subSteps.forEach((_, subIdx) => {
                        const key = p + '_' + phase.phase + '_' + subIdx;
                        if (user.completedSubtopics[p][key]) completed++;
                    });
                }
            });
        }
        return { label: p, value: completed, total: total };
    });
    const totalCompletedAll = pathCompleted.reduce((s, p) => s + p.value, 0);

    new Chart(document.getElementById('pie-chart'), {
        type: 'doughnut',
        data: {
            labels: pathCompleted.map((p) => p.label),
            datasets: [
                {
                    data: pathCompleted.map((p) => totalCompletedAll > 0 ? (p.value / totalCompletedAll) * 100 : 0),
                    backgroundColor: pathColors.slice(0, paths.length),
                    borderColor: 'rgba(15, 23, 42, 0.9)',
                    borderWidth: 2,
                    hoverOffset: 8,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 12,
                        font: { family: 'Outfit', size: 11 },
                    },
                },
            },
        },
    });

    /* Activity Chart Toggle - Weekly Bar / Monthly Streak */
    let activityChart = null;
    const activityCtx = document.getElementById('activity-chart').getContext('2d');
    const toggleWeekly = document.getElementById('toggle-weekly');
    const toggleMonthly = document.getElementById('toggle-monthly');

    function renderWeeklyActivity() {
        if (activityChart) activityChart.destroy();
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        // Calculate completed topics per day (simulated based on completion data)
        const weeklyData = days.map(() => {
            let count = 0;
            paths.forEach((p) => {
                if (user.completedSubtopics[p]) {
                    Object.keys(user.completedSubtopics[p]).forEach(() => count++);
                }
            });
            return Math.floor(count / 7) + Math.floor(Math.random() * 5);
        });

        activityChart = new Chart(activityCtx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Topics Completed',
                    data: weeklyData,
                    backgroundColor: pathColors[0],
                    borderRadius: 6,
                    borderSkipped: false,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8', font: { size: 11 } },
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: { color: '#94a3b8', font: { size: 11 }, beginAtZero: true },
                    },
                },
            },
        });
    }

    function renderMonthlyStreak() {
        if (activityChart) activityChart.destroy();
        
        // Generate last 30 days streak data
        const today = new Date();
        const daysData = [];
        const labels = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.getDate());
            
            // Check if user has completed topics (simulate streak)
            let hasActivity = false;
            paths.forEach((p) => {
                if (user.completedSubtopics[p] && Object.keys(user.completedSubtopics[p]).length > 0) {
                    // Simulate activity based on completion count
                    const completionCount = Object.keys(user.completedSubtopics[p]).length;
                    hasActivity = (completionCount + i) % 3 !== 0; // Simulate some days with activity
                }
            });
            daysData.push(hasActivity ? 1 : 0);
        }

        // Create streak visualization
        const streakData = daysData.map((val, idx) => ({
            x: idx,
            y: val,
        }));

        activityChart = new Chart(activityCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Activity',
                    data: daysData,
                    backgroundColor: (ctx) => {
                        const value = ctx.parsed.y;
                        return value === 1 ? pathColors[0] : 'rgba(255, 255, 255, 0.1)';
                    },
                    borderRadius: 4,
                    borderSkipped: false,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 0 },
                    },
                    y: {
                        display: false,
                    },
                },
            },
        });
    }

    toggleWeekly.addEventListener('click', () => {
        toggleWeekly.classList.add('active');
        toggleMonthly.classList.remove('active');
        renderWeeklyActivity();
    });

    toggleMonthly.addEventListener('click', () => {
        toggleMonthly.classList.add('active');
        toggleWeekly.classList.remove('active');
        renderMonthlyStreak();
    });

    // Initialize with weekly
    renderWeeklyActivity();

    /* Topic Navigation */
    const topicsNav = document.getElementById('topics-navigation');
    const topicsList = document.getElementById('topics-list');
    if (paths.length > 0 && paths[0] !== 'General') {
        topicsNav.style.display = 'block';
        topicsList.innerHTML = '';
        paths.forEach((pathName) => {
            const link = document.createElement('a');
            link.href = 'profile.html?topic=' + encodeURIComponent(pathName);
            link.className = 'topic-link';
            link.textContent = pathName;
            topicsList.appendChild(link);
        });
    }
})();
