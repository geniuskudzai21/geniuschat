# GENIUSCHAT - Supabase Integrated Chat Application

A modern, real-time chat application with a sleek dark theme interface, powered by Supabase for backend functionality.

## Features

- **Real-time Messaging**: Instant message delivery with Supabase real-time subscriptions
- **Channel Management**: Create public and private channels with invite codes
- **User Authentication**: Secure email/password authentication via Supabase Auth
- **Modern UI**: Beautiful dark theme with smooth animations and transitions
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Invite System**: Share invite codes to join private channels

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new account
2. Create a new project
3. Wait for the project to be ready (usually 1-2 minutes)

### 2. Set Up Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql`
3. Paste and run the SQL script to create all necessary tables and policies

### 3. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Project Settings** > **API**
2. Copy the **Project URL** and **anon public key**
3. Update the configuration in `app.js`:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key
```

### 4. Configure Authentication

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Ensure **Enable email confirmations** is set to your preference
3. Add your site URL to **Site URL** and **Redirect URLs** (for local development, use `http://localhost:3000` or similar)

### 5. Run the Application

1. Open `index.html` in your web browser
2. Or serve it with a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

## Database Schema

The application uses three main tables:

### Channels
- `id` (text, primary key): Channel identifier
- `name` (text): Channel display name
- `is_private` (boolean): Whether channel is private
- `invite_code` (text, unique): Invite code for private channels
- `created_by` (text, references auth.users): Creator's user ID
- `created_at` (timestamp): Creation time
- `updated_at` (timestamp): Last update time

### Messages
- `id` (uuid, primary key): Message ID
- `channel_id` (text, references channels): Channel ID
- `user_id` (text, references auth.users): Sender's user ID
- `username` (text): Sender's display name
- `text` (text): Message content
- `created_at` (timestamp): Message time
- `updated_at` (timestamp): Last update time

### Channel Members
- `id` (uuid, primary key): Membership ID
- `channel_id` (text, references channels): Channel ID
- `user_id` (text, references auth.users): User ID
- `joined_at` (timestamp): When user joined

## Security Features

- **Row Level Security (RLS)**: All tables have RLS policies enabled
- **Channel Access Control**: Users can only access channels they're members of
- **Message Permissions**: Users can only send messages to channels they have access to
- **Private Channels**: Invite codes required for private channel access

## Usage

1. **Sign Up/Sign In**: Create an account or sign in with email and password
2. **Join Channels**: Access the general channel automatically or join private channels with invite codes
3. **Create Channels**: Create private channels with custom invite codes
4. **Send Messages**: Real-time messaging with typing indicators
5. **Manage Channels**: Delete channels you created (except the general channel)

## File Structure

```
geniuschat/
├── index.html              # Main HTML file with UI
├── app.js                  # JavaScript application logic
├── styles.css              # Custom CSS styles
├── supabase-schema.sql     # Database schema and policies
└── README.md              # This file
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Icons**: Font Awesome
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth

## Customization

### Colors
The app uses a custom color palette defined in `index.html`. You can modify these in the Tailwind config:

```javascript
colors: {
    'blue': 'rgb(59, 130, 246)',
    'silver': '#e5e7eb',
    'darkgrey': '#374151',
    // ... other colors
}
```

### Features
- Add more authentication providers (Google, GitHub, etc.)
- Implement file/image sharing
- Add user roles and permissions
- Create channel categories
- Add message reactions and threading

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your site URL is properly configured in Supabase Authentication settings
2. **Permission Denied**: Check that RLS policies are correctly set up in your database
3. **Real-time Not Working**: Verify that Realtime is enabled for your tables in the Supabase dashboard
4. **Authentication Issues**: Check email confirmation settings and redirect URLs

### Debug Mode

Enable console logging by adding this to `app.js`:

```javascript
// Add at the top of the file
window.DEBUG = true;
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).
