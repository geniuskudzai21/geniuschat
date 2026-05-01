// ======================== SUPABASE CONFIGURATION ========================
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// ======================== APPLICATION STATE ========================
let currentChannel = { id: 'general', name: 'General' };
let messages = [];
let isTyping = false;
let typingTimeout = null;
let currentUser = null;
let channels = [];
let allMessages = {};

// ======================== DOM ELEMENTS ========================
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const channelNameSpan = document.getElementById('channelName');
const openSidebarBtn = document.getElementById('openSidebarBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const addChannelBtn = document.getElementById('addChannelBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const channelModal = document.getElementById('channelModal');
const inviteModal = document.getElementById('inviteModal');
const closeInviteBtn = document.getElementById('closeInviteBtn');
const cancelInviteBtn = document.getElementById('cancelInviteBtn');
const sendInviteBtn = document.getElementById('sendInviteBtn');
const inviteChannelName = document.getElementById('inviteChannelName');
const inviteCodeInput = document.getElementById('inviteCodeInput');
const inviteLinkInput = document.getElementById('inviteLinkInput');
const copyInviteBtn = document.getElementById('copyInviteBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const channelNameInput = document.getElementById('channelNameInput');
const createChannelBtn = document.getElementById('createChannelBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const charCounter = document.getElementById('charCounter');

// ======================== AUTHENTICATION ========================
async function signInWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        await initializeApp();
        showSuccess('Signed in successfully!');
        return data;
    } catch (error) {
        console.error('Sign in error:', error);
        showError(error.message || 'Failed to sign in');
        return null;
    }
}

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
            await initializeApp();
            showSuccess('Account created and signed in!');
        }
        return data;
    } catch (error) {
        console.error('Sign up error:', error);
        showError(error.message || 'Failed to sign up');
        return null;
    }
}

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

// Listen for auth changes
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

function resetProfileUI() {
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    if (profileAvatar) profileAvatar.textContent = 'GU';
    if (profileName) profileName.textContent = 'Guest User';
    if (profileEmail) profileEmail.textContent = 'guest@geniuschat.com';
}

// ======================== SUPABASE OPERATIONS ========================

async function initializeApp() {
    try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user;
        
        if (!currentUser) {
            showSignInPrompt();
            return;
        }
        
        await loadChannels();
        await loadMessages();
        setupRealtimeSubscriptions();
        renderChannels();
        renderMessages();
        updateCharCount();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application');
    }
}

function showSignInPrompt() {
    messagesContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center relative z-10">
            <div class="w-20 h-20 bg-gradient-to-br from-blue/20 to-blue/10 rounded-3xl flex items-center justify-center mb-8 border-2 border-blue/30 shadow-2xl shadow-blue/20 backdrop-blur">
                <i class="fas fa-sign-in-alt text-3xl text-blue"></i>
            </div>
            <h3 class="text-3xl font-bold text-white mb-4 tracking-wider">GENIUSCHAT TERMINAL</h3>
            <p class="text-silver-dark text-lg max-w-md font-medium leading-relaxed mb-8">Secure channel established. Authentication required for access...</p>
            <button onclick="showAuthModal()" class="px-6 py-3 bg-gradient-to-r from-blue to-blue-dark text-white rounded-2xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue/30 font-mono font-bold mb-4">
                SIGN IN / SIGN UP
            </button>
            <p class="text-silver-dark text-sm">Use email and password to authenticate</p>
        </div>
    `;
    
    // Clear channels list
    document.getElementById('channelsList').innerHTML = '';
}

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

function closeAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.add('hidden');
        authModal.style.display = 'none';
        document.getElementById('authEmail').value = '';
        document.getElementById('authPassword').value = '';
    }
}

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

async function createGeneralChannel() {
    const { data, error } = await supabase
        .from('channels')
        .insert({
            id: 'general',
            name: 'General',
            is_private: false,
            created_by: 'system'
        })
        .select()
        .single();
    
    if (error) throw error;
    channels.push(data);
}

async function loadMessages() {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        // Group messages by channel
        allMessages = {};
        (data || []).forEach(msg => {
            if (!allMessages[msg.channel_id]) {
                allMessages[msg.channel_id] = [];
            }
            allMessages[msg.channel_id].push({
                ...msg,
                sender: msg.username,
                timestamp: new Date(msg.created_at),
                isOwn: msg.user_id === currentUser?.id,
                avatar: msg.username?.charAt(0)?.toUpperCase() || 'U'
            });
        });
    } catch (error) {
        console.error('Error loading messages:', error);
        throw error;
    }
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser) {
        if (!currentUser) {
            showError('Please sign in to send messages');
        }
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                channel_id: currentChannel.id,
                user_id: currentUser.id,
                username: currentUser.email?.split('@')[0] || 'User',
                text: text,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Clear input
        messageInput.value = '';
        updateCharCount();
        stopTyping();
        
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Failed to send message');
    }
}

async function createChannel() {
    const name = channelNameInput.value.trim();
    if (!name || !currentUser) {
        if (!currentUser) {
            showError('Please sign in to create channels');
        }
        return;
    }
    
    try {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        const inviteCode = generateInviteCode();
        
        const { data, error } = await supabase
            .from('channels')
            .insert({
                id: id,
                name: name,
                is_private: true,
                invite_code: inviteCode,
                created_by: currentUser.id
            })
            .select()
            .single();
        
        if (error) {
            if (error.code === '23505') {
                showError('Channel already exists!');
            } else {
                throw error;
            }
            return;
        }
        
        channels.push(data);
        allMessages[id] = [];
        
        renderChannels();
        currentChannel = { id, name };
        channelNameSpan.textContent = `#${name}`;
        renderMessages();
        
        closeModal();
        showSuccess(`Channel "${name}" created successfully!\n\nYour invite code is: ${inviteCode}`);
        
    } catch (error) {
        console.error('Error creating channel:', error);
        showError('Failed to create channel');
    }
}

