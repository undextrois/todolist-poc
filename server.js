const express = require('express');
const { createHandler } = require('graphql-http/lib/use/express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { PubSub } = require('graphql-subscriptions');
const { useServer } = require('graphql-ws/lib/use/ws');
const { WebSocketServer } = require('ws');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const pubsub = new PubSub();

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add some sample data
  const stmt = db.prepare('INSERT INTO tasks (title, status) VALUES (?, ?)');
  stmt.run('Design new landing page', 'todo');
  stmt.run('Review pull requests', 'in_progress');
  stmt.run('Deploy to production', 'done');
  stmt.finalize();
});

// GraphQL Schema
const typeDefs = `
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
`;

// Resolvers
const resolvers = {
  Query: {
    tasks: () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM tasks ORDER BY created_at DESC', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  },
  Mutation: {
    createTask: (_, { title }) => {
      return new Promise((resolve, reject) => {
        db.run('INSERT INTO tasks (title, status) VALUES (?, ?)', [title, 'todo'], function(err) {
          if (err) reject(err);
          else {
            db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, row) => {
              if (err) reject(err);
              else {
                pubsub.publish('TASK_UPDATED', { taskUpdated: row });
                resolve(row);
              }
            });
          }
        });
      });
    },
    updateTaskStatus: (_, { id, status }) => {
      return new Promise((resolve, reject) => {
        db.run('UPDATE tasks SET status = ? WHERE id = ?', [status, id], (err) => {
          if (err) reject(err);
          else {
            db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
              if (err) reject(err);
              else {
                pubsub.publish('TASK_UPDATED', { taskUpdated: row });
                resolve(row);
              }
            });
          }
        });
      });
    },
    deleteTask: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM tasks WHERE id = ?', [id], (err) => {
          if (err) reject(err);
          else {
            pubsub.publish('TASK_UPDATED', { taskUpdated: { id, deleted: true } });
            resolve(true);
          }
        });
      });
    }
  },
  Subscription: {
    taskUpdated: {
      subscribe: () => pubsub.asyncIterator(['TASK_UPDATED'])
    }
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

app.use(cors());
app.use(express.json());

// HTTP endpoint
app.all('/graphql', createHandler({ schema }));

const server = app.listen(4000, () => {
  console.log('Server running on http://localhost:4000/graphql');
  
  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server,
    path: '/graphql'
  });

  useServer({ schema }, wsServer);
  console.log('WebSocket server running on ws://localhost:4000/graphql');
});