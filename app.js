// ======================== SELECTION STATE ========================
let isSelectionMode = false;
let selectedMessages = new Set();

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
const usernameInput = document.getElementById('usernameInput');
const channelNameInput = document.getElementById('channelNameInput');
const inviteCodeInput = document.getElementById('inviteCodeInput');
const createChannelBtn = document.getElementById('createChannelBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const closeInviteBtn = document.getElementById('closeInviteBtn');
const copyInviteBtn = document.getElementById('copyInviteBtn');
const charCounter = document.getElementById('charCounter');
const menuBtn = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');
const searchMessagesBtn = document.getElementById('searchMessagesBtn');
const deleteMessagesBtn = document.getElementById('deleteMessagesBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const searchModal = document.getElementById('searchModal');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchResults = document.getElementById('searchResults');

// ======================== HELPER FUNCTIONS ========================
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
        const isSelected = selectedMessages.has(msg.id);
        console.log(`💬 Message ${index}: isOwn=${isOwn}, text="${msg.text}"`);
        
        return `
            <div class="flex ${isOwn ? 'justify-end' : 'justify-start'} w-full relative z-10 scroll-fade-in group ${isSelectionMode ? 'selection-mode' : ''} ${isSelected ? 'selected' : ''}" style="animation-delay: ${index * 0.1}s" data-message-id="${msg.id}">
                <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%] relative">
                    ${isSelectionMode ? `
                        <div class="absolute ${isOwn ? '-left-8' : '-right-8'} top-2 z-20">
                            <input type="checkbox" 
                                   class="message-checkbox w-4 h-4 rounded border-2 border-blue/40 bg-bg-tertiary text-blue focus:ring-blue focus:ring-2 cursor-pointer transition-all hover:border-blue/60" 
                                   data-message-id="${msg.id}"
                                   ${isSelected ? 'checked' : ''}>
                        </div>
                    ` : ''}
                    <div class="${isOwn ? 'bg-gradient-to-r from-blue to-blue-dark text-white rounded-2xl rounded-tr-none shadow-lg shadow-blue/20 border border-blue/30' : 'bg-gradient-to-br from-darkgrey-light to-darkgrey text-white rounded-2xl rounded-tl-none border-2 border-blue/20 backdrop-blur'} px-4 py-2 ${isSelectionMode && isSelected ? 'ring-2 ring-blue ring-opacity-60' : ''} transition-all">
                        <p class="text-sm break-words font-mono font-medium leading-relaxed">${escapeHtml(msg.text)}</p>
                    </div>
                    <span class="text-xs text-silver-dark mt-1 ${isOwn ? 'text-right' : 'text-left'} font-mono">${formatTime(msg.timestamp)}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to checkboxes
    if (isSelectionMode) {
        document.querySelectorAll('.message-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const messageId = e.target.dataset.messageId;
                if (e.target.checked) {
                    selectedMessages.add(messageId);
                } else {
                    selectedMessages.delete(messageId);
                }
                updateDeleteButton();
                // Update visual feedback
                const messageElement = e.target.closest('[data-message-id]');
                if (messageElement) {
                    messageElement.classList.toggle('selected', e.target.checked);
                }
            });
        });
    }
    
    console.log('✅ Messages rendered, scrolling to bottom');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateCharCount() {
    const length = messageInput.value.length;
    charCounter.textContent = `${length}/500`;
    charCounter.classList.toggle('text-blue', length >= 450);
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

function toggleMenuDropdown() {
    menuDropdown.classList.toggle('hidden');
}

function closeMenuDropdown() {
    menuDropdown.classList.add('hidden');
}

function openSearchModal() {
    searchModal.classList.remove('hidden');
    searchModal.style.display = 'flex';
    searchInput.value = '';
    searchResults.innerHTML = `
        <div class="text-center text-silver-dark py-8">
            <i class="fas fa-search text-4xl mb-3 opacity-50"></i>
            <p>Enter a search term to find messages</p>
        </div>
    `;
    clearSearchBtn.classList.add('hidden');
    searchInput.focus();
}

function closeSearchModal() {
    searchModal.classList.add('hidden');
    searchModal.style.display = 'none';
    closeMenuDropdown();
}

function searchMessages(query) {
    if (!query.trim()) {
        searchResults.innerHTML = `
            <div class="text-center text-silver-dark py-8">
                <i class="fas fa-search text-4xl mb-3 opacity-50"></i>
                <p>Enter a search term to find messages</p>
            </div>
        `;
        clearSearchBtn.classList.add('hidden');
        return;
    }

    const channelMessages = window.allMessages[window.currentChannel?.id] || [];
    const searchQuery = query.toLowerCase().trim();
    
    const filteredMessages = channelMessages.filter(msg => 
        msg.text.toLowerCase().includes(searchQuery)
    );

    if (filteredMessages.length === 0) {
        searchResults.innerHTML = `
            <div class="text-center text-silver-dark py-8">
                <i class="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                <p>No messages found for "${escapeHtml(query)}"</p>
            </div>
        `;
    } else {
        searchResults.innerHTML = filteredMessages.map(msg => `
            <div class="p-3 bg-bg-elevated border border-blue/20 rounded-lg hover:bg-blue/5 transition-all cursor-pointer" onclick="scrollToMessage('${msg.id}')">
                <div class="flex items-start space-x-3">
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs text-silver-dark font-mono">${formatTime(msg.timestamp)}</span>
                        </div>
                        <p class="text-sm text-white break-words font-mono">${highlightSearchTerm(escapeHtml(msg.text), searchQuery)}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    clearSearchBtn.classList.remove('hidden');
}

function highlightSearchTerm(text, term) {
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<span class="bg-yellow-500/30 text-yellow-300 font-bold">$1</span>');
}

function scrollToMessage(messageId) {
    closeSearchModal();
    // Find and scroll to the message by matching the message text and sender
    const channelMessages = window.allMessages[window.currentChannel?.id] || [];
    const targetMessage = channelMessages.find(msg => msg.id === messageId);
    
    if (targetMessage) {
        const messageElements = document.querySelectorAll('.scroll-fade-in');
        messageElements.forEach(element => {
            const messageText = element.querySelector('p')?.textContent;
            const senderElement = element.querySelector('.text-blue');
            const senderText = senderElement?.textContent;
            
            if (messageText === targetMessage.text && senderText === targetMessage.sender) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-blue', 'ring-opacity-50');
                setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-blue', 'ring-opacity-50');
                }, 2000);
            }
        });
    }
}

