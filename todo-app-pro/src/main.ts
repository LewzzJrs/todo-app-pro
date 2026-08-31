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

const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
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

type HistoryAction = 'completed' | 'deleted';

interface HistoryEntry {
  id: number;
  title: string;
  action: HistoryAction;
  timestamp: number;
}

function formatWaktu(timestamp: number): string {
  const d = new Date(timestamp);
  const tanggal = String(d.getDate()).padStart(2, '0');
  const bulan = String(d.getMonth() + 1).padStart(2, '0');
  const jam = String(d.getHours()).padStart(2, '0');
  const menit = String(d.getMinutes()).padStart(2, '0');
  return `${tanggal}/${bulan} ${jam}:${menit}`;
}

class TodoList {
  private todos: Todo[] = [];
  private availableMonths: Set<string> = new Set();
  private history: HistoryEntry[] = [];

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

  private saveMonths(): void {
    localStorage.setItem(
      'bulan_tersedia',
      JSON.stringify(Array.from(this.availableMonths))
    );
  }

  private loadMonths(): void {
    const dataTersimpan = localStorage.getItem('bulan_tersedia');
    if (dataTersimpan) {
      this.availableMonths = new Set(JSON.parse(dataTersimpan));
    }
  }

  private registerMonth(dueDate?: string): void {
    if (!dueDate) return;
    const key = dueDate.slice(0, 7);
    if (!this.availableMonths.has(key)) {
      this.availableMonths.add(key);
      this.saveMonths();
    }
  }

  getAvailableMonths(): string[] {
    return Array.from(this.availableMonths).sort();
  }

  private saveHistoryLog(): void {
    localStorage.setItem('riwayat_tugas', JSON.stringify(this.history));
  }

  private loadHistoryLog(): void {
    const dataTersimpan = localStorage.getItem('riwayat_tugas');
    if (dataTersimpan) {
      this.history = JSON.parse(dataTersimpan);
    }
  }

  private logHistory(title: string, action: HistoryAction): void {
    this.history.unshift({
      id: Date.now() + Math.random(),
      title,
      action,
      timestamp: Date.now(),
    });
    this.saveHistoryLog();
  }

  getHistory(): HistoryEntry[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
    localStorage.removeItem('riwayat_tugas');
    this.availableMonths = new Set();
    localStorage.removeItem('bulan_tersedia');
  }

  private validateTitle(title: string): string {
    if (!title || title.trim() === '') {
      throw new Error('Judul tugas tidak boleh kosong');
    }
    return title.trim();
  }

  addTodo(title: string, dueDate?: string): Todo {
    const normalizedDate = dueDate ? normalizeDate(dueDate) : undefined;
    const newTodo = new Todo(
      Date.now(),
      this.validateTitle(title),
      false,
      normalizedDate
    );
    this.todos.push(newTodo);
    this.saveData();
    this.registerMonth(normalizedDate);
    return newTodo;
  }

  updateTodo(id: number, title: string, dueDate?: string): void {
    const todo = this.todos.find((todo) => todo.id === id);
    if (!todo) return;
    todo.title = this.validateTitle(title);
    todo.dueDate = dueDate ? normalizeDate(dueDate) : undefined;
    this.saveData();
    this.registerMonth(todo.dueDate);
  }

  deleteTodo(id: number): void {
    const todo = this.todos.find((todo) => todo.id === id);
    this.todos = this.todos.filter((todo) => todo.id !== id);
    this.saveData();
    if (todo) this.logHistory(todo.title, 'deleted');
  }

  toggleTodoStatus(id: number): void {
    const todo = this.todos.find((todo) => todo.id === id);
    if (todo) {
      todo.isCompleted = !todo.isCompleted;
      this.saveData();
      if (todo.isCompleted) this.logHistory(todo.title, 'completed');
    }
  }

  getTodos(): Todo[] {
    return this.todos;
  }

  clearAll(): void {
    this.todos.forEach((todo) => this.logHistory(todo.title, 'deleted'));
    this.todos = [];
    localStorage.removeItem('tugas_ts');
  }

