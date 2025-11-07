# Task Board POC - Technical Documentation

## Architecture Overview

This POC demonstrates a modern web application using GraphQL as the API layer between a Node.js backend and a vanilla JavaScript frontend.

### Technology Stack

**Backend:**
- **Node.js** - Runtime environment
- **Express** - Web server framework
- **GraphQL** - API query language
- **SQLite** - Embedded relational database
- **WebSocket** - Real-time communication protocol

**Frontend:**
- **Vanilla JavaScript** - No frameworks, pure ES6+
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Grid and Flexbox

---

## System Architecture

```
┌─────────────────┐         HTTP/WebSocket        ┌──────────────────┐
│                 │◄──────────────────────────────►│                  │
│  Frontend       │    GraphQL Queries/Mutations   │   Backend        │
│  (index.html)   │                                │   (server.js)    │
│                 │                                │                  │
└─────────────────┘                                └────────┬─────────┘
                                                            │
                                                            ▼
                                                   ┌─────────────────┐
                                                   │  SQLite DB      │
                                                   │  (in-memory)    │
                                                   └─────────────────┘
```

---

## Backend Architecture

### 1. Database Layer (SQLite)

**Schema:**
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Why SQLite?**
- Zero configuration
- Self-contained (no separate server process)
- Perfect for POCs and prototypes
- Easy to migrate to PostgreSQL/MySQL later

**Current Implementation:**
- In-memory database (data lost on restart)
- Synchronous initialization with sample data
- Simple CRUD operations

### 2. GraphQL Layer

**Schema Definition:**
```graphql
type Task {
  id: ID!
  title: String!
  status: String!
  created_at: String!
}

type Query {
  tasks: [Task!]!
}

type Mutation {
  createTask(title: String!): Task!
  updateTaskStatus(id: ID!, status: String!): Task!
  deleteTask(id: ID!): Boolean!
}

type Subscription {
  taskUpdated: Task!
}
```

**Resolvers:**
- **Query.tasks** - Fetches all tasks from database
- **Mutation.createTask** - Inserts new task with default 'todo' status
- **Mutation.updateTaskStatus** - Updates task status (todo/in_progress/done)
- **Mutation.deleteTask** - Removes task from database
- **Subscription.taskUpdated** - Publishes real-time updates (infrastructure ready)

**PubSub Pattern:**
- Uses `graphql-subscriptions` for event publishing
- WebSocket server enabled for real-time subscriptions
- Currently publishes events but frontend doesn't subscribe yet

### 3. Server Configuration

**Endpoints:**
- `POST /graphql` - HTTP endpoint for queries/mutations
- `WS /graphql` - WebSocket endpoint for subscriptions

**Middleware:**
- CORS enabled for cross-origin requests
- JSON body parser for request handling
- Express integration with graphql-http

---

## Frontend Architecture

### 1. Application Structure

**Single HTML File:**
- Embedded CSS for styling
- Embedded JavaScript for logic
- No build process required

**State Management:**
```javascript
let tasks = []; // In-memory task cache
```

Simple, straightforward - tasks array holds current state fetched from server.

### 2. GraphQL Client Implementation

**Custom Fetch Wrapper:**
```javascript
async function graphqlRequest(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  const { data } = await response.json();
  return data;
}
```

**Why Not Apollo/Relay?**
- No dependencies = faster load time
- Clear understanding of what's happening
- Easy to debug and modify
- Perfect for POC scope

### 3. UI Components (Conceptual)

**Task Input:**
- Text input field
- Add button
- Enter key support

**Task Columns:**
- Three columns (To Do, In Progress, Done)
- Dynamic task rendering
- Empty state handling

**Task Cards:**
- Title display
- Status navigation buttons (◀/▶)
- Delete button (✕)
- Hover effects

### 4. User Interactions

**Add Task Flow:**
1. User types task title
2. Clicks "Add" or presses Enter
3. Frontend sends GraphQL mutation
4. Server creates task in database
5. Frontend refreshes task list
6. New task appears in "To Do" column

