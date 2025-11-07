
    const API_URL = 'http://localhost:4000/graphql';
    let tasks = [];

    async function graphqlRequest(query, variables = {}) {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
      });
      const { data } = await response.json();
      return data;
    }

    async function loadTasks() {
      const data = await graphqlRequest(`
        query {
          tasks {
            id
            title
            status
            created_at
          }
        }
      `);
      tasks = data.tasks;
      renderTasks();
    }

    function renderTasks() {
      ['todo', 'in_progress', 'done'].forEach(status => {
        const container = document.getElementById(status);
        const statusTasks = tasks.filter(t => t.status === status);
        
        if (statusTasks.length === 0) {
          container.innerHTML = '<div class="empty-state">No tasks</div>';
          return;
        }

        container.innerHTML = statusTasks.map(task => `
          <div class="task">
            <div class="task-title">${task.title}</div>
            <div class="task-actions">
              ${task.status !== 'todo' ? '<button class="status-btn" onclick="updateStatus(\''+task.id+'\', \'todo\')">◀</button>' : ''}
              ${task.status !== 'done' ? '<button class="status-btn" onclick="updateStatus(\''+task.id+'\', '+(task.status === 'todo' ? '\'in_progress\'' : '\'done\'')+')">▶</button>' : ''}
              <button class="btn-delete" onclick="deleteTask(\'${task.id}\')">✕</button>
            </div>
          </div>
        `).join('');
      });
    }

    async function addTask() {
      const input = document.getElementById('taskInput');
      const title = input.value.trim();
      if (!title) return;

      await graphqlRequest(`
        mutation($title: String!) {
          createTask(title: $title) {
            id
            title
            status
          }
        }
      `, { title });

      input.value = '';
      await loadTasks();
    }

    async function updateStatus(id, status) {
      await graphqlRequest(`
        mutation($id: ID!, $status: String!) {
          updateTaskStatus(id: $id, status: $status) {
            id
            status
          }
        }
      `, { id, status });
      await loadTasks();
    }

    async function deleteTask(id) {
      await graphqlRequest(`
        mutation($id: ID!) {
          deleteTask(id: $id)
        }
      `, { id });
      await loadTasks();
    }

    document.getElementById('taskInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTask();
    });

    loadTasks();