/* Interview Prep Page Functionality */
(function() {
    if (!getCurrentUser()) {
        window.location.href = 'login.html';
        return;
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
            if (item.dataset.section === 'mock-interview') {
                showSection('check-resume');
                const results = document.getElementById('results-container');
                if (results) results.hidden = false;
                const mockCard = document.getElementById('mock-interview-card');
                if (mockCard) mockCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            showSection(item.dataset.section);
        });
    });

    document.querySelectorAll('.quick-action-btn[data-target-section]').forEach((actionBtn) => {
        actionBtn.addEventListener('click', function () {
            const targetSection = actionBtn.dataset.targetSection;
            if (!targetSection) return;
            if (targetSection === 'mock-interview') {
                showSection('check-resume');
                const results = document.getElementById('results-container');
                if (results) results.hidden = false;
                const mockCard = document.getElementById('mock-interview-card');
                if (mockCard) mockCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            showSection(targetSection);
            const panel = document.getElementById('section-' + targetSection);
            if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const resultsContainer = document.getElementById('results-container');
    const jdTextEl = document.getElementById('jd-text');
    const resumeTextEl = document.getElementById('resume-text');
    const scoreBig = document.getElementById('score-big-new');
    const keywordMatchValue = document.getElementById('keyword-match-value');
    const readinessBadge = document.getElementById('readiness-badge');
    const scoreExplanation = document.getElementById('score-explanation');
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnReanalyze = document.getElementById('btn-reanalyze');
    const btnStartMock = document.getElementById('btn-start-mock');
    const breakdownSection = document.getElementById('breakdown-section');

    const stepNodes = document.querySelectorAll('.rp-step');
    function setActiveStep(stepNumber) {
        stepNodes.forEach(function(step, index) {
            step.classList.toggle('is-active', index + 1 === stepNumber);
        });
    }

    const UploadSection = {
        file: null,
        init: function() {
            const zone = document.getElementById('resume-upload-zone');
            const input = document.getElementById('resume-upload-input');
            const label = document.getElementById('resume-upload-text');
            const preview = document.getElementById('resume-file-preview');
            const previewName = document.getElementById('resume-file-name');
            const removeBtn = document.getElementById('btn-remove-resume');
            if (!zone || !input || !label || !preview || !previewName || !removeBtn || !resumeTextEl) return;

            const defaultLabel = 'Drag and drop your resume';

            const renderPreview = function(fileName) {
                preview.hidden = false;
                previewName.textContent = fileName;
            };

            const clearFile = function() {
                UploadSection.file = null;
                input.value = '';
                resumeTextEl.value = '';
                label.textContent = defaultLabel;
                preview.hidden = true;
                previewName.textContent = '';
            };

            const onFile = function(file) {
                if (!file) return;
                UploadSection.file = file;
                renderPreview(file.name);
                label.textContent = 'Uploaded: ' + file.name;
                // Fallback content for non-text files so analysis flow still proceeds.
                resumeTextEl.value = file.name;
                if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
                    const reader = new FileReader();
                    reader.onload = function(evt) {
                        resumeTextEl.value = String(evt.target && evt.target.result ? evt.target.result : '');
                    };
                    reader.readAsText(file);
                }
            };

            zone.addEventListener('click', function() { input.click(); });
            zone.addEventListener('keydown', function(event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    input.click();
                }
            });
            zone.addEventListener('dragover', function(event) {
                event.preventDefault();
                zone.classList.add('drag-over');
            });
            zone.addEventListener('dragleave', function() { zone.classList.remove('drag-over'); });
            zone.addEventListener('drop', function(event) {
                event.preventDefault();
                zone.classList.remove('drag-over');
                const file = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null;
                if (!file) return;
                input.files = event.dataTransfer.files;
                onFile(file);
            });
            input.addEventListener('change', function() { onFile(input.files && input.files[0] ? input.files[0] : null); });
            removeBtn.addEventListener('click', clearFile);
        },
        hasInput: function() {
            return !!(resumeTextEl && resumeTextEl.value.trim());
        }
    };

    const ScoreCard = {
        currentScore: 0,
        setLoading: function(isLoading) {
            if (!btnAnalyze) return;
            btnAnalyze.classList.toggle('loading', isLoading);
            btnAnalyze.setAttribute('aria-busy', isLoading ? 'true' : 'false');
        },
        setScore: function(score, keywordPct) {
            const target = Math.max(0, Math.min(100, score));
            const keyword = Math.max(0, Math.min(100, keywordPct));
            const start = this.currentScore;
            const steps = 20;
            let tick = 0;
            const diff = target - start;

            const timer = setInterval(function() {
                tick += 1;
                const value = Math.round(start + (diff * tick) / steps);
                if (scoreBig) scoreBig.textContent = value + '%';
                if (tick >= steps) clearInterval(timer);
            }, 35);

            this.currentScore = target;
            if (keywordMatchValue) keywordMatchValue.textContent = keyword + '%';
            if (typeof window.animateAtsScore === 'function') {
                window.animateAtsScore(target);
            }

            const levels = [
                { badge: 'Strong', text: 'You meet most required skills and are interview-ready.' },
                { badge: 'Moderate', text: 'Your profile is promising with a few notable gaps to close.' },
                { badge: 'Weak', text: 'Key requirements are missing. Prioritize checklist and roadmap items.' }
            ];
            const level = target >= 75 ? levels[0] : target >= 55 ? levels[1] : levels[2];
            if (readinessBadge) readinessBadge.textContent = level.badge;
            if (scoreExplanation) scoreExplanation.textContent = level.text;
        }
    };

    const BreakdownCard = {
        init: function() {
            document.querySelectorAll('.breakdown-toggle').forEach(function(toggle) {
                toggle.addEventListener('click', function() {
                    const expanded = toggle.getAttribute('aria-expanded') === 'true';
                    const content = toggle.nextElementSibling;
                    toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
                    if (content) content.hidden = expanded;
                });
            });
        }
    };

    const MockInterviewCard = {
        init: function() {
            const btnRun = document.getElementById('btn-mock-run');
            const progressFill = document.getElementById('mock-progress-fill');
            const progressText = document.getElementById('mock-progress-text');
            const feedback = document.getElementById('mock-feedback');
            const feedbackSummary = document.getElementById('mock-feedback-summary');
            const feedbackScores = document.getElementById('mock-feedback-scores');
            const mockType = document.getElementById('mock-type');
            const mockDifficulty = document.getElementById('mock-difficulty');
            if (!btnRun || !progressFill || !progressText || !feedback || !feedbackSummary || !feedbackScores || !mockType || !mockDifficulty) return;

            btnRun.addEventListener('click', function() {
                let progress = 0;
                feedback.hidden = true;
                progressText.textContent = 'Interview running...';
                setActiveStep(4);

                const timer = setInterval(function() {
                    progress += 10;
                    progressFill.style.width = progress + '%';
                    progressText.textContent = 'Interview in progress: ' + progress + '%';
                    if (progress >= 100) {
                        clearInterval(timer);
                        progressText.textContent = 'Interview completed';
                        feedback.hidden = false;
                        feedbackSummary.textContent = 'Strong communication and structure. Improve depth on system trade-offs and measurable outcomes.';
                        feedbackScores.innerHTML =
                            '<span>Confidence: 82%</span>' +
                            '<span>Technical Accuracy: 76%</span>' +
                            '<span>Communication: 88%</span>' +
                            '<span>Type: ' + mockType.value.toUpperCase() + '</span>' +
                            '<span>Difficulty: ' + mockDifficulty.value.toUpperCase() + '</span>';
                    }
                }, 240);
            });
        }
    };

    function runResumeAnalysis() {
        if (!resumeTextEl || !jdTextEl) return;
        if (!UploadSection.hasInput() || !jdTextEl.value.trim()) {
            alert('Please upload your resume and paste the job description.');
            return;
        }

        setActiveStep(2);
        ScoreCard.setLoading(true);
        resultsContainer.hidden = false;

        setTimeout(function() {
            const score = Math.floor(Math.random() * 25) + 70;
            const keyword = Math.max(45, score - Math.floor(Math.random() * 18));
            ScoreCard.setLoading(false);
            ScoreCard.setScore(score, keyword);
            if (btnReanalyze) btnReanalyze.hidden = false;
            setActiveStep(3);
            populateInterviewQuestions();

            if (breakdownSection) {
                breakdownSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 1500);
    }

    UploadSection.init();
    BreakdownCard.init();
    MockInterviewCard.init();

    if (btnAnalyze) btnAnalyze.addEventListener('click', runResumeAnalysis);
    if (btnReanalyze) btnReanalyze.addEventListener('click', runResumeAnalysis);
    if (btnStartMock) {
        btnStartMock.addEventListener('click', function() {
            resultsContainer.hidden = false;
            setActiveStep(4);
            const mockCard = document.getElementById('mock-interview-card');
            if (mockCard) mockCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    const btnDownloadImproved = document.getElementById('btn-download-improved');
    if (btnDownloadImproved) {
        btnDownloadImproved.addEventListener('click', function() {
            const suggestionText = [
                'Improved Resume Suggestions',
                '',
                '1. Add Docker and AWS projects to match tooling requirements.',
                '2. Quantify impact with percentages and scale.',
                '3. Add LinkedIn and a one-line professional headline.',
                '4. Prioritize roadmap modules: Docker Fundamentals, AWS Basics.'
            ].join('\n');
            const blob = new Blob([suggestionText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'improved-resume-suggestions.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }

    function populateInterviewQuestions() {
        const technical = [
            'Explain Docker architecture and when to use containers.',
            'What is overfitting and how do you prevent it?',
            'Describe the difference between REST and GraphQL.',
            'How would you debug a memory leak in a Node.js application?',
            'Explain CI/CD and how you have used it.',
            'What is the time complexity of a hash map lookup?',
            'Describe how you would design a rate-limiting system.'
        ];
        const behavioral = [
            'Tell me about a time you had to meet a tight deadline.',
            'Describe a situation where you had to work with a difficult stakeholder.',
            'Give an example of when you took the lead on a project.',
            'How do you handle receiving critical feedback?',
            'Tell me about a time you failed and what you learned.',
            'Describe how you prioritize tasks when everything is urgent.',
            'Give an example of when you had to learn something new quickly.'
        ];
        const project = [
            'Walk me through the most complex project you have worked on.',
            'What would you do differently if you could rebuild a past project?',
            'How did you measure success for your last project?',
            'Describe a technical decision you made and its trade-offs.',
            'How did you handle scope creep or changing requirements?',
            'What tools and processes did you use for collaboration?',
            'How did you ensure code quality and maintainability?'
        ];

        function fillList(id, items) {
            const list = document.getElementById(id);
            if (!list) return;
            list.innerHTML = '';
            items.forEach(function(q) {
                const li = document.createElement('li');
                li.textContent = q;
                list.appendChild(li);
            });
        }

        fillList('iq-list-technical', technical);
        fillList('iq-list-behavioral', behavioral);
        fillList('iq-list-project', project);
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
