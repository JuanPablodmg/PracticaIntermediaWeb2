import { EventEmitter } from 'events';

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this._registerListeners();
  }

  _registerListeners() {
    this.on('user:registered', ({ email }) => {
      console.log(`[EVENT] user:registered → ${email}`);
    });

    this.on('user:verified', ({ email }) => {
      console.log(`[EVENT] user:verified → ${email}`);
    });

    this.on('user:invited', ({ email, company }) => {
      console.log(`[EVENT] user:invited → ${email} a empresa ${company}`);
    });

    this.on('user:deleted', ({ email, soft }) => {
      console.log(`[EVENT] user:deleted → ${email} (${soft ? 'soft' : 'hard'})`);
    });
  }
}

export const notificationService = new NotificationService();
