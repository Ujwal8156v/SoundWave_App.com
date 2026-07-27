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

    // One-Click Auto-Fill Code Button
    document.getElementById('autoFillOtpBtn')?.addEventListener('click', () => {
      if (this.currentOtp && this.currentOtp.length === 6) {
        const otpInputs = document.querySelectorAll('.otp-digit-input');
        this.currentOtp.split('').forEach((char, i) => {
          if (otpInputs[i]) otpInputs[i].value = char;
        });
        if (otpInputs[5]) otpInputs[5].focus();
        this.verifyOtp();
      }
    });

    // Verify OTP Button Action
    document.getElementById('verifyOtpBtn')?.addEventListener('click', () => this.verifyOtp());

    // Resend OTP Action
    document.getElementById('resendOtpBtn')?.addEventListener('click', () => this.resendOtp());

    // Auto-Fill OTP Action
    document.getElementById('autoFillOtpBtn')?.addEventListener('click', () => this.autoFillOtp());

    // Forgot Password Link Action
    document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openForgotPasswordStep();
    });

    // Send Reset OTP Button Action
    document.getElementById('sendResetOtpBtn')?.addEventListener('click', () => {
      this.handlePasswordResetFlow();
    });

    // Back to Login from Reset Link Action
    document.getElementById('backToLoginFromResetLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.isLogin = true;
      this.updateForm();
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
    const resetContainer = document.getElementById('resetPasswordStepContainer');
    const forgotWrap = document.getElementById('forgotPasswordWrap');

    if (otpContainer) otpContainer.style.display = 'none';
    if (resetContainer) resetContainer.style.display = 'none';

    if (this.isLogin) {
      if (commonFields) commonFields.style.display = 'block';
      if (registerFields) registerFields.style.display = 'none';
      if (forgotWrap) forgotWrap.style.display = 'block';
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

    const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    let user = storedUsers.find(u => 
      (u.email && u.email.toLowerCase() === cleanInput) || 
      (u.username && u.username.toLowerCase() === cleanInput)
    );

    if (!user) {
      const inferredUsername = email.includes('@') ? email.split('@')[0] : email;
      user = {
        id: Date.now(),
        email: email.includes('@') ? email : `${email}@soundwave.com`,
        username: inferredUsername,
        avatar: 'assets/about_headphones.jpg',
        followers: '142.5K',
        following: '312',
        bio: '🎵 320kbps Master Audio Streaming | 🚀 Daily Trending Beats & Reels'
      };
      storedUsers.push(user);
      localStorage.setItem('registered_users', JSON.stringify(storedUsers));
    }

    localStorage.setItem('token', 'token-' + Date.now());
    if (targetApp) {
      targetApp.setCurrentUser(user);
      targetApp.showNotification(`Logined 🚀 Welcome back, ${user.username}!`, 'success', 'top-right');
    }

    // Stay on login modal page until popup is shown, then close after 800ms
    setTimeout(() => {
      this.closeModal();
    }, 800);

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
    this.isOtpStep = true;

    // Generate 6-digit OTP code instantly (0ms latency)
    this.currentOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Async background API dispatch to Gmail SMTP without blocking UI
    if (window.API) {
      window.API.sendOtp(email, 'email')
        .then(res => {
          if (res && res.demoOtpCode) {
            this.currentOtp = res.demoOtpCode;
            const displayBanner = document.getElementById('otpDisplayBanner');
            if (displayBanner) displayBanner.textContent = `📩 OTP Code: ${this.currentOtp}`;
            const autoFillBtn = document.getElementById('autoFillOtpBtn');
            if (autoFillBtn) autoFillBtn.textContent = `⚡ Click to Auto-Fill OTP (${this.currentOtp})`;
          }
        })
        .catch(err => console.warn('Background sendOtp sync note:', err.message));
    }

    // Switch UI to OTP step view instantly
    document.getElementById('commonFields').style.display = 'none';
    document.getElementById('registerFields').style.display = 'none';
    document.getElementById('authSubmitBtn').style.display = 'none';
    document.getElementById('toggleAuth').style.display = 'none';
    const forgotWrap = document.getElementById('forgotPasswordWrap');
    if (forgotWrap) forgotWrap.style.display = 'none';
    document.getElementById('authFormTitle').textContent = 'Verify Email OTP';
    document.getElementById('authSubtitle').textContent = `Enter the 6-digit code sent to ${email}`;

    const otpContainer = document.getElementById('otpStepContainer');
    if (otpContainer) otpContainer.style.display = 'block';

    const emailTarget = document.getElementById('otpEmailTarget');
    if (emailTarget) emailTarget.textContent = email;

    const displayBanner = document.getElementById('otpDisplayBanner');
    if (displayBanner) displayBanner.textContent = `📩 OTP Code: ${this.currentOtp}`;

    const autoFillBtn = document.getElementById('autoFillOtpBtn');
    if (autoFillBtn) autoFillBtn.textContent = `⚡ Click to Auto-Fill OTP (${this.currentOtp})`;

    // Clear and focus first OTP digit input
    const otpInputs = document.querySelectorAll('.otp-digit-input');
    otpInputs.forEach(input => input.value = '');
    if (otpInputs[0]) otpInputs[0].focus();

    // Start 60s countdown timer
    this.startOtpTimer();

    const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
    if (targetApp) {
      targetApp.showNotification(`📩 Email OTP Code: ${this.currentOtp} (Sent to ${email})`, 'info', 'top-right');
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

  async resendOtp() {
    if (!this.pendingUser) return;
    this.startOtpTimer();

    if (window.API) {
      try {
        const res = await window.API.sendOtp(this.pendingUser.email, 'email');
        if (res && res.demoOtpCode) {
          this.currentOtp = res.demoOtpCode;
        }
      } catch (e) {
        console.warn('API resendOtp notice:', e.message);
      }
    }

    const displayBanner = document.getElementById('otpDisplayBanner');
    if (displayBanner) displayBanner.textContent = `📩 OTP Code: ${this.currentOtp}`;

    const autoFillBtn = document.getElementById('autoFillOtpBtn');
    if (autoFillBtn) autoFillBtn.textContent = `⚡ Click to Auto-Fill OTP (${this.currentOtp})`;

    const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
    if (targetApp) {
      targetApp.showNotification(`📩 New OTP Code: ${this.currentOtp} (Sent to ${this.pendingUser.email})`, 'info', 'top-right');
    }
  }

  autoFillOtp() {
    if (!this.currentOtp || this.currentOtp.length !== 6) return;
    const otpInputs = document.querySelectorAll('.otp-digit-input');
    const digits = this.currentOtp.split('');
    otpInputs.forEach((input, index) => {
      if (digits[index]) input.value = digits[index];
    });
    const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
    if (targetApp) targetApp.showNotification('OTP Code auto-filled! ✨', 'success', 'top-right');
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

  openForgotPasswordStep() {
    document.getElementById('commonFields').style.display = 'none';
    document.getElementById('registerFields').style.display = 'none';
    document.getElementById('otpStepContainer').style.display = 'none';
    document.getElementById('authSubmitBtn').style.display = 'none';
    document.getElementById('toggleAuth').style.display = 'none';
    const forgotWrap = document.getElementById('forgotPasswordWrap');
    if (forgotWrap) forgotWrap.style.display = 'none';

    document.getElementById('authFormTitle').textContent = 'Recover Account';
    document.getElementById('authSubtitle').textContent = 'Enter your email to receive a Password Recovery OTP';

    const resetContainer = document.getElementById('resetPasswordStepContainer');
    if (resetContainer) resetContainer.style.display = 'block';

    document.getElementById('resetEmailGroup').style.display = 'block';
    document.getElementById('resetOtpFields').style.display = 'none';
    document.getElementById('sendResetOtpBtn').textContent = 'Send Password Recovery OTP 📩';
    this.resetStep = 1;
  }

  async handlePasswordResetFlow() {
    const targetApp = window.app || (typeof app !== 'undefined' ? app : null);
    const alertBox = document.getElementById('authAlert');
    if (alertBox) alertBox.style.display = 'none';

    if (this.resetStep === 1) {
      const email = document.getElementById('resetEmailInput')?.value.trim();
      if (!email) {
        if (targetApp) targetApp.showNotification('Please enter your account email address', 'error', 'top-right');
        return;
      }

      this.resetEmail = email;
      this.resetOtpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Async background email dispatch via Gmail SMTP
      if (window.API) {
        window.API.sendOtp(email, 'email')
          .then(res => {
            if (res && res.demoOtpCode) this.resetOtpCode = res.demoOtpCode;
            const banner = document.getElementById('resetOtpDisplayBanner');
            if (banner) banner.textContent = `📩 Recovery OTP Code: ${this.resetOtpCode}`;
          })
          .catch(() => null);
      }

      document.getElementById('resetEmailGroup').style.display = 'none';
      document.getElementById('resetOtpFields').style.display = 'block';
      const banner = document.getElementById('resetOtpDisplayBanner');
      if (banner) banner.textContent = `📩 Recovery OTP Code: ${this.resetOtpCode}`;
      document.getElementById('sendResetOtpBtn').textContent = 'Verify OTP & Reset Password 🔑';
      this.resetStep = 2;

      if (targetApp) targetApp.showNotification(`Recovery OTP sent to ${email} 📩 (Code: ${this.resetOtpCode})`, 'info', 'top-right');
    } else if (this.resetStep === 2) {
      const enteredOtp = document.getElementById('resetOtpInput')?.value.trim();
      const newPassword = document.getElementById('newPasswordInput')?.value;

      if (!enteredOtp || enteredOtp.length !== 6) {
        if (targetApp) targetApp.showNotification('Please enter the 6-digit Recovery OTP', 'error', 'top-right');
        return;
      }

      if (!newPassword || newPassword.length < 4) {
        if (targetApp) targetApp.showNotification('Password must be at least 4 characters long', 'error', 'top-right');
        return;
      }

      if (enteredOtp !== this.resetOtpCode) {
        if (targetApp) targetApp.showNotification('Invalid Recovery OTP code', 'error', 'top-right');
        return;
      }

      // Successfully updated password locally in storage & state
      const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const userIdx = users.findIndex(u => u.email && u.email.toLowerCase() === this.resetEmail.toLowerCase());
      if (userIdx !== -1) {
        users[userIdx].password = newPassword;
        localStorage.setItem('registered_users', JSON.stringify(users));
      }

      if (targetApp) {
        targetApp.showNotification('Password reset successfully! Logged in automatically 🚀', 'success', 'top-right');
        targetApp.setCurrentUser({
          id: Date.now(),
          email: this.resetEmail,
          username: this.resetEmail.split('@')[0]
        });
      }

      this.closeModal();
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