async function deleteAllMessages() {
    if (!currentChannel) {
        showError('No channel selected');
        return;
    }

    if (!confirm(`Are you sure you want to delete all messages in "#${currentChannel.name}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('channel_id', currentChannel.id);

        if (error) {
            console.error('Error deleting messages:', error);
            throw error;
        }

        // Clear local messages
        window.allMessages[currentChannel.id] = [];
        selectedMessages.clear();
        renderMessages();
        closeMenuDropdown();
        showSuccess('All messages deleted successfully');

    } catch (error) {
        console.error('Failed to delete messages:', error);
        showError('Failed to delete messages');
    }
}

function toggleSelectionMode() {
    isSelectionMode = !isSelectionMode;
    if (!isSelectionMode) {
        selectedMessages.clear();
    }
    renderMessages();
    updateSelectionUI();
}

function updateSelectionUI() {
    const deleteBtn = document.getElementById('deleteMessagesBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    
    if (isSelectionMode) {
        // Add professional selection bar below header
        const messagesContainer = document.getElementById('messagesContainer');
        const existingControls = document.getElementById('selectionControls');
        
        if (!existingControls) {
            const selectionControls = document.createElement('div');
            selectionControls.id = 'selectionControls';
            selectionControls.className = 'sticky top-0 left-0 right-0 bg-bg-secondary border-b border-blue/20 backdrop-blur-xl z-40 px-4 py-2 shadow-lg shadow-blue/10';
            selectionControls.innerHTML = `
                <div class="max-w-7xl mx-auto flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-blue rounded-full animate-pulse"></div>
                            <span class="text-xs text-blue font-mono">SELECTING</span>
                        </div>
                        <span class="text-xs text-silver font-mono">
                            <span id="selectedCount" class="text-blue font-bold">0</span>
                        </span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button id="selectAllBtn" class="w-8 h-8 text-sm bg-blue/10 text-blue hover:bg-blue/20 border border-blue/30 rounded-lg transition-all font-mono flex items-center justify-center">
                            <i class="fas fa-check-square text-xs"></i>
                        </button>
                        <button id="cancelSelectionBtn" class="w-8 h-8 text-sm bg-silver/10 text-silver hover:bg-silver/20 border border-silver/30 rounded-lg transition-all font-mono flex items-center justify-center">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                        <button id="deleteSelectedBtn" class="w-8 h-8 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all font-mono flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            <i class="fas fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // Insert at the beginning of the messages container
            messagesContainer.insertBefore(selectionControls, messagesContainer.firstChild);
            
            // Add event listeners
            document.getElementById('selectAllBtn').addEventListener('click', selectAllMessages);
            document.getElementById('cancelSelectionBtn').addEventListener('click', toggleSelectionMode);
            document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedMessages);
        }
        
        updateDeleteButton();
    } else {
        // Remove selection controls
        const selectionControls = document.getElementById('selectionControls');
        if (selectionControls) {
            selectionControls.remove();
        }
    }
    
    closeMenuDropdown();
}

