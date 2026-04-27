// ======================== APPLICATION STATE ========================
let currentChannel = { id: 'general', name: 'General' };
let messages = [];
let isTyping = false;
let typingTimeout = null;

// Mock data for demonstration (will be replaced with Supabase)
let channels = [
    { id: 'general', name: 'General' },
    { id: 'random', name: 'Random' },
    { id: 'tech', name: 'Tech Talk' }
];

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
const channelModal = document.getElementById('channelModal');
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
            <div class="flex flex-col items-center justify-center h-full text-center">
                <div class="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center mb-6 border border-slate-700">
                    <i class="fas fa-network-wired text-2xl text-accent-500"></i>
                </div>
                <h3 class="text-lg font-mono font-semibold text-slate-300">NO TRANSMISSIONS</h3>
                <p class="text-slate-500 mt-2 font-mono text-sm">Initiate first transmission...</p>
            </div>
        `;
        return;
    }
    
    messagesContainer.innerHTML = channelMessages.map(msg => {
        if (msg.type === 'system') {
            return `
                <div class="flex justify-center">
                    <div class="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
                        <span class="text-xs text-slate-400 font-mono">${msg.text}</span>
                    </div>
                </div>
            `;
        }
        
        const isOwn = msg.sender === 'You' || msg.isOwn;
        return `
            <div class="flex items-start space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}">
                ${!isOwn ? `
                    <div class="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-slate-300 font-mono text-xs border border-slate-600 flex-shrink-0">
                        ${msg.avatar || msg.sender.charAt(0)}
                    </div>
                ` : ''}
                <div class="flex flex-col ${isOwn ? 'items-end' : ''} max-w-[70%]">
                    ${!isOwn ? `<span class="text-xs font-mono font-semibold text-slate-400 mb-1 ml-1">${msg.sender}</span>` : ''}
                    <div class="${isOwn ? 'bg-accent-600 text-white rounded-lg rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-lg rounded-tl-none border border-slate-700'} px-4 py-2.5">
                        <p class="text-sm break-words font-mono">${escapeHtml(msg.text)}</p>
                    </div>
                    <span class="text-xs text-slate-600 mt-1 ml-1 font-mono">${formatTime(msg.timestamp)}</span>
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
            <button class="channel-item flex-1 text-left px-3 py-2.5 rounded-lg transition-all ${currentChannel.id === ch.id ? 'bg-accent-600/20 text-accent-400 font-medium border border-accent-600/30' : 'hover:bg-slate-800 text-slate-300 border border-transparent'}" data-channel-id="${ch.id}">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-hashtag ${currentChannel.id === ch.id ? 'text-accent-400' : 'text-slate-600'} text-sm"></i>
                    <span class="font-mono text-sm">${escapeHtml(ch.name)}</span>
                </div>
            </button>
            ${ch.id !== 'general' ? `
                <button class="delete-channel-btn p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200" data-channel-id="${ch.id}" title="Delete channel">
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
        charCounter.classList.add('text-accent-500');
    } else {
        charCounter.classList.remove('text-accent-500');
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

function createChannel() {
    const name = channelNameInput.value.trim();
    if (!name) return;
    
    const id = name.toLowerCase().replace(/\s+/g, '-');
    if (!channels.find(c => c.id === id)) {
        channels.push({ id, name });
        allMessages[id] = [];
        renderChannels();
        currentChannel = { id, name };
        channelNameSpan.textContent = `#${name}`;
        renderMessages();
        channelModal.classList.add('hidden');
        channelNameInput.value = '';
    } else {
        alert('Channel already exists!');
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
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
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
