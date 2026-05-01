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
