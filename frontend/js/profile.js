/* Profile page - load user data and render charts (multi-path support) */
(function() {
    // Check if viewing another user's profile
    const urlParams = new URLSearchParams(window.location.search);
    const viewingProfileEmail = urlParams.get('profile');
    
    const currentUser = getFullUser();
    const users = getUsers();
    
    let user = currentUser;

    // If viewing another user, load their profile
    if (viewingProfileEmail && currentUser) {
        const viewedUser = users[decodeURIComponent(viewingProfileEmail)];
        if (!viewedUser) {
            alert('User not found');
            window.location.href = 'profile.html';
            return;
        }
        user = viewedUser;
    }

    function redirectToLogin() {
        window.location.href = 'login.html';
    }

    if (!user || !currentUser) {
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

    /* Role Selection Handling */
    const roleSelectionSection = document.getElementById('role-selection-section');
    const guideInfoSection = document.getElementById('guide-info-section');
    const continueAsStudentBtn = document.getElementById('continue-as-student');
    const hereAsGuideBtn = document.getElementById('here-as-guide');
    const btnGuideRequests = document.getElementById('btn-guide-requests');
    const studentGuideSection = document.getElementById('student-guide-section');
    const studentProfileLayout = document.getElementById('panel-dashboard');
    const guideProfileLayout = document.getElementById('guide-profile-layout');

    // If viewing another user's profile, hide edit sections and show "back" link
    if (viewingProfileEmail) {
        // Hide search and editable elements
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.style.display = 'none';
        }
        
        // Hide account dropdown
        const accountToggle = document.querySelector('.account-toggle-wrap');
        if (accountToggle) {
            accountToggle.style.display = 'none';
        }
        
        // Add back link to header
        const profileHeader = document.querySelector('.profile-header-bar h1');
        if (profileHeader) {
            profileHeader.innerHTML = `<a href="profile.html" style="color:inherit;text-decoration:none;cursor:pointer;">← Back to My Profile</a>`;
        }
    }

    // Check if user is already a guide
    const userRole = user.role || 'student';
    
    if (userRole === 'guide' || userRole === 'mentor') {
        // Hide student profile, show guide profile
        if (studentProfileLayout) studentProfileLayout.style.display = 'none';
        if (guideProfileLayout) {
            guideProfileLayout.style.display = 'block';
            // Initialize guide profile
            initializeGuideProfile(user);
        }
        // Hide student-only tabs
        document.querySelectorAll('.student-only-tab').forEach(tab => {
            tab.style.display = 'none';
        });
    } else {
        // Show student profile, hide guide profile
        if (studentProfileLayout) studentProfileLayout.style.display = 'grid';
        if (guideProfileLayout) guideProfileLayout.style.display = 'none';
        
        if (roleSelectionSection) roleSelectionSection.style.display = 'block';
        if (guideInfoSection) guideInfoSection.style.display = 'none';
        if (studentGuideSection) studentGuideSection.style.display = 'block';
        // Show student-only tabs
        document.querySelectorAll('.student-only-tab').forEach(tab => {
            tab.style.display = 'inline-flex';
        });
    }

    // Find guides button for students
    document.getElementById('btn-find-guides')?.addEventListener('click', function() {
        showFindGuides();
    });

    /* Initialize Guide Profile */
    function initializeGuideProfile(guideUser) {
        // Set profile picture
        const initial = guideUser.name ? guideUser.name.charAt(0).toUpperCase() : 'G';
        document.getElementById('guide-avatar').textContent = initial;
        
        // Load stored banner and avatar images
        if (guideUser.bannerImage) {
            const bannerEl = document.getElementById('guide-banner-img');
            if (bannerEl) {
                bannerEl.style.backgroundImage = `url(${guideUser.bannerImage})`;
                bannerEl.style.backgroundSize = 'cover';
                bannerEl.style.backgroundPosition = 'center';
            }
        }
        if (guideUser.profileImage) {
            const avatarEl = document.getElementById('guide-avatar');
            if (avatarEl) {
                avatarEl.textContent = '';
                avatarEl.style.backgroundImage = `url(${guideUser.profileImage})`;
                avatarEl.style.backgroundSize = 'cover';
            }
        }
        
        // Set name and info
        document.getElementById('guide-profile-name').textContent = guideUser.name || 'Guide';
        document.getElementById('guide-headline').textContent = `${guideUser.guideExpertise || 'Expert'} in ${guideUser.guideDomain || 'Technology'}`;
        document.getElementById('guide-domain-text').textContent = guideUser.guideDomain || 'Not Set';
        
        // Show edit buttons only if viewing own profile
        if (!viewingProfileEmail && guideUser.email === currentUser.email) {
            const editBannerBtn = document.getElementById('edit-banner-btn');
            const editAvatarBtn = document.getElementById('edit-avatar-btn');
            if (editBannerBtn) editBannerBtn.style.display = 'inline-block';
            if (editAvatarBtn) editAvatarBtn.style.display = 'flex';
            
            // Banner upload handler
            editBannerBtn?.addEventListener('click', () => {
                document.getElementById('bannerUpload').click();
            });
            
            document.getElementById('bannerUpload')?.addEventListener('change', function(e) {
                const file = e.target.files?.[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageData = event.target?.result;
                    // Save to user object
                    guideUser.bannerImage = imageData;
                    users[guideUser.email] = guideUser;
                    saveUsers(users);
                    
                    // Update UI
                    const bannerEl = document.getElementById('guide-banner-img');
                    if (bannerEl) {
                        bannerEl.style.backgroundImage = `url(${imageData})`;
                        bannerEl.style.backgroundSize = 'cover';
                        bannerEl.style.backgroundPosition = 'center';
                    }
                };
                reader.readAsDataURL(file);
            });
            
            // Avatar upload handler
            editAvatarBtn?.addEventListener('click', () => {
                document.getElementById('avatarUpload').click();
            });
            
            document.getElementById('avatarUpload')?.addEventListener('change', function(e) {
                const file = e.target.files?.[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageData = event.target?.result;
                    // Save to user object
                    guideUser.profileImage = imageData;
                    users[guideUser.email] = guideUser;
                    saveUsers(users);
                    
                    // Update UI
                    const avatarEl = document.getElementById('guide-avatar');
                    if (avatarEl) {
                        avatarEl.textContent = '';
                        avatarEl.style.backgroundImage = `url(${imageData})`;
                        avatarEl.style.backgroundSize = 'cover';
                    }
                };
                reader.readAsDataURL(file);
            });
        }
        
        // Handle action buttons
        document.getElementById('btn-follow')?.addEventListener('click', function() {
            alert('Follow feature coming soon!');
        });
        
        document.getElementById('btn-dm')?.addEventListener('click', function() {
            alert('Direct messaging feature coming soon!');
        });
        
        document.getElementById('btn-student-requests')?.addEventListener('click', function() {
            // If viewing own profile and is a guide, show received requests
            // If viewing another user's profile and is a student, show send request modal
            if (!viewingProfileEmail) {
                // Viewing own profile - show received requests (for guides)
                showGuideRequests();
            } else {
                // Viewing another user's profile - show send request modal (for students)
                showSendRequestModal(guideUser);
            }
        });
        
        document.getElementById('btn-saved-posts')?.addEventListener('click', function() {
            showSavedPosts();
        });
        
        // Load guide's posts
        loadGuidePosts(guideUser);
    }

    /* Load Guide Posts */
    function loadGuidePosts(guideUser) {
        const feed = document.getElementById('guide-posts-feed');
        if (!feed) return;
        
        // Get guide's posts from localStorage (in real app, from backend)
        const allPosts = JSON.parse(localStorage.getItem('guide_posts') || '[]');
        const guidePosts = allPosts.filter(p => p.authorEmail === guideUser.email);
        
        if (guidePosts.length === 0) {
            feed.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No posts yet. Share your expertise with the community!</p>';
            return;
        }
        
        feed.innerHTML = '';
        guidePosts.forEach(post => {
            const postEl = document.createElement('div');
            postEl.className = 'post-card';
            const initial = post.author ? post.author.charAt(0).toUpperCase() : 'G';
            postEl.innerHTML = `
                <div class="post-card-header">
                    <div class="post-avatar">${escapeHtml(initial)}</div>
                    <div class="post-meta">
                        <div class="post-author">${escapeHtml(post.author)}</div>
                        <div class="post-headline">${escapeHtml(post.headline || 'Guide')}</div>
                        <div class="post-time">${escapeHtml(post.time || 'Recently')}</div>
                    </div>
                </div>
                <div class="post-body">${escapeHtml(post.body)}</div>
                <div class="post-actions">
                    <button type="button" class="post-action-btn">Like</button>
                    <button type="button" class="post-action-btn">Comment</button>
                    <button type="button" class="post-action-btn">Share</button>
                </div>
            `;
            feed.appendChild(postEl);
        });
    }

    /* Show Saved Posts */
    function showSavedPosts() {
        const savedPosts = JSON.parse(localStorage.getItem('saved_posts') || '[]');
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Saved Posts</h2>
                    <button class="modal-close" type="button">&times;</button>
                </div>
                <div class="modal-body" id="saved-posts-list">
                    ${savedPosts.length === 0 ? '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No saved posts</p>' : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const postsList = document.getElementById('saved-posts-list');
        savedPosts.forEach(post => {
            const postEl = document.createElement('div');
            postEl.className = 'post-card';
            postEl.style.marginBottom = '1rem';
            const initial = post.author ? post.author.charAt(0).toUpperCase() : 'U';
            postEl.innerHTML = `
                <div class="post-card-header">
                    <div class="post-avatar">${escapeHtml(initial)}</div>
                    <div class="post-meta">
                        <div class="post-author">${escapeHtml(post.author)}</div>
                        <div class="post-headline">${escapeHtml(post.headline || '')}</div>
                        <div class="post-time">${escapeHtml(post.time || '')}</div>
                    </div>
                </div>
                <div class="post-body">${escapeHtml(post.body)}</div>
            `;
            postsList.appendChild(postEl);
        });
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    if (continueAsStudentBtn) {
        continueAsStudentBtn.addEventListener('click', function() {
            // User continues as student - hide role selection if present
            if (roleSelectionSection) roleSelectionSection.style.display = 'none';
        });
    }

    if (hereAsGuideBtn) {
        hereAsGuideBtn.addEventListener('click', function() {
            // Redirect to guide signup page
            window.location.href = 'guide-signup.html';
        });
    }

    btnGuideRequests?.addEventListener('click', function() {
        // Show guide requests modal/page
        showGuideRequests();
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

    /* Guide Requests Management */
    function showGuideRequests() {
        // Get pending requests from localStorage (in a real app, this would be from backend)
        let requests = JSON.parse(localStorage.getItem('guide_requests') || '[]');
        
        // Filter requests for this guide's domain
        if (user.guideDomain) {
            requests = requests.filter(r => r.guideEmail === user.email && r.domain === user.guideDomain);
        } else {
            requests = requests.filter(r => r.guideEmail === user.email);
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Student Requests</h2>
                    <button class="modal-close" type="button">&times;</button>
                </div>
                <div class="modal-body" id="guide-requests-list">
                    ${requests.length === 0 ? '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No pending requests</p>' : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const requestsList = document.getElementById('guide-requests-list');
        requests.forEach((request, index) => {
            const requestEl = document.createElement('div');
            requestEl.className = 'guide-request-item';
            requestEl.innerHTML = `
                <div class="request-info">
                    <div class="request-student-name">${escapeHtml(request.studentName)}</div>
                    <div class="request-student-email">${escapeHtml(request.studentEmail)}</div>
                    <div class="request-domain">Domain: ${escapeHtml(request.domain)}</div>
                    <div class="request-message">${escapeHtml(request.message || 'No message')}</div>
                </div>
                <div class="request-actions">
                    <button class="btn-accept-request" data-index="${index}">Accept</button>
                    <button class="btn-reject-request" data-index="${index}">Reject</button>
                </div>
            `;
            requestsList.appendChild(requestEl);
        });
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Handle accept/reject
        requestsList.querySelectorAll('.btn-accept-request').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                const request = requests[index];
                // Accept request
                const connections = JSON.parse(localStorage.getItem('guide_connections') || '[]');
                connections.push({
                    studentEmail: request.studentEmail,
                    studentName: request.studentName,
                    domain: request.domain,
                    acceptedAt: new Date().toISOString()
                });
                localStorage.setItem('guide_connections', JSON.stringify(connections));
                
                // Remove from requests
                requests.splice(index, 1);
                localStorage.setItem('guide_requests', JSON.stringify(requests));
                
                modal.remove();
                alert(`Connection accepted with ${request.studentName}`);
            });
        });
        
        requestsList.querySelectorAll('.btn-reject-request').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                requests.splice(index, 1);
                localStorage.setItem('guide_requests', JSON.stringify(requests));
                modal.remove();
            });
        });
    }

    /* Send Request Modal - Student sends request to Guide */
    function showSendRequestModal(guideUser) {
        // Check if student already sent a request
        const requests = JSON.parse(localStorage.getItem('guide_requests') || '[]');
        const existingRequest = requests.find(r => 
            r.guideEmail === guideUser.email && r.studentEmail === currentUser.email
        );
        
        if (existingRequest) {
            alert('You have already sent a request to this guide.');
            return;
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Send Request to ${escapeHtml(guideUser.name)}</h2>
                    <button class="modal-close" type="button">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="request-domain">Domain (optional)</label>
                        <input type="text" id="request-domain" placeholder="${escapeHtml(guideUser.guideDomain || 'e.g., React, JavaScript')}" style="width: 100%; padding: 8px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; background: rgba(255,255,255,0.05); color: var(--text-primary);">
                    </div>
                    <div class="form-group">
                        <label for="request-message">Message</label>
                        <textarea id="request-message" placeholder="Tell ${escapeHtml(guideUser.name)} why you want their guidance..." rows="4" style="width: 100%; padding: 8px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; background: rgba(255,255,255,0.05); color: var(--text-primary); resize: vertical;"></textarea>
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                        <button type="button" class="btn-cancel-request" style="padding: 8px 16px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; background: transparent; color: var(--text-primary); cursor: pointer;">Cancel</button>
                        <button type="button" class="btn-submit-request" style="padding: 8px 16px; border: none; border-radius: 8px; background: linear-gradient(135deg, var(--accent-green), var(--accent-cyan)); color: #010008; font-weight: 600; cursor: pointer;">Send Request</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event handlers
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.btn-cancel-request').addEventListener('click', () => modal.remove());
        
        modal.querySelector('.btn-submit-request').addEventListener('click', () => {
            const domain = document.getElementById('request-domain').value || guideUser.guideDomain || 'General';
            const message = document.getElementById('request-message').value.trim();
            
            if (!message) {
                alert('Please write a message');
                return;
            }
            
            // Add request to localStorage
            const request = {
                guideEmail: guideUser.email,
                guideName: guideUser.name,
                studentEmail: currentUser.email,
                studentName: currentUser.name,
                domain: domain,
                message: message,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };
            
            requests.push(request);
            localStorage.setItem('guide_requests', JSON.stringify(requests));
            
            modal.remove();
            alert('Request sent successfully!');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /* Find Guides for Students */
    function showFindGuides() {
        // Get all guides from users
        const users = getUsers();
        const guides = Object.values(users).filter(u => u.role === 'guide' || u.role === 'mentor');
        
        // Get user's selected paths
        const userPaths = getSelectedPaths();
        const userDomain = userPaths.length > 0 ? userPaths[0] : 'General';
        
        // Filter guides by domain
        const matchingGuides = guides.filter(g => g.guideDomain === userDomain || !g.guideDomain);
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Find Guides - ${userDomain}</h2>
                    <button class="modal-close" type="button">&times;</button>
                </div>
                <div class="modal-body" id="guides-list">
                    ${matchingGuides.length === 0 ? '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No guides available for this domain</p>' : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const guidesList = document.getElementById('guides-list');
        matchingGuides.forEach((guide) => {
            if (guide.email === user.email) return; // Don't show self
            
            const guideEl = document.createElement('div');
            guideEl.className = 'guide-request-item';
            guideEl.innerHTML = `
                <div class="request-info">
                    <div class="request-student-name">${escapeHtml(guide.name)}</div>
                    <div class="request-student-email">${escapeHtml(guide.email)}</div>
                    <div class="request-domain">Domain: ${escapeHtml(guide.guideDomain || 'Not specified')}</div>
                    <div class="request-domain">Expertise: ${escapeHtml(guide.guideExpertise || 'Not specified')}</div>
                </div>
                <div class="request-actions">
                    <button class="btn-accept-request btn-request-guide" data-guide-email="${escapeHtml(guide.email)}" data-guide-name="${escapeHtml(guide.name)}" data-domain="${escapeHtml(guide.guideDomain || userDomain)}">Request Guide</button>
                </div>
            `;
            guidesList.appendChild(guideEl);
        });
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Handle guide requests
        guidesList.querySelectorAll('.btn-request-guide').forEach(btn => {
            btn.addEventListener('click', function() {
                const guideEmail = this.dataset.guideEmail;
                const guideName = this.dataset.guideName;
                const domain = this.dataset.domain;
                
                // Create request
                const requests = JSON.parse(localStorage.getItem('guide_requests') || '[]');
                const newRequest = {
                    studentEmail: user.email,
                    studentName: user.name,
                    guideEmail: guideEmail,
                    guideName: guideName,
                    domain: domain,
                    message: `Request from ${user.name} for ${domain}`,
                    requestedAt: new Date().toISOString()
                };
                
                // Check if request already exists
                const exists = requests.some(r => r.studentEmail === user.email && r.guideEmail === guideEmail);
                if (exists) {
                    alert('You have already sent a request to this guide');
                    return;
                }
                
                requests.push(newRequest);
                localStorage.setItem('guide_requests', JSON.stringify(requests));
                
                modal.remove();
                alert(`Request sent to ${guideName}!`);
            });
        });
    }

    /* Global Search Functionality */
    const searchInput = document.getElementById('global-search-input');
    const searchBtn = document.getElementById('global-search-btn');
    const searchResults = document.getElementById('search-results');

    if (searchInput && searchBtn && searchResults) {
        searchInput.addEventListener('keyup', debounce(performSearch, 300));
        searchBtn.addEventListener('click', performSearch);
        
        // Close results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.classList.add('hidden');
            }
        });
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function performSearch() {
        const query = searchInput.value.trim();
        if (!query || query.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }

        searchResults.innerHTML = '<div class="search-result-empty">Searching...</div>';
        searchResults.classList.remove('hidden');

        // Search in local users (from auth.js localStorage)
        const users = getUsers();
        const results = [];

        Object.values(users).forEach(u => {
            if (u.name.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    email: u.email,
                    name: u.name,
                    role: u.role === 'guide' || u.role === 'mentor' ? 'mentor' : 'student',
                    domain: u.guideDomain || ''
                });
            }
        });

        // Also try backend API if available
        if (results.length === 0) {
            searchBackend(query);
        } else {
            displaySearchResults(results);
        }
    }

    function searchBackend(query) {
        // Try mentors first
        fetch(`/api/guider/search?q=${encodeURIComponent(query)}`)
            .then(r => r.json())
            .catch(() => ({ data: [] }))
            .then(res1 => {
                const mentors = res1.data || [];
                // Try students
                fetch(`/api/student/search?q=${encodeURIComponent(query)}`)
                    .then(r => r.json())
                    .catch(() => ({ data: [] }))
                    .then(res2 => {
                        const students = res2.data || [];
                        const combined = [
                            ...mentors.map(m => ({ ...m, role: 'mentor' })),
                            ...students.map(s => ({ ...s, role: 'student' }))
                        ];
                        displaySearchResults(combined);
                    });
            });
    }

    function displaySearchResults(results) {
        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-empty">No results found</div>';
            return;
        }

        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.role = 'option';
            const initial = result.name.charAt(0).toUpperCase();
            item.innerHTML = `
                <div class="search-result-avatar">${escapeHtml(initial)}</div>
                <div class="search-result-info">
                    <div class="search-result-name">${escapeHtml(result.name)}</div>
                    <div class="search-result-role">${result.role === 'mentor' ? '👨‍🏫 Mentor' : '🎓 Student'} ${result.domain ? '• ' + escapeHtml(result.domain) : ''}</div>
                </div>
            `;

            item.addEventListener('click', () => {
                // Navigate to user profile
                if (result.email === currentUser.email) {
                    // Current user, just close
                    searchResults.classList.add('hidden');
                    searchInput.value = '';
                } else {
                    // Navigate to this user's profile
                    showUserProfile(result);
                    searchResults.classList.add('hidden');
                    searchInput.value = '';
                }
            });

            searchResults.appendChild(item);
        });
    }

    function showUserProfile(userInfo) {
        // Navigate to this user's profile by email
        window.location.href = 'profile.html?profile=' + encodeURIComponent(userInfo.email);
    }
})();
