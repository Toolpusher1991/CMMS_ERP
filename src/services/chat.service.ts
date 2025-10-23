import { apiClient } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface QuickAction {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge?: number;
}

export interface ChatResponse {
  message: string;
  conversationHistory: ChatMessage[];
}

class ChatService {
  private conversationHistory: ChatMessage[] = [];
  private readonly STORAGE_KEY = 'chatbot_conversation';

  constructor() {
    this.loadConversation();
  }

  // Save conversation to localStorage
  private saveConversation() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.conversationHistory));
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  // Load conversation from localStorage
  private loadConversation() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.conversationHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      this.conversationHistory = [];
    }
  }

  // Send message to chatbot
  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      const response = await apiClient.post<ChatResponse>('/chatbot/chat', {
        message,
        conversationHistory: this.conversationHistory,
      });

      // Update conversation history
      this.conversationHistory = response.conversationHistory;
      this.saveConversation();

      return response;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  // Get quick action suggestions
  async getQuickActions(): Promise<QuickAction[]> {
    try {
      const response = await apiClient.get<{ suggestions: QuickAction[] }>('/chatbot/quick-actions');
      return response.suggestions;
    } catch (error) {
      console.error('Failed to load quick actions:', error);
      return [];
    }
  }

  // Get conversation history
  getHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  // Clear conversation
  clearConversation() {
    this.conversationHistory = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Add message to history (for optimistic updates)
  addMessage(message: ChatMessage) {
    this.conversationHistory.push(message);
    this.saveConversation();
  }
}

export const chatService = new ChatService();
