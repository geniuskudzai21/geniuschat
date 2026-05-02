// ======================== DOM ELEMENTS ========================
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const channelNameSpan = document.getElementById('channelName');
const openSidebarBtn = document.getElementById('openSidebarBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const body = document.body;
const addChannelBtn = document.getElementById('addChannelBtn');
const inviteBtn = document.getElementById('inviteBtn');
const channelModal = document.getElementById('channelModal');
const inviteModal = document.getElementById('inviteModal');
const channelNameInput = document.getElementById('channelNameInput');
const inviteCodeInput = document.getElementById('inviteCodeInput');
const createChannelBtn = document.getElementById('createChannelBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const closeInviteBtn = document.getElementById('closeInviteBtn');
const copyInviteBtn = document.getElementById('copyInviteBtn');
const charCounter = document.getElementById('charCounter');

// ======================== HELPER FUNCTIONS ========================
function showError(message) {
    alert(`ERROR: ${message}`);
}

function showSuccess(message) {
    alert(`SUCCESS: ${message}`);
}

function renderMessages() {
    const channelMessages = window.allMessages[window.currentChannel?.id] || [];
    
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
        const isOwn = msg.isOwn;
        return `
            <div class="flex items-start space-x-4 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''} relative z-10 scroll-fade-in" style="animation-delay: ${index * 0.1}s">
                ${!isOwn ? `
                    <div class="w-12 h-12 bg-gradient-to-br from-silver to-silver-dark rounded-2xl flex items-center justify-center text-darkgrey font-bold text-sm border-2 border-blue/20 flex-shrink-0 shadow-lg">
                        ${msg.avatar}
                    </div>
                ` : ''}
                <div class="flex flex-col ${isOwn ? 'items-end' : ''} max-w-[70%]">
                    ${!isOwn ? `<span class="text-sm font-mono font-bold text-blue mb-2 ml-2">${escapeHtml(msg.sender)}</span>` : ''}
                    <div class="${isOwn ? 'bg-gradient-to-r from-blue to-blue-dark text-white rounded-2xl rounded-tr-none shadow-lg shadow-blue/20 border border-blue/30' : 'bg-gradient-to-br from-darkgrey-light to-darkgrey text-white rounded-2xl rounded-tl-none border-2 border-blue/20 backdrop-blur'} px-5 py-3">
                        <p class="text-sm break-words font-mono font-medium leading-relaxed">${escapeHtml(msg.text)}</p>
                    </div>
                    <span class="text-xs text-silver-dark mt-2 ml-2 font-mono">${formatTime(msg.timestamp)}</span>
                </div>
            </div>
        `;
    }).join('');
    
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
        <button class="channel-item w-full text-left px-4 py-3 rounded-2xl transition-all ${currentChannel?.id === ch.id ? 'bg-blue/20 text-blue font-bold border-2 border-blue/30 shadow-lg shadow-blue/20' : 'hover:bg-darkgrey-light/30 text-silver border-2 border-transparent hover:border-blue/20'}" data-channel-id="${ch.id}">
            <div class="flex items-center space-x-3">
                <i class="fas fa-hashtag ${currentChannel?.id === ch.id ? 'text-blue' : 'text-silver-dark'} text-sm"></i>
                <span class="font-mono text-sm font-medium">${escapeHtml(ch.name)}</span>
            </div>
        </button>
    `).join('');
    
    document.querySelectorAll('.channel-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const channelId = btn.dataset.channelId;
            switchToChannel(channelId);
            if (window.innerWidth < 768) {
                body.classList.remove('sidebar-open');
            }
        });
    });
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateCharCount() {
    const length = messageInput.value.length;
    charCounter.textContent = `${length}/500`;
    charCounter.classList.toggle('text-blue', length >= 450);
}

function openChannelModal() {
    channelModal.classList.remove('hidden');
    channelModal.style.display = 'flex';
    channelNameInput.value = '';
    inviteCodeInput.value = '';
    messageInput.disabled = true;
    sendBtn.disabled = true;
}

function closeChannelModal() {
    channelModal.classList.add('hidden');
    channelModal.style.display = 'none';
}

function showInviteModal() {
    if (!currentChannel) return;
    document.getElementById('inviteCodeDisplay').textContent = currentChannel.invite_code;
    inviteModal.classList.remove('hidden');
    inviteModal.style.display = 'flex';
}

function closeInviteModal() {
    inviteModal.classList.add('hidden');
    inviteModal.style.display = 'none';
}

// ======================== EVENT LISTENERS ========================
sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('input', () => {
    updateCharCount();
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

document.addEventListener('click', (e) => {
    if (window.innerWidth < 768 && body.classList.contains('sidebar-open')) {
        const sidebar = document.querySelector('.sidebar-mobile');
        if (sidebar && !sidebar.contains(e.target) && !openSidebarBtn.contains(e.target)) {
            body.classList.remove('sidebar-open');
        }
    }
});

addChannelBtn.addEventListener('click', openChannelModal);
inviteBtn.addEventListener('click', showInviteModal);

closeModalBtn.addEventListener('click', closeChannelModal);
cancelModalBtn.addEventListener('click', closeChannelModal);
channelModal.addEventListener('click', (e) => {
    if (e.target === channelModal) closeChannelModal();
});

closeInviteBtn.addEventListener('click', closeInviteModal);
inviteModal.addEventListener('click', (e) => {
    if (e.target === inviteModal) closeInviteModal();
});

copyInviteBtn.addEventListener('click', () => {
    const code = document.getElementById('inviteCodeDisplay').textContent;
    navigator.clipboard.writeText(code).then(() => {
        copyInviteBtn.innerHTML = '<i class="fas fa-check mr-2"></i>COPIED!';
        setTimeout(() => {
            copyInviteBtn.innerHTML = '<i class="fas fa-copy mr-2"></i>COPY CODE';
        }, 2000);
    });
});

createChannelBtn.addEventListener('click', async () => {
    const name = channelNameInput.value.trim();
    const inviteCode = inviteCodeInput.value.trim().toUpperCase();
    
    if (inviteCode) {
        // Join existing channel
        const channel = await joinChannelByCode(inviteCode);
        if (channel) {
            closeChannelModal();
            await switchToChannel(channel.id);
            showSuccess(`Joined ${channel.name}!`);
        }
    } else if (name) {
        // Create new channel
        const channel = await createChannel(name);
        if (channel) {
            closeChannelModal();
            await switchToChannel(channel.id);
            showInviteModal();
        }
    } else {
        showError('Please enter a channel name or invite code');
    }
});
