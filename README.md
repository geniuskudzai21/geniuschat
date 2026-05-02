# GENIUSCHAT - Supabase Integrated Chat Application

A modern, real-time chat application with a sleek dark theme interface, powered by Supabase for backend functionality.

## Features

- **Real-time Messaging**: Instant message delivery with Supabase real-time subscriptions
- **Channel Management**: Create public and private channels with invite codes
- **User Authentication**: Secure email/password authentication via Supabase Auth
- **Modern UI**: Beautiful dark theme with smooth animations and transitions
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Invite System**: Share invite codes to join private channels
  
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

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Icons**: Font Awesome
- **Backend**: Supabase (PostgreSQL + Real-time)
  
### Features
- Add authentication providers (Google, GitHub, etc.)
- Implement file/image sharing
- Add user roles and permissions
- Create channel categories
- Add message reactions and threading

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).
