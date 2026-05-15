export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  bio: string;
  phone: string;
  location: string;
  avatar: string;
  createdAt: string;
  emailVerified: boolean;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
}

const USERS_KEY = "caramelinho_users";
const SESSION_KEY = "caramelinho_session";

function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function generateId(): string {
  return "u_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

export function registerUser(email: string, password: string, name: string): { success: boolean; error?: string } {
  const users = getUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: "Este email já está cadastrado." };
  }
  const newUser: User = {
    id: generateId(),
    email: email.toLowerCase(),
    password,
    name,
    bio: "",
    phone: "",
    location: "",
    avatar: "",
    createdAt: new Date().toISOString(),
    emailVerified: false,
  };
  users.push(newUser);
  saveUsers(users);
  return { success: true };
}

export function loginUser(email: string, password: string): { success: boolean; session?: AuthSession; error?: string } {
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return { success: false, error: "Email não encontrado." };
  }
  if (user.password !== password) {
    return { success: false, error: "Senha incorreta." };
  }
  const session: AuthSession = { userId: user.id, email: user.email, name: user.name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, session };
}

export function logoutUser(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function updateUser(id: string, updates: Partial<Omit<User, "id" | "email" | "password" | "createdAt">>): boolean {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  // Update session if name changed
  const session = getSession();
  if (session && session.userId === id && updates.name) {
    session.name = updates.name;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return true;
}

export function verifyUserEmail(id: string): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    users[idx].emailVerified = true;
    saveUsers(users);
  }
}