async function deleteChannel(channelId) {
    if (channelId === 'general') {
        showError('Cannot delete the general channel!');
        return;
    }
    
    const channel = channels.find(c => c.id === channelId);
    if (!channel || channel.created_by !== currentUser?.id) {
        showError('You can only delete channels you created');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete the channel "${channel.name}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('channels')
            .delete()
            .eq('id', channelId);
        
        if (error) throw error;
        
        // Remove from local state
        channels = channels.filter(c => c.id !== channelId);
        delete allMessages[channelId];
        
        if (currentChannel.id === channelId) {
            currentChannel = { id: 'general', name: 'General' };
            channelNameSpan.textContent = '#general';
        }
        
        renderChannels();
        renderMessages();
        
    } catch (error) {
        console.error('Error deleting channel:', error);
        showError('Failed to delete channel');
    }
}

function setupRealtimeSubscriptions() {
    // Subscribe to messages
    const messageSubscription = supabase
        .channel('messages')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload) => {
                const newMessage = {
                    ...payload.new,
                    sender: payload.new.username,
                    timestamp: new Date(payload.new.created_at),
                    isOwn: payload.new.user_id === currentUser?.id,
                    avatar: payload.new.username?.charAt(0)?.toUpperCase() || 'U'
                };
                
                if (!allMessages[newMessage.channel_id]) {
                    allMessages[newMessage.channel_id] = [];
                }
                allMessages[newMessage.channel_id].push(newMessage);
                
                if (newMessage.channel_id === currentChannel.id) {
                    renderMessages();
                }
            }
        )
        .subscribe();
    
    // Subscribe to channels
    const channelSubscription = supabase
        .channel('channels')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'channels' },
            (payload) => {
                if (payload.eventType === 'INSERT') {
                    channels.push(payload.new);
                } else if (payload.eventType === 'DELETE') {
                    channels = channels.filter(c => c.id !== payload.old.id);
                    delete allMessages[payload.old.id];
                    
                    if (currentChannel.id === payload.old.id) {
                        currentChannel = { id: 'general', name: 'General' };
                        channelNameSpan.textContent = '#general';
                    }
                }
                renderChannels();
                if (payload.eventType === 'DELETE') {
                    renderMessages();
                }
            }
        )
        .subscribe();
}

// ======================== HELPER FUNCTIONS ========================
function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function showError(message) {
    alert(`ERROR: ${message}`);
}

function showSuccess(message) {
    alert(`SUCCESS: ${message}`);
}

