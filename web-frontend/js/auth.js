// Authentication Handler

class AuthHandler {
  constructor() {
    this.isLogin = true;
    this.setupEventListeners();
  }

  setupEventListeners() {
    const authForm = document.getElementById('authForm');
    const toggleAuthLink = document.getElementById('toggleAuth');
    const modalClose = document.querySelector('.modal-close');

    authForm?.addEventListener('submit', (e) => this.handleSubmit(e));
    toggleAuthLink?.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleMode();
    });
    modalClose?.addEventListener('click', () => this.closeModal());

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
    const loginFields = document.getElementById('loginFields');
    const registerFields = document.getElementById('registerFields');
    const toggleText = document.getElementById('toggleAuth');
    const formTitle = document.querySelector('.auth-form h2');
    const submitBtn = document.querySelector('.auth-form button[type="submit"]');

    if (this.isLogin) {
      loginFields.style.display = 'block';
      registerFields.style.display = 'none';
      formTitle.textContent = 'Login';
      submitBtn.textContent = 'Login';
      toggleText.innerHTML = "Don't have an account? <a href='#'>Register</a>";
    } else {
      loginFields.style.display = 'none';
      registerFields.style.display = 'block';
      formTitle.textContent = 'Register';
      submitBtn.textContent = 'Register';
      toggleText.innerHTML = 'Already have an account? <a href="#">Login</a>';
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    try {
      if (this.isLogin) {
        await this.login();
      } else {
        await this.register();
      }
      this.closeModal();
    } catch (error) {
      console.error('Auth error:', error);
      app.showNotification('Authentication failed', 'error');
    }
  }

  async login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
      throw new Error('Please fill all fields');
    }

    const response = await API.login(email, password);
    app.setCurrentUser(response.data);
    app.showNotification('Logged in successfully');
  }

  async register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;

    if (!email || !password || !username) {
      throw new Error('Please fill all required fields');
    }

    const response = await API.register({
      email,
      password,
      username,
      firstName,
      lastName
    });
    app.setCurrentUser(response.data);
    app.showNotification('Registered successfully');
  }

  closeModal() {
    app.closeAuthModal();
  }
}

const auth = new AuthHandler();
