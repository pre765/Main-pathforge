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
    if (!logIn(email, password)) {
      alert('Invalid email or password.');
      return;
    }
    window.location.href = 'profile.html';
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
      if (!signUpMentor(name, email, password, { domain, expertise, bio, years })) {
        alert('This email is already registered. Please sign in instead.');
        return;
      }
    } else {
      if (!signUp(name, email, password, bio)) {
        alert('This email is already registered. Please sign in instead.');
        return;
      }
    }
    window.location.href = role === 'mentor' ? 'profile.html' : 'path-select.html';
  });
})();
