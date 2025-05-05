function checkAuth() {
    const isAuth = localStorage.getItem('isAuth');
    const authButtons = document.getElementById('authButtons');
    const profileMenu = document.getElementById('profileMenu');
    
    if (isAuth) {
        if (authButtons) authButtons.style.display = 'none';
        if (profileMenu) profileMenu.style.display = 'flex';
        updateProfileInfo();
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (profileMenu) profileMenu.style.display = 'none';
        if (window.location.pathname !== '/login.html' && window.location.pathname !== '/register.html') {
            window.location.href = 'login.html';
        }
    }
}

function logout() {
    localStorage.removeItem('isAuth');
    localStorage.removeItem('userId');
    window.location.href = 'login.html';
}

async function updateProfileInfo() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    try {
        const res = await fetch(`/api/user/${userId}`);
        if (!res.ok) return;
        const user = await res.json();
        const profileName = document.getElementById('profileName');
        if (profileName) profileName.textContent = user.username;
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
    }
}


document.addEventListener('DOMContentLoaded', checkAuth); 