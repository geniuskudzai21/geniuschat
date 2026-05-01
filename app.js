// ======================== SUPABASE CONFIGURATION ========================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

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

