// ======================== SUPABASE OPERATIONS ========================

// Initialize the application
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

// Show sign in prompt
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

// Load channels from Supabase
async function loadChannels() {
    try {
        const { data, error } = await supabase
            .from('channels')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        channels = data || [];
        
        // Ensure general channel exists
        if (!channels.find(c => c.id === 'general')) {
            await createGeneralChannel();
        }
    } catch (error) {
        console.error('Error loading channels:', error);
        throw error;
    }
}

// Create general channel
async function createGeneralChannel() {
    const { data, error } = await supabase
        .from('channels')
        .insert({
            id: 'general',
            name: 'General',
            is_private: false,
            created_by: null
        })
        .select()
        .single();
    
    if (error) throw error;
    channels.push(data);
}

// Load messages from Supabase
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

// Send message to Supabase
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

// Create new channel
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

// Delete channel
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

// Setup real-time subscriptions
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
