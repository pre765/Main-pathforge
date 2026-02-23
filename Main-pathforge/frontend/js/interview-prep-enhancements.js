// ===== Interview Prep Enhancements =====

document.addEventListener('DOMContentLoaded', function() {
    initializeUploadMethods();
    initailizeDragDrop();
});

// ===== UPLOAD METHOD TABS =====
function initializeUploadMethods() {
    const tabs = document.querySelectorAll('.upload-method-tab');
    const pasteSection = document.getElementById('paste-method');
    const uploadSection = document.getElementById('upload-method');

    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const method = this.dataset.method;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide sections
            if (method === 'paste') {
                pasteSection.style.display = 'grid';
                uploadSection.style.display = 'none';
            } else {
                pasteSection.style.display = 'none';
                uploadSection.style.display = 'block';
            }
        });
    });
}

// ===== DRAG AND DROP UPLOAD =====
function initailizeDragDrop() {
    const uploadZones = document.querySelectorAll('.upload-zone');
    
    uploadZones.forEach(zone => {
        const input = zone.querySelector('input[type="file"]');
        
        if (!input) return;

        // Click to browse
        zone.addEventListener('click', () => input.click());

        // Drag and drop
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                handleFileUpload(input, zone);
            }
        });

        // File input change
        input.addEventListener('change', () => {
            handleFileUpload(input, zone);
        });
    });
}

function handleFileUpload(input, zone) {
    const file = input.files[0];
    if (!file) return;

    // Simple text extraction (in real app, use PDF.js for PDFs, etc.)
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            // Populate appropriate textarea based on zone ID
            if (input.id === 'resume-upload-input') {
                document.getElementById('resume-text').value = text;
            } else if (input.id === 'jd-upload-input') {
                document.getElementById('jd-text').value = text;
            }
            // Show success feedback
            updateZoneFeedback(zone, 'File loaded: ' + file.name);
        };
        reader.readAsText(file);
    } else {
        // For PDF/DOCX in real app, you'd use appropriate libraries
        updateZoneFeedback(zone, '✓ File selected: ' + file.name);
    }
}

function updateZoneFeedback(zone, message) {
    const textEl = zone.querySelector('.upload-zone-text');
    const originalText = textEl.textContent;
    textEl.textContent = message;
    
    zone.style.borderColor = 'rgba(0, 255, 136, 0.6)';
    
    setTimeout(() => {
        textEl.textContent = originalText;
        zone.style.borderColor = '';
    }, 3000);
}

// ===== ANIMATE ATS SCORE CIRCLE =====
function animateAtsScore(scoreValue) {
    const circle = document.getElementById('score-circle-fill');
    if (!circle) return;

    // Calculate stroke-dashoffset for circumference
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (scoreValue / 100) * circumference;

    circle.style.strokeDashoffset = offset;
}

// Call this after analysis returns score
window.animateAtsScore = animateAtsScore;

// ===== SUGGESTIONS ACCORDION =====
document.addEventListener('click', function(e) {
    if (e.target.closest('.accordion-header')) {
        const header = e.target.closest('.accordion-header');
        const isOpen = header.getAttribute('aria-expanded') === 'true';
        
        header.setAttribute('aria-expanded', !isOpen);
    }
});

// ===== DOWNLOAD BUTTON =====
const downloadBtn = document.getElementById('btn-download-improved');
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        // In real app, generate PDF from resume data
        alert('Resume download functionality would be implemented here');
    });
}

// ===== COPY BUTTON (from summary) =====
const copySummaryBtn = document.getElementById('btn-copy-summary');
if (copySummaryBtn) {
    copySummaryBtn.addEventListener('click', () => {
        const text = document.getElementById('summary-text').textContent;
        navigator.clipboard.writeText(text).then(() => {
            copySummaryBtn.classList.add('copied');
            copySummaryBtn.textContent = 'Copied!';
            setTimeout(() => {
                copySummaryBtn.classList.remove('copied');
                copySummaryBtn.textContent = 'Copy';
            }, 2000);
        });
    });
}
