export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  businessId?: string;
  businessName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

const CONVERSATIONS_KEY = "caramelinho_conversations";
const MESSAGES_KEY = "caramelinho_messages";

function getConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(c: Conversation[]): void {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(c));
}

function getMessages(): Message[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(m: Message[]): void {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(m));
}

function generateId(): string {
  return "msg_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

export function getOrCreateConversation(
  senderId: string,
  receiverId: string,
  businessId?: string,
  businessName?: string
): Conversation {
  const conversations = getConversations();
  const existing = conversations.find(
    (c) =>
      c.participants.includes(senderId) &&
      c.participants.includes(receiverId) &&
      (businessId ? c.businessId === businessId : true)
  );
  if (existing) return existing;

  const newConv: Conversation = {
    id: generateId(),
    participants: [senderId, receiverId],
    businessId,
    businessName,
    createdAt: new Date().toISOString(),
  };
  conversations.push(newConv);
  saveConversations(conversations);
  return newConv;
}

export function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string
): Message {
  const message: Message = {
    id: generateId(),
    conversationId,
    senderId,
    senderName,
    text,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const messages = getMessages();
  messages.push(message);
  saveMessages(messages);

  // Update conversation
  const conversations = getConversations();
  const conv = conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.lastMessage = text;
    conv.lastMessageAt = message.createdAt;
    saveConversations(conversations);
  }

  return message;
}

export function getConversationsForUser(userId: string): Conversation[] {
  return getConversations()
    .filter((c) => c.participants.includes(userId))
    .sort((a, b) => (b.lastMessageAt || b.createdAt).localeCompare(a.lastMessageAt || a.createdAt));
}

export function getMessagesForConversation(conversationId: string): Message[] {
  return getMessages()
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function markConversationAsRead(conversationId: string, userId: string): void {
  const messages = getMessages();
  let changed = false;
  messages.forEach((m) => {
    if (m.conversationId === conversationId && m.senderId !== userId && !m.read) {
      m.read = true;
      changed = true;
    }
  });
  if (changed) saveMessages(messages);
}

export function getUnreadCount(userId: string): number {
  return getMessages().filter((m) => {
    const conv = getConversations().find((c) => c.id === m.conversationId);
    return conv && conv.participants.includes(userId) && m.senderId !== userId && !m.read;
  }).length;
}

export function getConversationPartner(conversation: Conversation, userId: string): string {
  return conversation.participants.find((p) => p !== userId) || "";
}
