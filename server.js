const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Data directory setup
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// File paths
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

// Initialize data files
const initDataFiles = () => {
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2));
  }
};

initDataFiles();

// Helper functions
const readSessions = () => {
  const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
  return JSON.parse(data);
};

const writeSessions = (sessions) => {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
};

const readSubmissions = () => {
  const data = fs.readFileSync(SUBMISSIONS_FILE, 'utf8');
  return JSON.parse(data);
};

const writeSubmissions = (submissions) => {
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
};

const generateToken = () => {
  return crypto.randomBytes(16).toString('hex'); // 32 characters
};

// Store active connections
const activeConnections = new Map(); // token -> socket.id
const socketToToken = new Map(); // socket.id -> token

// API Routes

// Create a new session
app.post('/api/sessions', (req, res) => {
  const { sessionName, studentCount } = req.body;
  
  const sessionId = generateToken();
  const students = [];
  
  for (let i = 0; i < studentCount; i++) {
    const token = generateToken();
    students.push({
      token,
      studentNumber: i + 1,
      name: null,
      submitted: false,
      online: false,
      lastActivity: null,
      progress: 0
    });
  }
  
  const session = {
    sessionId,
    sessionName,
    createdAt: new Date().toISOString(),
    students,
    activityLog: [{
      timestamp: new Date().toISOString(),
      event: 'Session created',
      details: `Created with ${studentCount} student slots`
    }]
  };
  
  const sessions = readSessions();
  sessions.push(session);
  writeSessions(sessions);
  
  res.json({ success: true, session });
});

// Get all sessions
app.get('/api/sessions', (req, res) => {
  const sessions = readSessions();
  res.json(sessions);
});

// Get a specific session
app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const sessions = readSessions();
  const session = sessions.find(s => s.sessionId === sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json(session);
});

