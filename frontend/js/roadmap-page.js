(function(){
    /* Rebuilt roadmap-page.js
         - Student-only: redirects guides away
         - Loads lessons from selected path
         - Drag-to-reorder nodes (persist per-user)
         - Active/locked/completed state
    */

    const user = getFullUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    if (user.role && (user.role === 'guide' || user.role === 'mentor')) {
        // Guides shouldn't see the roadmap
        window.location.href = 'profile.html';
        return;
    }

    // Build lessons from selected path (user-customizable)
    const selectedPaths = getSelectedPaths();
    const roadmaps = getRoadmapsData();
    const pathName = selectedPaths && selectedPaths.length ? selectedPaths[0] : 'General';
    const phases = roadmaps[pathName] || roadmaps['General'] || [];

    // create lessons array from phases
    const lessons = phases.map((p, idx) => ({ id: idx, title: p.title, desc: p.desc }));

    // restore saved order for this user if present
    const orderKey = 'roadmap_order_' + (user.email || 'anon');
    try {
        const saved = JSON.parse(localStorage.getItem(orderKey) || 'null');
        if (Array.isArray(saved) && saved.length === lessons.length) {
            const mapById = lessons.reduce((acc, l) => (acc[l.id]=l, acc), {});
            const ordered = [];
            saved.forEach(id => { if (mapById.hasOwnProperty(id)) ordered.push(mapById[id]); });
            if (ordered.length === lessons.length) {
                lessons.length = 0; lessons.push(...ordered);
            }
        }
    } catch(e){}

    const roadmapIcons = ['🤖', '📊', '🧠', '🛠️', '🚀', '🎯', '💡', '📚'];
    let activeIndex = 0;
    const completed = new Set();

    // restore completed from user record if available
    if (user && Array.isArray(user.completedRoadmap)) {
        user.completedRoadmap.forEach(id => completed.add(Number(id)));
    }
    // ensure roadmap subtopic progress structure exists
    if (!user.completedSubtopics) user.completedSubtopics = {};

    const container = document.getElementById('roadmap');
    const modal = document.getElementById('node-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const continueBtn = document.getElementById('continue-btn');
    const modalClose = document.getElementById('modal-close');
    const modalBackdrop = document.getElementById('modal-backdrop');

    // helper to resolve topics for a given module index based on current domain/path
    function getModuleTopicsForIndex(index){
        const moduleNumber = index + 1;
        const pathKey = localStorage.getItem('selectedPath') || pathName;
        const fromMap = window.roadmapTopics
            && window.roadmapTopics[pathKey]
            && window.roadmapTopics[pathKey][String(moduleNumber)];
        const fromPhase = (phases[index] && phases[index].subSteps) || [];
        return {
            pathKey,
            topics: Array.isArray(fromMap) && fromMap.length ? fromMap : fromPhase
        };
    }

    // init
    requestAnimationFrame(()=>{
        document.querySelector('.roadmap-wrapper').classList.add('visible');
        renderRoadmap();
        enableDragToScroll();
    });

    function renderRoadmap(){
        container.innerHTML = '';

        const frag = document.createDocumentFragment();

        lessons.forEach((lesson, i)=>{
            const node = document.createElement('div');
            node.className = 'roadmap-node roadmap-step';
            if(i === activeIndex) node.classList.add('active');
            else if(completed.has(lesson.id)) node.classList.add('completed');
            else node.classList.add('locked');

            const button = document.createElement('div');
            button.className = 'roadmap-step-button';
            button.setAttribute('title', lesson.title);
            // 3D tilt interaction
            button.style.setProperty('--rx', '0deg');
            button.style.setProperty('--ry', '0deg');
            button.style.setProperty('--lift', '0px');
            button.addEventListener('pointermove', (e) => {
                const rect = button.getBoundingClientRect();
                const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
                const py = (e.clientY - rect.top) / rect.height - 0.5;
                const rx = (-py * 10).toFixed(2);
                const ry = (px * 14).toFixed(2);
                button.style.setProperty('--rx', `${rx}deg`);
                button.style.setProperty('--ry', `${ry}deg`);
                button.style.setProperty('--lift', '-2px');
            });
            button.addEventListener('pointerleave', () => {
                button.style.setProperty('--rx', '0deg');
                button.style.setProperty('--ry', '0deg');
                button.style.setProperty('--lift', '0px');
            });

            const icon = document.createElement('span');
            icon.className = 'roadmap-step-icon';
            icon.textContent = roadmapIcons[i % roadmapIcons.length];
            button.appendChild(icon);

            if (i === activeIndex) {
                const aura = document.createElement('div');
                aura.className = 'roadmap-step-aura';
                button.appendChild(aura);
            }

            const label = document.createElement('div');
            label.className = 'roadmap-step-label';
            const labelText = document.createElement('span');
            labelText.className = 'roadmap-step-title';
            labelText.textContent = lesson.title;
            label.appendChild(labelText);

            node.appendChild(button);
            node.appendChild(label);

            // hover tooltip showing concepts for this stage (Duolingo-like)
            const tooltipMeta = getModuleTopicsForIndex(i);
            const tooltip = document.createElement('div');
            tooltip.className = 'roadmap-stage-tooltip';
            const tooltipId = `roadmap-stage-tooltip-${i}`;
            tooltip.id = tooltipId;

            const ttTitle = document.createElement('div');
            ttTitle.className = 'roadmap-stage-tooltip-title';
            ttTitle.textContent = `Stage ${i+1}: ${lesson.title}`;
            tooltip.appendChild(ttTitle);

            const topics = tooltipMeta.topics || [];
            if (topics.length) {
                const list = document.createElement('ul');
                list.className = 'roadmap-stage-tooltip-list';
                topics.forEach((t, ti) => {
                    const li = document.createElement('li');

                    const labelEl = document.createElement('label');
                    labelEl.className = 'roadmap-tooltip-topic-label';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'roadmap-tooltip-topic-checkbox';

                    const moduleNumber = i + 1;
                    const pathKey = tooltipMeta.pathKey;
                    if (!user.completedSubtopics[pathKey]) {
                        user.completedSubtopics[pathKey] = {};
                    }
                    const subKey = pathKey + '_' + String(moduleNumber) + '_' + String(ti);
                    const isDone =
                        user.completedSubtopics[pathKey] &&
                        user.completedSubtopics[pathKey][subKey];
                    checkbox.checked = !!isDone;

                    checkbox.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                    });

                    checkbox.addEventListener('change', (ev) => {
                        const done = ev.target.checked;
                        const users = getUsers();
                        if (!user.completedSubtopics[pathKey]) {
                            user.completedSubtopics[pathKey] = {};
                        }
                        if (done) {
                            user.completedSubtopics[pathKey][subKey] = true;
                        } else {
                            delete user.completedSubtopics[pathKey][subKey];
                        }
                        if (users[user.email]) {
                            users[user.email].completedSubtopics = user.completedSubtopics;
                            saveUsers(users);
                        }
                    });

                    const textSpan = document.createElement('span');
                    textSpan.textContent = t;

                    labelEl.appendChild(checkbox);
                    labelEl.appendChild(textSpan);
                    li.appendChild(labelEl);
                    list.appendChild(li);
                });
                tooltip.appendChild(list);
            } else {
                const empty = document.createElement('div');
                empty.className = 'roadmap-stage-tooltip-empty';
                empty.textContent = 'Concepts coming soon.';
                tooltip.appendChild(empty);
            }

            button.appendChild(tooltip);
            button.setAttribute('aria-describedby', tooltipId);

            // direct stage-complete tick control on the 3D node
            const stageTick = document.createElement('button');
            stageTick.type = 'button';
            stageTick.className = 'roadmap-stage-complete-toggle';
            stageTick.setAttribute('aria-label', `Mark stage ${i+1} as completed`);
            if (completed.has(lesson.id)) {
                stageTick.classList.add('is-checked');
            }
            if (i > activeIndex) {
                stageTick.disabled = true;
            }
            stageTick.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (i > activeIndex) return;
                // avoid double-complete
                if (completed.has(lesson.id)) return;
                markStageCompleted(i, { fromTick: true });
            });
            button.appendChild(stageTick);

            if (i < lessons.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'roadmap-step-connector';
                if (completed.has(lesson.id)) {
                    connector.classList.add('unlocked');
                }
                node.appendChild(connector);
            }

            // store data-index for drag logic
            node.dataset.index = i;
            node.dataset.lessonId = lesson.id;

            // click behavior
            node.addEventListener('click', ()=>{
                if(i === activeIndex){
                    openModal(i);
                }
            });

            // pointer interaction for drag
            node.style.touchAction = 'none';
            node.addEventListener('pointerdown', onPointerDown);

            frag.appendChild(node);
        });

        container.appendChild(frag);
        requestAnimationFrame(drawConnectors);
    }

    function drawConnectors(){
        const nodes = Array.from(container.querySelectorAll('.roadmap-node'));
        nodes.forEach((node)=>{
            const connector = node.querySelector('.roadmap-step-connector');
            if (!connector) return;
            const lessonId = Number(node.dataset.lessonId);
            connector.classList.toggle('unlocked', completed.has(lessonId));
        });
    }

    /* Smooth drag-to-scroll with inertia (only when dragging background, not nodes) */
    function enableDragToScroll(){
        const el = container;
        if(!el) return;
        let isDown = false; let startY = 0; let scrollTop = 0; let vel = 0; let lastY=0; let lastT=0; let rafId=null;

        el.addEventListener('pointerdown', (e)=>{
            // ignore if pointer on a node (we use node pointerdown for dragging nodes)
            if (e.target.closest('.roadmap-node')) return;
            isDown = true; startY = e.clientY; scrollTop = el.scrollTop; lastY = e.clientY; lastT = performance.now(); vel = 0;
            el.classList.add('drag-scroll');
            el.setPointerCapture(e.pointerId);
            if (rafId) cancelAnimationFrame(rafId);
        });

        el.addEventListener('pointermove', (e)=>{
            if(!isDown) return;
            const dy = e.clientY - startY;
            el.scrollTop = scrollTop - dy;
            // compute velocity
            const t = performance.now();
            const dt = t - lastT || 16;
            const dyv = e.clientY - lastY;
            vel = dyv / dt;
            lastY = e.clientY; lastT = t;
        });

        el.addEventListener('pointerup', (e)=>{
            if(!isDown) return; isDown = false; el.classList.remove('drag-scroll');
            // inertia
            let v = vel * 1000; // px/sec
            const decay = 0.95;
            const step = ()=>{
                if (Math.abs(v) < 0.5) return;
                el.scrollTop -= v * (1/60);
                v *= decay;
                rafId = requestAnimationFrame(step);
            };
            rafId = requestAnimationFrame(step);
        });

        el.addEventListener('pointercancel', ()=>{ isDown=false; el.classList.remove('drag-scroll'); });
    }

    function scrollToNode(index){
        const nodes = Array.from(container.querySelectorAll('.roadmap-node'));
        const node = nodes[index];
        if(!node) return;
        const parentRect = container.getBoundingClientRect();
        const nodeRect = node.getBoundingClientRect();
        const offset = (nodeRect.top + nodeRect.bottom)/2 - parentRect.top - (container.clientHeight/2);
        container.scrollBy({top: offset, behavior: 'smooth'});
    }

    // mark a stage as completed and advance progress
    function markStageCompleted(index, opts){
        const options = opts || {};
        const lesson = lessons[index];
        if (!lesson) return;
        const lessonId = lesson.id;
        if (completed.has(lessonId)) return;

        completed.add(lessonId);

        // persist completed status to user record
        const full = getFullUser();
        if (full) {
            const users = getUsers();
            if (users[full.email]) {
                users[full.email].completedRoadmap = Array.from(completed);
                saveUsers(users);
            }
        }

        // also mark all checklist topics for this module as done
        try {
            const meta = getModuleTopicsForIndex(index);
            const topics = meta.topics || [];
            if (topics.length) {
                const state = getChecklistState();
                const moduleNumber = index + 1;
                if (!state[meta.pathKey]) state[meta.pathKey] = {};
                if (!state[meta.pathKey][moduleNumber]) state[meta.pathKey][moduleNumber] = {};
                topics.forEach(t => { state[meta.pathKey][moduleNumber][t] = true; });
                saveChecklistState(state);
            }
        } catch(e){}

        // animate connector glow between this and next
        animateConnectorGlow(index);

        // advance active stage if we are on this one
        if (index === activeIndex && activeIndex < lessons.length - 1) {
            activeIndex += 1;
            scrollToNode(activeIndex);
        }

        // re-render nodes to reflect completion state
        setTimeout(renderRoadmap, 380);
    }

    function openModal(index){
        const lesson = lessons[index];
        modalTitle.textContent = `Module ${index+1}: ${lesson.title}`;
        modalDesc.textContent = lesson.desc || '';

        // build checklist from roadmapTopics or fallback to phases subSteps
        const meta = getModuleTopicsForIndex(index);
        renderChecklist(meta.pathKey, index+1, meta.topics || []);

        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden','false');
    }

    function closeModal(){
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden','true');
    }

    continueBtn.addEventListener('click', ()=>{
        const curIdx = activeIndex;
        markStageCompleted(curIdx);
        closeModal();
    });

    /* Checklist / persistence */
    const CHECK_KEY = 'roadmap_checklist_v1';

    function getChecklistState(){
        try{ return JSON.parse(localStorage.getItem(CHECK_KEY) || '{}'); }catch(e){return {}}
    }
    function saveChecklistState(state){
        try{ localStorage.setItem(CHECK_KEY, JSON.stringify(state)); }catch(e){}
    }

    function renderChecklist(pathKey, moduleNumber, topics){
        const list = document.getElementById('modal-todo-list');
        const progressFill = document.getElementById('modal-progress-fill');
        const progressText = document.getElementById('modal-progress-text');
        list.innerHTML = '';

        const state = getChecklistState();
        if (!state[pathKey]) state[pathKey] = {};
        if (!state[pathKey][moduleNumber]) state[pathKey][moduleNumber] = {};

        topics.forEach(topic => {
            const li = document.createElement('li');
            const id = `chk_${moduleNumber}_${slug(topic)}`;
            const checked = !!state[pathKey][moduleNumber][topic];
            li.className = checked ? 'completed' : '';
            li.innerHTML = `<label><input type="checkbox" data-topic="${escapeHtml(topic)}" ${checked? 'checked' : ''}/> <span>${escapeHtml(topic)}</span></label>`;
            const cb = li.querySelector('input[type=checkbox]');
            cb.addEventListener('change', (e)=>{
                state[pathKey][moduleNumber][topic] = e.target.checked;
                saveChecklistState(state);
                li.classList.toggle('completed', e.target.checked);
                updateModalProgress(pathKey, moduleNumber, topics);

                // If all topics checked, mark node completed and unlock next
                const all = topics.every(t => !!state[pathKey][moduleNumber][t]);
                if (all) {
                    const stageIndex = moduleNumber - 1;
                    markStageCompleted(stageIndex);
                }
            });

            list.appendChild(li);
        });

        updateModalProgress(pathKey, moduleNumber, topics);
        // open modal visually after building
        requestAnimationFrame(()=>{
            modal.classList.remove('hidden');
        });
    }

    function updateModalProgress(pathKey, moduleNumber, topics){
        const state = getChecklistState();
        const progressFill = document.getElementById('modal-progress-fill');
        const progressText = document.getElementById('modal-progress-text');
        const moduleState = (state[pathKey] && state[pathKey][moduleNumber]) || {};
        const done = topics.filter(t => !!moduleState[t]).length;
        const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
        if (progressFill) progressFill.style.width = pct + '%';
        if (progressText) progressText.textContent = pct + '%';
    }

    function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'_'); }

    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);

    function animateConnectorGlow(index){
        const nodes = Array.from(container.querySelectorAll('.roadmap-node'));
        const node = nodes[index];
        if (!node) return;
        const connector = node.querySelector('.roadmap-step-connector');
        if (!connector) return;
        connector.classList.add('glow-anim', 'unlocked');
        // ensure it stays unlocked style once done
        setTimeout(()=>{
            connector.classList.remove('glow-anim');
            connector.classList.add('unlocked');
        }, 900);
    }

    /* Drag & drop reordering */
    let dragging = null;
    let placeholder = null;
    let startY = 0;
    let originIndex = -1;

    function onPointerDown(e){
        const node = e.currentTarget;
        node.setPointerCapture(e.pointerId);
        dragging = node;
        originIndex = Number(node.dataset.index);
        startY = e.clientY;

        placeholder = document.createElement('div');
        placeholder.className = 'node-placeholder';
        placeholder.style.width = node.offsetWidth + 'px';
        placeholder.style.height = node.offsetHeight + 'px';

        node.classList.add('dragging');
        node.style.position = 'absolute';
        const rect = node.getBoundingClientRect();
        const parentRect = container.getBoundingClientRect();
        node.style.left = (rect.left - parentRect.left) + 'px';
        node.style.top = (rect.top - parentRect.top) + 'px';
        node.style.zIndex = 999;

        container.insertBefore(placeholder, node.nextSibling);

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    }

    function onPointerMove(e){
        if(!dragging) return;
        const parentRect = container.getBoundingClientRect();
        const y = e.clientY - parentRect.top - (dragging.offsetHeight/2);
        dragging.style.top = y + 'px';

        // compute midpoints and find insert position
        const nodes = Array.from(container.querySelectorAll('.roadmap-node')).filter(n => n !== dragging);
        for (let n of nodes) {
            const r = n.getBoundingClientRect();
            const mid = (r.top + r.bottom)/2 - parentRect.top;
            if (e.clientY - parentRect.top < mid) {
                container.insertBefore(placeholder, n);
                break;
            } else {
                container.appendChild(placeholder);
            }
        }
    }

    function onPointerUp(e){
        if(!dragging) return;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);

        // place dragging into placeholder position
        container.insertBefore(dragging, placeholder);
        // cleanup styles
        dragging.style.position = '';
        dragging.style.left = '';
        dragging.style.top = '';
        dragging.style.zIndex = '';
        dragging.classList.remove('dragging');

        // compute new order
        const nodes = Array.from(container.querySelectorAll('.roadmap-node'));
        const newOrder = nodes.map((n, idx) => {
            const id = Number(n.dataset.lessonId);
            n.dataset.index = idx;
            return id;
        });
        // reorder lessons array to match newOrder
        const map = lessons.reduce((acc,l)=> (acc[l.id]=l, acc), {});
        const reordered = newOrder.map(id => map[id]);
        lessons.length = 0; lessons.push(...reordered);

        // persist order per user
        try { localStorage.setItem(orderKey, JSON.stringify(newOrder)); } catch(e){}

        placeholder.remove(); placeholder = null; dragging = null;
        // re-render connectors and numbering
        setTimeout(()=>{ renderRoadmap(); }, 10);
    }

    // rebuild connectors on resize
    let resizeTimeout;
    window.addEventListener('resize', ()=>{
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(()=>{
            drawConnectors();
        },120);
    });

    // small parallax background movement
    const parallax = document.getElementById('parallax-bg');
    window.addEventListener('mousemove', (e)=>{
        const x = (e.clientX / window.innerWidth - 0.5) * 18;
        const y = (e.clientY / window.innerHeight - 0.5) * 12;
        parallax.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

})();

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

        // Add click handlers for checkboxes (toggle on/off)
        container.querySelectorAll('.roadmap-checkbox').forEach(function(cb) {
            cb.addEventListener('change', function() {
                toggleSubtopic(this.dataset.path, this.dataset.phase, parseInt(this.dataset.index));
            });
        });
    }

    renderRoadmaps();
})();
