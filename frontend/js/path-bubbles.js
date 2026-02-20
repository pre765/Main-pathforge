/* Path Bubbles - Rising, bouncing spheres with pop effect */

const PATHS = [
    'Web Development',
    'AIML',
    'Data Science',
    'Cyber Security',
    'Cloud Computing',
    'Product & Design',
];

if (!getCurrentUser()) {
    window.location.href = 'login.html';
}

const container = document.getElementById('bubble-container');
const dropletsContainer = document.getElementById('droplets-container');
let bubbles = [];
let animationId = null;
let spawnX = window.innerWidth / 2;
let spawnY = window.innerHeight + 80;

/* Bubble config */
const MIN_SIZE = 50;
const MAX_SIZE = 120;
const RISE_SPEED = 1.2;
const SPREAD_FACTOR = 1.8;
const BOUNCE_DAMPING = 0.6;
const GROWTH_RATE = 0.015;
const COLLISION_DAMPING = 0.85;

/* ---------- AUDIO SYSTEM ---------- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playPopSound() {
    const duration = 0.15;
    const sampleRate = audioCtx.sampleRate;
    const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    const startFreq = 220;
    const endFreq = 480;
    const decay = 28;

    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const progress = t / duration;

        const freq = startFreq + (endFreq - startFreq) * progress;
        const envelope = Math.exp(-t * decay) * (1 - progress);

        data[i] =
            Math.sin(2 * Math.PI * freq * t) *
            envelope *
            0.35;
    }

    const source = audioCtx.createBufferSource();
    const gainNode = audioCtx.createGain();

    source.buffer = buffer;
    gainNode.gain.value = 0.6;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    source.start();
}

function createBubble(pathText, index) {
    const el = document.createElement('div');
    el.className = 'bubble';
    el.innerHTML = `<span class="bubble-text">${pathText}</span>`;
    el.dataset.path = pathText;

    const size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE) * 0.5;
    const angle = (Math.random() - 0.5) * Math.PI * 0.8;
    const vx = Math.sin(angle) * SPREAD_FACTOR * (0.5 + Math.random());
    const vy = -RISE_SPEED * (0.8 + Math.random() * 0.4);

    const bubble = {
        el,
        x: spawnX,
        y: spawnY,
        vx: vx * (Math.random() > 0.5 ? 1 : -1),
        vy,
        size,
        targetSize: MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE),
        pathText,
    };

    updateBubbleElement(bubble);
    container.appendChild(el);
    bubbles.push(bubble);

    return bubble;
}

function updateBubbleElement(b) {
    b.el.style.width = `${b.size}px`;
    b.el.style.height = `${b.size}px`;
    b.el.style.left = `${b.x - b.size / 2}px`;
    b.el.style.top = `${b.y - b.size / 2}px`;
}



function createDroplets(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
        const d = document.createElement('div');
        d.className = 'droplet';
        const radius = 4 + Math.random() * 10;
        d.style.width = `${radius * 2}px`;
        d.style.height = `${radius * 2}px`;
        d.style.left = `${x}px`;
        d.style.top = `${y}px`;

        const angle = (Math.PI * 2 * i) / count + Math.random();
        const burstSpeed = 40 + Math.random() * 60;
        const vx = Math.cos(angle) * burstSpeed;
        const vy = Math.sin(angle) * burstSpeed * 0.5 + 120;

        dropletsContainer.appendChild(d);

        d.animate(
            [
                { transform: `translate(0, 0) scale(1)`, opacity: 1 },
                {
                    transform: `translate(${vx}px, ${vy}px) scale(0.4)`,
                    opacity: 0,
                },
            ],
            {
                duration: 700,
                easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
                fill: 'forwards',
            }
        ).onfinish = () => d.remove();
    }
}

function resolveCollisions() {
    for (let i = 0; i < bubbles.length; i++) {
        const a = bubbles[i];
        if (a.el.classList.contains('popping')) continue;

        for (let j = i + 1; j < bubbles.length; j++) {
            const b = bubbles[j];
            if (b.el.classList.contains('popping')) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = (a.size + b.size) / 2;

            if (dist < minDist && dist > 0) {
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                a.x -= nx * overlap * 0.5;
                a.y -= ny * overlap * 0.5;
                b.x += nx * overlap * 0.5;
                b.y += ny * overlap * 0.5;

                const dvx = b.vx - a.vx;
                const dvy = b.vy - a.vy;
                const dvn = dvx * nx + dvy * ny;

                if (dvn < 0) {
                    a.vx += nx * dvn * COLLISION_DAMPING;
                    a.vy += ny * dvn * COLLISION_DAMPING;
                    b.vx -= nx * dvn * COLLISION_DAMPING;
                    b.vy -= ny * dvn * COLLISION_DAMPING;
                }
            }
        }
    }
}

async function popBubble(bubble, redirectUrl = 'profile.html') {
    if (bubble.el.classList.contains('popping')) return;
    bubble.el.classList.add('popping');

    playPopSound();
    createDroplets(bubble.x, bubble.y);

    /* Add path to list (allow multiple) */
    try {
        const paths = JSON.parse(localStorage.getItem('auth_portal_selected_paths') || '[]');
        if (!paths.includes(bubble.pathText)) paths.push(bubble.pathText);
        localStorage.setItem('auth_portal_selected_paths', JSON.stringify(paths));
        await syncSelectedPathsToBackend(paths);
    } catch (e) {}

    setTimeout(() => {
        bubble.el.remove();
        bubbles = bubbles.filter((b) => b !== bubble);
        window.location.href = redirectUrl;
    }, 500);
}