  restoreTodo(todo: Todo): void {
    this.todos.push(todo);
    this.saveData();
    this.registerMonth(todo.dueDate);
  }

  restoreAll(todos: Todo[]): void {
    this.todos = todos;
    this.saveData();
    todos.forEach((todo) => this.registerMonth(todo.dueDate));
  }

  init(): void {
    this.loadData();
    this.loadMonths();
    this.loadHistoryLog();
  }
}

type Filter = 'all' | 'active' | 'completed';

const app = new TodoList();
let currentFilter: Filter = 'all';
let editingId: number | null = null;
let selectedMonth: string | null = null;

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
const toastContainer = document.getElementById(
  'toast-container'
) as HTMLDivElement;
const monthListElement = document.getElementById(
  'month-list'
) as HTMLDivElement;
const historyListElement = document.getElementById(
  'history-list'
) as HTMLDivElement;
const clearHistoryBtn = document.getElementById(
  'clear-history-btn'
) as HTMLButtonElement;
const reminderBannerElement = document.getElementById(
  'reminder-banner'
) as HTMLDivElement;

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
const ICON_CLOSE_SM =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

interface ToastOptions {
  message: string;
  type?: 'default' | 'error';
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

function showToast(options: ToastOptions): void {
  const { message, type = 'default', actionLabel, onAction, duration = 4000 } = options;

  const toast = document.createElement('div');
  toast.className = `flex items-center justify-between gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm transition-all duration-200 opacity-0 translate-y-2 ${
    type === 'error'
      ? 'bg-rose-950 border-rose-800 text-rose-200'
      : 'bg-slate-800 border-slate-700 text-slate-200'
  }`;

  const text = document.createElement('span');
  text.textContent = message;
  text.className = 'flex-1';

  const controls = document.createElement('div');
  controls.className = 'flex items-center gap-2 shrink-0';

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(timer);
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 200);
  };

  if (actionLabel && onAction) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.textContent = actionLabel;
    actionBtn.className =
      'font-semibold text-blue-400 hover:text-blue-300 transition-colors';
    actionBtn.onclick = () => {
      onAction();
      dismiss();
    };
    controls.appendChild(actionBtn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Tutup notifikasi');
  closeBtn.className = 'text-slate-500 hover:text-slate-300 transition-colors';
  closeBtn.innerHTML = ICON_CLOSE_SM;
  closeBtn.onclick = dismiss;
  controls.appendChild(closeBtn);

  toast.appendChild(text);
  toast.appendChild(controls);
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
  });

  const timer = setTimeout(dismiss, duration);
}

interface TypeConfirmOptions {
  title: string;
  description: string;
  confirmPhrase: string;
  confirmLabel: string;
  onConfirm: () => void;
}

function showTypeConfirmModal(options: TypeConfirmOptions): void {
  const { title, description, confirmPhrase, confirmLabel, onConfirm } = options;

  const overlay = document.createElement('div');
  overlay.className =
    'fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4';

  const card = document.createElement('div');
  card.className =
    'w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl';

  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.className = 'text-lg font-bold text-white mb-1';

  const descEl = document.createElement('p');
  descEl.className = 'text-sm text-slate-400 mb-4';
  descEl.innerHTML = `${description} Ketik <span class="font-mono text-rose-400">"${confirmPhrase}"</span> untuk lanjut.`;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = confirmPhrase;
  input.autocomplete = 'off';
  input.className =
    'w-full px-3 py-2 mb-4 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-white placeholder-slate-600';

  const btnRow = document.createElement('div');
  btnRow.className = 'flex justify-end gap-2';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Batal';
  cancelBtn.className =
    'px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors';

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.textContent = confirmLabel;
  confirmBtn.disabled = true;

  const updateConfirmBtn = () => {
    const isMatch = input.value.trim().toLowerCase() === confirmPhrase.toLowerCase();
    confirmBtn.disabled = !isMatch;
    confirmBtn.className = `px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 text-white transition-colors ${
      isMatch ? 'hover:bg-rose-500' : 'opacity-40 cursor-not-allowed'
    }`;
  };
  updateConfirmBtn();

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKeydown);
  };

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') close();
    if (event.key === 'Enter' && !confirmBtn.disabled) {
      onConfirm();
      close();
    }
  }

  input.addEventListener('input', updateConfirmBtn);
  document.addEventListener('keydown', onKeydown);

  cancelBtn.onclick = close;
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  confirmBtn.onclick = () => {
    if (confirmBtn.disabled) return;
    onConfirm();
    close();
  };

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(confirmBtn);
  card.appendChild(titleEl);
  card.appendChild(descEl);
  card.appendChild(input);
  card.appendChild(btnRow);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  input.focus();
}

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

