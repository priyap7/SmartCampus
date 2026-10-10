'use strict';

const TASKS_KEY = 'smart-campus.tasks.v1';
const THEME_KEY = 'smart-campus.theme.v1';
const taskList = document.querySelector('#task-list');
const emptyState = document.querySelector('#empty-state');
const taskForm = document.querySelector('#task-form');
const taskDialog = document.querySelector('#task-dialog');
const searchInput = document.querySelector('#task-search');
const filterSelect = document.querySelector('#task-filter');
const themeToggles = document.querySelectorAll('.theme-toggle, .mobile-theme-toggle');
let tasks = readTasks();
let activeView = 'overview';

function readTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
    if (!Array.isArray(savedTasks)) return [];

    return savedTasks.filter((task) => (
      task && typeof task.id === 'string' &&
      typeof task.title === 'string' &&
      ['low', 'medium', 'high'].includes(task.priority)
    ));
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    window.alert('Your browser could not save this change. Check that browser storage is available.');
    return false;
  }
}

// Date inputs represent local calendar days, so keep them out of UTC conversion.
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDueDate(dateString) {
  if (!dateString) return 'No due date';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const difference = Math.round((date - new Date(`${getLocalDateString()}T00:00:00`)) / 86400000);

  if (difference === 0) return 'Today';
  if (difference === 1) return 'Tomorrow';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function updateSummary() {
  const today = getLocalDateString();
  const openTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.length - openTasks.length;
  const dueToday = openTasks.filter((task) => task.dueDate === today).length;
  const completion = tasks.length ? (completedTasks / tasks.length) * 100 : 0;

  document.querySelector('#stat-open').textContent = openTasks.length;
  document.querySelector('#stat-open-caption').textContent = openTasks.length === 1 ? 'task to keep moving' : 'tasks to keep moving';
  document.querySelector('#stat-today').textContent = dueToday;
  document.querySelector('#stat-completed').textContent = completedTasks;
  document.querySelector('#nav-task-count').textContent = tasks.length;
  document.querySelector('#progress-fill').style.width = `${completion}%`;
}

// Apply the selected status/date filter and search before sorting the results.
function getVisibleTasks() {
  const selectedFilter = filterSelect.value;
  const query = searchInput.value.trim().toLocaleLowerCase();
  const today = getLocalDateString();

  return tasks
    .filter((task) => {
      if (selectedFilter === 'active' && task.completed) return false;
      if (selectedFilter === 'completed' && !task.completed) return false;
      if (selectedFilter === 'today' && (task.completed || task.dueDate !== today)) return false;
      if (selectedFilter === 'upcoming' && (task.completed || !task.dueDate || task.dueDate <= today)) return false;
      if (query && !`${task.title} ${task.course || ''}`.toLocaleLowerCase().includes(query)) return false;
      return true;
    })
    .sort((first, second) => {
      if (first.completed !== second.completed) return Number(first.completed) - Number(second.completed);
      const firstDue = first.dueDate || '9999-12-31';
      const secondDue = second.dueDate || '9999-12-31';
      if (firstDue !== secondDue) return firstDue.localeCompare(secondDue);
      const priorityRank = { high: 0, medium: 1, low: 2 };
      return priorityRank[first.priority] - priorityRank[second.priority];
    });
}

// Build elements and set textContent so task text is never interpreted as HTML.
function makeTaskRow(task) {
  const row = document.createElement('article');
  row.className = `task-row${task.completed ? ' is-completed' : ''}`;

  const checkbox = document.createElement('input');
  checkbox.className = 'task-check';
  checkbox.type = 'checkbox';
  checkbox.checked = Boolean(task.completed);
  checkbox.setAttribute('aria-label', `${task.completed ? 'Mark incomplete' : 'Complete'}: ${task.title}`);
  checkbox.dataset.completeTask = task.id;

  const main = document.createElement('div');
  main.className = 'task-main';
  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;
  main.append(title);

  const meta = document.createElement('div');
  meta.className = 'task-meta';
  if (task.course) {
    const course = document.createElement('span');
    course.className = 'course-tag';
    course.textContent = task.course;
    meta.append(course);
  }
  const dot = document.createElement('span');
  dot.className = 'meta-dot';
  dot.setAttribute('aria-hidden', 'true');
  const priorityText = document.createElement('span');
  priorityText.textContent = `${task.priority} priority`;
  meta.append(dot, priorityText);
  main.append(meta);

  const priority = document.createElement('span');
  priority.className = `task-priority priority-${task.priority}`;
  priority.textContent = task.priority;

  const due = document.createElement('time');
  due.className = 'task-due';
  due.textContent = formatDueDate(task.dueDate);
  if (task.dueDate) due.dateTime = task.dueDate;
  if (!task.completed && task.dueDate && task.dueDate < getLocalDateString()) {
    due.classList.add('is-overdue');
    due.textContent = `Overdue · ${formatDueDate(task.dueDate)}`;
  }

  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-task';
  deleteButton.type = 'button';
  deleteButton.dataset.deleteTask = task.id;
  deleteButton.setAttribute('aria-label', `Delete ${task.title}`);
  deleteButton.title = 'Delete task';
  deleteButton.textContent = '×';

  row.append(checkbox, main, priority, due, deleteButton);
  return row;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  taskList.replaceChildren(...visibleTasks.map(makeTaskRow));
  document.querySelector('#visible-task-count').textContent = visibleTasks.length;
  taskList.hidden = visibleTasks.length === 0;
  emptyState.hidden = visibleTasks.length !== 0;

  const noTasksYet = tasks.length === 0;
  document.querySelector('#empty-title').textContent = noTasksYet ? 'A fresh start.' : 'No tasks found.';
  document.querySelector('#empty-copy').textContent = noTasksYet
    ? 'Add your first task and make today count.'
    : 'Try another search or filter, or add a new task.';
  emptyState.querySelector('[data-open-task-form]').hidden = !noTasksYet;
  updateSummary();
}

function setActiveView(view) {
  activeView = view;
  const filterForView = { overview: 'all', all: 'all', today: 'today', completed: 'completed' };
  filterSelect.value = filterForView[view] || 'all';

  document.querySelectorAll('.nav-link').forEach((link) => {
    const isCurrent = link.dataset.view === activeView;
    link.classList.toggle('is-active', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  renderTasks();
}

function openTaskForm() {
  taskForm.reset();
  document.querySelector('#title-error').textContent = '';
  document.querySelector('#task-due-date').min = getLocalDateString();
  taskDialog.showModal();
  document.querySelector('#task-title').focus();
}

document.querySelectorAll('[data-open-task-form]').forEach((button) => {
  button.addEventListener('click', openTaskForm);
});

document.querySelectorAll('.nav-link').forEach((button) => {
  button.addEventListener('click', () => setActiveView(button.dataset.view));
});

document.querySelector('#close-dialog').addEventListener('click', () => taskDialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => taskDialog.close());
document.querySelector('#task-title').addEventListener('input', (event) => {
  if (event.target.value.trim()) document.querySelector('#title-error').textContent = '';
});

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(taskForm);
  const title = String(formData.get('title') || '').trim();
  if (!title) {
    document.querySelector('#title-error').textContent = 'Enter a task name before saving.';
    document.querySelector('#task-title').focus();
    return;
  }

  tasks.unshift({
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    priority: String(formData.get('priority') || 'medium'),
    dueDate: String(formData.get('dueDate') || ''),
    course: String(formData.get('course') || '').trim(),
    completed: false,
  });
  saveTasks();
  taskDialog.close();
  searchInput.value = '';
  setActiveView('overview');
});

taskList.addEventListener('change', (event) => {
  const taskId = event.target.dataset.completeTask;
  if (!taskId) return;
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;
  task.completed = event.target.checked;
  saveTasks();
  renderTasks();
});

taskList.addEventListener('click', (event) => {
  const taskId = event.target.closest('[data-delete-task]')?.dataset.deleteTask;
  if (!taskId) return;
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
});

searchInput.addEventListener('input', renderTasks);
filterSelect.addEventListener('change', () => {
  const selectedView = { today: 'today', completed: 'completed' }[filterSelect.value] || 'all';
  setActiveView(selectedView);
});

function updateThemeControls(isDark) {
  themeToggles.forEach((button) => {
    button.setAttribute('aria-pressed', String(isDark));
    button.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  });
}

themeToggles.forEach((button) => {
  button.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    updateThemeControls(isDark);
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch (error) {
      // The theme still works for this visit if browser storage is unavailable.
    }
  });
});

document.addEventListener('keydown', (event) => {
  const isTyping = event.target.matches('input, textarea, select, [contenteditable="true"]');
  if (event.key === '/' && !isTyping && !taskDialog.open) {
    event.preventDefault();
    searchInput.focus();
  }
});

function applySavedTheme() {
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(THEME_KEY);
  } catch (error) {
    savedTheme = null;
  }
  const useDarkTheme = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('dark-mode', useDarkTheme);
  updateThemeControls(useDarkTheme);
}

function showCurrentDate() {
  const now = new Date();
  document.querySelector('#topbar-date').textContent = new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  }).format(now);
  document.querySelector('#footer-year').textContent = now.getFullYear();
}

applySavedTheme();
showCurrentDate();
setActiveView(activeView);