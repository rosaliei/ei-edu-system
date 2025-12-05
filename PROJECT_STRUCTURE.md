# 📁 Project Structure

```
ei-edu/
├── 📄 package.json                 # Node.js dependencies and scripts
├── 📄 server.js                    # Express + Socket.io backend server
├── 📄 README.md                    # Project overview and installation
├── 📄 USAGE_GUIDE.md              # Comprehensive usage instructions
├── 📄 start.sh                     # Quick start script (./start.sh)
├── 📄 .gitignore                   # Git ignore rules
│
├── 📁 public/                      # Frontend files (served statically)
│   ├── 📄 teacher-dashboard.html  # Teacher dashboard for creating sessions
│   ├── 📄 teacher-monitor.html    # Live monitoring interface
│   ├── 📄 student.html            # Student CV submission form
│   └── 📄 styles.css              # All CSS styling (purple theme)
│
├── 📁 data/                        # JSON data storage (auto-created)
│   ├── 📄 sessions.json           # Session and student data
│   └── 📄 submissions.json        # CV submissions
│
└── 📁 node_modules/                # NPM dependencies (auto-generated)
```

## 🗂️ File Descriptions

### Backend

**server.js** (Node.js + Express + Socket.io)
- Express web server setup
- Socket.io WebSocket configuration
- REST API endpoints for sessions and submissions
- Real-time event handling
- Data persistence to JSON files
- Progress calculation algorithm

### Frontend

**teacher-dashboard.html**
- Session creation interface
- Session list with statistics
- Student link generation
- Modal for displaying links
- Auto-refresh every 10 seconds

**teacher-monitor.html**
- Three-panel live monitoring interface
- Student list with online/offline status
- Real-time CV preview
- Activity log with event tracking
- WebSocket connection for live updates
- Progress tracking visualization

**student.html**
- Token-based access validation
- Structured CV form (Profile, Experience, Education, Personal Details)
- Dynamic form sections (add/remove experience/education)
- Real-time auto-save (500ms debounce)
- Connection status indicator
- Submit functionality with confirmation

**styles.css**
- Purple gradient theme
- Responsive design for mobile/tablet/desktop
- Component styling (buttons, cards, forms, modals)
- Status indicators (online/offline/submitted)
- Progress bars and badges
- Activity log styling
- Professional and modern UI

### Data Storage

**data/sessions.json**
```json
[
  {
    "sessionId": "32-char-token",
    "sessionName": "Session Name",
    "createdAt": "ISO-timestamp",
    "students": [
      {
        "token": "32-char-token",
        "studentNumber": 1,
        "name": "Student Name",
        "submitted": false,
        "online": false,
        "lastActivity": "ISO-timestamp",
        "progress": 75
      }
    ],
    "activityLog": [
      {
        "timestamp": "ISO-timestamp",
        "event": "Event Type",
        "details": "Event description"
      }
    ]
  }
]
```

**data/submissions.json**
```json
[
  {
    "token": "32-char-token",
    "cvData": {
      "profile": { ... },
      "experience": [ ... ],
      "education": [ ... ],
      "personalDetails": { ... }
    },
    "submittedAt": "ISO-timestamp",
    "lastUpdated": "ISO-timestamp"
  }
]
```

## 🔌 API Endpoints

### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/:sessionId` - Get specific session

### Student Access
- `GET /api/validate/:token` - Validate student token
- `GET /api/submission/:token` - Get student submission
- `POST /api/submission/:token` - Save final submission

### CV Data
- `GET /api/cv/:token` - Get student CV (for teacher view)

## 🔄 WebSocket Events

### Client → Server
- `teacherJoin` - Teacher joins session monitoring
- `studentJoin` - Student connects with token
- `cvUpdate` - Real-time CV field update
- `disconnect` - Connection closed

### Server → Client
- `sessionUpdate` - Full session data update
- `studentOnline` - Student came online
- `studentOffline` - Student went offline
- `liveUpdate` - Real-time CV change notification
- `studentSubmitted` - Student completed submission
- `invalidToken` - Token validation failed
- `existingData` - Load saved CV data

## 🎨 UI Components

### Buttons
- Primary (purple gradient)
- Secondary (gray)
- Small size
- Large size
- Remove (red)

### Status Indicators
- Online (green dot)
- Offline (gray dot)
- Connection status text

### Cards
- Session cards
- Student list items
- CV preview sections
- Activity log entries

### Forms
- Grid layout (responsive)
- Dynamic entries (add/remove)
- Auto-save functionality
- Validation styling

### Modals
- Student links modal
- Fullscreen overlay
- Scrollable content

### Progress Tracking
- Progress bars
- Percentage display
- Color-coded status

## 📊 Data Flow

```
1. Teacher creates session
   ↓
2. Server generates tokens and creates session
   ↓
3. Teacher shares student links
   ↓
4. Student opens link → validates token
   ↓
5. Student connects via WebSocket
   ↓
6. Server notifies teacher (student online)
   ↓
7. Student types in form
   ↓
8. Form debounces input (500ms)
   ↓
9. Client sends cvUpdate via WebSocket
   ↓
10. Server saves to JSON + broadcasts to teacher
    ↓
11. Teacher sees live updates
    ↓
12. Student clicks Submit
    ↓
13. Server saves final submission
    ↓
14. Teacher sees submitted badge
```

## 🔧 Configuration

### Server Port
Change in `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

Or use environment variable:
```bash
PORT=3001 npm start
```

### Auto-save Delay
Change in `student.html`:
```javascript
saveTimeout = setTimeout(() => {
  // ...
}, 500); // Change this value (milliseconds)
```

### Data Directory
Change in `server.js`:
```javascript
const DATA_DIR = path.join(__dirname, 'data');
```

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1200px
- **Desktop**: > 1200px

## 🎯 Key Features Implementation

### Real-Time Sync
- Socket.io WebSocket connection
- 500ms debounce on input
- Event-driven architecture
- Automatic reconnection

### Progress Tracking
- Algorithm counts filled vs total fields
- Updates on every change
- Displayed as percentage
- Visual progress bar

### Connection Status
- Socket connect/disconnect events
- Visual indicators (colors)
- Status text updates
- Online/offline tracking

### Activity Log
- Server-side event recording
- Timestamped entries
- Color-coded by type
- Scrollable history

### Dynamic Forms
- Add/remove experience entries
- Add/remove education entries
- Unique IDs for each entry
- Event listener binding

## 🚀 Performance Optimizations

- Debounced auto-save (reduces server load)
- Efficient WebSocket broadcasting
- JSON file-based storage (fast read/write)
- Minimal DOM manipulation
- CSS animations (GPU accelerated)

## 🔒 Security Considerations

- 32-character random tokens
- Token validation on every request
- No token reuse across students
- Session-based access control
- Input sanitization needed (add if storing to database)

---

**Total Files**: 11 files (excluding node_modules)
**Total Lines of Code**: ~2,500 lines
**Technologies**: Node.js, Express, Socket.io, Vanilla JavaScript, HTML5, CSS3
