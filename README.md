# Real-Time CV Submission Portal

A real-time CV submission system with live tracking capabilities, similar to Google Docs.

## Features

### Teacher Side
- Create sessions and generate unique student links
- Live monitoring of students typing in real-time
- Online/offline status indicators
- Progress tracking per student
- Activity log and statistics dashboard
- View complete CVs anytime

### Student Side
- Access via unique token-based URL
- Structured CV form (Profile, Experience, Education, Personal Details)
- Real-time auto-save (500ms debounce)
- Connection status indicator
- Submit button when completed

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. For development with auto-reload:
```bash
npm run dev
```

## Usage

1. **Teacher**: Open `http://localhost:3000/teacher-dashboard.html`
2. **Create a session** and generate student links
3. **Share links** with students
4. **Monitor progress** at `http://localhost:3000/teacher-monitor.html?session=SESSION_ID`

## Technical Stack

- **Backend**: Node.js + Express
- **Real-time**: Socket.io (WebSocket)
- **Storage**: JSON files
- **Frontend**: Vanilla JavaScript, HTML5, CSS3

## Security

- 32-character unique tokens per student
- Session-based access control
- Token validation on every connection
# ei-edu-system