// Update student token
app.put('/api/sessions/:sessionId/student/:oldToken', (req, res) => {
  const { sessionId, oldToken } = req.params;
  const { newToken } = req.body;
  
  const sessions = readSessions();
  const session = sessions.find(s => s.sessionId === sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const student = session.students.find(s => s.token === oldToken);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  // Check if new token already exists
  const tokenExists = sessions.some(s => 
    s.students.some(st => st.token === newToken)
  );
  
  if (tokenExists && newToken !== oldToken) {
    return res.status(400).json({ error: 'Token already exists' });
  }
  
  // Update token
  student.token = newToken;
  writeSessions(sessions);
  
  res.json({ success: true, student });
});

// Validate student token
app.get('/api/validate/:token', (req, res) => {
  const { token } = req.params;
  const sessions = readSessions();
  
  for (const session of sessions) {
    const student = session.students.find(s => s.token === token);
    if (student) {
      return res.json({ 
        valid: true, 
        sessionId: session.sessionId,
        studentNumber: student.studentNumber,
        submitted: student.submitted || false,
        tokenName: token
      });
    }
  }
  
  res.status(404).json({ valid: false, error: 'Invalid token' });
});

// Get student submission
app.get('/api/submission/:token', (req, res) => {
  const { token } = req.params;
  const submissions = readSubmissions();
  const submission = submissions.find(s => s.token === token);
  
  if (!submission) {
    return res.json({ exists: false, data: null });
  }
  
  res.json({ exists: true, data: submission.cvData });
});

// Save student submission (final submit)
app.post('/api/submission/:token', (req, res) => {
  const { token } = req.params;
  const { cvData } = req.body;
  
  const sessions = readSessions();
  let sessionFound = false;
  let sessionId = null;
  
  for (const session of sessions) {
    const student = session.students.find(s => s.token === token);
    if (student) {
      student.submitted = true;
      student.lastActivity = new Date().toISOString();
      
      // Store CV view link
      const baseUrl = req.protocol + '://' + req.get('host');
      student.cvViewLink = `${baseUrl}/cv-view.html?token=${token}`;
      student.submittedAt = new Date().toISOString();
      
      sessionId = session.sessionId;
      sessionFound = true;
      
      session.activityLog.push({
        timestamp: new Date().toISOString(),
        event: 'Submission completed',
        details: `Student ${student.studentNumber} (${cvData.header?.fullName || cvData.profile?.name || 'Unknown'}) submitted their CV`
      });
      
      break;
    }
  }
  
  if (!sessionFound) {
    return res.status(404).json({ error: 'Invalid token' });
  }
  
  writeSessions(sessions);
  
  const submissions = readSubmissions();
  const existingIndex = submissions.findIndex(s => s.token === token);
  
  const submissionData = {
    token,
    cvData,
    submittedAt: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    submissions[existingIndex] = submissionData;
  } else {
    submissions.push(submissionData);
  }
  
  writeSubmissions(submissions);
  
  // Notify teacher dashboard with CV view link
  const baseUrl = req.protocol + '://' + req.get('host');
  const cvViewLink = `${baseUrl}/cv-view.html?token=${token}`;
  
  io.to(`session-${sessionId}`).emit('studentSubmitted', { 
    token,
    cvViewLink,
    submittedAt: new Date().toISOString()
  });
  
  // Notify peer reviewers
  io.to(`peer-${token}`).emit('studentSubmitted', { token });
  
  res.json({ success: true, cvViewLink });
});

// Get student CV data (for teacher view)
app.get('/api/cv/:token', (req, res) => {
  const { token } = req.params;
  const submissions = readSubmissions();
  const submission = submissions.find(s => s.token === token);
  
  if (!submission) {
    return res.status(404).json({ error: 'CV not found' });
  }
  
  res.json(submission);
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);
  
  // Teacher joins session room
  socket.on('teacherJoin', (sessionId) => {
    socket.join(`session-${sessionId}`);
    console.log(`Teacher joined session: ${sessionId}`);
    
    // Send current status
    const sessions = readSessions();
    const session = sessions.find(s => s.sessionId === sessionId);
    if (session) {
      socket.emit('sessionUpdate', session);
    }
  });
  
  // Peer review joins with token
  socket.on('peerJoin', (token) => {
    socket.join(`peer-${token}`);
    console.log(`Peer reviewer joined for token: ${token}`);
  });
  
  // Student joins with token
  socket.on('studentJoin', (token) => {
    const sessions = readSessions();
    let studentFound = false;
    let sessionId = null;
    
    for (const session of sessions) {
      const student = session.students.find(s => s.token === token);
      if (student) {
        student.online = true;
        student.lastActivity = new Date().toISOString();
        studentFound = true;
        sessionId = session.sessionId;
        
        activeConnections.set(token, socket.id);
        socketToToken.set(socket.id, token);
        
        session.activityLog.push({
          timestamp: new Date().toISOString(),
          event: 'Student connected',
          details: `Student ${student.studentNumber} came online`
        });
        
        writeSessions(sessions);
        
        // Notify teacher
        io.to(`session-${sessionId}`).emit('studentOnline', { 
          token, 
          studentNumber: student.studentNumber 
        });
        io.to(`session-${sessionId}`).emit('sessionUpdate', session);
        
        // Send existing data to student
        const submissions = readSubmissions();
        const submission = submissions.find(s => s.token === token);
        if (submission) {
          socket.emit('existingData', submission.cvData);
        }
        
        break;
      }
    }
    
    if (!studentFound) {
      socket.emit('invalidToken');
    }
  });
  
  // Real-time CV updates
  socket.on('cvUpdate', ({ token, cvData, field }) => {
    const sessions = readSessions();
    let sessionId = null;
    let studentNumber = null;
    
    for (const session of sessions) {
      const student = session.students.find(s => s.token === token);
      if (student) {
        student.lastActivity = new Date().toISOString();
        sessionId = session.sessionId;
        studentNumber = student.studentNumber;
        
        // Calculate progress
        const progress = calculateProgress(cvData);
        student.progress = progress;
        
        writeSessions(sessions);
        break;
      }
    }
    
    // Save to submissions (auto-save)
    const submissions = readSubmissions();
    const existingIndex = submissions.findIndex(s => s.token === token);
    
    const submissionData = {
      token,
      cvData,
      lastUpdated: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      submissions[existingIndex] = submissionData;
    } else {
      submissions.push(submissionData);
    }
    
    writeSubmissions(submissions);
    
    // Broadcast to teacher
    if (sessionId) {
      io.to(`session-${sessionId}`).emit('liveUpdate', { 
        token, 
        cvData, 
        field,
        studentNumber,
        timestamp: new Date().toISOString()
      });
    }
    
    // Broadcast to peer reviewers
    io.to(`peer-${token}`).emit('liveUpdate', { 
      token, 
      cvData
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    
    const token = socketToToken.get(socket.id);
    if (token) {
      const sessions = readSessions();
      
      for (const session of sessions) {
        const student = session.students.find(s => s.token === token);
        if (student) {
          student.online = false;
          student.lastActivity = new Date().toISOString();
          
          session.activityLog.push({
            timestamp: new Date().toISOString(),
            event: 'Student disconnected',
            details: `Student ${student.studentNumber} went offline`
          });
          
          writeSessions(sessions);
          
          // Notify teacher
          io.to(`session-${session.sessionId}`).emit('studentOffline', { 
            token, 
            studentNumber: student.studentNumber 
          });
          io.to(`session-${session.sessionId}`).emit('sessionUpdate', session);
          
          break;
        }
      }
      
      activeConnections.delete(token);
      socketToToken.delete(socket.id);
    }
  });
});

// Calculate CV completion progress
const calculateProgress = (cvData) => {
  if (!cvData) return 0;
  
  let totalFields = 0;
  let filledFields = 0;
  
  // Header section (5 fields)
  if (cvData.header) {
    totalFields += 5;
    if (cvData.header.fullName) filledFields++;
    if (cvData.header.address) filledFields++;
    if (cvData.header.city) filledFields++;
    if (cvData.header.mobile) filledFields++;
    if (cvData.header.email) filledFields++;
  }
  
  // Profile text area
  if (cvData.profile !== undefined) {
    totalFields += 1;
    if (cvData.profile && cvData.profile.trim().length > 0) filledFields++;
  }
  
  // Experience text area
  if (cvData.experience !== undefined) {
    totalFields += 1;
    if (cvData.experience && cvData.experience.trim().length > 0) filledFields++;
  }
  
  // Education text area
  if (cvData.education !== undefined) {
    totalFields += 1;
    if (cvData.education && cvData.education.trim().length > 0) filledFields++;
  }
  
  // Personal details text area
  if (cvData.personalDetails !== undefined) {
    totalFields += 1;
    if (cvData.personalDetails && cvData.personalDetails.trim().length > 0) filledFields++;
  }
  
  return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
};

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Teacher Dashboard: http://localhost:${PORT}/teacher-dashboard.html`);
});
