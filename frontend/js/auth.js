/* Auth + session helpers wired to backend API with local progress persistence */
const STORAGE_KEY = 'auth_portal_users';
const SESSION_KEY = 'auth_portal_session';
const TOKEN_KEY = 'auth_portal_token';
const PATHS_STORAGE_KEY = 'auth_portal_selected_paths';
const API_BASE = (window.PATHFORGE_API_BASE || 'http://localhost:5000/api').replace(/\/$/, '');
const GOOGLE_CLIENT_ID = (window.PATHFORGE_GOOGLE_CLIENT_ID || '').trim();

const DOMAIN_MAP = {
    'AIML': 'AI/ML',
    'Cyber Security': 'Cybersecurity',
    'Web Development': 'Web Development',
    'Data Science': 'Data Science',
};

function getUsers() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
}

function setAuthToken(token) {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        localStorage.removeItem(TOKEN_KEY);
    }
}

async function apiRequest(path, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    const token = getAuthToken();
    if (token && !headers.Authorization) {
        headers.Authorization = 'Bearer ' + token;
    }

    const response = await fetch(API_BASE + path, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok || !payload || payload.success === false) {
        const message = (payload && payload.message) || 'Request failed';
        throw new Error(message);
    }

    return payload;
}

function upsertLocalUser(userData = {}) {
    if (!userData.email) return null;

    const users = getUsers();
    const key = userData.email.toLowerCase().trim();
    const existing = users[key] || {};

    users[key] = {
        ...existing,
        ...userData,
        email: key,
        name: userData.name || existing.name || 'User',
        selectedDomain: userData.selectedDomain || existing.selectedDomain || null,
        skillLevel: userData.skillLevel || existing.skillLevel || 'beginner',
        joinedAt: userData.joinedAt || existing.joinedAt || new Date().toISOString(),
        progress: existing.progress || getDefaultProgress(),
        progressPerPath: existing.progressPerPath || {},
        completedSubtopics: existing.completedSubtopics || {},
    };

    saveUsers(users);
    return users[key];
}

function setSessionFromUser(userData) {
    const user = upsertLocalUser(userData);
    if (!user) return null;

    const session = {
        email: user.email,
        name: user.name,
        role: user.role || 'student',
        selectedDomain: user.selectedDomain || null,
        skillLevel: user.skillLevel || 'beginner',
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
}

async function fetchMyProfile() {
    const payload = await apiRequest('/student/me');
    const data = payload.data || {};

    return {
        id: data._id || data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        selectedDomain: data.selectedDomain,
        skillLevel: data.skillLevel,
        joinedAt: data.createdAt || data.joinedAt,
    };
}

async function signUp(name, email, password) {
    try {
        await apiRequest('/auth/register/request-otp', {
            method: 'POST',
            body: { name: name.trim(), email: email.trim(), password },
        });

        const otp = prompt('Enter the 6-digit verification code sent to your email:');
        if (!otp) {
            return { success: false, message: 'Sign up cancelled. Verification code is required.' };
        }

        const payload = await apiRequest('/auth/register/verify-otp', {
            method: 'POST',
            body: { email: email.trim(), otp: otp.trim() },
        });

        setAuthToken(payload.token);
        const profile = await fetchMyProfile();
        setSessionFromUser(profile);

        return { success: true };
    } catch (error) {
        return { success: false, message: error.message || 'Sign up failed' };
    }
}

async function logIn(email, password) {
    try {
        const payload = await apiRequest('/auth/login', {
            method: 'POST',
            body: { email: email.trim(), password },
        });

        setAuthToken(payload.token);
        const profile = await fetchMyProfile();
        setSessionFromUser(profile);

        return { success: true };
    } catch (error) {
        return { success: false, message: error.message || 'Login failed' };
    }
}

async function continueWithGoogle(idToken) {
    try {
        const payload = await apiRequest('/auth/google', {
            method: 'POST',
            body: { idToken },
        });

        setAuthToken(payload.token);
        const profile = await fetchMyProfile();
        setSessionFromUser(profile);

        return { success: true };
    } catch (error) {
        return { success: false, message: error.message || 'Google sign-in failed' };
    }
}

async function onGoogleCredentialResponse(response) {
    const credential = response && response.credential;
    if (!credential) {
        alert('Google sign-in failed. Missing credential token.');
        return;
    }

    const result = await continueWithGoogle(credential);
    if (result.success) {
        window.location.href = 'profile.html';
        return;
    }

    alert(result.message || 'Google sign-in failed. Please try again.');
}

function renderGoogleButton(mode = 'signin') {
    const container = document.getElementById('google-signin-button');
    if (!container || !window.google || !window.google.accounts || !window.google.accounts.id) {
        return;
    }

    container.innerHTML = '';
    window.google.accounts.id.renderButton(container, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        width: 320,
        text: mode === 'signup' ? 'signup_with' : 'signin_with',
    });
}

