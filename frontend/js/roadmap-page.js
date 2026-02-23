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

    let activeIndex = 0;
    const completed = new Set();

    // restore completed from user record if available
    if (user && Array.isArray(user.completedRoadmap)) {
        user.completedRoadmap.forEach(id => completed.add(Number(id)));
    }

    const container = document.getElementById('roadmap');
    const modal = document.getElementById('node-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const continueBtn = document.getElementById('continue-btn');
    const modalClose = document.getElementById('modal-close');
    const modalBackdrop = document.getElementById('modal-backdrop');

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
            node.className = 'roadmap-node';
            if(i === activeIndex) node.classList.add('active');
            else if(completed.has(lesson.id)) node.classList.add('completed');
            else node.classList.add('locked');

            const inner = document.createElement('div');
            inner.className = 'node-inner';

            const counter = document.createElement('div');
            counter.className = 'node-counter';
            counter.textContent = i+1;

            inner.appendChild(counter);
            inner.setAttribute('title', lesson.title);
            node.appendChild(inner);

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

        // draw connectors once nodes are present
        requestAnimationFrame(drawConnectors);

        // draw connectors once nodes are present
        requestAnimationFrame(drawConnectors);
    }

    function drawConnectors(){
        // Remove existing svg if any
        const prev = container.querySelector('.connectors-svg');
        if(prev) prev.remove();

        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS,'svg');
        svg.classList.add('connectors-svg');
        svg.setAttribute('width','200');
        svg.style.left = '50%';
        svg.style.transform = 'translateX(-50%)';

        const nodes = Array.from(container.querySelectorAll('.roadmap-node'));
        if(nodes.length < 2) return;

        // Determine top and bottom to size svg
        const firstRect = nodes[0].getBoundingClientRect();
        const lastRect = nodes[nodes.length-1].getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const height = (lastRect.bottom - firstRect.top) + 160;
        svg.setAttribute('height', String(height));
        svg.setAttribute('viewBox', `0 0 200 ${height}`);

        // For each gap create a curved path
        nodes.forEach((node, idx)=>{
            if(idx === nodes.length-1) return;
            const a = node.getBoundingClientRect();
            const b = nodes[idx+1].getBoundingClientRect();

            // coordinates relative to svg top
            const topOffset = a.top - containerRect.top + a.height/2 + 20;
            const bottomOffset = b.top - containerRect.top + b.height/2 + 20;

            const x1 = 100; // center
            const x2 = 100;
            const mid = (topOffset + bottomOffset) / 2;

            const path = document.createElementNS(svgNS,'path');
            const d = `M ${x1} ${topOffset} C ${x1-36} ${mid} ${x2+36} ${mid} ${x2} ${bottomOffset}`;
            path.setAttribute('d', d);
            path.classList.add('connector-path');

            // unlocked if previous node (by lesson id) is completed
            const prevNode = nodes[idx];
            const prevId = Number(prevNode.dataset.lessonId);
            if (completed.has(prevId)){
                path.classList.add('unlocked');
            }

            svg.appendChild(path);
        });

        container.appendChild(svg);
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

    function openModal(index){
        const lesson = lessons[index];
        modalTitle.textContent = `Module ${index+1}: ${lesson.title}`;
        modalDesc.textContent = lesson.desc || '';

        // build checklist from roadmapTopics or fallback to phases subSteps
        const savedPathKey = localStorage.getItem('selectedPath') || pathName;
        const topics = (window.roadmapTopics && window.roadmapTopics[savedPathKey] && window.roadmapTopics[savedPathKey][String(index+1)]) || phases[index].subSteps || [];

        renderChecklist(savedPathKey, index+1, topics);

        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden','false');
    }

    function closeModal(){
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden','true');
    }

    continueBtn.addEventListener('click', ()=>{
        const curIdx = activeIndex;
        const curLesson = lessons[curIdx];
        if (curLesson) completed.add(curLesson.id);

        // animate connector glow between cur and next
        animateConnectorGlow(curIdx);

        if(activeIndex < lessons.length - 1){
            activeIndex += 1;
        }

        closeModal();
        // persist completed status to user record
        const full = getFullUser();
        if (full) {
            const users = getUsers();
            if (users[full.email]) {
                users[full.email].completedRoadmap = Array.from(completed);
                saveUsers(users);
            }
        }

        setTimeout(renderRoadmap, 380);
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
                    // mark completed set
                    const lessonId = moduleNumber - 1;
                    completed.add(lessonId);
                    // persist to user
                    const full = getFullUser();
                    if (full) {
                        const users = getUsers();
                        if (users[full.email]) {
                            users[full.email].completedRoadmap = Array.from(completed);
                            saveUsers(users);
                        }
                    }
                    // unlock/advance activeIndex
                    if (activeIndex < lessons.length - 1 && (lessonId === activeIndex)) {
                        activeIndex += 1;
                        // smooth scroll to next
                        scrollToNode(activeIndex);
                    }
                    // re-render nodes to update visuals
                    renderRoadmap();
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
        const svg = container.querySelector('.connectors-svg');
        if(!svg) return;
        const paths = svg.querySelectorAll('.connector-path');
        const path = paths[index];
        if(!path) return;
        path.classList.add('glow-anim');
        // ensure it stays unlocked style once done
        setTimeout(()=>{
            path.classList.remove('glow-anim');
            path.classList.add('unlocked');
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

        // Add click handlers for checkboxes
        container.querySelectorAll('.roadmap-checkbox').forEach(function(cb) {
            cb.addEventListener('change', function() {
                toggleSubtopic(this.dataset.path, this.dataset.phase, parseInt(this.dataset.index));
            });
        });
    }

    renderRoadmaps();
})();
