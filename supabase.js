// ======================== SUPABASE OPERATIONS ========================

function showError(message) {
    alert(`ERROR: ${message}`);
}

function showSuccess(message) {
    alert(`SUCCESS: ${message}`);
}

function openChannelModal() {
    const channelModal = document.getElementById('channelModal');
    if (channelModal) {
        channelModal.classList.remove('hidden');
        channelModal.style.display = 'flex';
        const channelNameInput = document.getElementById('channelNameInput');
        const inviteCodeInput = document.getElementById('inviteCodeInput');
        if (channelNameInput) channelNameInput.value = '';
        if (inviteCodeInput) inviteCodeInput.value = '';
        
        // Disable message input while modal is open
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        if (messageInput) messageInput.disabled = true;
        if (sendBtn) sendBtn.disabled = true;
    }
}

async function initializeApp() {
    try {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = window.currentUser.name || 'Guest User';
        }
        await loadChannels();
        setupRealtimeSubscriptions();
        if (!window.currentChannel) {
            openChannelModal();
        } else {
            await switchToChannel(window.currentChannel.id);
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application');
    }
}

async function loadChannels() {
    try {
        const { data, error } = await supabase
            .from('channels')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Database error:', error);
            throw error;
        }
        
        window.channels = data || [];
        console.log('Successfully loaded', window.channels.length, 'channels from database');
        renderChannels();
    } catch (error) {
        console.error('Failed to load channels:', error);
        showError('Failed to load channels from database');
        throw error;
    }
}

function useLocalStorageFallback() {
    console.log('Using local storage fallback');
    // Get channels from local storage or create default
    const storedChannels = localStorage.getItem('geniuschat_channels');
    window.channels = storedChannels ? JSON.parse(storedChannels) : [];
    
    if (window.channels.length === 0) {
        // Create a default channel
        const defaultChannel = {
            id: 'general',
            name: 'General',
            invite_code: 'GENERAL1',
            created_by: window.currentUser.id,
            created_at: new Date().toISOString()
        };
        window.channels.push(defaultChannel);
        localStorage.setItem('geniuschat_channels', JSON.stringify(window.channels));
    }
}

async function createChannelsTable() {
    // For now, just log that tables need to be created manually
    console.log('Database tables need to be created manually in Supabase dashboard');
    throw new Error('Please run the SQL schema in Supabase dashboard first');
}

async function createChannel(name) {
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const inviteCode = generateInviteCode();
    
    // Check if channel already exists
    if (window.channels.find(c => c.id === id)) {
        showError('Channel already exists!');
        return null;
    }
    
    try {
        const { data, error } = await supabase
            .from('channels')
            .insert({ 
                id: id, 
                name: name, 
                invite_code: inviteCode,
                created_by: window.currentUser.id 
            })
            .select()
            .single();
        
        if (error) {
            console.error('Database error creating channel:', error);
            throw error;
        }
        
        window.channels.push(data);
        renderChannels();
        console.log('Channel created successfully in database');
        return data;
    } catch (error) {
        console.error('Failed to create channel:', error);
        showError('Failed to create channel in database');
        throw error;
    }
}

async function joinChannelByCode(code) {
    try {
        const { data, error } = await supabase
            .from('channels')
            .select('*')
            .eq('invite_code', code.toUpperCase())
            .single();
        if (error || !data) {
            showError('Invalid invite code!');
            return null;
        }
        if (!window.channels.find(c => c.id === data.id)) {
            window.channels.push(data);
            renderChannels();
        }
        return data;
    } catch (error) {
        console.error('Error joining channel:', error);
        showError('Failed to join channel');
        return null;
    }
}

async function switchToChannel(channelId) {
    const channel = window.channels.find(c => c.id === channelId);
    if (!channel) return;
    window.currentChannel = channel;
    document.getElementById('channelName').textContent = '#' + channel.name;
    messageInput.disabled = false;
    sendBtn.disabled = false;
    document.getElementById('inviteBtn').classList.remove('hidden');
    await loadMessages(channelId);
    renderMessages();
    renderChannels();
}

async function loadMessages(channelId) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('channel_id', channelId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        window.allMessages[channelId] = (data || []).map(msg => ({
            ...msg,
            sender: msg.username,
            timestamp: new Date(msg.created_at),
            isOwn: msg.user_id === window.currentUser.id,
            avatar: (msg.username || '?').charAt(0).toUpperCase()
        }));
        updateNodeCount();
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !window.currentChannel) return;
    try {
        const { error } = await supabase
            .from('messages')
            .insert({
                channel_id: window.currentChannel.id,
                user_id: window.currentUser.id,
                username: window.currentUser.name,
                text: text,
                created_at: new Date().toISOString()
            });
        if (error) throw error;
        messageInput.value = '';
        updateCharCount();
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Failed to send message');
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

function setupRealtimeSubscriptions() {
    window.supabase
        .channel('messages')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload) => {
                const msg = payload.new;
                const newMessage = {
                    ...msg,
                    sender: msg.username,
                    timestamp: new Date(msg.created_at),
                    isOwn: msg.user_id === window.currentUser.id,
                    avatar: (msg.username || '?').charAt(0).toUpperCase()
                };
                if (!window.allMessages[msg.channel_id]) {
                    window.allMessages[msg.channel_id] = [];
                }
                window.allMessages[msg.channel_id].push(newMessage);
                if (msg.channel_id === window.currentChannel?.id) {
                    renderMessages();
                }
                updateNodeCount();
            }
        )
        .subscribe();
}

function renderChannels() {
    const channelsList = document.getElementById('channelsList');
    if (!channelsList) return;
    
    channelsList.innerHTML = window.channels.map(ch => `
        <div class="flex items-center space-x-2 group">
            <button class="channel-item flex-1 text-left px-4 py-3 rounded-2xl transition-all ${window.currentChannel?.id === ch.id ? 'bg-blue/20 text-blue font-bold border-2 border-blue/30 shadow-lg shadow-blue/20' : 'hover:bg-darkgrey-light/30 text-silver border-2 border-transparent hover:border-blue/20'}" data-channel-id="${ch.id}">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-hashtag ${window.currentChannel?.id === ch.id ? 'text-blue' : 'text-silver-dark'} text-sm"></i>
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
                document.body.classList.remove('sidebar-open');
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
        window.channels = window.channels.filter(c => c.id !== channelId);
        delete window.allMessages[channelId];
        
        // If this was the current channel, switch to another or reset
        if (window.currentChannel?.id === channelId) {
            window.currentChannel = null;
            document.getElementById('channelName').textContent = '#no-channel';
            document.getElementById('inviteBtn').classList.add('hidden');
            messageInput.disabled = true;
            sendBtn.disabled = true;
            renderMessages();
            
            // If there are other channels, switch to the first one
            if (window.channels.length > 0) {
                await switchToChannel(window.channels[0].id);
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

function updateNodeCount() {
    const count = window.allMessages[window.currentChannel?.id]?.length || 0;
    document.getElementById('nodeCount').textContent = count + ' TRANSMISSIONS';
}
