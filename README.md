# BingeMates

A real-time video watching and chatting platform built with React, Node.js, Socket.IO, YouTube API, and Jitsi Meet.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Contributing](#contributing)


## Features

- Real-time video synchronization with YouTube
- Live chat functionality
- Video conferencing with Jitsi Meet
- User authentication (register, login) 
- Google OAuth integration
- Responsive design

## Technologies Used

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, Socket.IO
- APIs: YouTube Data API, Jitsi Meet API
- Authentication: JWT, Google OAuth ,Brevo (Sendinblue)
- Deployment: Vercel (frontend), Render (backend)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/bingemates.git
   cd bingemates
   ```
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
### Environment Variables
Create .env files in both backend/ and frontend/ directories with the following content:

Backend .env
```bash
# SMTP Configuration for sending OTP verification
SMTP_HOST=your_smtp_host_from_brevo
SMTP_PORT=your_smtp_port_from_brevo
SMTP_USER=your_smtp_user_from_brevo
SMTP_PASS=your_smtp_password_from_brevo

# Server Configuration
PORT=5001

# MongoDB Configuration
MONGO_URI=your_mongo_url

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Frontend Origin for CORS
CLIENT_ORIGIN=http://localhost:5173
SESSION_SECRET=bingemates_secret
```
Frontend .env
```bash
# Jitsi Meet Configuration
VITE_VPASS_APP_ID=your_jitsi_app_id

# Backend API Base URL
VITE_API_BASE_URL=http://localhost:5001
```

## Running the Application
1. Start the backend server:
```bash
cd backend
npm start
```
2. Start the frontend development server:
```bash
cd frontend
npm run dev
```
3. Open your browser and navigate to http://localhost:5173

## Contributing
Contributions are welcome! 


