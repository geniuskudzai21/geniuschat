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
    console.log('🎨 Rendering messages...');
    console.log('📱 Current channel:', window.currentChannel?.id);
    console.log('📨 All messages:', window.allMessages);
    
    const channelMessages = window.allMessages[window.currentChannel?.id] || [];
    console.log('💬 Channel messages count:', channelMessages.length);
    
    if (!messagesContainer) {
        console.error('❌ messagesContainer not found!');
        return;
    }
    
    if (channelMessages.length === 0) {
        console.log('📭 No messages, showing empty state');
        messagesContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center relative z-10">
                <div class="w-20 h-20 bg-gradient-to-br from-blue/20 to-blue/10 rounded-3xl flex items-center justify-center mb-8 border-2 border-blue/30 shadow-2xl shadow-blue/20 backdrop-blur">
                    <img src="logo.png" alt="GENIUSCHAT" class="w-14 h-14 mb-2">
                </div>
                <h3 class="text-2xl font-bold text-white mb-4 tracking-wider">NO TRANSMISSIONS</h3>
                <p class="text-silver-dark text-lg font-medium leading-relaxed">Initiate first transmission...</p>
            </div>
        `;
        return;
    }
    
    console.log('🎯 Rendering', channelMessages.length, 'messages');
    messagesContainer.innerHTML = channelMessages.map((msg, index) => {
        const isOwn = msg.isOwn;
        console.log(`💬 Message ${index}: isOwn=${isOwn}, text="${msg.text}"`);
        return `
            <div class="flex ${isOwn ? 'justify-end' : 'justify-start'} w-full relative z-10 scroll-fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]">
                    ${!isOwn ? `<span class="text-sm font-mono font-bold text-blue mb-1">${escapeHtml(msg.sender)}</span>` : ''}
                    <div class="${isOwn ? 'bg-gradient-to-r from-blue to-blue-dark text-white rounded-2xl rounded-tr-none shadow-lg shadow-blue/20 border border-blue/30' : 'bg-gradient-to-br from-darkgrey-light to-darkgrey text-white rounded-2xl rounded-tl-none border-2 border-blue/20 backdrop-blur'} px-4 py-2">
                        <p class="text-sm break-words font-mono font-medium leading-relaxed">${escapeHtml(msg.text)}</p>
                    </div>
                    <span class="text-xs text-silver-dark mt-1 ${isOwn ? 'text-right' : 'text-left'} font-mono">${formatTime(msg.timestamp)}</span>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('✅ Messages rendered, scrolling to bottom');
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
        <div class="flex items-center space-x-2 group">
            <button class="channel-item flex-1 text-left px-4 py-3 rounded-2xl transition-all ${currentChannel?.id === ch.id ? 'bg-blue/20 text-blue font-bold border-2 border-blue/30 shadow-lg shadow-blue/20' : 'hover:bg-darkgrey-light/30 text-silver border-2 border-transparent hover:border-blue/20'}" data-channel-id="${ch.id}">
                <div class="flex items-center space-x-3">
                    <span class="font-mono text-sm font-medium">${escapeHtml(ch.name)}</span>
                </div>
            </button>
            <button class="delete-channel-btn p-2 rounded-xl text-silver-dark hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100" data-channel-id="${ch.id}" data-channel-name="${escapeHtml(ch.name)}">
                <i class="fas fa-trash text-sm"></i>
            </button>
        </div>
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
    
    document.querySelectorAll('.delete-channel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const channelId = btn.dataset.channelId;
            const channelName = btn.dataset.channelName;
            deleteChannel(channelId, channelName);
        });
    });
}

async function deleteChannel(channelId, channelName) {
    if (!confirm(`Are you sure you want to delete channel "#${channelName}"? This will also delete all messages in this channel.`)) {
        return;
    }
    
    try {
        // Delete all messages in the channel first
        const { error: messagesError } = await supabase
            .from('messages')
            .delete()
            .eq('channel_id', channelId);
        
        if (messagesError) {
            console.error('Error deleting messages:', messagesError);
            throw messagesError;
        }
        
        // Delete the channel
        const { error: channelError } = await supabase
            .from('channels')
            .delete()
            .eq('id', channelId);
        
        if (channelError) {
            console.error('Error deleting channel:', channelError);
            throw channelError;
        }
        
        // Remove from local state
        channels = channels.filter(c => c.id !== channelId);
        delete window.allMessages[channelId];
        
        // If this was the current channel, switch to another or reset
        if (currentChannel?.id === channelId) {
            currentChannel = null;
            document.getElementById('channelName').textContent = 'no-channel';
            document.getElementById('inviteBtn').classList.add('hidden');
            messageInput.disabled = true;
            sendBtn.disabled = true;
            renderMessages();
            
            // If there are other channels, switch to the first one
            if (channels.length > 0) {
                await switchToChannel(channels[0].id);
            } else {
                openChannelModal();
            }
        }
        
        renderChannels();
        showSuccess(`Channel "#${channelName}" deleted successfully`);
        
    } catch (error) {
        console.error('Failed to delete channel:', error);
        showError('Failed to delete channel');
    }
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
