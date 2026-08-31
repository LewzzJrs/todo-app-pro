import './style.css';

interface ITodo {
  id: number;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
}

class Todo implements ITodo {
  id: number;
  title: string;
  isCompleted: boolean;
  dueDate?: string;

  constructor(
    id: number,
    title: string,
    isCompleted: boolean = false,
    dueDate?: string
  ) {
    this.id = id;
    this.title = title;
    this.isCompleted = isCompleted;
    this.dueDate = dueDate;
  }
}

const NAMA_HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

function formatTanggal(dueDate: string): string {
  const [year, month, day] = dueDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const namaHari = NAMA_HARI[date.getDay()];
  const tanggal = String(date.getDate()).padStart(2, '0');
  const bulan = String(date.getMonth() + 1).padStart(2, '0');
  return `${namaHari}, ${tanggal}/${bulan}/${date.getFullYear()}`;
}

function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeDate(value: string): string | undefined {
  return value && value.trim() !== '' ? value.trim() : undefined;
}

function isOverdue(todo: Todo): boolean {
  return (
    !todo.isCompleted && !!todo.dueDate && todo.dueDate < getTodayStr()
  );
}

class TodoList {
  private todos: Todo[] = [];

  private saveData(): void {
    localStorage.setItem('tugas_ts', JSON.stringify(this.todos));
  }

  private loadData(): boolean {
    const dataTersimpan = localStorage.getItem('tugas_ts');
    if (dataTersimpan) {
      this.todos = JSON.parse(dataTersimpan);
      return true;
    }
    return false;
  }

  private validateTitle(title: string): string {
    if (!title || title.trim() === '') {
      throw new Error('Judul tugas tidak boleh kosong');
    }
    return title.trim();
  }

  addTodo(title: string, dueDate?: string): Todo {
    const newTodo = new Todo(
      Date.now(),
      this.validateTitle(title),
      false,
      dueDate ? normalizeDate(dueDate) : undefined
    );
    this.todos.push(newTodo);
    this.saveData();
    return newTodo;
  }

  updateTodo(id: number, title: string, dueDate?: string): void {
    const todo = this.todos.find((todo) => todo.id === id);
    if (!todo) return;
    todo.title = this.validateTitle(title);
    todo.dueDate = dueDate ? normalizeDate(dueDate) : undefined;
    this.saveData();
  }

  deleteTodo(id: number): void {
    this.todos = this.todos.filter((todo) => todo.id !== id);
    this.saveData();
  }

  toggleTodoStatus(id: number): void {
    const todo = this.todos.find((todo) => todo.id === id);
    if (todo) {
      todo.isCompleted = !todo.isCompleted;
      this.saveData();
    }
  }

  getTodos(): Todo[] {
    return this.todos;
  }

  clearAll(): void {
    this.todos = [];
    localStorage.removeItem('tugas_ts');
  }

  init(): void {
    this.loadData();
  }
}

type Filter = 'all' | 'active' | 'completed';

const app = new TodoList();
let currentFilter: Filter = 'all';
let editingId: number | null = null;

const todoForm = document.getElementById('todo-form') as HTMLFormElement;
const todoInput = document.getElementById('todo-input') as HTMLInputElement;
const todoDateInput = document.getElementById(
  'todo-date-input'
) as HTMLInputElement;
const todoListElement = document.getElementById(
  'todo-list'
) as HTMLUListElement;
const clearAllBtn = document.getElementById(
  'clear-all-btn'
) as HTMLButtonElement;
const filterTabs = document.getElementById('filter-tabs') as HTMLDivElement;
const todoCounter = document.getElementById('todo-counter') as HTMLSpanElement;

const ICON_CHECK =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const ICON_UNDO =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
const ICON_TRASH =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';
const ICON_EDIT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
const ICON_CLOSE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

function iconButton(
  icon: string,
  label: string,
  className: string
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.title = label;
  btn.setAttribute('aria-label', label);
  btn.className = `w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-white ${className}`;
  btn.innerHTML = icon;
  return btn;
}

function getVisibleTodos(): Todo[] {
  const todos = app.getTodos().slice();

  const filtered = todos.filter((todo) => {
    if (currentFilter === 'active') return !todo.isCompleted;
    if (currentFilter === 'completed') return todo.isCompleted;
    return true;
  });

  filtered.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.id - b.id;
  });

  return filtered;
}

