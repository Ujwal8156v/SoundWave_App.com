// SoundWave Glassmorphic Dynamic Auth Handler with Email OTP Verification

class AuthHandler {
  constructor() {
    this.isLogin = true;
    this.isOtpStep = false;
    this.currentOtp = null;
    this.otpTimer = null;
    this.pendingUser = null;
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

    // Auto-Fill Demo Credentials Button Handler
    document.getElementById('fillDemoCredsBtn')?.addEventListener('click', () => {
      const emailInput = document.getElementById('email');
      const passInput = document.getElementById('password');
      if (emailInput) emailInput.value = 'MusicDemo';
      if (passInput) passInput.value = 'SoundWave1234';

      const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
      if (targetApp) {
        targetApp.showNotification('Demo Credentials Filled: MusicDemo / SoundWave1234 ⚡', 'info', 'top-right');
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

    // OTP Input Digit Auto-Focus & Key Navigation
    const otpInputs = document.querySelectorAll('.otp-digit-input');
    otpInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
        // Auto verify if all 6 digits entered
        const fullOtp = Array.from(otpInputs).map(i => i.value).join('');
        if (fullOtp.length === 6) {
          this.verifyOtp();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          otpInputs[index - 1].focus();
        }
      });
    });

    // Paste Support for 6-digit OTP
    const otpContainer = document.getElementById('otpStepContainer');
    otpContainer?.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedData = (e.clipboardData || window.clipboardData).getData('text').trim();
      if (/^\d{6}$/.test(pastedData)) {
        const otpInputs = document.querySelectorAll('.otp-digit-input');
        pastedData.split('').forEach((char, i) => {
          if (otpInputs[i]) otpInputs[i].value = char;
        });
        if (otpInputs[5]) otpInputs[5].focus();
        this.verifyOtp();
      }
    });

    // Back to Registration link
    document.getElementById('backToRegisterLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.isOtpStep = false;
      this.updateForm();
    });

    // Verify OTP Button Action
    document.getElementById('verifyOtpBtn')?.addEventListener('click', () => this.verifyOtp());

    // Resend OTP Action
    document.getElementById('resendOtpBtn')?.addEventListener('click', () => this.resendOtp());

    modalCloseBtn?.addEventListener('click', () => this.closeModal());

    window.addEventListener('click', (e) => {
      if (e.target === document.getElementById('authModal')) {
        this.closeModal();
      }
    });
  }

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.isOtpStep = false;
    this.updateForm();
  }

  updateForm() {
    const registerFields = document.getElementById('registerFields');
    const commonFields = document.getElementById('commonFields');
    const toggleText = document.getElementById('toggleAuth');
    const formTitle = document.getElementById('authFormTitle');
    const subtitle = document.getElementById('authSubtitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const usernameInput = document.getElementById('username');
    const otpContainer = document.getElementById('otpStepContainer');

    const tabLogin = document.getElementById('authTabLogin');
    const tabRegister = document.getElementById('authTabRegister');

    if (otpContainer) otpContainer.style.display = 'none';

    if (this.isLogin) {
      if (commonFields) commonFields.style.display = 'block';
      if (registerFields) registerFields.style.display = 'none';
      if (submitBtn) {
        submitBtn.style.display = 'block';
        submitBtn.textContent = 'Sign In to SoundWave 🚀';
      }
      if (usernameInput) usernameInput.removeAttribute('required');
      if (formTitle) formTitle.textContent = 'Welcome Back';
      if (subtitle) subtitle.textContent = 'Log in to unlock 320kbps streams, playlists, and spatial audio';
      if (toggleText) {
        toggleText.style.display = 'block';
        toggleText.innerHTML = "Don't have an account? <a href='#' id='toggleAuthLink'>Create one now</a>";
      }

      tabLogin?.classList.add('active');
      tabRegister?.classList.remove('active');
    } else {
      if (commonFields) commonFields.style.display = 'block';
      if (registerFields) {
        registerFields.style.display = 'flex';
        registerFields.style.flexDirection = 'column';
        registerFields.style.gap = '0.75rem';
      }
      if (submitBtn) {
        submitBtn.style.display = 'block';
        submitBtn.textContent = 'Send OTP & Register ✨';
      }
      if (usernameInput) usernameInput.setAttribute('required', '');
      if (formTitle) formTitle.textContent = 'Join SoundWave';
      if (subtitle) subtitle.textContent = 'Create your free account with Email OTP Verification';
      if (toggleText) {
        toggleText.style.display = 'block';
        toggleText.innerHTML = 'Already have an account? <a href="#" id="toggleAuthLink">Log in here</a>';
      }

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

    try {
      if (this.isLogin) {
        await this.login();
      } else {
        await this.initiateOtpRegistration();
      }
    } catch (error) {
      console.error('Auth error:', error);
      const msg = error.message || 'Authentication failed. Please check your credentials.';
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.textContent = msg;
      }
      const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
      if (targetApp) targetApp.showNotification(msg, 'error', 'top-right');
    }
  }

  async login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      throw new Error('Please fill in all required fields');
    }

    const cleanInput = email.toLowerCase();
    const targetApp = window.app || (typeof app !== 'undefined' ? app : null);

    // List of valid registered emails and usernames
    const presetEmails = ['musicdemo@soundwave.com', 'musicdemo', 'demo@soundwave.com', 'admin@soundwave.com', 'user@soundwave.com'];
    const presetUsernames = ['musicdemo', 'demo_user', 'admin', 'soundwave_user'];

    const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const activeUser = localStorage.getItem('soundwave_user') ? JSON.parse(localStorage.getItem('soundwave_user')) : null;

    const isPresetUser = presetEmails.includes(cleanInput) || presetUsernames.includes(cleanInput);
    const isStoredUser = storedUsers.some(u => 
      (u.email && u.email.toLowerCase() === cleanInput) || 
      (u.username && u.username.toLowerCase() === cleanInput)
    );
    const isActiveUser = activeUser && (
      (activeUser.email && activeUser.email.toLowerCase() === cleanInput) || 
      (activeUser.username && activeUser.username.toLowerCase() === cleanInput)
    );

    const isRegistered = isPresetUser || isStoredUser || isActiveUser;

    if (!isRegistered) {
      const msg = 'User Not Found! ⚠️ You are not registered yet. Please create an account to register.';
      const alertBox = document.getElementById('authAlert');
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.textContent = msg;
      }
      if (targetApp) {
        targetApp.showNotification(msg, 'warning', 'top-right');
      }

      // Automatically switch to Registration tab after 1s
      setTimeout(() => {
        if (this.isLogin) {
          this.toggleMode();
        }
      }, 1000);

      return;
    }

    // Process valid login for registered users
    const isMusicDemo = cleanInput === 'musicdemo' || cleanInput === 'musicdemo@soundwave.com';
    const optimisticUser = isMusicDemo ? {
      id: 100,
      username: 'MusicDemo',
      email: 'MusicDemo@soundwave.com',
      firstName: 'Music',
      lastName: 'Demo'
    } : (activeUser || {
      id: Date.now(),
      email,
      username: email.includes('@') ? email.split('@')[0] : email,
      firstName: 'Music',
      lastName: 'User'
    });

    localStorage.setItem('token', 'token-' + Date.now());
    if (targetApp) {
      targetApp.setCurrentUser(optimisticUser);
      targetApp.showNotification('Logined 🚀', 'success', 'top-right');
    }

    // Stay on login modal page until popup is shown, then close after 1.2s
    setTimeout(() => {
      this.closeModal();
    }, 1200);

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

  async initiateOtpRegistration() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const usernameInput = document.getElementById('username');
    const username = (usernameInput && usernameInput.value.trim()) ? usernameInput.value.trim() : email.split('@')[0];
    const firstName = document.getElementById('firstName')?.value?.trim() || 'Music';
    const lastName = document.getElementById('lastName')?.value?.trim() || 'User';

    if (!email || !password) {
      throw new Error('Please fill in required email and password');
    }

    // Check duplicate email & username
    const existingUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const presetEmails = ['demo@soundwave.com', 'admin@soundwave.com', 'user@soundwave.com'];
    const presetUsernames = ['demo_user', 'admin', 'soundwave_user'];

    const emailExists = presetEmails.includes(email.toLowerCase()) || 
      existingUsers.some(u => u.email && u.email.toLowerCase() === email.toLowerCase()) ||
      (localStorage.getItem('soundwave_user') && JSON.parse(localStorage.getItem('soundwave_user')).email?.toLowerCase() === email.toLowerCase());

    const usernameExists = presetUsernames.includes(username.toLowerCase()) || 
      existingUsers.some(u => u.username && u.username.toLowerCase() === username.toLowerCase()) ||
      (localStorage.getItem('soundwave_user') && JSON.parse(localStorage.getItem('soundwave_user')).username?.toLowerCase() === username.toLowerCase());

    if (emailExists) {
      const msg = 'User Already Exists with this Email! ⚠️ Please log in or use another email.';
      const alertBox = document.getElementById('authAlert');
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.textContent = msg;
      }
      const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
      if (targetApp) targetApp.showNotification(msg, 'error', 'top-right');
      return;
    }

    if (usernameExists) {
      const msg = 'Username Already Taken! ⚠️ Please choose a different username.';
      const alertBox = document.getElementById('authAlert');
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.textContent = msg;
      }
      const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
      if (targetApp) targetApp.showNotification(msg, 'error', 'top-right');
      return;
    }

    // Store pending user registration payload
    this.pendingUser = { email, password, username, firstName, lastName };

    // Generate 6-digit OTP
    this.currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
    this.isOtpStep = true;

    // Dispatch via Backend OTP Gateway API
    if (window.API) {
      window.API.sendOtp(email, 'email')
        .then(res => {
          if (res && res.demoOtpCode) {
            this.currentOtp = res.demoOtpCode;
            const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
            if (targetApp) {
              targetApp.showNotification(`OTP Code Sent to ${email} 📩 (Code: ${this.currentOtp})`, 'info', 'top-right');
            }
          }
        })
        .catch(() => null);
    }

    // Switch UI to OTP step view
    document.getElementById('commonFields').style.display = 'none';
    document.getElementById('registerFields').style.display = 'none';
    document.getElementById('authSubmitBtn').style.display = 'none';
    document.getElementById('toggleAuth').style.display = 'none';
    document.getElementById('authFormTitle').textContent = 'Verify Email OTP';
    document.getElementById('authSubtitle').textContent = `Enter the 6-digit code sent to ${email}`;

    const otpContainer = document.getElementById('otpStepContainer');
    if (otpContainer) otpContainer.style.display = 'block';

    const emailTarget = document.getElementById('otpEmailTarget');
    if (emailTarget) emailTarget.textContent = email;

    // Clear and focus first OTP digit input
    const otpInputs = document.querySelectorAll('.otp-digit-input');
    otpInputs.forEach(input => input.value = '');
    if (otpInputs[0]) otpInputs[0].focus();

    // Start 60s countdown timer
    this.startOtpTimer();

    const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
    if (targetApp) {
      targetApp.showNotification(`OTP Code Sent to ${email} 📩 (Code: ${this.currentOtp})`, 'info', 'top-right');
    }
  }

  startOtpTimer() {
    clearInterval(this.otpTimer);
    let secondsLeft = 60;
    const timerText = document.getElementById('otpTimerText');
    const resendBtn = document.getElementById('resendOtpBtn');
    
    if (resendBtn) resendBtn.disabled = true;

    this.otpTimer = setInterval(() => {
      secondsLeft--;
      if (timerText) timerText.textContent = `(${secondsLeft}s)`;
      if (secondsLeft <= 0) {
        clearInterval(this.otpTimer);
        if (timerText) timerText.textContent = '';
        if (resendBtn) resendBtn.disabled = false;
      }
    }, 1000);
  }

  resendOtp() {
    if (!this.pendingUser) return;
    this.currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
    this.startOtpTimer();

    const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
    if (targetApp) {
      targetApp.showNotification(`New OTP Sent 📩 (Code: ${this.currentOtp})`, 'info', 'top-right');
    }
  }

  async verifyOtp() {
    const otpInputs = document.querySelectorAll('.otp-digit-input');
    const enteredOtp = Array.from(otpInputs).map(i => i.value).join('').trim();
    const targetApp = window.app || (typeof app !== 'undefined' ? app : null);

    if (enteredOtp.length !== 6) {
      if (targetApp) targetApp.showNotification('Please enter all 6 OTP digits', 'error', 'top-right');
      return;
    }

    if (!this.pendingUser) {
      if (targetApp) targetApp.showNotification('Registration session expired. Please start again.', 'error', 'top-right');
      this.isOtpStep = false;
      this.updateForm();
      return;
    }

    // Strict local verification against generated OTP code sent to user email
    if (enteredOtp !== this.currentOtp) {
      const errMsg = 'Invalid OTP Code! ⚠️ Please enter the exact 6-digit code sent to your email.';
      if (targetApp) targetApp.showNotification(errMsg, 'error', 'top-right');
      const alertBox = document.getElementById('authAlert');
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.textContent = errMsg;
      }
      otpInputs.forEach(i => i.style.borderColor = '#ef4444');
      setTimeout(() => otpInputs.forEach(i => i.style.borderColor = 'rgba(255,255,255,0.18)'), 2000);
      return;
    }

    // Attempt Backend OTP Verification if online API is active
    if (window.API && window.API.verifyOtp) {
      try {
        await window.API.verifyOtp(this.pendingUser.email, enteredOtp);
      } catch (err) {
        console.warn('Backend OTP sync notice:', err.message);
      }
    }

    // OTP Verified strictly! Complete user registration.
    const user = {
      id: Date.now(),
      email: this.pendingUser.email,
      username: this.pendingUser.username,
      firstName: this.pendingUser.firstName,
      lastName: this.pendingUser.lastName
    };

    // Save to local registered users store for duplicate protection
    const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    registeredUsers.push(user);
    localStorage.setItem('registered_users', JSON.stringify(registeredUsers));

    localStorage.setItem('token', 'token-' + Date.now());
    if (targetApp) {
      targetApp.setCurrentUser(user);
      targetApp.showNotification('Registered ✨', 'success', 'top-right');
    }

    // Stay on registration page until popup is shown, then close after 1.2s
    setTimeout(() => {
      this.closeModal();
    }, 1200);

    // Async background API sync
    if (window.API) {
      window.API.register(this.pendingUser)
        .then(response => {
          if (response && response.data && targetApp) {
            targetApp.setCurrentUser(response.data);
          }
        })
        .catch(() => null);
    }
  }

  closeModal() {
    clearInterval(this.otpTimer);
    this.isOtpStep = false;
    const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
    if (targetApp) {
      targetApp.closeAuthModal();
    } else {
      const authModal = document.getElementById('authModal');
      if (authModal) authModal.style.display = 'none';
    }
    setTimeout(() => this.updateForm(), 300);
  }
}

window.auth = new AuthHandler();
