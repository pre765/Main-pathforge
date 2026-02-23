/* Interview Prep Page Functionality */
(function() {
    if (!getCurrentUser()) {
        window.location.href = 'login.html';
        return;
    }

    if (!localStorage.getItem('pathforge_api_base')) {
        localStorage.setItem('pathforge_api_base', 'http://localhost:5000');
    }

    // Navigation
    const navItems = document.querySelectorAll('.prep-nav-item');
    const sections = document.querySelectorAll('.prep-section');

    function showSection(sectionId) {
        navItems.forEach(nav => nav.classList.remove('active'));
        sections.forEach(sec => sec.classList.remove('active'));
        const item = document.querySelector('.prep-nav-item[data-section="' + sectionId + '"]');
        const panel = document.getElementById('section-' + sectionId);
        if (item) item.classList.add('active');
        if (panel) panel.classList.add('active');
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            showSection(item.dataset.section);
        });
    });

    // Open Check Resume when landing with #check-resume
    if (window.location.hash === '#check-resume') {
        showSection('check-resume');
    }

    // Resume Builder Form Steps
    let currentStep = 0;
    const steps = ['skills', 'projects', 'experience', 'job-desc', 'past-jobs'];
    const formData = {};

    window.nextStep = function(stepName) {
        const stepIndex = steps.indexOf(stepName);
        const input = document.getElementById('input-' + stepName);
        
        if (input && input.value.trim()) {
            formData[stepName] = input.value.trim();
            
            document.getElementById('step-' + stepName).classList.remove('active');
            if (stepIndex < steps.length - 1) {
                document.getElementById('step-' + steps[stepIndex + 1]).classList.add('active');
            }
        }
    };

    window.prevStep = function(stepName) {
        const stepIndex = steps.indexOf(stepName);
        if (stepIndex > 0) {
            document.getElementById('step-' + stepName).classList.remove('active');
            document.getElementById('step-' + steps[stepIndex - 1]).classList.add('active');
        }
    };

    window.generateResume = function() {
        const pastJobs = document.getElementById('input-past-jobs').value.trim();
        if (pastJobs) formData['past-jobs'] = pastJobs;

        // Generate LaTeX resume
        const latexResume = generateLatexResume(formData);
        const preview = document.getElementById('resume-preview');
        
        // For frontend, we'll render a simplified HTML version
        // In production, this would be sent to backend for LaTeX compilation
        preview.innerHTML = renderResumeHTML(formData);
        
        // Generate suggestions
        generateSuggestions(formData);
        document.getElementById('resume-suggestions').style.display = 'block';
    };

    function generateLatexResume(data) {
        // LaTeX template (frontend only - backend would compile this)
        return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{titlesec}
\\usepackage{enumitem}

\\titleformat{\\section}{\\Large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{1em}{0.5em}

\\begin{document}
\\begin{center}
\\textbf{\\Huge Your Name}\\\\
Email | Phone | LinkedIn
\\end{center}

\\section*{Skills}
${data.skills || 'Your skills here'}

\\section*{Projects}
${data.projects || 'Your projects here'}

\\section*{Experience}
${data.experience || 'Your experience here'}
${data['past-jobs'] ? '\\subsection*{Previous Experience}\n' + data['past-jobs'] : ''}

\\end{document}`;
    }

    function renderResumeHTML(data) {
        return `
            <div style="font-family: 'Times New Roman', serif; line-height: 1.6;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 24px; margin-bottom: 0.5rem;">Your Name</h1>
                    <p style="font-size: 12px;">Email | Phone | LinkedIn</p>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h2 style="font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 0.3rem; margin-bottom: 0.5rem;">Skills</h2>
                    <p style="font-size: 12px; white-space: pre-wrap;">${escapeHtml(data.skills || '')}</p>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h2 style="font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 0.3rem; margin-bottom: 0.5rem;">Projects</h2>
                    <p style="font-size: 12px; white-space: pre-wrap;">${escapeHtml(data.projects || '')}</p>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h2 style="font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 0.3rem; margin-bottom: 0.5rem;">Experience</h2>
                    <p style="font-size: 12px; white-space: pre-wrap;">${escapeHtml(data.experience || '')}</p>
                    ${data['past-jobs'] ? `<h3 style="font-size: 14px; margin-top: 1rem; margin-bottom: 0.5rem;">Previous Experience</h3><p style="font-size: 12px; white-space: pre-wrap;">${escapeHtml(data['past-jobs'])}</p>` : ''}
                </div>
            </div>
        `;
    }

    function generateSuggestions(data) {
        const suggestionsDiv = document.getElementById('suggestions-content');
        const jobDesc = data['job-desc'] || '';
        const skills = data.skills || '';
        
        suggestionsDiv.innerHTML = '';
        
        // Analyze job description for suggested skills
        const jobKeywords = extractKeywords(jobDesc);
        const userSkills = skills.toLowerCase().split(/[,\n]/).map(s => s.trim());
        const missingSkills = jobKeywords.filter(kw => !userSkills.some(us => us.includes(kw.toLowerCase())));
        
        if (missingSkills.length > 0) {
            const skillSuggestion = document.createElement('div');
            skillSuggestion.className = 'suggestion-item';
            skillSuggestion.innerHTML = `
                <h4>Suggested Skills to Develop</h4>
                <p>Based on the job description, consider learning: ${missingSkills.slice(0, 5).join(', ')}</p>
            `;
            suggestionsDiv.appendChild(skillSuggestion);
        }
        
        // Suggested projects
        const projectSuggestion = document.createElement('div');
        projectSuggestion.className = 'suggestion-item';
        projectSuggestion.innerHTML = `
            <h4>Suggested Projects</h4>
            <p>Build projects that demonstrate: ${jobKeywords.slice(0, 3).join(', ')}. Consider creating a portfolio project that showcases these skills.</p>
        `;
        suggestionsDiv.appendChild(projectSuggestion);
        
        // Courses/Competitions
        const courseSuggestion = document.createElement('div');
        courseSuggestion.className = 'suggestion-item';
        courseSuggestion.innerHTML = `
            <h4>Recommended Learning Resources</h4>
            <p>Consider taking courses on platforms like Coursera, Udemy, or freeCodeCamp. Also look into relevant coding competitions like Hackathons or LeetCode contests to practice.</p>
        `;
        suggestionsDiv.appendChild(courseSuggestion);
    }

    function extractKeywords(text) {
        const commonTech = ['javascript', 'python', 'react', 'node', 'java', 'sql', 'aws', 'docker', 'kubernetes', 'git', 'html', 'css', 'typescript', 'angular', 'vue', 'mongodb', 'postgresql', 'machine learning', 'ai', 'data science'];
        const lowerText = text.toLowerCase();
        return commonTech.filter(tech => lowerText.includes(tech));
    }

    // ========== Resume Intelligence Engine ==========
    const btnAnalyze = document.getElementById('btn-analyze');
    const resultsContainer = document.getElementById('results-container');
    const scoreBig = document.getElementById('score-big-new');
    const readinessBadge = document.getElementById('readiness-badge');
    const scoreExplanation = document.getElementById('score-explanation');
    const keywordMatchValue = document.getElementById('keyword-match-value');
    function resolveApiBases() {
        const bases = [];
        const configuredGeneral = (localStorage.getItem('pathforge_api_base') || '').trim();
        const configuredResume = (localStorage.getItem('pathforge_resume_api_base') || '').trim();

        if (configuredGeneral) bases.push(configuredGeneral.replace(/\/$/, ''));
        if (configuredResume) bases.push(configuredResume.replace(/\/$/, ''));

        const host = window.location.hostname;
        const port = window.location.port;
        const isLikelyStaticServer = port === '5500' || port === '5501' || port === '5502';
        const isLoopback = host === '127.0.0.1' || host === 'localhost';
        if (isLikelyStaticServer && isLoopback) {
            bases.push('http://localhost:3000');
        }
        bases.push('');

        return [...new Set(bases)];
    }
    const API_BASES = resolveApiBases();

    function getApiUrls(path) {
        return API_BASES.map((base) => (base ? `${base}${path}` : path));
    }

    function setAnalyzeLoading(isLoading) {
        if (!btnAnalyze) return;
        btnAnalyze.classList.toggle('loading', isLoading);
        btnAnalyze.setAttribute('aria-busy', isLoading ? 'true' : 'false');
        btnAnalyze.disabled = isLoading;
    }

    function showAnalyzeError(message) {
        alert(message || 'Failed to analyze resume.');
    }

    function fillList(id, items) {
        const list = document.getElementById(id);
        if (!list) return;
        list.innerHTML = '';
        (items || []).forEach(function(item) {
            const li = document.createElement('li');
            li.textContent = item;
            list.appendChild(li);
        });
    }

    function getStatusClass(items) {
        const count = (items || []).length;
        if (count === 0) return 'status-good';
        if (count <= 2) return 'status-medium';
        return 'status-needs';
    }

    function getStatusLabel(items) {
        const count = (items || []).length;
        if (count === 0) return 'Good';
        if (count <= 2) return 'Moderate';
        return 'Needs Improvement';
    }

    function renderBreakdownCard(cardKey, items) {
        const card = document.querySelector(`[data-card="${cardKey}"]`);
        if (!card) return;
        const ul = card.querySelector('.breakdown-bullets');
        const badge = card.querySelector('.status-badge');
        if (ul) {
            ul.innerHTML = '';
            if ((items || []).length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No major issues detected.';
                ul.appendChild(li);
            } else {
                items.forEach((item) => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    ul.appendChild(li);
                });
            }
        }
        if (badge) {
            badge.classList.remove('status-good', 'status-medium', 'status-needs');
            badge.classList.add(getStatusClass(items));
            badge.textContent = getStatusLabel(items);
        }
    }

    function renderRoadmapRecommendations(items) {
        const roadmapModules = document.getElementById('roadmap-modules');
        if (!roadmapModules) return;
        roadmapModules.innerHTML = '';

        const recommendations = (items || []).filter(Boolean);
        if (recommendations.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'module-card';
            empty.textContent = 'No roadmap recommendations right now.';
            roadmapModules.appendChild(empty);
            return;
        }

        recommendations.forEach((moduleName) => {
            const link = document.createElement('a');
            link.href = 'roadmap.html';
            link.className = 'module-card';
            link.textContent = moduleName;
            roadmapModules.appendChild(link);
        });
    }

    function renderChecklist(containerId, items, fallbackText) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        if (!items || items.length === 0) {
            const row = document.createElement('label');
            row.className = 'checklist-item';
            row.innerHTML = `<span>${escapeHtml(fallbackText)}</span>`;
            container.appendChild(row);
            return;
        }

        items.forEach((item) => {
            const row = document.createElement('label');
            row.className = 'checklist-item';
            row.innerHTML = `<input type="checkbox"> <span>${escapeHtml(item)}</span>`;
            const checkbox = row.querySelector('input');
            const text = row.querySelector('span');
            if (checkbox && text) {
                checkbox.addEventListener('change', function() {
                    text.style.textDecoration = checkbox.checked ? 'line-through' : '';
                });
            }
            container.appendChild(row);
        });
    }

    function renderSkillGaps(items) {
        const skillsGapList = document.getElementById('skills-gap-list');
        if (!skillsGapList) return;
        skillsGapList.innerHTML = '';
        if (!items || items.length === 0) {
            const badge = document.createElement('span');
            badge.className = 'skill-gap-badge';
            badge.textContent = 'No critical skill gaps';
            skillsGapList.appendChild(badge);
            return;
        }
        items.forEach((skill) => {
            const badge = document.createElement('span');
            badge.className = 'skill-gap-badge';
            badge.textContent = skill;
            skillsGapList.appendChild(badge);
        });
    }

    function renderInterviewQuestions(aiInsights, flatQuestions) {
        const technical = aiInsights?.interviewQuestions?.technicalQuestions || [];
        const behavioral = aiInsights?.interviewQuestions?.behavioralQuestions || [];
        const project = aiInsights?.interviewQuestions?.projectBasedQuestions || [];

        if (technical.length || behavioral.length || project.length) {
            fillList('iq-list-technical', technical);
            fillList('iq-list-behavioral', behavioral);
            fillList('iq-list-project', project);
            return;
        }

        const list = Array.isArray(flatQuestions) ? flatQuestions : [];
        fillList('iq-list-technical', list.slice(0, 5));
        fillList('iq-list-behavioral', list.slice(5, 10));
        fillList('iq-list-project', list.slice(10, 15));
    }

    function renderAnalyzeResult(result) {
        const score = Math.round(Number(result?.atsScore ?? result?.finalScore ?? 0));
        const requiredScore = Math.round(Number(result?.requiredSkillScore ?? 0));
        const readiness = result?.readinessLevel || 'Needs Improvement';
        const atsExplanation =
            result?.aiInsights?.atsCompatibilityExplanation ||
            `Your resume ATS alignment is ${score}%. Focus on missing skills and quantified achievements.`;
        const summary =
            result?.improvedResumeSuggestion ||
            result?.aiInsights?.professionalSummarySuggestion ||
            'No summary suggestion available yet.';

        if (scoreBig) scoreBig.textContent = String(score);
        if (keywordMatchValue) keywordMatchValue.textContent = `${requiredScore}%`;
        if (readinessBadge) readinessBadge.textContent = readiness;
        if (scoreExplanation) scoreExplanation.textContent = atsExplanation;
        if (typeof window.animateAtsScore === 'function') window.animateAtsScore(score);

        renderBreakdownCard('skills', result?.aiInsights?.analysisBreakdown?.skillsMatch || []);
        renderBreakdownCard('experience', result?.aiInsights?.analysisBreakdown?.experienceStrength || []);
        renderBreakdownCard('impact', result?.aiInsights?.analysisBreakdown?.impactAndMetrics || []);
        renderBreakdownCard('branding', result?.aiInsights?.analysisBreakdown?.professionalBranding || []);

        renderSkillGaps(result?.missingSkills || []);

        const checklist = (result?.improvements && result.improvements.length > 0)
            ? result.improvements
            : (result?.aiInsights?.immediateActionChecklist || []);
        renderChecklist('action-checklist', checklist, 'No immediate fixes suggested.');
        renderRoadmapRecommendations(result?.roadmapRecommendations || []);
        renderInterviewQuestions(result?.aiInsights, result?.interviewQuestions);

        const summaryText = document.getElementById('summary-text');
        if (summaryText) summaryText.textContent = summary;

        if (resultsContainer) {
            resultsContainer.hidden = false;
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    async function analyzeWithText(resumeText, jobDescription) {
        const urls = getApiUrls('/api/resume/analyze');
        for (let i = 0; i < urls.length; i++) {
            let response;
            try {
                response = await fetch(urls[i], {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resumeText, jobDescription })
                });
            } catch (_networkError) {
                continue;
            }

            const rawText = await response.text();
            let data = {};
            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch (_) {
                data = {};
            }

            if (response.ok) return data;

            if (response.status === 404 || response.status === 405) {
                continue;
            }

            const details = rawText && !data?.error ? ` (${rawText.slice(0, 120)})` : '';
            throw new Error(data?.error || data?.message || `Analyze API failed (${response.status})${details}`);
        }

        throw new Error('Cannot reach Resume Analyze API. Start Next app on http://localhost:3000 or set localStorage.pathforge_resume_api_base.');
    }

    async function analyzeWithUpload(file, jobDescription) {
        const form = new FormData();
        form.append('file', file);
        form.append('jobDescription', jobDescription || '');

        const urls = getApiUrls('/api/resume/upload');
        for (let i = 0; i < urls.length; i++) {
            let response;
            try {
                response = await fetch(urls[i], {
                    method: 'POST',
                    body: form
                });
            } catch (_networkError) {
                continue;
            }

            const rawText = await response.text();
            let data = {};
            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch (_) {
                data = {};
            }

            if (response.ok) return data;

            if (response.status === 404 || response.status === 405) {
                continue;
            }

            const details = rawText && !data?.error ? ` (${rawText.slice(0, 120)})` : '';
            throw new Error(data?.error || data?.message || `Upload API failed (${response.status})${details}`);
        }

        throw new Error('Cannot reach Resume Upload API. Start Next app on http://localhost:3000 or set localStorage.pathforge_resume_api_base.');
    }

    function readTextFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve(String(e.target?.result || ''));
            };
            reader.onerror = function() {
                reject(new Error('Unable to read the selected job description file.'));
            };
            reader.readAsText(file);
        });
    }

    if (btnAnalyze) {
        btnAnalyze.addEventListener('click', async function() {
            const resumeTextEl = document.getElementById('resume-text');
            const jdTextEl = document.getElementById('jd-text');
            const resumeUploadInput = document.getElementById('resume-upload-input');
            const roleSelect = document.getElementById('job-role-select');
            const levelSelect = document.getElementById('experience-level-select');

            if (!resumeTextEl || !jdTextEl) return;

            const activeUploadTab = document.querySelector('.upload-method-tab.active');
            const activeMethod = activeUploadTab?.dataset?.method || 'paste';

            const jdUploadInput = document.getElementById('jd-upload-input');
            const roleContext = roleSelect && roleSelect.value ? `Target Role: ${roleSelect.options[roleSelect.selectedIndex].text}` : '';
            const levelContext = levelSelect && levelSelect.value ? `Candidate Level: ${levelSelect.options[levelSelect.selectedIndex].text}` : '';
            const extraContext = [roleContext, levelContext].filter(Boolean).join('\n');

            let baseJd = (jdTextEl.value || '').trim();
            if (!baseJd && jdUploadInput && jdUploadInput.files && jdUploadInput.files[0]) {
                const jdFile = jdUploadInput.files[0];
                if (!/\.txt$/i.test(jdFile.name) && jdFile.type !== 'text/plain') {
                    throw new Error('Job description upload supports text files (.txt) only. Paste JD text for PDF/DOCX.');
                }
                baseJd = (await readTextFromFile(jdFile)).trim();
                jdTextEl.value = baseJd;
            }

            const finalJd = extraContext ? [baseJd, extraContext].filter(Boolean).join('\n\n') : baseJd;

            try {
                setAnalyzeLoading(true);
                let result;

                if (activeMethod === 'upload' && resumeUploadInput && resumeUploadInput.files && resumeUploadInput.files[0]) {
                    const file = resumeUploadInput.files[0];
                    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
                        throw new Error('Resume upload must be a PDF for backend parsing.');
                    }
                    if (!finalJd) {
                        throw new Error('Job description text is required. Paste it in the textbox or upload a .txt file.');
                    }
                    result = await analyzeWithUpload(file, finalJd);
                } else {
                    const resumeText = (resumeTextEl.value || '').trim();
                    if (!resumeText) {
                        throw new Error('Please paste resume text or upload a PDF resume.');
                    }
                    if (!finalJd) {
                        throw new Error('Please provide a job description.');
                    }
                    result = await analyzeWithText(resumeText, finalJd);
                }

                renderAnalyzeResult(result);
            } catch (error) {
                showAnalyzeError(error?.message || 'Analysis failed.');
            } finally {
                setAnalyzeLoading(false);
            }
        });
    }

    // Interview question tabs
    const iqTabs = document.querySelectorAll('.iq-tab');
    const iqPanels = document.querySelectorAll('.iq-panel');

    iqTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            const target = tab.dataset.iq;
            iqTabs.forEach(function(t) { t.classList.remove('active'); });
            iqPanels.forEach(function(p) { p.classList.remove('active'); });
            tab.classList.add('active');
            const panel = document.getElementById('iq-' + target);
            if (panel) panel.classList.add('active');
        });
    });

    // Copy summary button
    const btnCopySummary = document.getElementById('btn-copy-summary');
    const summaryText = document.getElementById('summary-text');

    if (btnCopySummary && summaryText) {
        btnCopySummary.addEventListener('click', function() {
            navigator.clipboard.writeText(summaryText.textContent).then(function() {
                btnCopySummary.textContent = 'Copied!';
                btnCopySummary.classList.add('copied');
                setTimeout(function() {
                    btnCopySummary.textContent = 'Copy';
                    btnCopySummary.classList.remove('copied');
                }, 2000);
            });
        });
    }

    // Checklist: strikethrough when checked (fallback for older browsers)
    document.querySelectorAll('.checklist-item input').forEach(function(cb) {
        cb.addEventListener('change', function() {
            var span = cb.nextElementSibling;
            if (span) span.style.textDecoration = cb.checked ? 'line-through' : '';
        });
    });

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();
