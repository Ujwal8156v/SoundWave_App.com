// Authentication Handler

class AuthHandler {
  constructor() {
    this.isLogin = true;
    this.setupEventListeners();
    this.updateForm();
  }

  setupEventListeners() {
    const authForm = document.getElementById('authForm');
    const toggleAuthLink = document.getElementById('toggleAuthLink');
    const modalCloseBtn = document.getElementById('closeAuthModalBtn');

    authForm?.addEventListener('submit', (e) => this.handleSubmit(e));
    toggleAuthLink?.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleMode();
    });

    // Segmented Mode Tabs
    document.getElementById('authTabLogin')?.addEventListener('click', () => {
      if (!this.isLogin) this.toggleMode();
    });
    document.getElementById('authTabRegister')?.addEventListener('click', () => {
      if (this.isLogin) this.toggleMode();
    });

    // 1-Click Quick Demo Login (Instant 0ms)
    document.getElementById('demoLoginBtn')?.addEventListener('click', () => {
      document.getElementById('email').value = 'demo@soundwave.com';
      document.getElementById('password').value = 'soundwave123';
      
      const demoUser = {
        id: 1,
        username: 'demo_user',
        email: 'demo@soundwave.com',
        firstName: 'Demo',
        lastName: 'User'
      };
      localStorage.setItem('token', 'demo-token-12345');
      this.closeModal();
      const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
      if (targetApp) {
        targetApp.setCurrentUser(demoUser);
        targetApp.showNotification('Logined 🚀', 'success', 'top-right');
      }

      // Background async sync with API
      if (window.API) {
        window.API.login('demo@soundwave.com', 'soundwave123').catch(() => null);
      }
    });

    // Password Visibility Toggle
    document.getElementById('togglePasswordBtn')?.addEventListener('click', () => {
      const passInput = document.getElementById('password');
      if (passInput) {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        const toggleBtn = document.getElementById('togglePasswordBtn');
        if (toggleBtn) toggleBtn.textContent = isPass ? '🙈' : '👁️';
      }
    });

    modalCloseBtn?.addEventListener('click', () => this.closeModal());

    window.addEventListener('click', (e) => {
      if (e.target === document.getElementById('authModal')) {
        this.closeModal();
      }
    });
  }

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.updateForm();
  }

  updateForm() {
    const registerFields = document.getElementById('registerFields');
    const toggleText = document.getElementById('toggleAuth');
    const formTitle = document.getElementById('authFormTitle');
    const subtitle = document.getElementById('authSubtitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const usernameInput = document.getElementById('username');

    const tabLogin = document.getElementById('authTabLogin');
    const tabRegister = document.getElementById('authTabRegister');

    if (this.isLogin) {
      if (registerFields) registerFields.style.display = 'none';
      if (usernameInput) usernameInput.removeAttribute('required');
      if (formTitle) formTitle.textContent = 'Welcome Back';
      if (subtitle) subtitle.textContent = 'Log in to unlock 320kbps streams, playlists, and spatial audio';
      if (submitBtn) submitBtn.textContent = 'Sign In to SoundWave 🚀';
      if (toggleText) toggleText.innerHTML = "Don't have an account? <a href='#' id='toggleAuthLink'>Create one now</a>";

      tabLogin?.classList.add('active');
      tabRegister?.classList.remove('active');
    } else {
      if (registerFields) {
        registerFields.style.display = 'flex';
        registerFields.style.flexDirection = 'column';
        registerFields.style.gap = '0.75rem';
      }
      if (usernameInput) usernameInput.setAttribute('required', '');
      if (formTitle) formTitle.textContent = 'Join SoundWave';
      if (subtitle) subtitle.textContent = 'Create your free account to stream 10M+ songs & build playlists';
      if (submitBtn) submitBtn.textContent = 'Create Free Account ✨';
      if (toggleText) toggleText.innerHTML = 'Already have an account? <a href="#" id="toggleAuthLink">Log in here</a>';

      tabRegister?.classList.add('active');
      tabLogin?.classList.remove('active');
    }

    // Re-bind click on dynamically created toggle link
    document.getElementById('toggleAuthLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleMode();
    });

    const alertBox = document.getElementById('authAlert');
    if (alertBox) alertBox.style.display = 'none';
  }

  async handleSubmit(e) {
    e.preventDefault();
    const alertBox = document.getElementById('authAlert');
    if (alertBox) alertBox.style.display = 'none';
    const targetApp = window.app || (typeof app !== 'undefined' ? app : null);

    try {
      if (this.isLogin) {
        await this.login();
      } else {
        await this.register();
      }
      this.closeModal();
    } catch (error) {
      console.error('Auth error:', error);
      const msg = error.message || 'Authentication failed. Please check your credentials.';
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.textContent = msg;
      }
      if (targetApp) targetApp.showNotification(msg, 'error', 'top-right');
    }
  }

  async login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      throw new Error('Please fill in all required fields');
    }

    const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
    
    // 0ms Optimistic Immediate Close & Login State
    this.closeModal();
    const optimisticUser = {
      id: Date.now(),
      email,
      username: email.split('@')[0],
      firstName: 'Music',
      lastName: 'User'
    };
    localStorage.setItem('token', 'token-' + Date.now());
    if (targetApp) {
      targetApp.setCurrentUser(optimisticUser);
      targetApp.showNotification('Logined 🚀', 'success', 'top-right');
    }

    // Async background API sync
    if (window.API) {
      window.API.login(email, password)
        .then(response => {
          if (response && response.data && targetApp) {
            targetApp.setCurrentUser(response.data);
          }
        })
        .catch(() => null);
    }
  }

  async register() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const usernameInput = document.getElementById('username');
    const username = (usernameInput && usernameInput.value.trim()) ? usernameInput.value.trim() : email.split('@')[0];
    const firstName = document.getElementById('firstName')?.value?.trim() || 'Music';
    const lastName = document.getElementById('lastName')?.value?.trim() || 'User';

    if (!email || !password) {
      throw new Error('Please fill in required email and password');
    }

    const targetApp = window.app || (typeof app !== 'undefined' ? app : null);

    // 0ms Optimistic Immediate Close & Register State
    this.closeModal();
    const optimisticUser = {
      id: Date.now(),
      email,
      username,
      firstName,
      lastName
    };
    localStorage.setItem('token', 'token-' + Date.now());
    if (targetApp) {
      targetApp.setCurrentUser(optimisticUser);
      targetApp.showNotification('Registered ✨', 'success', 'top-right');
    }

    // Async background API sync
    if (window.API) {
      window.API.register({ email, password, username, firstName, lastName })
        .then(response => {
          if (response && response.data && targetApp) {
            targetApp.setCurrentUser(response.data);
          }
        })
        .catch(() => null);
    }
  }

  closeModal() {
    const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
    if (targetApp) {
      targetApp.closeAuthModal();
    } else {
      const authModal = document.getElementById('authModal');
      if (authModal) authModal.style.display = 'none';
    }
  }
}

window.auth = new AuthHandler();
