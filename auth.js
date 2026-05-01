// ======================== AUTHENTICATION ========================

// Sign in with email and password
async function signInWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        showSuccess('Signed in successfully!');
        return data;
    } catch (error) {
        console.error('Sign in error:', error);
        showError(error.message || 'Failed to sign in');
        return null;
    }
}

// Sign up with email and password
async function signUpWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        if (data.user && !data.session) {
            showSuccess('Account created! Please check your email to verify.');
        } else {
            currentUser = data.user;
            showSuccess('Account created and signed in!');
        }
        return data;
    } catch (error) {
        console.error('Sign up error:', error);
        showError(error.message || 'Failed to sign up');
        return null;
    }
}

// Sign out user
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        channels = [];
        allMessages = {};
        
        // Clear UI
        messagesContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center relative z-10">
                <div class="w-20 h-20 bg-gradient-to-br from-blue/20 to-blue/10 rounded-3xl flex items-center justify-center mb-8 border-2 border-blue/30 shadow-2xl shadow-blue/20 backdrop-blur">
                    <i class="fas fa-sign-in-alt text-3xl text-blue"></i>
                </div>
                <h3 class="text-2xl font-bold text-white mb-4 tracking-wider">SIGN IN REQUIRED</h3>
                <p class="text-silver-dark text-lg font-medium leading-relaxed mb-8">Please sign in to access GENIUSCHAT</p>
                <button onclick="showAuthModal()" class="px-6 py-3 bg-gradient-to-r from-blue to-blue-dark text-white rounded-2xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue/30 font-mono font-bold">
                    SIGN IN
                </button>
            </div>
        `;
        
        showSuccess('Signed out successfully!');
    } catch (error) {
        console.error('Sign out error:', error);
        showError('Failed to sign out');
    }
}

// Listen for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
        currentUser = session.user;
        updateProfileUI();
        await initializeApp();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        channels = [];
        allMessages = {};
        resetProfileUI();
    }
});

// Update profile UI with user information
function updateProfileUI() {
    if (!currentUser) return;
    
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    if (profileAvatar) {
        const email = currentUser.email || 'User';
        const initials = email.charAt(0).toUpperCase() + (email.split('@')[0].charAt(1) || '').toUpperCase();
        profileAvatar.textContent = initials;
    }
    
    if (profileName) {
        profileName.textContent = currentUser.email?.split('@')[0] || 'User';
    }
    
    if (profileEmail) {
        profileEmail.textContent = currentUser.email || 'No email';
    }
}

// Reset profile UI to guest state
function resetProfileUI() {
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    if (profileAvatar) profileAvatar.textContent = 'GU';
    if (profileName) profileName.textContent = 'Guest User';
    if (profileEmail) profileEmail.textContent = 'guest@geniuschat.com';
}

// Show authentication modal
function showAuthModal() {
    // Create auth modal if it doesn't exist
    if (!document.getElementById('authModal')) {
        const authModalHTML = `
            <div id="authModal" class="fixed inset-0 bg-black/90 backdrop-blur-2xl z-50 hidden items-center justify-center p-6">
                <div class="bg-gradient-to-b from-darkgrey-dark to-black border-2 border-blue/30 rounded-3xl max-w-md w-full p-8 shadow-2xl shadow-blue/20 backdrop-blur-xl relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-br from-blue/10 to-transparent opacity-50"></div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-center mb-8">
                            <h3 class="text-2xl font-bold text-white tracking-wider">AUTHENTICATE</h3>
                            <button onclick="closeAuthModal()" class="text-silver hover:text-blue transition-colors hover:scale-110">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-silver-dark mb-2">Email Address</label>
                            <input type="email" id="authEmail" placeholder="your@email.com" class="w-full px-4 py-3 bg-darkgrey-light/50 border-2 border-blue/30 rounded-xl text-white placeholder-silver-dark focus:ring-4 focus:ring-blue/20 focus:border-blue font-mono text-sm backdrop-blur">
                        </div>
                        
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-silver-dark mb-2">Password</label>
                            <input type="password" id="authPassword" placeholder="••••••••" class="w-full px-4 py-3 bg-darkgrey-light/50 border-2 border-blue/30 rounded-xl text-white placeholder-silver-dark focus:ring-4 focus:ring-blue/20 focus:border-blue font-mono text-sm backdrop-blur">
                        </div>
                        
                        <div class="flex justify-end space-x-4">
                            <button onclick="signIn()" class="px-6 py-3 bg-gradient-to-r from-blue to-blue-dark text-white rounded-2xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue/30 font-mono font-bold">
                                SIGN IN
                            </button>
                            <button onclick="signUp()" class="px-6 py-3 text-silver hover:text-white hover:bg-blue/10 rounded-2xl transition-all font-mono font-medium border border-silver/30 hover:border-blue/30">
                                SIGN UP
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', authModalHTML);
    }
    
    const authModal = document.getElementById('authModal');
    authModal.classList.remove('hidden');
    authModal.style.display = 'flex';
}

// Close authentication modal
function closeAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.add('hidden');
        authModal.style.display = 'none';
        document.getElementById('authEmail').value = '';
        document.getElementById('authPassword').value = '';
    }
}

// Handle sign in form submission
async function signIn() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    
    if (!email || !password) {
        showError('Please enter email and password');
        return;
    }
    
    await signInWithEmail(email, password);
    closeAuthModal();
}

// Handle sign up form submission
async function signUp() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    
    if (!email || !password) {
        showError('Please enter email and password');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    await signUpWithEmail(email, password);
    closeAuthModal();
}
