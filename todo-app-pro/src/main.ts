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

  addTodo(title: string, dueDate?: string): Todo {
    if (!title || title.trim() === '') {
      throw new Error('Judul tugas tidak boleh kosong');
    }
    const newTodo = new Todo(
      Date.now(),
      title.trim(),
      false,
      dueDate ? dueDate.trim() : undefined
    );
    this.todos.push(newTodo);
    this.saveData();
    return newTodo;
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

const app = new TodoList();

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

function renderTodos(): void {
  todoListElement.innerHTML = '';
  const currentTodos = app.getTodos();

  if (currentTodos.length === 0) {
    todoListElement.innerHTML =
      '<li class="text-center text-slate-500 py-4">Belum ada tugas. Yuk, tambah tugas baru!</li>';
    return;
  }

  currentTodos.forEach((todo) => {
    const li = document.createElement('li');
    li.className =
      'flex justify-between items-center bg-slate-800 p-3 rounded-lg border-l-4 border-blue-500 shadow-sm border-y border-r border-slate-700';

    if (todo.isCompleted) {
      li.classList.add('opacity-50', 'line-through');
    }

    const infoDiv = document.createElement('div');
    infoDiv.className = 'flex flex-col min-w-0 mr-3';

    const span = document.createElement('span');
    span.textContent = todo.title;
    span.className = 'font-medium text-slate-200 truncate';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'text-xs mt-1';
    if (todo.dueDate) {
      dateSpan.textContent = formatTanggal(todo.dueDate);
      dateSpan.classList.add('text-slate-400');
    } else {
      dateSpan.textContent = 'Hari dan tanggal belum diisi';
      dateSpan.classList.add('text-amber-500', 'italic');
    }

    infoDiv.appendChild(span);
    infoDiv.appendChild(dateSpan);

    const actionDiv = document.createElement('div');
    actionDiv.className = 'flex items-center gap-2 shrink-0';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.title = todo.isCompleted ? 'Tandai belum selesai' : 'Tandai selesai';
    toggleBtn.setAttribute('aria-label', toggleBtn.title);
    toggleBtn.className = `w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-white ${
      todo.isCompleted
        ? 'bg-slate-600 hover:bg-slate-500'
        : 'bg-emerald-600 hover:bg-emerald-500'
    }`;
    toggleBtn.innerHTML = todo.isCompleted
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    toggleBtn.onclick = () => {
      app.toggleTodoStatus(todo.id);
      renderTodos();
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.title = 'Hapus tugas';
    deleteBtn.setAttribute('aria-label', 'Hapus tugas');
    deleteBtn.className =
      'w-9 h-9 flex items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors';
    deleteBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';
    deleteBtn.onclick = () => {
      if (confirm(`Hapus tugas: "${todo.title}"?`)) {
        app.deleteTodo(todo.id);
        renderTodos();
      }
    };

    actionDiv.appendChild(toggleBtn);
    actionDiv.appendChild(deleteBtn);
    li.appendChild(infoDiv);
    li.appendChild(actionDiv);
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
    renderTodos();
  }
});

app.init();
renderTodos();
