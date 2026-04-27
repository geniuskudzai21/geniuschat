// ======================== DOM ELEMENTS ========================
const loginBtn = document.getElementById('loginBtn');
const loginInput = document.getElementById('loginInput');
const passwordInput = document.getElementById('passwordInput');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const githubLoginBtn = document.getElementById('githubLoginBtn');

// ======================== LOGIN FUNCTIONS ========================
function handleLogin() {
    const email = loginInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    // Show loading state
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-3"></i>LOGGING IN...';
    loginBtn.disabled = true;
    
    // Simulate authentication (replace with real auth)
    setTimeout(() => {
        // Mock successful login
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify({
            email: email,
            name: email.split('@')[0],
            avatar: email.charAt(0).toUpperCase()
        }));
        
        // Redirect to chat app
        window.location.href = 'index.html';
    }, 1500);
}

function handleGoogleLogin() {
    // Show loading state
    googleLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-3"></i>CONNECTING...';
    googleLoginBtn.disabled = true;
    
    // Simulate Google OAuth (replace with real Google OAuth)
    setTimeout(() => {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify({
            email: 'user@gmail.com',
            name: 'Google User',
            avatar: 'G',
            provider: 'google'
        }));
        
        window.location.href = 'index.html';
    }, 2000);
}

function handleGitHubLogin() {
    // Show loading state
    githubLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-3"></i>CONNECTING...';
    githubLoginBtn.disabled = true;
    
    // Simulate GitHub OAuth (replace with real GitHub OAuth)
    setTimeout(() => {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify({
            email: 'user@github.com',
            name: 'GitHub User',
            avatar: 'G',
            provider: 'github'
        }));
        
        window.location.href = 'index.html';
    }, 2000);
}

// ======================== EVENT LISTENERS ========================
loginBtn.addEventListener('click', handleLogin);
googleLoginBtn.addEventListener('click', handleGoogleLogin);
githubLoginBtn.addEventListener('click', handleGitHubLogin);

// Enter key login
passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

loginInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

// Check if user is already logged in
window.addEventListener('load', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        window.location.href = 'index.html';
    }
});

// ======================== ANIMATIONS ========================
// Add subtle animations to inputs
loginInput.addEventListener('focus', () => {
    loginInput.parentElement.classList.add('ring-2', 'ring-blue/20');
});

loginInput.addEventListener('blur', () => {
    loginInput.parentElement.classList.remove('ring-2', 'ring-blue/20');
});

passwordInput.addEventListener('focus', () => {
    passwordInput.parentElement.classList.add('ring-2', 'ring-blue/20');
});

passwordInput.addEventListener('blur', () => {
    passwordInput.parentElement.classList.remove('ring-2', 'ring-blue/20');
});
