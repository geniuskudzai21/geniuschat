// ======================== APPLICATION STATE ========================
let currentChannel = { id: 'general', name: 'General' };
let messages = [];
let isTyping = false;
let typingTimeout = null;

// Mock data for demonstration (will be replaced with Supabase)
let channels = [
    { id: 'general', name: 'General', isPrivate: false, members: ['You', 'Alice', 'Bob'] },
    { id: 'random', name: 'Random', isPrivate: true, members: ['You', 'Charlie'], inviteCode: 'RAND123' },
    { id: 'tech', name: 'Tech Talk', isPrivate: true, members: ['You', 'Diana'], inviteCode: 'TECH456' }
];

// Store invite codes for channels
let inviteCodes = {
    'random': 'RAND123',
    'tech': 'TECH456'
};

let allMessages = {
    general: [
        { id: '1', text: 'Welcome to #general! 👋', sender: 'system', timestamp: new Date(Date.now() - 3600000), type: 'system' },
        { id: '2', text: 'Hey everyone! This is a demo chat.', sender: 'Alice', timestamp: new Date(Date.now() - 1800000), avatar: 'A' },
        { id: '3', text: 'Beautiful UI! Love the animations 🎨', sender: 'Bob', timestamp: new Date(Date.now() - 900000), avatar: 'B' },
    ],
    random: [
        { id: '1', text: 'What\'s everyone up to?', sender: 'Charlie', timestamp: new Date(Date.now() - 7200000), avatar: 'C' },
        { id: '2', text: 'Just building this awesome chat app!', sender: 'You', timestamp: new Date(Date.now() - 3600000), avatar: 'Y', isOwn: true },
    ],
    tech: [
        { id: '1', text: 'Has anyone tried the new React 19?', sender: 'Diana', timestamp: new Date(Date.now() - 86400000), avatar: 'D' },
        { id: '2', text: 'I\'m learning Tailwind CSS, it\'s amazing!', sender: 'Eve', timestamp: new Date(Date.now() - 43200000), avatar: 'E' },
    ]
};

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
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                    <i class="fas ${ch.isPrivate ? 'fa-lock' : 'fa-hashtag'} ${currentChannel.id === ch.id ? 'text-blue' : 'text-silver-dark'} text-sm"></i>
                    <span class="font-mono text-sm font-medium">${escapeHtml(ch.name)}</span>
                    ${ch.isPrivate ? '<span class="text-xs text-blue ml-2">🔒</span>' : ''}
                    ${ch.members ? `<span class="text-xs text-silver-dark ml-2">(${ch.members.length})</span>` : ''}
                </div>
            </button>
            ${ch.id !== 'general' ? `
                <button class="invite-channel-btn p-2 text-silver-dark hover:text-blue opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110" data-channel-id="${ch.id}" title="Invite to channel">
                    <i class="fas fa-user-plus text-xs"></i>
                </button>
                <button class="delete-channel-btn p-2 text-silver-dark hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110" data-channel-id="${ch.id}" title="Delete channel">
                    <i class="fas fa-trash text-xs"></i>
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

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    const newMessage = {
        id: Date.now().toString(),
        text: text,
        sender: 'You',
        timestamp: new Date(),
        isOwn: true,
        avatar: 'Y'
    };
    
    if (!allMessages[currentChannel.id]) {
        allMessages[currentChannel.id] = [];
    }
    allMessages[currentChannel.id].push(newMessage);
    renderMessages();
    messageInput.value = '';
    updateCharCount();
    stopTyping();
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

function deleteChannel(channelId) {
    if (channelId === 'general') {
        alert('Cannot delete the general channel!');
        return;
    }
    
    if (confirm(`Are you sure you want to delete the channel "${channels.find(c => c.id === channelId)?.name}"? This action cannot be undone.`)) {
        // Remove channel from channels array
        channels = channels.filter(c => c.id !== channelId);
        
        // Remove messages for this channel
        delete allMessages[channelId];
        
        // If deleted channel was current, switch to general
        if (currentChannel.id === channelId) {
            currentChannel = { id: 'general', name: 'General' };
            channelNameSpan.textContent = '#general';
        }
        
        // Re-render channels and messages
        renderChannels();
        renderMessages();
    }
}

function showInviteModal(channelId) {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;
    
    inviteChannelName.value = channel.name;
    inviteCodeInput.value = channel.inviteCode || '';
    inviteLinkInput.value = `${window.location.origin}/invite/${channel.inviteCode || ''}`;
    
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
    const channelId = Object.keys(inviteCodes).find(id => inviteCodes[id] === code);
    
    if (channelId) {
        const channel = channels.find(c => c.id === channelId);
        if (channel && !channel.members.includes('You')) {
            channel.members.push('You');
            currentChannel = { id: channelId, name: channel.name };
            channelNameSpan.textContent = `#${channel.name}`;
            renderChannels();
            renderMessages();
            closeInviteModal();
            alert(`Successfully joined ${channel.name}!`);
        } else if (channel) {
            alert('You are already a member of this channel!');
        }
    } else {
        alert('Invalid invite code!');
    }
}

function createChannel() {
    const name = channelNameInput.value.trim();
    if (!name) return;
    
    const id = name.toLowerCase().replace(/\s+/g, '-');
    if (!channels.find(c => c.id === id)) {
        // Generate invite code
        const inviteCode = generateInviteCode();
        
        // Create private channel with invite code
        const newChannel = { 
            id, 
            name, 
            isPrivate: true, 
            members: ['You'], 
            inviteCode: inviteCode 
        };
        
        channels.push(newChannel);
        allMessages[id] = [];
        inviteCodes[id] = inviteCode;
        
        renderChannels();
        currentChannel = { id, name };
        channelNameSpan.textContent = `#${name}`;
        renderMessages();
        
        // Show invite code to user
        channelModal.classList.add('hidden');
        channelModal.style.display = 'none';
        channelNameInput.value = '';
        
        // Show success message with invite code
        setTimeout(() => {
            alert(`Channel "${name}" created successfully!\n\nYour invite code is: ${inviteCode}\n\nShare this code with others to let them join your private channel.`);
        }, 100);
    } else {
        alert('Channel already exists!');
    }
}

function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
renderChannels();
renderMessages();
updateCharCount();

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Simulate incoming messages for demo
setInterval(() => {
    if (Math.random() > 0.7 && currentChannel.id === 'general') {
        const demoMessages = [
            'Connection established successfully 🌐',
            'System diagnostics running... ✅',
            'Neural link activated 🧠',
            'Firewall status: secure 🔒'
        ];
        const randomMsg = demoMessages[Math.floor(Math.random() * demoMessages.length)];
        const newMsg = {
            id: Date.now().toString(),
            text: randomMsg,
            sender: 'System',
            timestamp: new Date(),
            avatar: 'S'
        };
        if (!allMessages[currentChannel.id]) allMessages[currentChannel.id] = [];
        allMessages[currentChannel.id].push(newMsg);
        renderMessages();
    }
}, 15000);
