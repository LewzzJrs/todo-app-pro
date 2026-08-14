import './style.css';

interface ITodo {
  id: number;
  title: string;
  isCompleted: boolean;
}

class Todo implements ITodo {
  id: number;
  title: string;
  isCompleted: boolean;

  constructor(id: number, title: string, isCompleted: boolean = false) {
    this.id = id;
    this.title = title;
    this.isCompleted = isCompleted;
  }
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

  addTodo(title: string): Todo {
    if (!title || title.trim() === '') {
      throw new Error('Judul tugas tidak boleh kosong');
    }
    const newTodo = new Todo(Date.now(), title.trim());
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

  async fetchInitialTodos(): Promise<void> {
    try {
      if (this.loadData()) return;

      const response = await fetch(
        'https://jsonplaceholder.typicode.com/todos?_limit=5'
      );
      if (!response.ok) throw new Error('Gagal mengambil data dari server');

      interface ApiTodo {
        id: number;
        title: string;
        completed: boolean;
      }

      const data: ApiTodo[] = await response.json();

      const tugasKeren: string[] = [
        'Latihan TypeScript murni',
        'Eksplorasi utilitas Tailwind CSS',
        'Bikin beat baru di Ableton',
        'Nongkrong di Tomoro Coffee',
        'Bedah soal logika Mensa',
      ];

      data.forEach((item, index) => {
        const newTodo = new Todo(item.id, tugasKeren[index], false);
        this.todos.push(newTodo);
      });

      this.saveData();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Terjadi kesalahan', error.message);
      }
    }
  }
}

const app = new TodoList();

const todoForm = document.getElementById('todo-form') as HTMLFormElement;
const todoInput = document.getElementById('todo-input') as HTMLInputElement;
const todoListElement = document.getElementById(
  'todo-list'
) as HTMLUListElement;

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

    const span = document.createElement('span');
    span.textContent = todo.title;
    span.className = 'font-medium text-slate-200';

    const actionDiv = document.createElement('div');
    actionDiv.className = 'flex gap-2';

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = todo.isCompleted ? 'Batal' : 'Selesai';
    toggleBtn.className = `px-3 py-1 rounded text-sm font-semibold transition-colors text-white ${
      todo.isCompleted
        ? 'bg-slate-600 hover:bg-slate-500'
        : 'bg-emerald-600 hover:bg-emerald-500'
    }`;
    toggleBtn.onclick = () => {
      app.toggleTodoStatus(todo.id);
      renderTodos();
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Hapus';
    deleteBtn.className =
      'px-3 py-1 rounded text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors';
    deleteBtn.onclick = () => {
      if (confirm(`Hapus tugas: "${todo.title}"?`)) {
        app.deleteTodo(todo.id);
        renderTodos();
      }
    };

    actionDiv.appendChild(toggleBtn);
    actionDiv.appendChild(deleteBtn);
    li.appendChild(span);
    li.appendChild(actionDiv);
    todoListElement.appendChild(li);
  });
}

todoForm.addEventListener('submit', (event: Event) => {
  event.preventDefault();
  try {
    app.addTodo(todoInput.value);
    todoInput.value = '';
    renderTodos();
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    }
  }
});

app.fetchInitialTodos().then(() => {
  renderTodos();
});
