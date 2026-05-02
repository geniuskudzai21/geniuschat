// ======================== SUPABASE CONFIGURATION ========================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    console.error('VITE_SUPABASE_URL:', supabaseUrl);
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'MISSING');
}

// Initialize Supabase immediately when config loads
if (window.supabase && window.supabase.createClient) {
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    window.supabase = supabaseClient;
    console.log('✅ Supabase client initialized');
    console.log('URL:', supabaseUrl);
    console.log('Key set:', !!supabaseKey);
} else {
    console.error('❌ Supabase library not loaded');
    console.error('window.supabase:', window.supabase);
}

let currentChannel = null;
let currentUser = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    name: 'User' + Math.floor(Math.random() * 1000)
};
let channels = [];
let allMessages = {};

// Make variables globally accessible
window.currentUser = currentUser;
window.currentChannel = currentChannel;
window.channels = channels;
window.allMessages = allMessages;