function updateFilterTabsUI(): void {
  filterTabs.querySelectorAll<HTMLButtonElement>('.filter-btn').forEach((btn) => {
    const isActive = btn.dataset.filter === currentFilter;
    btn.classList.toggle('bg-blue-600', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('text-slate-400', !isActive);
    btn.classList.toggle('hover:text-slate-200', !isActive);
  });
}

function updateCounter(): void {
  const activeCount = app.getTodos().filter((t) => !t.isCompleted).length;
  todoCounter.textContent =
    activeCount === 0 ? 'Semua beres' : `${activeCount} tugas tersisa`;
}

function renderEditForm(li: HTMLLIElement, todo: Todo): void {
  li.className =
    'flex flex-col gap-2 bg-slate-800 p-3 rounded-lg border-l-4 border-blue-500 shadow-sm border-y border-r border-slate-700';

  const row = document.createElement('div');
  row.className = 'flex flex-col gap-2';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = todo.title;
  titleInput.className =
    'px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white';

  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.value = todo.dueDate ?? '';
  dateInput.className =
    'px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white scheme-dark';

  row.appendChild(titleInput);
  row.appendChild(dateInput);

  const actionRow = document.createElement('div');
  actionRow.className = 'flex justify-end gap-2';

  const saveBtn = iconButton(
    ICON_CHECK,
    'Simpan perubahan',
    'bg-emerald-600 hover:bg-emerald-500'
  );
  saveBtn.onclick = () => {
    try {
      app.updateTodo(todo.id, titleInput.value, dateInput.value);
      editingId = null;
      renderTodos();
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    }
  };

  const cancelBtn = iconButton(
    ICON_CLOSE,
    'Batalkan edit',
    'bg-slate-600 hover:bg-slate-500'
  );
  cancelBtn.onclick = () => {
    editingId = null;
    renderTodos();
  };

  actionRow.appendChild(saveBtn);
  actionRow.appendChild(cancelBtn);

  li.appendChild(row);
  li.appendChild(actionRow);
}

function renderTodoRow(li: HTMLLIElement, todo: Todo): void {
  const overdue = isOverdue(todo);

  li.className = `flex justify-between items-center bg-slate-800 p-3 rounded-lg border-l-4 shadow-sm border-y border-r border-slate-700 ${
    overdue ? 'border-rose-500' : 'border-blue-500'
  }`;

  if (todo.isCompleted) {
    li.classList.add('opacity-50', 'line-through');
  }

  const infoDiv = document.createElement('div');
  infoDiv.className = 'flex flex-col min-w-0 mr-3';

  const span = document.createElement('span');
  span.textContent = todo.title;
  span.className = 'font-medium text-slate-200 truncate';

  const dateRow = document.createElement('div');
  dateRow.className = 'flex items-center gap-2 mt-1';

  const dateSpan = document.createElement('span');
  dateSpan.className = 'text-xs';
  if (todo.dueDate) {
    dateSpan.textContent = formatTanggal(todo.dueDate);
    dateSpan.classList.add(overdue ? 'text-rose-400' : 'text-slate-400');
  } else {
    dateSpan.textContent = 'Hari dan tanggal belum diisi';
    dateSpan.classList.add('text-amber-500', 'italic');
  }
  dateRow.appendChild(dateSpan);

  if (overdue) {
    const badge = document.createElement('span');
    badge.textContent = 'Terlambat';
    badge.className =
      'text-[10px] font-semibold uppercase tracking-wide bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded';
    dateRow.appendChild(badge);
  }

  infoDiv.appendChild(span);
  infoDiv.appendChild(dateRow);

  const actionDiv = document.createElement('div');
  actionDiv.className = 'flex items-center gap-2 shrink-0';

  const toggleBtn = iconButton(
    todo.isCompleted ? ICON_UNDO : ICON_CHECK,
    todo.isCompleted ? 'Tandai belum selesai' : 'Tandai selesai',
    todo.isCompleted
      ? 'bg-slate-600 hover:bg-slate-500'
      : 'bg-emerald-600 hover:bg-emerald-500'
  );
  toggleBtn.onclick = () => {
    app.toggleTodoStatus(todo.id);
    renderTodos();
  };

  const editBtn = iconButton(
    ICON_EDIT,
    'Edit tugas',
    'bg-slate-600 hover:bg-slate-500'
  );
  editBtn.onclick = () => {
    editingId = todo.id;
    renderTodos();
  };

  const deleteBtn = iconButton(
    ICON_TRASH,
    'Hapus tugas',
    'bg-rose-600 hover:bg-rose-500'
  );
  deleteBtn.onclick = () => {
    if (confirm(`Hapus tugas: "${todo.title}"?`)) {
      app.deleteTodo(todo.id);
      renderTodos();
    }
  };

  actionDiv.appendChild(toggleBtn);
  actionDiv.appendChild(editBtn);
  actionDiv.appendChild(deleteBtn);
  li.appendChild(infoDiv);
  li.appendChild(actionDiv);
}

function renderTodos(): void {
  todoListElement.innerHTML = '';
  const visibleTodos = getVisibleTodos();

  updateFilterTabsUI();
  updateCounter();

  if (visibleTodos.length === 0) {
    const emptyMessage =
      currentFilter === 'active'
        ? 'Tidak ada tugas aktif. Semua beres!'
        : currentFilter === 'completed'
        ? 'Belum ada tugas yang selesai.'
        : 'Belum ada tugas. Yuk, tambah tugas baru!';
    todoListElement.innerHTML = `<li class="text-center text-slate-500 py-4">${emptyMessage}</li>`;
    return;
  }

  visibleTodos.forEach((todo) => {
    const li = document.createElement('li');
    if (todo.id === editingId) {
      renderEditForm(li, todo);
    } else {
      renderTodoRow(li, todo);
    }
    todoListElement.appendChild(li);
  });
}

todoForm.addEventListener('submit', (event: Event) => {
  event.preventDefault();
  try {
    app.addTodo(todoInput.value, todoDateInput.value);
    todoInput.value = '';
    todoDateInput.value = '';
    renderTodos();
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    }
  }
});

clearAllBtn.addEventListener('click', () => {
  if (app.getTodos().length === 0) return;
  if (confirm('Hapus semua tugas? Tindakan ini tidak bisa dibatalkan.')) {
    app.clearAll();
    editingId = null;
    renderTodos();
  }
});

filterTabs.addEventListener('click', (event: Event) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
    '.filter-btn'
  );
  if (!target || !target.dataset.filter) return;
  currentFilter = target.dataset.filter as Filter;
  renderTodos();
});

app.init();
renderTodos();
