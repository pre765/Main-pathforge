/* Interview Prep Page Functionality */
(function() {
    if (!getCurrentUser()) {
        window.location.href = 'login.html';
        return;
    }

    // Navigation
    const navItems = document.querySelectorAll('.prep-nav-item');
    const sections = document.querySelectorAll('.prep-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetSection = item.dataset.section;
            
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById('section-' + targetSection).classList.add('active');
        });
    });

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

    // Resume Checker
    const fileInput = document.getElementById('resume-file-input');
    const uploadArea = document.getElementById('upload-area');
    const atsResults = document.getElementById('ats-results');

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Simulate file processing
            uploadArea.innerHTML = `
                <div style="text-align: center; color: var(--accent-green);">
                    <p>✓ File uploaded: ${file.name}</p>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Processing resume...</p>
                </div>
            `;
            
            setTimeout(() => {
                analyzeResume(file);
            }, 1500);
        }
    });

    function analyzeResume(file) {
        // Simulate ATS analysis
        const atsScore = Math.floor(Math.random() * 30) + 70; // 70-100
        
        document.getElementById('ats-score-value').textContent = atsScore;
        atsResults.style.display = 'block';
        
        // Populate tabs
        populateSuggestedChanges();
        populateSuggestedSkills();
        populateLayouts();
    }

    function populateSuggestedChanges() {
        const list = document.getElementById('suggested-changes-list');
        const suggestions = [
            { title: 'Keyword Optimization', desc: 'Add more relevant keywords from the job description to improve ATS matching.' },
            { title: 'Format Consistency', desc: 'Ensure consistent formatting throughout your resume. Use standard fonts and clear section headers.' },
            { title: 'Quantify Achievements', desc: 'Add numbers and metrics to your achievements (e.g., "Increased performance by 30%").' },
            { title: 'Remove Graphics', desc: 'ATS systems may not parse images or complex graphics. Stick to text-based formatting.' },
        ];
        
        list.innerHTML = '';
        suggestions.forEach(s => {
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            card.innerHTML = `<h4>${s.title}</h4><p>${s.desc}</p>`;
            list.appendChild(card);
        });
    }

    function populateSuggestedSkills() {
        const list = document.getElementById('suggested-skills-list');
        const suggestions = [
            { title: 'Technical Skills', desc: 'Consider adding: Cloud Computing (AWS/Azure), Containerization (Docker), CI/CD pipelines, and version control expertise.' },
            { title: 'Project Ideas', desc: 'Build a full-stack application, contribute to open-source projects, or create a portfolio website showcasing your work.' },
        ];
        
        list.innerHTML = '';
        suggestions.forEach(s => {
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            card.innerHTML = `<h4>${s.title}</h4><p>${s.desc}</p>`;
            list.appendChild(card);
        });
    }

    function populateLayouts() {
        const grid = document.getElementById('layouts-grid');
        const layouts = [
            { name: 'Chronological', desc: 'Traditional format, best for steady career progression' },
            { name: 'Functional', desc: 'Skills-focused, ideal for career changers' },
            { name: 'Combination', desc: 'Hybrid approach, balances skills and experience' },
            { name: 'Modern', desc: 'Creative design, suitable for design/creative roles' },
        ];
        
        grid.innerHTML = '';
        layouts.forEach(layout => {
            const card = document.createElement('div');
            card.className = 'layout-card';
            card.innerHTML = `<h4>${layout.name}</h4><p>${layout.desc}</p>`;
            card.addEventListener('click', () => {
                alert(`Selected ${layout.name} layout. This would apply the layout in production.`);
            });
            grid.appendChild(card);
        });
    }

    // ATS Tabs
    const atsTabs = document.querySelectorAll('.ats-tab');
    const atsTabContents = document.querySelectorAll('.ats-tab-content');

    atsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            atsTabs.forEach(t => t.classList.remove('active'));
            atsTabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById('tab-' + targetTab).classList.add('active');
        });
    });

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();