function renderMessages() {
    const channelMessages = allMessages[currentChannel.id] || [];
    if (channelMessages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center relative z-10">
                <div class="w-20 h-20 bg-gradient-to-br from-blue/20 to-blue/10 rounded-3xl flex items-center justify-center mb-8 border-2 border-blue/30 shadow-2xl shadow-blue/20 backdrop-blur">
                    <i class="fas fa-network-wired text-3xl text-blue"></i>
                </div>
                <h3 class="text-2xl font-bold text-white mb-4 tracking-wider">NO TRANSMISSIONS</h3>
                <p class="text-silver-dark text-lg font-medium leading-relaxed">Initiate first transmission...</p>
            </div>
        `;
        return;
    }
    
    messagesContainer.innerHTML = channelMessages.map((msg, index) => {
        if (msg.type === 'system') {
            return `
                <div class="flex justify-center scroll-fade-in" style="animation-delay: ${index * 0.1}s">
                    <div class="bg-gradient-to-r from-blue/10 to-blue/5 rounded-2xl px-6 py-3 border border-blue/20 backdrop-blur">
                        <span class="text-sm text-blue font-mono font-medium">${msg.text}</span>
                    </div>
                </div>
            `;
        }
        
        const isOwn = msg.sender === 'You' || msg.isOwn;
        return `
            <div class="flex items-start space-x-4 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''} relative z-10 scroll-fade-in" style="animation-delay: ${index * 0.1}s">
                ${!isOwn ? `
                    <div class="w-12 h-12 bg-gradient-to-br from-silver to-silver-dark rounded-2xl flex items-center justify-center text-darkgrey font-bold text-sm border-2 border-blue/20 flex-shrink-0 shadow-lg">
                        ${msg.avatar || msg.sender.charAt(0)}
                    </div>
                ` : ''}
                <div class="flex flex-col ${isOwn ? 'items-end' : ''} max-w-[70%]">
                    ${!isOwn ? `<span class="text-sm font-mono font-bold text-blue mb-2 ml-2">${msg.sender}</span>` : ''}
                    <div class="${isOwn ? 'bg-gradient-to-r from-blue to-blue-dark text-white rounded-2xl rounded-tr-none shadow-lg shadow-blue/20 border border-blue/30' : 'bg-gradient-to-br from-darkgrey-light to-darkgrey text-white rounded-2xl rounded-tl-none border-2 border-blue/20 backdrop-blur'} px-5 py-3">
                        <p class="text-sm break-words font-mono font-medium leading-relaxed">${escapeHtml(msg.text)}</p>
                    </div>
                    <span class="text-xs text-silver-dark mt-2 ml-2 font-mono">${formatTime(msg.timestamp)}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderChannels() {
    const channelsList = document.getElementById('channelsList');
    channelsList.innerHTML = channels.map(ch => `
        <div class="channel-wrapper flex items-center group">
            <button class="channel-item flex-1 text-left px-4 py-3 rounded-2xl transition-all ${currentChannel.id === ch.id ? 'bg-blue/20 text-blue font-bold border-2 border-blue/30 shadow-lg shadow-blue/20' : 'hover:bg-darkgrey-light/30 text-silver border-2 border-transparent hover:border-blue/20'}" data-channel-id="${ch.id}">
                <div class="flex items-center space-x-3">
                    <i class="fas ${ch.is_private ? 'fa-lock' : 'fa-hashtag'} ${currentChannel.id === ch.id ? 'text-blue' : 'text-silver-dark'} text-sm"></i>
                    <span class="font-mono text-sm font-medium">${escapeHtml(ch.name)}</span>
                    ${ch.is_private ? '<span class="text-xs text-blue ml-2">🔒</span>' : ''}
                </div>
            </button>
            ${ch.id !== 'general' && ch.created_by === currentUser?.id ? `
                <button class="invite-channel-btn p-2 text-silver-dark hover:text-blue opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110" data-channel-id="${ch.id}" title="Invite to channel">
                    <i class="fas fa-user-plus text-xs"></i>
                </button>
                <button class="delete-channel-btn p-2 text-silver-dark hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110" data-channel-id="${ch.id}" title="Delete channel">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            ` : ch.id !== 'general' ? `
                <button class="invite-channel-btn p-2 text-silver-dark hover:text-blue opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110" data-channel-id="${ch.id}" title="Invite to channel">
                    <i class="fas fa-user-plus text-xs"></i>
                </button>
            ` : ''}
        </div>
    `).join('');
    
    // Add event listeners to channel buttons
    document.querySelectorAll('.channel-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const channelId = btn.dataset.channelId;
            const channel = channels.find(c => c.id === channelId);
            if (channel) {
                currentChannel = channel;
                channelNameSpan.textContent = `#${channel.name}`;
                renderChannels();
                renderMessages();
                // Close sidebar on mobile after selection
                if (window.innerWidth < 768) {
                    body.classList.remove('sidebar-open');
                }
            }
        });
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-channel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const channelId = btn.dataset.channelId;
            deleteChannel(channelId);
        });
    });
    
    // Add event listeners to invite buttons
    document.querySelectorAll('.invite-channel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const channelId = btn.dataset.channelId;
            showInviteModal(channelId);
        });
    });
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function startTyping() {
    if (!isTyping) {
        isTyping = true;
        typingIndicator.classList.remove('hidden');
    }
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => stopTyping(), 1500);
}

