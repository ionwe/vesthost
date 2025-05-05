class NotificationManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'error') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = document.createElement('span');
        icon.className = 'notification-icon';
        icon.innerHTML = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        
        const text = document.createElement('span');
        text.className = 'notification-text';
        text.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => this.close(notification);
        
        notification.appendChild(icon);
        notification.appendChild(text);
        notification.appendChild(closeBtn);
        
        this.container.appendChild(notification);
        
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        
        setTimeout(() => {
            this.close(notification);
        }, 5000);
    }

    close(notification) {
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        
        notification.addEventListener('animationend', () => {
            notification.remove();
        });
    }
}


window.notifications = new NotificationManager(); 