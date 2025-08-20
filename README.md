# Chat Z 🐆 - Decentralized Social Chat

A fully decentralized social messaging platform built on the Internet Computer, featuring Internet Identity authentication, real-time chat, channel management, and image sharing capabilities.

## Features

- 🔐 **Internet Identity Authentication** - Secure, passwordless login
- 💬 **Real-time Messaging** - Instant chat with automatic refresh
- 🏛️ **Channel Management** - Create and join different chat channels  
- 👥 **User Profiles** - Customizable usernames and bios
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔗 **Fully Decentralized** - No central servers, runs on Internet Computer
- 🎨 **Modern UI** - Beautiful, animated interface with Tailwind CSS

## Architecture

### Backend (Rust)
- **Canister**: `chat_z_backend` 
- **State Management**: IC stable structures for persistent storage
- **Features**:
  - User registration and management
  - Message storage and retrieval  
  - Channel creation and membership
  - Real-time message broadcasting
  - Attachment support for images

### Frontend (React + Vite)
- **Authentication**: Internet Identity integration via `@dfinity/auth-client`
- **State Management**: React Context providers for auth and chat state
- **UI Framework**: Tailwind CSS with custom animations
- **Icons**: Lucide React for consistent iconography
- **Routing**: React Router for SPA navigation

## Quick Start

### Prerequisites
- [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/) (latest version)
- Node.js 18+
- Rust (for backend development)

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/chat_z.git
cd chat_z

# Install frontend dependencies
cd src/frontend
npm install

# Return to project root
cd ../..
```

### 2. Start Local Replica
```bash
# Start the local Internet Computer replica
dfx start --clean --background
```

### 3. Deploy Backend
```bash
# Deploy the chat backend canister
dfx deploy chat_z_backend
```

### 4. Get Canister ID
```bash
# Get the canister ID for frontend configuration
dfx canister id chat_z_backend
```

### 5. Configure Frontend
Update the canister ID in `src/frontend/src/hooks/Auth.jsx`:
```javascript
const CHAT_CANISTER_ID = "YOUR_CANISTER_ID_HERE";
```

### 6. Build and Deploy Frontend
```bash
# Build frontend
cd src/frontend
npm run build

# Copy build to dist directory (if needed)
cd ../..

# Deploy frontend canister
dfx deploy chat_z_frontend
```

### 7. Access the Application
```bash
# Get frontend URL
dfx canister id chat_z_frontend
```

Visit `http://localhost:4943/?canisterId=<frontend_canister_id>` in your browser.

## Usage

### 1. Login
- Click "Login with Internet Identity" on the landing page
- Complete Internet Identity authentication
- You'll be redirected to the registration page

### 2. Register Profile  
- Enter your desired username
- Optionally add a bio
- Click "Join the Chat"

### 3. Start Chatting
- Browse available channels in the sidebar
- Click on a channel to join the conversation
- Type messages in the input field at the bottom
- Create new channels using the "+" button

### 4. Channel Management
- **Create Channel**: Click the "+" icon next to "Channels"
- **Join Channel**: Click on any channel in the sidebar
- **View Members**: See member count in channel header

## API Reference

### Backend Canister Methods

#### User Management
- `register_user(username: text, bio: opt text) -> Result<User, ChatError>`
- `update_user(request: UpdateUserRequest) -> Result<User, ChatError>`  
- `get_current_user() -> opt User` (query)
- `get_all_users() -> vec User` (query)

#### Channel Management
- `create_channel(request: CreateChannelRequest) -> Result<Channel, ChatError>`
- `get_all_channels() -> vec Channel` (query)
- `join_channel(channel_id: nat64) -> Result<null, ChatError>`

#### Messaging
- `send_message(request: CreateMessageRequest) -> Result<Message, ChatError>`
- `get_messages(channel_id: opt nat64, limit: opt nat64, offset: opt nat64) -> PaginatedMessages` (query)
- `get_stats() -> vec record { text; nat64 }` (query)

## Development

### Backend Development
```bash
# Check backend code
cargo check --manifest-path=src/chat_z_backend/Cargo.toml

# Run backend tests  
cargo test --manifest-path=src/chat_z_backend/Cargo.toml
```

### Frontend Development
```bash
cd src/frontend

# Start development server
npm run dev

# Build for production
npm run build
```

### Deploying to Mainnet
1. Acquire cycles for deployment
2. Update `dfx.json` networks configuration
3. Deploy with mainnet flag:
```bash
dfx deploy --network ic
```

## Project Structure

```
chat_z/
├── dfx.json                 # DFX configuration
├── Cargo.toml              # Workspace configuration
├── src/
│   ├── chat_z_backend/     # Rust backend canister
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs      # Main canister logic
│   │   │   └── state.rs    # State management
│   │   └── chat_z_backend.did  # Candid interface
│   └── frontend/           # React frontend
│       ├── package.json
│       ├── vite.config.js
│       ├── index.html
│       └── src/
│           ├── hooks/      # React Context providers
│           │   ├── Auth.jsx    # Authentication
│           │   └── Chat.jsx    # Chat state
│           ├── components/ # React components
│           │   ├── Landing.jsx
│           │   ├── UserRegistration.jsx
│           │   └── ChatInterface.jsx
│           ├── ic/         # IC integration
│           │   └── chat_z_backend/
│           │       ├── index.js    # Actor creation
│           │       └── index.did.js # Generated interface
│           └── App.jsx     # Main app component
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly 
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
- Open a GitHub issue
- Join our community chat (once deployed!)

---

Built with ❤️ on the Internet Computer

**Chat Z 🐆** - *The future of decentralized social messaging*