**Update Status Flow:**
1. User clicks arrow button (◀/▶)
2. Frontend determines new status
3. Sends updateTaskStatus mutation
4. Server updates database
5. Frontend refreshes task list
6. Task moves to new column

**Delete Task Flow:**
1. User clicks delete button (✕)
2. Frontend sends deleteTask mutation
3. Server removes from database
4. Frontend refreshes task list
5. Task disappears from UI

---

## Design Philosophy

### Minimalist Apple Aesthetic

**Color Palette:**
- Background: `#fafafa` (off-white)
- Surface: `#ffffff` (white)
- Primary text: `#1d1d1f` (near-black)
- Secondary text: `#86868b` (gray)
- Borders: `#e5e5e5` (light gray)

**Typography:**
- Font: `-apple-system` (San Francisco on Apple devices)
- Weight: 400 (regular), 500 (medium), 600 (semibold)
- Sizes: 11px-32px range
- Letter spacing: Tight for headlines (-0.5px)

**Spacing:**
- Generous padding (12px-24px)
- Consistent gaps (8px, 12px, 24px, 40px)
- Breathing room around elements

**Interaction Design:**
- Subtle hover states
- Fast transitions (0.2s)
- No aggressive animations
- Focus states for accessibility

---

## Data Flow

### Complete Request Cycle

```
User Action → Frontend Handler → GraphQL Request → Express Server
                                                         ↓
Frontend Update ← JSON Response ← GraphQL Resolver ← Database Query
```

**Example: Creating a Task**

1. User types "Deploy to staging" and clicks Add
2. `addTask()` function called
3. GraphQL mutation constructed:
   ```graphql
   mutation($title: String!) {
     createTask(title: $title) {
       id
       title
       status
     }
   }
   ```
4. Sent via fetch to `http://localhost:4000/graphql`
5. Express routes to GraphQL handler
6. Resolver executes SQL: `INSERT INTO tasks (title, status) VALUES (?, ?)`
7. Database returns new row with auto-generated ID
8. Resolver publishes to PubSub (for future subscribers)
9. GraphQL returns task object as JSON
10. Frontend receives response
11. `loadTasks()` called to refresh
12. UI re-renders with new task in "To Do" column

---

## Current Limitations

### Backend
1. **In-memory database** - Data lost on server restart
2. **No authentication** - Anyone can modify tasks
3. **No validation** - Empty titles could be inserted
4. **No error handling** - Database errors not gracefully handled
5. **No rate limiting** - Vulnerable to abuse
6. **No logging** - Difficult to debug production issues

### Frontend
1. **No real-time updates** - WebSocket infrastructure ready but not used
2. **No optimistic updates** - UI waits for server confirmation
3. **No error handling** - Network failures not displayed to user
4. **No loading states** - User doesn't know when requests are in-flight
5. **No input validation** - Can submit empty tasks
6. **No persistence** - Page refresh loses unsaved changes
7. **Accessibility** - Missing ARIA labels and keyboard navigation

---

## Future Enhancements

### Phase 1: Core Improvements (Quick Wins)

**1. Persistent Database**
```javascript
// Change from in-memory to file-based
const db = new sqlite3.Database('./tasks.db');
```
- Tasks survive server restarts
- Production-ready storage

**2. Input Validation**
```javascript
// Frontend
if (!title || title.length > 200) {
  showError('Task title must be 1-200 characters');
  return;
}

// Backend resolver
if (!title?.trim()) {
  throw new GraphQLError('Task title is required');
}
```

**3. Error Handling**
```javascript
async function graphqlRequest(query, variables = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const { data, errors } = await response.json();
    
    if (errors) {
      throw new Error(errors[0].message);
    }
    
    return data;
  } catch (err) {
    showError(err.message);
    throw err;
  }
}
```

**4. Loading States**
```javascript
let isLoading = false;

async function addTask() {
  if (isLoading) return;
  isLoading = true;
  showLoadingSpinner();
  
  try {
    await graphqlRequest(...);
  } finally {
    isLoading = false;
    hideLoadingSpinner();
  }
}
```

### Phase 2: Real-Time Features

