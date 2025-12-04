class NotificationService {
  private permission: NotificationPermission = 'default';

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  isPermissionGranted(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  show(title: string, options?: NotificationOptions): void {
    if (!this.isPermissionGranted()) return;

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  showTimerStarted(): void {
    this.show('Timer Started! ⏱️', {
      body: 'Your task timer is now running.',
      tag: 'timer-status'
    });
  }

  showTimerStopped(taskName: string, duration: string): void {
    this.show('Timer Stopped! ✅', {
      body: `${taskName || 'Task'} completed - Duration: ${duration}`,
      tag: 'timer-status'
    });
  }

  showBreakReminder(minutes: number): void {
    this.show(`${minutes} Minutes Passed! 🔔`, {
      body: 'Take a quick break or switch task.',
      tag: 'break-reminder',
      requireInteraction: true
    });
  }
}

export const notificationService = new NotificationService();