function getMonthsWithCounts(): { key: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  app.getTodos().forEach((todo) => {
    if (!todo.dueDate) return;
    const key = todo.dueDate.slice(0, 7);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return app.getAvailableMonths().map((key) => {
    const [year, month] = key.split('-').map(Number);
    return {
      key,
      label: `${NAMA_BULAN[month - 1]} ${year}`,
      count: counts.get(key) ?? 0,
    };
  });
}

function getVisibleTodos(): Todo[] {
  const todos = app.getTodos().slice();

  const filtered = todos.filter((todo) => {
    if (currentFilter === 'active' && todo.isCompleted) return false;
    if (currentFilter === 'completed' && !todo.isCompleted) return false;
    if (selectedMonth && !todo.dueDate?.startsWith(selectedMonth)) return false;
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

function sidebarBtnClass(isActive: boolean): string {
  return `text-left px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
  }`;
}

function renderSidebar(): void {
  const months = getMonthsWithCounts();

  monthListElement.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.textContent = `Semua (${app.getTodos().length})`;
  allBtn.className = sidebarBtnClass(selectedMonth === null);
  allBtn.onclick = () => {
    selectedMonth = null;
    renderTodos();
  };
  monthListElement.appendChild(allBtn);

  months.forEach((month) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `${month.label} (${month.count})`;
    btn.className = sidebarBtnClass(selectedMonth === month.key);
    btn.onclick = () => {
      selectedMonth = month.key;
      renderTodos();
    };
    monthListElement.appendChild(btn);
  });
}

function renderHistory(): void {
  const entries = app.getHistory();
  historyListElement.innerHTML = '';

  if (entries.length === 0) {
    historyListElement.innerHTML =
      '<p class="text-xs text-slate-600 px-1">Belum ada riwayat.</p>';
    return;
  }

  entries.forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'flex items-start justify-between gap-2 px-1 py-1 text-xs';

    const left = document.createElement('div');
    left.className = 'min-w-0';

    const title = document.createElement('p');
    title.textContent = entry.title;
    title.className = 'text-slate-300 truncate';

    const time = document.createElement('p');
    time.textContent = formatWaktu(entry.timestamp);
    time.className = 'text-slate-600';

    left.appendChild(title);
    left.appendChild(time);

    const badge = document.createElement('span');
    badge.textContent = entry.action === 'completed' ? 'Selesai' : 'Dihapus';
    badge.className = `shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
      entry.action === 'completed'
        ? 'bg-emerald-500/20 text-emerald-400'
        : 'bg-rose-500/20 text-rose-400'
    }`;

    row.appendChild(left);
    row.appendChild(badge);
    historyListElement.appendChild(row);
  });
}

function updateCounter(): void {
  const activeCount = app.getTodos().filter((t) => !t.isCompleted).length;
  todoCounter.textContent =
    activeCount === 0 ? 'Semua beres' : `${activeCount} tugas tersisa`;
}

function getDueTodayOrOverdue(): Todo[] {
  const today = getTodayStr();
  return app.getTodos().filter((t) => !t.isCompleted && t.dueDate && t.dueDate <= today);
}

function requestNotificationPermission(): void {
  if (!('Notification' in window)) return;
  Notification.requestPermission().then(() => {
    renderReminderBanner();
    notifyDueTasks();
  });
}

function notifyDueTasks(): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const due = getDueTodayOrOverdue();
  if (due.length === 0) return;

  const titles = due.slice(0, 3).map((t) => t.title).join(', ');
  new Notification('Jangan lupa tugasmu!', {
    body: `${due.length} tugas jatuh tempo hari ini/terlambat: ${titles}${
      due.length > 3 ? ', ...' : ''
    }`,
    icon: '/favicon.svg',
  });
}

function renderReminderBanner(): void {
  const due = getDueTodayOrOverdue();
  reminderBannerElement.innerHTML = '';

  if (due.length === 0) return;

  const box = document.createElement('div');
  box.className =
    'mb-6 p-3 rounded-lg border border-amber-800 bg-amber-950/40 flex items-center justify-between gap-3 text-sm';

  const text = document.createElement('span');
  text.className = 'text-amber-300';
  text.textContent = `${due.length} tugas jatuh tempo hari ini atau terlambat — jangan lupa!`;
  box.appendChild(text);

  if ('Notification' in window && Notification.permission === 'default') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Aktifkan Notifikasi';
    btn.className =
      'shrink-0 px-3 py-1 rounded-md text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors';
    btn.onclick = requestNotificationPermission;
    box.appendChild(btn);
  }

  reminderBannerElement.appendChild(box);
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
      if (error instanceof Error) showToast({ message: error.message, type: 'error' });
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
    app.deleteTodo(todo.id);
    if (editingId === todo.id) editingId = null;
    renderTodos();
    showToast({
      message: `Tugas "${todo.title}" dihapus`,
      actionLabel: 'Urungkan',
      onAction: () => {
        app.restoreTodo(todo);
        renderTodos();
      },
    });
  };

  actionDiv.appendChild(toggleBtn);
  actionDiv.appendChild(editBtn);
  actionDiv.appendChild(deleteBtn);
  li.appendChild(infoDiv);
  li.appendChild(actionDiv);
}