**1. WebSocket Subscriptions**
```javascript
// Frontend: Connect to WebSocket
const ws = new WebSocket('ws://localhost:4000/graphql');

ws.send(JSON.stringify({
  type: 'subscribe',
  payload: {
    query: `
      subscription {
        taskUpdated {
          id
          title
          status
        }
      }
    `
  }
}));

ws.onmessage = (event) => {
  const { data } = JSON.parse(event.data);
  updateTaskInUI(data.taskUpdated);
};
```

**Benefits:**
- Multiple users see changes instantly
- No polling required
- Feels collaborative

**2. Optimistic Updates**
```javascript
async function deleteTask(id) {
  // Remove from UI immediately
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
  
  try {
    await graphqlRequest(...);
  } catch (err) {
    // Rollback on error
    await loadTasks();
    showError('Failed to delete task');
  }
}
```

### Phase 3: Enhanced Features

**1. Task Details**
- Description field
- Due dates
- Priority levels
- Assignees
- Tags/labels

**Database Migration:**
```sql
ALTER TABLE tasks ADD COLUMN description TEXT;
ALTER TABLE tasks ADD COLUMN due_date DATE;
ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN assignee TEXT;
```

**2. Drag and Drop**
```javascript
// Use HTML5 Drag and Drop API
function handleDragStart(e, taskId) {
  e.dataTransfer.setData('taskId', taskId);
}

function handleDrop(e, newStatus) {
  const taskId = e.dataTransfer.getData('taskId');
  updateStatus(taskId, newStatus);
}
```

**3. Search and Filter**
```javascript
// GraphQL query with arguments
const data = await graphqlRequest(`
  query($search: String, $status: String) {
    tasks(search: $search, status: $status) {
      id
      title
      status
    }
  }
`, { search: 'deploy', status: 'todo' });
```

**4. Task History/Audit Log**
```sql
CREATE TABLE task_history (
  id INTEGER PRIMARY KEY,
  task_id INTEGER,
  action TEXT,
  old_value TEXT,
  new_value TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 4: Production Readiness

**1. Authentication & Authorization**
```javascript
// JWT-based auth
const jwt = require('jsonwebtoken');

app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    req.user = jwt.verify(token, SECRET_KEY);
  }
  next();
});

// Check permissions in resolvers
updateTaskStatus: async (_, { id, status }, context) => {
  if (!context.user) {
    throw new GraphQLError('Unauthorized');
  }
  // ...
}
```

**2. Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/graphql', limiter);
```

