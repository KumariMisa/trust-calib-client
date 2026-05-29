// Frontend API client for Claude AI Clone Backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  id: string;
  name: string;
  username: string;
  created_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

// Helper to make API calls with credentials (cookies)
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Ensure session cookies are sent/received
  });

  if (!response.ok) {
    let errorDetail = 'API call failed';
    try {
      const errData = await response.json();
      errorDetail = errData.detail || errorDetail;
    } catch {
      try {
        errorDetail = await response.text();
      } catch {}
    }
    throw new Error(errorDetail);
  }

  // Handle empty responses (like logout / delete)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  try {
    return await response.json() as T;
  } catch {
    return {} as T;
  }
}

export const authAPI = {
  async register(name: string, username: string, password: string): Promise<User> {
    return fetchAPI<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, username, password }),
    });
  },

  async login(username: string, password: string): Promise<User> {
    return fetchAPI<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async logout(): Promise<{ message: string }> {
    return fetchAPI<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  async me(): Promise<User> {
    return fetchAPI<User>('/auth/me');
  },
};

export const conversationsAPI = {
  async list(): Promise<Conversation[]> {
    return fetchAPI<Conversation[]>('/conversations');
  },

  async get(id: string): Promise<ConversationDetail> {
    return fetchAPI<ConversationDetail>(`/conversations/${id}`);
  },

  async create(title?: string): Promise<Conversation> {
    return fetchAPI<Conversation>('/conversations/new', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  async rename(id: string, title: string): Promise<Conversation> {
    return fetchAPI<Conversation>(`/conversations/${id}/rename`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return fetchAPI<{ message: string }>(`/conversations/${id}`, {
      method: 'DELETE',
    });
  },
};

// SSE streaming function for sending messages
export async function sendChatMessageStream(
  conversationId: string,
  message: string,
  modelName: string,
  onToken: (token: string) => void,
  onNodeStart?: (nodeName: string) => void,
  onNodeEnd?: (nodeName: string) => void,
  onError?: (err: string) => void
) {
  const url = `${API_URL}/chat/send`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: message,
        model: modelName,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMsg = 'Failed to send message';
      try {
        const errJson = await response.json();
        errorMsg = errJson.detail || errorMsg;
      } catch {
        errorMsg = await response.text() || errorMsg;
      }
      throw new Error(errorMsg);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() || '';

      for (const part of parts) {
        const lines = part.split(/\r?\n/);
        let event = '';
        let dataStr = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            event = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            dataStr = line.substring(5).trim();
          }
        }

        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            const eventName = event || data.event;
            
            if (eventName === 'token') {
              onToken(data.text || '');
            } else if (eventName === 'node_start') {
              if (onNodeStart) onNodeStart(data.node || '');
            } else if (eventName === 'node_end') {
              if (onNodeEnd) onNodeEnd(data.node || '');
            } else if (eventName === 'error') {
              if (onError) onError(data.detail || 'Streaming error');
            }
          } catch (e) {
            console.error('Failed to parse SSE data JSON:', e, dataStr);
          }
        }
      }
    }
  } catch (error: any) {
    if (onError) {
      onError(error.message || String(error));
    }
  }
}
