/**
 * Unified Auth Page — Tab toggle, role selector, dynamic fields,
 * password strength, show/hide password, form submit, redirect by role.
 */
(function () {
  const tabSignIn = document.getElementById('tab-signin');
  const tabCreate = document.getElementById('tab-create');
  const panelSignIn = document.getElementById('panel-signin');
  const panelCreate = document.getElementById('panel-create');
  const formSignIn = document.getElementById('form-signin');
  const formCreate = document.getElementById('form-create');
  const rolePills = document.querySelectorAll('.role-pill');
  const createRoleInput = document.getElementById('create-role');
  const mentorFields = document.getElementById('mentor-fields');
  const createPassword = document.getElementById('create-password');
  const strengthFill = document.getElementById('password-strength-fill');
  const strengthLabel = document.getElementById('password-strength-label');
  const otpPanel = document.getElementById('otp-panel');
  const otpCodeInput = document.getElementById('otp-code');
  const otpNote = document.getElementById('otp-note');
  const otpVerifyBtn = document.getElementById('otp-verify-btn');
  const otpResendBtn = document.getElementById('otp-resend-btn');

  /* ----- Tab switch ----- */
  function showPanel(panel) {
    panelSignIn.classList.remove('active');
    panelCreate.classList.remove('active');
    tabSignIn.classList.remove('active');
    tabCreate.classList.remove('active');
    panelSignIn.hidden = true;
    panelCreate.hidden = true;
    tabSignIn.setAttribute('aria-selected', 'false');
    tabCreate.setAttribute('aria-selected', 'false');

    if (panel === 'signin') {
      panelSignIn.classList.add('active');
      panelSignIn.hidden = false;
      tabSignIn.classList.add('active');
      tabSignIn.setAttribute('aria-selected', 'true');
    } else {
      panelCreate.classList.add('active');
      panelCreate.hidden = false;
      tabCreate.classList.add('active');
      tabCreate.setAttribute('aria-selected', 'true');
    }
  }

  tabSignIn.addEventListener('click', () => showPanel('signin'));
  tabCreate.addEventListener('click', () => showPanel('create'));

  /* ----- Role selector ----- */
  const domainInput = document.getElementById('create-domain');
  const expertiseInput = document.getElementById('create-expertise');
  const yearsInput = document.getElementById('create-years');

  function toggleMentorFields(isMentor) {
    if (isMentor) {
      mentorFields.classList.remove('hidden');
      mentorFields.classList.add('visible');
      domainInput?.setAttribute('required', 'required');
      expertiseInput?.setAttribute('required', 'required');
      yearsInput?.setAttribute('required', 'required');
    } else {
      mentorFields.classList.remove('visible');
      mentorFields.classList.add('hidden');
      domainInput?.removeAttribute('required');
      expertiseInput?.removeAttribute('required');
      yearsInput?.removeAttribute('required');
    }
  }

  rolePills.forEach((pill) => {
    pill.addEventListener('click', function () {
      rolePills.forEach((p) => p.classList.remove('active'));
      this.classList.add('active');
      const role = this.dataset.role;
      createRoleInput.value = role;
      toggleMentorFields(role === 'mentor');
    });
  });

  /* ----- Password strength ----- */
  function getStrength(pwd) {
    if (!pwd.length) return { level: 0, label: 'Password strength' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    const level = Math.min(4, Math.ceil((score / 5) * 4));
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    return { level, label: labels[level - 1] || 'Password strength' };
  }

  if (createPassword && strengthFill && strengthLabel) {
    createPassword.addEventListener('input', function () {
      const { level, label } = getStrength(this.value);
      strengthFill.setAttribute('data-level', level || '0');
      strengthFill.style.width = level ? (level / 4) * 100 + '%' : '0';
      strengthLabel.textContent = label;
    });
  }

  /* Open Create Account tab if hash is #create */
  if (window.location.hash === '#create') {
    showPanel('create');
  }

  /* ----- Toggle password visibility ----- */
  document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', function () {
      const wrap = this.closest('.password-wrap');
      const input = wrap.querySelector('input[type="password"], input[type="text"]');
      const eye = wrap.querySelector('.icon-eye');
      const eyeOff = wrap.querySelector('.icon-eye-off');
      if (input.type === 'password') {
        input.type = 'text';
        eye.hidden = true;
        eyeOff.hidden = false;
        this.setAttribute('aria-label', 'Hide password');
      } else {
        input.type = 'password';
        eye.hidden = false;
        eyeOff.hidden = true;
        this.setAttribute('aria-label', 'Show password');
      }
    });
  });

  /* ----- Sign In ----- */
  formSignIn.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    handleLogin(email, password);
  });

  /* ----- Create Account ----- */
  formCreate.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('create-name').value.trim();
    const email = document.getElementById('create-email').value.trim();
    const password = document.getElementById('create-password').value;
    const bio = document.getElementById('create-bio').value.trim();
    const role = createRoleInput.value;

    if (role === 'mentor') {
      const domain = document.getElementById('create-domain').value;
      const expertise = document.getElementById('create-expertise').value;
      const years = document.getElementById('create-years').value;
      requestSignupOtp({
        name,
        email,
        password,
        bio,
        role,
        domain,
        expertise,
        years,
      });
    } else {
      requestSignupOtp({
        name,
        email,
        password,
        bio,
        role,
      });
    }
  });

  /* ----- Google Sign In ----- */
  const config = window.PathForgeConfig || {};
  const apiBaseUrl = config.apiBaseUrl || 'http://localhost:5000/api';
  const googleClientId = config.googleClientId;
  const googleSignInBtn = document.getElementById('google-signin-btn');
  const googleSignUpBtn = document.getElementById('google-signup-btn');
  let googleRedirectTarget = 'profile.html';

  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', () => {
      googleRedirectTarget = 'profile.html';
    });
  }

  if (googleSignUpBtn) {
    googleSignUpBtn.addEventListener('click', () => {
      googleRedirectTarget = 'path-select.html';
    });
  }

  async function postJson(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  }

  async function handleGoogleCredential(response) {
    if (!response || !response.credential) {
      alert('Google sign-in failed.');
      return;
    }

    try {
      const data = await postJson(`${apiBaseUrl}/auth/google`, {
        idToken: response.credential,
      });

      const user = data.data || {};
      const token = data.token;
      const ok = oauthSignIn(
        {
          email: user.email,
          name: user.name,
          role: user.role,
          selectedDomain: user.selectedDomain,
          skillLevel: user.skillLevel,
        },
        token
      );

      if (!ok) {
        throw new Error('Unable to create session');
      }

      window.location.href = googleRedirectTarget;
    } catch (err) {
      alert(err.message || 'Google authentication failed.');
    }
  }

  function initGoogleButtons(retry = 0) {
    if (!googleSignInBtn && !googleSignUpBtn) return;

    if (!googleClientId) {
      if (googleSignInBtn) googleSignInBtn.textContent = 'Google not configured';
      if (googleSignUpBtn) googleSignUpBtn.textContent = 'Google not configured';
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      if (retry < 10) {
        setTimeout(() => initGoogleButtons(retry + 1), 300);
      }
      return;
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
    });

    const buttonOptions = {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'left',
      width: 240,
    };

    if (googleSignInBtn) {
      window.google.accounts.id.renderButton(googleSignInBtn, buttonOptions);
    }
    if (googleSignUpBtn) {
      window.google.accounts.id.renderButton(googleSignUpBtn, buttonOptions);
    }
  }

  window.addEventListener('load', () => initGoogleButtons());

  /* ----- API auth (email/password + OTP) ----- */
  let pendingSignup = null;

  function isEmailValid(email) {
    return /@/.test(String(email || ''));
  }

  function normalizeRole(role) {
    return role === 'mentor' ? 'guider' : 'student';
  }

  function normalizeDomain(raw) {
    if (!raw) return null;
    const map = {
      'Web Development': 'Web Development',
      'AIML': 'AI/ML',
      'AI/ML': 'AI/ML',
      'Cyber Security': 'Cybersecurity',
      'Cybersecurity': 'Cybersecurity',
      'Data Science': 'Data Science',
    };
    return map[raw] || null;
  }

  function normalizeSkillLevel(raw) {
    if (!raw) return null;
    const val = String(raw).toLowerCase();
    if (val === 'beginner' || val === 'intermediate' || val === 'advanced') return val;
    return null;
  }

  function setOtpVisible(visible, message) {
    if (!otpPanel) return;
    otpPanel.classList.toggle('hidden', !visible);
    if (message && otpNote) otpNote.textContent = message;
  }

  async function handleLogin(email, password) {
    if (!email || !password) {
      alert('Email and password are required.');
      return;
    }
    if (!isEmailValid(email)) {
      alert('Please enter an email address.');
      return;
    }

    try {
      const data = await postJson(`${apiBaseUrl}/auth/login`, { email, password });
      const user = data.data || {};
      const token = data.token;
      const ok = oauthSignIn(
        {
          email: user.email,
          name: user.name,
          role: user.role,
          selectedDomain: user.selectedDomain,
          skillLevel: user.skillLevel,
        },
        token
      );
      if (!ok) throw new Error('Unable to create session');
      window.location.href = 'profile.html';
    } catch (err) {
      alert(err.message || 'Invalid email or password.');
    }
  }

  async function requestSignupOtp(payload) {
    const { name, email, password, role } = payload;

    if (!name || !email || !password) {
      alert('Name, email, and password are required.');
      return;
    }
    if (!isEmailValid(email)) {
      alert('Please enter an email address.');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    const normalizedRole = normalizeRole(role);
    const selectedDomain = normalizeDomain(payload.domain);
    const skillLevel = normalizeSkillLevel(payload.expertise);

    try {
      await postJson(`${apiBaseUrl}/auth/register/request-otp`, {
        name,
        email,
        password,
        role: normalizedRole,
        selectedDomain,
        skillLevel,
      });

      pendingSignup = {
        email,
        role: normalizedRole,
        redirectTo: normalizedRole === 'guider' ? 'profile.html' : 'path-select.html',
      };
      setOtpVisible(true, `Verification code sent to ${email}.`);
      if (otpCodeInput) otpCodeInput.focus();
    } catch (err) {
      alert(err.message || 'Failed to send verification code.');
    }
  }

  async function verifySignupOtp() {
    if (!pendingSignup) {
      alert('Please request a verification code first.');
      return;
    }
    const otp = otpCodeInput ? otpCodeInput.value.trim() : '';
    if (!otp) {
      alert('Enter the verification code.');
      return;
    }

    try {
      const data = await postJson(`${apiBaseUrl}/auth/register/verify-otp`, {
        email: pendingSignup.email,
        otp,
      });

      const user = data.data || {};
      const token = data.token;
      const ok = oauthSignIn(
        {
          email: user.email,
          name: user.name,
          role: user.role,
          selectedDomain: user.selectedDomain,
          skillLevel: user.skillLevel,
        },
        token
      );
      if (!ok) throw new Error('Unable to create session');
      window.location.href = pendingSignup.redirectTo;
    } catch (err) {
      alert(err.message || 'Verification failed.');
    }
  }

  if (otpVerifyBtn) {
    otpVerifyBtn.addEventListener('click', verifySignupOtp);
  }

  if (otpResendBtn) {
    otpResendBtn.addEventListener('click', () => {
      if (!pendingSignup) {
        alert('Please fill the form and request a code first.');
        return;
      }
      const name = document.getElementById('create-name').value.trim();
      const email = document.getElementById('create-email').value.trim();
      const password = document.getElementById('create-password').value;
      const role = createRoleInput.value;
      const domain = document.getElementById('create-domain')?.value;
      const expertise = document.getElementById('create-expertise')?.value;
      const years = document.getElementById('create-years')?.value;
      requestSignupOtp({ name, email, password, role, domain, expertise, years });
    });
  }
})();