**3. Logging & Monitoring**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log all GraphQL operations
logger.info('GraphQL operation', {
  operation: info.operation.operation,
  query: info.operation.selectionSet
});
```

**4. Testing**
```javascript
// Jest + Supertest for API testing
describe('Task mutations', () => {
  it('creates a task', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation {
            createTask(title: "Test task") {
              id
              title
            }
          }
        `
      });
    
    expect(response.body.data.createTask.title).toBe('Test task');
  });
});
```

**5. Environment Configuration**
```javascript
// .env file
PORT=4000
DATABASE_URL=./tasks.db
NODE_ENV=production
JWT_SECRET=your-secret-key

// Load with dotenv
require('dotenv').config();
const PORT = process.env.PORT || 4000;
```

### Phase 5: Advanced Features

**1. Multi-board Support**
- Create multiple boards
- Share boards with teams
- Board templates

**2. Notifications**
- Email notifications for due dates
- Browser push notifications
- Slack/Discord integrations

**3. Analytics Dashboard**
- Tasks completed over time
- Average time in each status
- Team productivity metrics

**4. Mobile App**
- React Native app
- Shares GraphQL backend
- Offline-first with sync

**5. Export/Import**
- Export to CSV/JSON
- Import from Trello/Asana
- Backup and restore

---

## Deployment Considerations

### Development
```bash
npm start
# Server runs on localhost:4000
# Open index.html in browser
```

### Production Options

**1. Simple VPS Deployment**
```bash
# On server (Ubuntu)
sudo apt install nodejs npm sqlite3
git clone <repo>
cd task-board-poc
npm install
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

**2. Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 4000
CMD ["node", "server.js"]
```

**3. Cloud Platforms**
- **Heroku**: Easy deployment, free tier available
- **Railway**: Modern, simple, good free tier
- **Fly.io**: Global edge deployment
- **AWS EC2**: Full control, more setup
- **DigitalOcean App Platform**: Balanced option

### Frontend Hosting
- Netlify
- Vercel
- GitHub Pages
- S3 + CloudFront

### Database Migration Path
```
SQLite (in-memory) → SQLite (file) → PostgreSQL → PostgreSQL (managed)
```

---

## Performance Optimization

### Backend
1. **Database Indexing**
```sql
CREATE INDEX idx_status ON tasks(status);
CREATE INDEX idx_created ON tasks(created_at);
```

2. **Query Optimization**
```javascript
// Use prepared statements
const stmt = db.prepare('SELECT * FROM tasks WHERE status = ?');
stmt.all([status], callback);
```

3. **Caching Layer**
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 });

// Cache task list
const cachedTasks = cache.get('tasks');
if (cachedTasks) return cachedTasks;
```

4. **Connection Pooling**
```javascript
// For PostgreSQL migration
const { Pool } = require('pg');
const pool = new Pool({
  max: 20,
  connectionTimeoutMillis: 2000
});
```

### Frontend
1. **Debouncing**
```javascript
// For search inputs
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

const searchTasks = debounce(async (query) => {
  // GraphQL search query
}, 300);
```

2. **Virtual Scrolling**
```javascript
// For large task lists (1000+ items)
// Use libraries like react-window or implement custom
```

3. **Code Splitting**
```javascript
// When migrating to a bundler
const TaskEditor = () => import('./TaskEditor.js');
```

---

## Security Best Practices

### Input Sanitization
```javascript
const sanitizeHtml = require('sanitize-html');

createTask: (_, { title }) => {
  const cleanTitle = sanitizeHtml(title, {
    allowedTags: [],
    allowedAttributes: {}
  });
  // Insert cleanTitle
}
```

### SQL Injection Prevention
```javascript
// Always use parameterized queries
db.run('INSERT INTO tasks (title) VALUES (?)', [title]); // ✓ Safe
db.run(`INSERT INTO tasks (title) VALUES ('${title}')`); // ✗ Vulnerable
```

### CORS Configuration
```javascript
// Production: Restrict origins
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

### HTTPS
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(443);
```

---

## Monitoring & Debugging

### Development Tools
1. **GraphQL Playground**
```javascript
// Add to server.js
const { graphqlHTTP } = require('express-graphql');

app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true // Enable GraphQL IDE
}));
```

2. **Chrome DevTools**
- Network tab for GraphQL requests
- Console for JavaScript errors
- Application tab for storage

3. **Database Browser**
```bash
sqlite3 tasks.db
.tables
.schema tasks
SELECT * FROM tasks;
```

### Production Monitoring
1. **Error Tracking**: Sentry, Rollbar
2. **Performance**: New Relic, Datadog
3. **Uptime**: Pingdom, UptimeRobot
4. **Logs**: Papertrail, Loggly

---

## Conclusion

This POC demonstrates a clean, functional implementation of a task board using modern web technologies. The architecture is intentionally simple and minimalist, following Apple's design philosophy of "less is more."

The GraphQL API provides a flexible, efficient interface between frontend and backend, while SQLite offers a zero-configuration database solution perfect for prototyping. The vanilla JavaScript frontend proves you don't need complex frameworks for building responsive, interactive UIs.

This foundation is production-ready with the enhancements outlined in Phase 4, and can scale to support thousands of users with proper infrastructure and optimization.

**Key Takeaways:**
- Simplicity enables rapid iteration
- GraphQL reduces over-fetching and under-fetching
- Vanilla JS is powerful and underestimated
- Good architecture doesn't require complexity
- Start minimal, enhance based on real needs

**Next Steps:**
1. Implement Phase 1 improvements (validation, error handling)
2. Add real-time subscriptions for collaborative editing
3. Deploy to a production environment
4. Gather user feedback
5. Iterate based on actual usage patterns

Happy building! 🚀