function animate() {
    const W = window.innerWidth;
    const H = window.innerHeight;

    bubbles.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;

        /* Grow as it rises */
        if (b.size < b.targetSize) {
            b.size = Math.min(b.targetSize, b.size + (b.targetSize - b.size) * GROWTH_RATE);
        }

        /* Bounce at top */
        if (b.y - b.size / 2 <= 0) {
            b.y = b.size / 2;
            b.vy = -b.vy * BOUNCE_DAMPING;
            if (Math.abs(b.vy) < 0.3) b.vy = -0.5;
        }

        /* Bounce at sides */
        if (b.x - b.size / 2 <= 0) {
            b.x = b.size / 2;
            b.vx = -b.vx * BOUNCE_DAMPING;
        }
        if (b.x + b.size / 2 >= W) {
            b.x = W - b.size / 2;
            b.vx = -b.vx * BOUNCE_DAMPING;
        }

        /* Soft floor */
        if (b.y + b.size / 2 >= H) {
            b.y = H - b.size / 2;
            b.vy = -Math.abs(b.vy) * BOUNCE_DAMPING;
        }
    });

    resolveCollisions();

    bubbles.forEach((b) => {
        updateBubbleElement(b);
    });

    animationId = requestAnimationFrame(animate);
}

function init() {
    /* Create static bubbles in a grid layout */
    const cols = 3;
    const rows = Math.ceil(PATHS.length / cols);
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const spacingX = containerWidth / (cols + 1);
    const spacingY = containerHeight / (rows + 1);
    
    PATHS.forEach((path, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = spacingX * (col + 1);
        const y = spacingY * (row + 1) + 100; // Offset from top for title
        
        const bubble = createBubble(path, i);
        bubble.x = x;
        bubble.y = y;
        bubble.vx = 0;
        bubble.vy = 0;
        updateBubbleElement(bubble);
    });

    /* Click delegation - handles all bubbles */
    container.addEventListener('click', (e) => {
        const bubbleEl = e.target.closest('.bubble');
        if (!bubbleEl || bubbleEl.classList.contains('popping')) return;
        const b = bubbles.find((x) => x.el === bubbleEl);
        if (b) popBubble(b);
    });
}

window.addEventListener('resize', () => {
    const cols = 3;
    const rows = Math.ceil(PATHS.length / cols);
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const spacingX = containerWidth / (cols + 1);
    const spacingY = containerHeight / (rows + 1);
    
    bubbles.forEach((bubble, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        bubble.x = spacingX * (col + 1);
        bubble.y = spacingY * (row + 1) + 100;
        updateBubbleElement(bubble);
    });
});

init();
