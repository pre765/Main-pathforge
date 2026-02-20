/* Simple auth using localStorage (demo only - no real backend) */
const STORAGE_KEY = 'auth_portal_users';
const SESSION_KEY = 'auth_portal_session';

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

function signUp(name, email, password) {
    const users = getUsers();
    const key = email.toLowerCase().trim();
    if (users[key]) return false;

    users[key] = {
        name: name.trim(),
        email: key,
        password: password,
        joinedAt: new Date().toISOString(),
        progress: getDefaultProgress(),
    };
    saveUsers(users);

    const session = { email: key, name: users[key].name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
}

function logIn(email, password) {
    const users = getUsers();
    const key = email.toLowerCase().trim();
    const user = users[key];
    if (!user || user.password !== password) return false;

    const session = { email: key, name: user.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
}

function logOut() {
    localStorage.removeItem(SESSION_KEY);
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
    if (!session) return null;
    const users = getUsers();
    return users[session.email] || null;
}

const PATHS_STORAGE_KEY = 'auth_portal_selected_paths';

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