function stopTyping() {
    isTyping = false;
    typingIndicator.classList.add('hidden');
    if (typingTimeout) clearTimeout(typingTimeout);
}

function updateCharCount() {
    const length = messageInput.value.length;
    charCounter.textContent = `${length}/500`;
    if (length >= 450) {
        charCounter.classList.add('text-blue');
    } else {
        charCounter.classList.remove('text-blue');
    }
}


function showInviteModal(channelId) {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;
    
    inviteChannelName.value = channel.name;
    inviteCodeInput.value = channel.invite_code || '';
    inviteLinkInput.value = `${window.location.origin}/invite/${channel.invite_code || ''}`;
    
    inviteModal.classList.remove('hidden');
    inviteModal.style.display = 'flex';
}

function closeInviteModal() {
    inviteModal.classList.add('hidden');
    inviteModal.style.display = 'none';
    inviteCodeInput.value = '';
}

function copyToClipboard(button, text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show success feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check text-green-400"></i>';
        setTimeout(() => {
            button.innerHTML = originalHTML;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}

function joinChannelByInvite() {
    const code = inviteCodeInput.value.trim().toUpperCase();
    const channel = channels.find(c => c.invite_code === code);
    
    if (channel) {
        // For now, just switch to the channel
        // In a real app, you'd want to add user to channel_members table
        currentChannel = { id: channel.id, name: channel.name };
        channelNameSpan.textContent = `#${channel.name}`;
        renderChannels();
        renderMessages();
        closeInviteModal();
        showSuccess(`Successfully joined ${channel.name}!`);
    } else {
        showError('Invalid invite code!');
    }
}


// ======================== EVENT LISTENERS ========================
sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('input', () => {
    updateCharCount();
    if (messageInput.value.trim()) {
        startTyping();
    } else {
        stopTyping();
    }
});

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

openSidebarBtn.addEventListener('click', () => {
    body.classList.add('sidebar-open');
});

closeSidebarBtn.addEventListener('click', () => {
    body.classList.remove('sidebar-open');
});

// Click outside sidebar on mobile to close
document.addEventListener('click', (e) => {
    if (window.innerWidth < 768 && body.classList.contains('sidebar-open')) {
        const sidebar = document.querySelector('.sidebar-mobile');
        if (sidebar && !sidebar.contains(e.target) && !openSidebarBtn.contains(e.target)) {
            body.classList.remove('sidebar-open');
        }
    }
});

// Theme Toggle
if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

themeToggle.addEventListener('click', () => {
    // Open settings modal instead of theme toggle
    settingsModal.classList.remove('hidden');
    settingsModal.style.display = 'flex';
});

// Settings modal handling
function openSettings() {
    settingsModal.classList.remove('hidden');
    settingsModal.style.display = 'flex';
}

function closeSettings() {
    settingsModal.classList.add('hidden');
    settingsModal.style.display = 'none';
}

closeSettingsBtn.addEventListener('click', closeSettings);
cancelSettingsBtn.addEventListener('click', closeSettings);
saveSettingsBtn.addEventListener('click', () => {
    // Here you would typically save the settings
    alert('Settings saved successfully!');
    closeSettings();
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
});

// Invite modal handling
closeInviteBtn.addEventListener('click', closeInviteModal);
cancelInviteBtn.addEventListener('click', closeInviteModal);
sendInviteBtn.addEventListener('click', joinChannelByInvite);
copyInviteBtn.addEventListener('click', (e) => {
    const code = inviteCodeInput.value;
    if (code) copyToClipboard(e.target, code);
});
copyLinkBtn.addEventListener('click', (e) => {
    const link = inviteLinkInput.value;
    if (link) copyToClipboard(e.target, link);
});
inviteModal.addEventListener('click', (e) => {
    if (e.target === inviteModal) closeInviteModal();
});

// Modal handling
addChannelBtn.addEventListener('click', () => {
    channelModal.classList.remove('hidden');
    channelModal.style.display = 'flex';
});

function closeModal() {
    channelModal.classList.add('hidden');
    channelModal.style.display = 'none';
    channelNameInput.value = '';
}

closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);
createChannelBtn.addEventListener('click', createChannel);
channelModal.addEventListener('click', (e) => {
    if (e.target === channelModal) closeModal();
});


// Initialize
initializeApp();

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

