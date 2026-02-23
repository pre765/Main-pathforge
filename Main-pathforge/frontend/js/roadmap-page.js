/* Roadmap page - mini horizontal guide + full roadmaps for selected paths */
(function() {
    if (!getCurrentUser()) {
        window.location.href = 'login.html';
        return;
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    var pathList = getSelectedPaths();
    var pathsToShow = pathList.length ? pathList : ['General'];

    var recommendedOrder = getRecommendedPathOrder();
    var orderedPaths = pathsToShow.slice().sort(function(a, b) {
        var i = recommendedOrder.indexOf(a);
        var j = recommendedOrder.indexOf(b);
        if (i === -1) i = 999;
        if (j === -1) j = 999;
        return i - j;
    });

    var roadmapsData = getRoadmapsData();

    /* Mini horizontal roadmap */
    var miniEl = document.getElementById('mini-roadmap');
    miniEl.innerHTML = '';
    orderedPaths.forEach(function(pathName, idx) {
        var step = document.createElement('span');
        step.className = 'mini-roadmap-step';
        step.innerHTML = '<span class="mini-roadmap-step-num">' + (idx + 1) + '</span> ' + escapeHtml(pathName);
        miniEl.appendChild(step);
        if (idx < orderedPaths.length - 1) {
            var arrow = document.createElement('span');
            arrow.className = 'mini-roadmap-arrow';
            arrow.setAttribute('aria-hidden', 'true');
            arrow.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
            miniEl.appendChild(arrow);
        }
    });

    /* Get user progress for ticked items */
    var user = getFullUser();
    if (!user.completedSubtopics) user.completedSubtopics = {};

    function toggleSubtopic(pathName, phaseNum, subtopicIndex) {
        if (!user.completedSubtopics[pathName]) user.completedSubtopics[pathName] = {};
        var completedSubs = user.completedSubtopics[pathName];
        var key = pathName + '_' + phaseNum + '_' + subtopicIndex;
        if (!completedSubs[key]) {
            completedSubs[key] = true;
        } else {
            delete completedSubs[key];
        }
        user.completedSubtopics[pathName] = completedSubs;
        var users = getUsers();
        if (users[user.email]) {
            users[user.email].completedSubtopics = user.completedSubtopics;
            saveUsers(users);
        }
        renderRoadmaps();
    }

    function renderRoadmaps() {
        var container = document.getElementById('roadmap-container');
        container.innerHTML = '';
        pathsToShow.forEach(function(pathName) {
            var phases = roadmapsData[pathName] || roadmapsData['General'] || [];
            var section = document.createElement('div');
            section.className = 'roadmap-section roadmap-island';
            var phasesHtml = '';
            phases.forEach(function(p, phaseIdx) {
                var desc = p.desc ? '<p class="roadmap-phase-desc">' + escapeHtml(p.desc) + '</p>' : '';
                var subList = '';
                if (p.subSteps && p.subSteps.length) {
                    subList = '<ul class="roadmap-sublist">';
                    var pathCompletedSubs = user.completedSubtopics[pathName] || {};
                    p.subSteps.forEach(function(s, subIdx) {
                        var key = pathName + '_' + p.phase + '_' + subIdx;
                        var isChecked = pathCompletedSubs[key] || false;
                        subList += '<li class="roadmap-subtopic-item">' +
                            '<label class="roadmap-checkbox-label">' +
                            '<input type="checkbox" class="roadmap-checkbox" ' + (isChecked ? 'checked' : '') + 
                            ' data-path="' + escapeHtml(pathName) + '" data-phase="' + escapeHtml(String(p.phase)) + '" data-index="' + subIdx + '">' +
                            '<span class="roadmap-checkbox-custom"></span>' +
                            '<span class="roadmap-subtopic-text">' + escapeHtml(s) + '</span>' +
                            '</label></li>';
                    });
                    subList += '</ul>';
                }
                phasesHtml += '<div class="roadmap-phase roadmap-island-phase"><div class="roadmap-phase-header"><span class="roadmap-step-num">' + escapeHtml(String(p.phase)) + '</span><span class="roadmap-phase-title">' + escapeHtml(p.title) + '</span></div>' + desc + subList + '</div>';
            });
            section.innerHTML = '<h3 class="roadmap-path-title">' + escapeHtml(pathName) + '</h3><div class="roadmap-phases roadmap-islands-container">' + phasesHtml + '</div>';
            container.appendChild(section);
        });

        // Add click handlers for checkboxes
        container.querySelectorAll('.roadmap-checkbox').forEach(function(cb) {
            cb.addEventListener('change', function() {
                toggleSubtopic(this.dataset.path, this.dataset.phase, parseInt(this.dataset.index));
            });
        });
    }

    renderRoadmaps();
})();