function selectAllMessages() {
    const channelMessages = window.allMessages[window.currentChannel?.id] || [];
    selectedMessages.clear();
    channelMessages.forEach(msg => selectedMessages.add(msg.id));
    renderMessages();
    updateDeleteButton();
}

function updateDeleteButton() {
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const selectedCount = document.getElementById('selectedCount');
    
    if (deleteBtn && selectedCount) {
        selectedCount.textContent = selectedMessages.size;
        deleteBtn.disabled = selectedMessages.size === 0;
    }
}

async function deleteSelectedMessages() {
    if (selectedMessages.size === 0) {
        showError('No messages selected');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedMessages.size} selected message(s)? This action cannot be undone.`)) {
        return;
    }
    
    try {
        // Delete from database
        const { error } = await supabase
            .from('messages')
            .delete()
            .in('id', Array.from(selectedMessages));
        
        if (error) {
            console.error('Error deleting selected messages:', error);
            throw error;
        }
        
        // Update local messages
        const channelMessages = window.allMessages[window.currentChannel?.id] || [];
        window.allMessages[window.currentChannel?.id] = channelMessages.filter(msg => !selectedMessages.has(msg.id));
        
        selectedMessages.clear();
        isSelectionMode = false;
        renderMessages();
        updateSelectionUI();
        showSuccess('Selected messages deleted successfully');
        
    } catch (error) {
        console.error('Failed to delete selected messages:', error);
        showError('Failed to delete selected messages');
    }
}

async function clearChat() {
    if (!currentChannel) {
        showError('No channel selected');
        return;
    }

    if (!confirm(`Are you sure you want to clear the chat in "#${currentChannel.name}"? This will permanently delete all messages in this channel.`)) {
        return;
    }

    try {
        // Delete all messages from database
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('channel_id', currentChannel.id);

        if (error) {
            console.error('Error clearing chat:', error);
            throw error;
        }

        // Clear local messages
        window.allMessages[currentChannel.id] = [];
        selectedMessages.clear();
        renderMessages();
        closeMenuDropdown();
        showSuccess('Chat cleared successfully');

    } catch (error) {
        console.error('Failed to clear chat:', error);
        showError('Failed to clear chat');
    }
}

// ======================== EVENT LISTENERS ========================
// Event listeners are now handled in supabase.js to avoid duplicates

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
    const username = usernameInput.value.trim();
    const name = channelNameInput.value.trim();
    const inviteCode = inviteCodeInput.value.trim().toUpperCase();
    
    // Validate username
    if (!username || username.length < 2) {
        showError('Please enter a username (at least 2 characters)');
        return;
    }
    
    // Preserve existing user ID if available, only update name
    if (window.currentUser && window.currentUser.id) {
        window.currentUser.name = username;
    } else {
        window.currentUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: username
        };
    }
    
    // Save user to localStorage for persistence across reloads
    localStorage.setItem('geniuschat_user', JSON.stringify(window.currentUser));
    
    // Update UI with username
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = username;
    }
    
    try {
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
    } catch (error) {
        console.error('Error creating/joining channel:', error);
    }
});

// Menu dropdown event listeners
menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenuDropdown();
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
        closeMenuDropdown();
    }
});


// Menu dropdown event delegation
menuDropdown.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    e.stopPropagation();
    switch(button.id) {
        case 'searchMessagesBtn':
            openSearchModal();
            break;
        case 'deleteMessagesBtn':
            toggleSelectionMode();
            break;
        case 'clearChatBtn':
            clearChat();
            break;
    }
});

// Search modal event listeners
closeSearchBtn.addEventListener('click', closeSearchModal);

searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) closeSearchModal();
});

searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    searchMessages(query);
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchMessages('');
    searchInput.focus();
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeSearchModal();
    }
});
