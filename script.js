document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const taskPriority = document.getElementById('taskPriority');
    const taskCategory = document.getElementById('taskCategory');
    const taskDue = document.getElementById('taskDue');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const categoryItems = document.querySelectorAll('.category-item');
    const sortBtn = document.getElementById('sortBtn');
    const themeToggle = document.getElementById('themeToggle');
    
    // Set today's date as default for due date
    const today = new Date().toISOString().split('T')[0];
    taskDue.value = today;
    
    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentCategory = 'all';
    let dragSrcEl = null;
    let isNormalMode = localStorage.getItem('themeMode') === 'normal';
    
    // Initialize the app
    function init() {
        // Set initial theme
        if (isNormalMode) {
            document.body.classList.add('normal-mode');
            themeToggle.innerHTML = '<i class="fas fa-magic"></i>';
        }
        
        renderTasks();
        updateTaskCount();
        
        // Event listeners
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.id === 'sortBtn') {
                    sortTasks();
                    return;
                }
                
                // Update active button
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Set current filter and render
                currentFilter = this.getAttribute('data-filter');
                renderTasks();
            });
        });
        
        categoryItems.forEach(item => {
            item.addEventListener('click', function() {
                // Update active category
                categoryItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                // Set current category and render
                currentCategory = this.getAttribute('data-category');
                renderTasks();
            });
        });
        
        // Theme toggle event listener
        themeToggle.addEventListener('click', toggleTheme);
        
        // Initialize drag and drop
        initDragAndDrop();
    }
    
    // Toggle between normal and modern theme
    function toggleTheme() {
        isNormalMode = !isNormalMode;
        
        if (isNormalMode) {
            document.body.classList.add('normal-mode');
            themeToggle.innerHTML = '<i class="fas fa-magic"></i>';
            localStorage.setItem('themeMode', 'normal');
        } else {
            document.body.classList.remove('normal-mode');
            themeToggle.innerHTML = '<i class="fas fa-paint-roller"></i>';
            localStorage.setItem('themeMode', 'modern');
        }
    }
    
    // Add a new task
    function addTask() {
        const text = taskInput.value.trim();
        if (text === '') return;
        
        const newTask = {
            id: Date.now(),
            text: text,
            completed: false,
            priority: taskPriority.value,
            category: taskCategory.value,
            dueDate: taskDue.value,
            timestamp: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateTaskCount();
        
        // Clear input
        taskInput.value = '';
        taskInput.focus();
        
        // Add animation
        const taskItems = document.querySelectorAll('.task-item');
        if (taskItems.length > 0) {
            const lastTask = taskItems[taskItems.length - 1];
            lastTask.style.animation = 'slideIn 0.4s ease-out';
        }
    }
    
    // Toggle task completion
    function toggleTask(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                const updatedTask = {...task, completed: !task.completed};
                
                // Add confetti if task is completed
                if (updatedTask.completed) {
                    createConfetti();
                }
                
                return updatedTask;
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
    
    // Create confetti animation
    function createConfetti() {
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.width = Math.floor(Math.random() * 10 + 5) + 'px';
            confetti.style.height = Math.floor(Math.random() * 10 + 5) + 'px';
            document.body.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }
    
    // Delete a task
    function deleteTask(id) {
        const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
        if (taskElement) {
            taskElement.classList.add('fade-out');
            
            setTimeout(() => {
                tasks = tasks.filter(task => task.id !== id);
                saveTasks();
                renderTasks();
                updateTaskCount();
            }, 400);
        }
    }
    
    // Edit a task
    function editTask(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        
        const newText = prompt('Edit your task:', task.text);
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            saveTasks();
            renderTasks();
        }
    }
    
    // Sort tasks by due date
    function sortTasks() {
        tasks.sort((a, b) => {
            if (a.dueDate < b.dueDate) return -1;
            if (a.dueDate > b.dueDate) return 1;
            return 0;
        });
        
        saveTasks();
        renderTasks();
    }
    
    // Render tasks based on current filter and category
    function renderTasks() {
        // Filter tasks based on current selection
        let filteredTasks = tasks;
        
        // Apply category filter
        if (currentCategory !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === currentCategory);
        }
        
        // Apply status filter
        if (currentFilter === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }
        
        // Render tasks or empty state
        if (filteredTasks.length === 0) {
            let message = '';
            if (currentFilter === 'all' && currentCategory === 'all') message = 'No tasks yet. Add a task to get started!';
            else if (currentFilter === 'active') message = 'No active tasks. Great job!';
            else if (currentFilter === 'completed') message = 'No completed tasks yet.';
            else message = `No tasks in ${currentCategory} category.`;
            
            taskList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>${message}</p>
                </div>
            `;
            return;
        }
        
        // Render tasks
        taskList.innerHTML = '';
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`;
            li.setAttribute('data-id', task.id);
            li.draggable = true;
            
            // Format due date for display
            const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
            
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <span class="task-text">${task.text}</span>
                    <div class="task-meta">
                        <span class="task-category"><i class="fas fa-tag"></i> ${task.category}</span>
                        <span class="task-due"><i class="fas fa-calendar"></i> ${dueDate}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-edit"><i class="fas fa-edit"></i></button>
                    <button class="task-delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Add event listeners
            li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
            li.querySelector('.task-edit').addEventListener('click', () => editTask(task.id));
            li.querySelector('.task-delete').addEventListener('click', () => deleteTask(task.id));
            
            taskList.appendChild(li);
        });
        
        // Add drag and drop event listeners
        addDragListeners();
    }
    
    // Initialize drag and drop functionality
    function initDragAndDrop() {
        function handleDragStart(e) {
            dragSrcEl = this;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
            
            setTimeout(() => this.classList.add('dragging'), 0);
        }
        
        function handleDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.dataTransfer.dropEffect = 'move';
            return false;
        }
        
        function handleDragEnter() {
            this.classList.add('over');
        }
        
        function handleDragLeave() {
            this.classList.remove('over');
        }
        
        function handleDrop(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            
            if (dragSrcEl !== this) {
                const sourceId = parseInt(e.dataTransfer.getData('text/plain'));
                const targetId = parseInt(this.getAttribute('data-id'));
                
                // Reorder tasks array
                const sourceIndex = tasks.findIndex(task => task.id === sourceId);
                const targetIndex = tasks.findIndex(task => task.id === targetId);
                
                if (sourceIndex !== -1 && targetIndex !== -1) {
                    // Remove from old position and insert at new position
                    const [movedTask] = tasks.splice(sourceIndex, 1);
                    tasks.splice(targetIndex, 0, movedTask);
                    
                    saveTasks();
                    renderTasks();
                }
            }
            
            return false;
        }
        
        function handleDragEnd() {
            document.querySelectorAll('.task-item').forEach(item => {
                item.classList.remove('over');
                item.classList.remove('dragging');
            });
        }
        
        window.handleDragStart = handleDragStart;
        window.handleDragOver = handleDragOver;
        window.handleDragEnter = handleDragEnter;
        window.handleDragLeave = handleDragLeave;
        window.handleDrop = handleDrop;
        window.handleDragEnd = handleDragEnd;
    }
    
    // Add drag and drop event listeners to tasks
    function addDragListeners() {
        document.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('dragstart', window.handleDragStart);
            item.addEventListener('dragenter', window.handleDragEnter);
            item.addEventListener('dragover', window.handleDragOver);
            item.addEventListener('dragleave', window.handleDragLeave);
            item.addEventListener('drop', window.handleDrop);
            item.addEventListener('dragend', window.handleDragEnd);
        });
    }
    
    // Update task counter
    function updateTaskCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        const totalTasks = tasks.length;
        
        if (totalTasks === 0) {
            taskCount.textContent = 'No tasks';
        } else if (activeTasks === 1) {
            taskCount.textContent = '1 task remaining';
        } else {
            taskCount.textContent = `${activeTasks} tasks remaining`;
        }
    }
    
    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Initialize the app
    init();
});