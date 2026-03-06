import { EventEmitter } from "events";

class SSEManager extends EventEmitter {
  private static instance: SSEManager;
  private users: Map<string, Set<ReadableStreamDefaultController>> = new Map();

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  public static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  /**
   * Register a user's controller for SSE events.
   */
  public addUser(userId: string, controller: ReadableStreamDefaultController) {
    if (!this.users.has(userId)) {
      this.users.set(userId, new Set());
    }
    this.users.get(userId)?.add(controller);
    
    // Send initial keep-alive
    this.sendToUser(userId, { type: "KEEP_ALIVE", timestamp: Date.now() });
  }

  /**
   * Remove a user's controller on disconnect.
   */
  public removeUser(userId: string, controller: ReadableStreamDefaultController) {
    const userControllers = this.users.get(userId);
    if (userControllers) {
      userControllers.delete(controller);
      if (userControllers.size === 0) {
        this.users.delete(userId);
      }
    }
  }

  /**
   * Send an event to all active sessions of a specific user.
   */
  public sendToUser(userId: string, data: any) {
    const userControllers = this.users.get(userId);
    if (userControllers) {
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      const encoder = new TextEncoder();
      
      userControllers.forEach((controller) => {
        try {
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          // Controller might be closed
          this.removeUser(userId, controller);
        }
      });
    }
  }

  /**
   * Broadcast an event to all connected users (e.g., live bidding update).
   */
  public broadcast(data: any) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    
    this.users.forEach((controllers, userId) => {
      controllers.forEach((controller) => {
        try {
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          this.removeUser(userId, controller);
        }
      });
    });
  }
}

export const sseManager = SSEManager.getInstance();