function initGoogleAuth(mode = 'signin') {
    if (!GOOGLE_CLIENT_ID) {
        const note = document.getElementById('google-auth-note');
        if (note) {
            note.textContent = 'Google sign-in is disabled. Set PATHFORGE_GOOGLE_CLIENT_ID in the page script.';
        }
        return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        return;
    }

    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: onGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
    });

    renderGoogleButton(mode);
}

function initializeGoogleAuthOnLoad(mode = 'signin', attempts = 0) {
    const tryInit = () => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
            initGoogleAuth(mode);
            return;
        }

        if (attempts < 30) {
            setTimeout(() => initializeGoogleAuthOnLoad(mode, attempts + 1), 150);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit, { once: true });
    } else {
        tryInit();
    }
}

function logOut() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
}

function signOut() {
    logOut();
}

function deleteProfile() {
    const user = getFullUser();
    if (!user) return;
    const users = getUsers();
    const key = user.email.toLowerCase().trim();
    if (users[key]) {
        users[key].progressPerPath = {};
        users[key].progress = getDefaultProgress();
        users[key].completedSubtopics = {};
        saveUsers(users);
    }
}

function deleteAccount() {
    const user = getFullUser();
    if (!user) return;
    const users = getUsers();
    const key = user.email.toLowerCase().trim();
    if (users[key]) {
        delete users[key];
        saveUsers(users);
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PATHS_STORAGE_KEY);
}

function getCurrentUser() {
    try {
        const data = localStorage.getItem(SESSION_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

function getFullUser() {
    const session = getCurrentUser();
    if (!session || !session.email) return null;

    const users = getUsers();
    const user = users[session.email];
    if (user) return user;

    return upsertLocalUser({
        name: session.name,
        email: session.email,
        role: session.role,
        selectedDomain: session.selectedDomain,
        skillLevel: session.skillLevel,
    });
}

function getSelectedPaths() {
    try {
        let paths = JSON.parse(localStorage.getItem(PATHS_STORAGE_KEY) || '[]');
        const legacy = localStorage.getItem('auth_portal_selected_path');
        if (legacy && !paths.includes(legacy)) {
            paths = [legacy, ...paths];
            localStorage.setItem(PATHS_STORAGE_KEY, JSON.stringify(paths));
        }
        return paths;
    } catch {
        return [];
    }
}

async function syncSelectedPathsToBackend(paths) {
    const normalized = Array.isArray(paths) ? paths : [];
    const supported = normalized.map((path) => DOMAIN_MAP[path]).filter(Boolean);

    if (!supported.length || !getAuthToken()) {
        return { success: false, skipped: true };
    }

    const selectedDomain = supported[supported.length - 1];
    const payload = await apiRequest('/student/domain', {
        method: 'PUT',
        body: { selectedDomain },
    });

    const user = payload.data || {};
    setSessionFromUser({
        name: user.name,
        email: user.email,
        role: user.role,
        selectedDomain: user.selectedDomain,
        skillLevel: user.skillLevel,
        joinedAt: user.createdAt,
    });

    return { success: true, selectedDomain: user.selectedDomain };
}

function getDefaultProgress(seed = 0) {
    const r = (s) => ((s * 9301 + 49297) % 233280) / 233280;
    return {
        coursesCompleted: 4 + Math.floor(r(seed) * 2),
        totalCourses: 8,
        hoursSpent: 20 + Math.floor(r(seed + 1) * 15),
        weeklyActivity: [10, 18, 14, 20, 16, 23, 28].map((v, i) => v + Math.floor(r(seed + i) * 8)),
        skillBreakdown: [
            { label: 'HTML/CSS', value: 80 + Math.floor(r(seed) * 15) },
            { label: 'JavaScript', value: 65 + Math.floor(r(seed + 1) * 20) },
            { label: 'React', value: 40 + Math.floor(r(seed + 2) * 25) },
            { label: 'Node.js', value: 25 + Math.floor(r(seed + 3) * 30) },
        ],
        monthlyProgress: [35, 50, 45, 68, 60, 82, 78, 90].map((v, i) => v + Math.floor(r(seed + i) * 15)),
    };
}

window.initializeGoogleAuthOnLoad = initializeGoogleAuthOnLoad;