function renderTodos(): void {
  renderSidebar();
  renderHistory();
  renderReminderBanner();

  todoListElement.innerHTML = '';
  const visibleTodos = getVisibleTodos();

  updateFilterTabsUI();
  updateCounter();

  if (visibleTodos.length === 0) {
    let emptyMessage =
      currentFilter === 'active'
        ? 'Tidak ada tugas aktif. Semua beres!'
        : currentFilter === 'completed'
        ? 'Belum ada tugas yang selesai.'
        : 'Belum ada tugas. Yuk, tambah tugas baru!';
    if (selectedMonth) emptyMessage = 'Tidak ada tugas di bulan ini.';
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
      showToast({ message: error.message, type: 'error' });
    }
  }
});

clearAllBtn.addEventListener('click', () => {
  const snapshot = app.getTodos().slice();
  if (snapshot.length === 0) return;
  app.clearAll();
  editingId = null;
  renderTodos();
  showToast({
    message: `${snapshot.length} tugas dihapus`,
    actionLabel: 'Urungkan',
    duration: 5000,
    onAction: () => {
      app.restoreAll(snapshot);
      renderTodos();
    },
  });
});

clearHistoryBtn.addEventListener('click', () => {
  if (app.getHistory().length === 0 && app.getAvailableMonths().length === 0) return;
  showTypeConfirmModal({
    title: 'Hapus Riwayat?',
    description:
      'Semua catatan tugas selesai & dihapus, beserta daftar Filter Bulan, akan hilang permanen dan tidak bisa dikembalikan.',
    confirmPhrase: 'udah selesai',
    confirmLabel: 'Hapus Riwayat',
    onConfirm: () => {
      app.clearHistory();
      selectedMonth = null;
      renderTodos();
      showToast({ message: 'Riwayat dihapus' });
    },
  });
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
notifyDueTasks();
