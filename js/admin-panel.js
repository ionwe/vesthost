async function checkAndShowAdminPanel() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const response = await fetch(`/api/user/${userId}`);
        const user = await response.json();
        
        if (user.role === 'admin') {
            const adminPanels = document.querySelectorAll('#adminPanel');
            adminPanels.forEach(panel => {
                panel.style.display = 'block';
            });

            await loadVideosList();
        }
    } catch (error) {
        console.error('Ошибка при проверке админских прав:', error);
    }
}


let allUsers = [];

async function showAllUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        allUsers = users;
        renderUsersList(users);
        notifications.show(`Всего пользователей: ${users.length}`, 'info');
    } catch (error) {
        notifications.show('Ошибка при получении списка пользователей', 'error');
    }
}

function renderUsersList(users) {
    let html = `
        <div class="users-search-container">
            <input type="text" id="userSearchInput" class="user-search-input" placeholder="Поиск по имени или email..." oninput="filterUsersList()">
        </div>
        <div class="users-list">
            ${users.map(user => `
                <div class="user-item">
                    <input class="user-name-edit" type="text" value="${user.username}" onchange="updateUserName(${user.id}, this.value)">
                    <span class="user-email">${user.email}</span>
                    <select class="user-role-select" onchange="updateUserRole(${user.id}, this.value)">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>Пользователь</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
                    </select>
                    <button class="user-delete-btn" onclick="deleteUser(${user.id})">Удалить</button>
                </div>
            `).join('')}
        </div>
    `;
    const videosListContainer = document.getElementById('videosList');
    if (videosListContainer) {
        videosListContainer.innerHTML = html;
    }
}

window.filterUsersList = function() {
    const value = document.getElementById('userSearchInput').value.toLowerCase();
    const filtered = allUsers.filter(user =>
        user.username.toLowerCase().includes(value) ||
        user.email.toLowerCase().includes(value)
    );
    renderUsersList(filtered);
}

window.deleteUser = async function(id) {
    if (!confirm('Удалить пользователя?')) return;
    try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            notifications.show('Пользователь удалён', 'success');
            showAllUsers();
        } else {
            notifications.show('Ошибка при удалении пользователя', 'error');
        }
    } catch {
        notifications.show('Ошибка при удалении пользователя', 'error');
    }
}

window.updateUserRole = async function(id, role) {
    try {
        const res = await fetch(`/api/users/${id}/role`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
        if (res.ok) {
            notifications.show('Роль обновлена', 'success');
        } else {
            notifications.show('Ошибка при обновлении роли', 'error');
        }
    } catch {
        notifications.show('Ошибка при обновлении роли', 'error');
    }
}

window.updateUserName = async function(id, username) {
    try {
        const res = await fetch(`/api/users/${id}/username`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        if (res.ok) {
            notifications.show('Имя пользователя обновлено', 'success');
        } else {
            notifications.show('Ошибка при обновлении имени', 'error');
        }
    } catch {
        notifications.show('Ошибка при обновлении имени', 'error');
    }
}


async function loadVideosList() {
    try {
        const userId = localStorage.getItem('userId');
        const response = await fetch(`/api/videos?userId=${userId}`);
        const videos = await response.json();
        
        const videosListContainer = document.getElementById('videosList');
        if (!videosListContainer) return;

        videosListContainer.innerHTML = `
            <h3>Список видео</h3>
            <div class="videos-list">
                ${videos.map(video => `
                    <div class="video-item" data-video-id="${video.id}">
                        <div class="video-info">
                            <span class="video-title">${video.title}</span>
                            <span class="video-status ${video.is_private ? 'restricted' : ''}">
                                ${video.is_private ? 'Ограничено' : 'Доступно'}
                            </span>
                        </div>
                        <div class="video-actions">
                            <button onclick="toggleVideoRestriction(${video.id}, ${!video.is_private})">
                                ${video.is_private ? 'Снять ограничение' : 'Ограничить'}
                            </button>
                            <button onclick="deleteVideo(${video.id})">Удалить</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        notifications.show('Ошибка при загрузке списка видео', 'error');
    }
}


async function toggleVideoRestriction(videoId, restrict) {
    try {
        const response = await fetch(`/api/videos/${videoId}/restrict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ restricted: restrict })
        });

        if (response.ok) {
            notifications.show(
                restrict ? 'Видео ограничено' : 'Ограничение снято',
                'success'
            );
            await loadVideosList(); 
        } else {
            throw new Error('Ошибка при изменении статуса видео');
        }
    } catch (error) {
        notifications.show('Ошибка при изменении статуса видео', 'error');
    }
}


async function deleteVideo(videoId) {
    if (!confirm('Вы уверены, что хотите удалить это видео?')) return;

    try {
        const response = await fetch(`/api/videos/${videoId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            notifications.show('Видео успешно удалено', 'success');
            await loadVideosList(); 
        } else {
            throw new Error('Ошибка при удалении видео');
        }
    } catch (error) {
        notifications.show('Ошибка при удалении видео', 'error');
    }
}


document.addEventListener('DOMContentLoaded', checkAndShowAdminPanel); 