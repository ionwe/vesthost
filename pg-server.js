const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

const pool = new Pool({
    user: 'postgres', 
    host: 'localhost',
    database: 'vestvideo',
    password: '178745', 
    port: 5432,
});

app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = Date.now() + ext;
        cb(null, name);
    }
});
const upload = multer({ storage });


app.post('/api/upload', upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'preview', maxCount: 1 }
]), async (req, res) => {
    const { user_id, title, description } = req.body;
    const file_path = '/uploads/' + req.files['video'][0].filename;
    let preview_path = null;
    if (req.files['preview']) {
        preview_path = '/uploads/' + req.files['preview'][0].filename;
    }
    await pool.query(
        'INSERT INTO videos (user_id, title, description, file_path, preview_path) VALUES ($1, $2, $3, $4, $5)',
        [user_id, title, description, file_path, preview_path]
    );
    res.json({ success: true });
});


app.get('/api/videos', async (req, res) => {
    const result = await pool.query('SELECT * FROM videos ORDER BY upload_date DESC');
    res.json(result.rows);
});


app.get('/api/video/:id', async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
    res.json(result.rows[0]);
});


app.get('/api/user-vote/:video_id/:user_id', async (req, res) => {
    const { video_id, user_id } = req.params;
    const like = await pool.query('SELECT 1 FROM video_likes WHERE video_id = $1 AND user_id = $2', [video_id, user_id]);
    if (like.rows.length > 0) return res.json({ vote: 'like' });
    const dislike = await pool.query('SELECT 1 FROM video_dislikes WHERE video_id = $1 AND user_id = $2', [video_id, user_id]);
    if (dislike.rows.length > 0) return res.json({ vote: 'dislike' });
    res.json({ vote: null });
});


app.get('/api/comments/:video_id', async (req, res) => {
    const { video_id } = req.params;
    const result = await pool.query(
        `SELECT c.*, COALESCE(u.username, 'Неизвестный') as username 
         FROM video_comments c 
         LEFT JOIN users u ON c.user_id = u.id 
         WHERE c.video_id = $1 
         ORDER BY c.created_at ASC`,
        [video_id]
    );
    res.json(result.rows);
});


app.post('/api/like', async (req, res) => {
    const { video_id, user_id } = req.body;

    await pool.query('DELETE FROM video_dislikes WHERE video_id = $1 AND user_id = $2', [video_id, user_id]);
    await pool.query(
        'INSERT INTO video_likes (video_id, user_id) VALUES ($1, $2) ON CONFLICT (video_id, user_id) DO NOTHING',
        [video_id, user_id]
    );
    res.json({ success: true });
});


app.post('/api/dislike', async (req, res) => {
    const { video_id, user_id } = req.body;
  
    await pool.query('DELETE FROM video_likes WHERE video_id = $1 AND user_id = $2', [video_id, user_id]);
    await pool.query(
        'INSERT INTO video_dislikes (video_id, user_id) VALUES ($1, $2) ON CONFLICT (video_id, user_id) DO NOTHING',
        [video_id, user_id]
    );
    res.json({ success: true });
});


app.get('/api/likes/:video_id', async (req, res) => {
    const { video_id } = req.params;
    const result = await pool.query('SELECT COUNT(*) FROM video_likes WHERE video_id = $1', [video_id]);
    res.json({ count: parseInt(result.rows[0].count, 10) });
});


app.get('/api/dislikes/:video_id', async (req, res) => {
    const { video_id } = req.params;
    const result = await pool.query('SELECT COUNT(*) FROM video_dislikes WHERE video_id = $1', [video_id]);
    res.json({ count: parseInt(result.rows[0].count, 10) });
});


app.post('/api/comment', async (req, res) => {
    const { video_id, user_id, comment } = req.body;
    await pool.query(
        'INSERT INTO video_comments (video_id, user_id, comment) VALUES ($1, $2, $3)',
        [video_id, user_id, comment]
    );
    res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query(
        'SELECT * FROM users WHERE (username = $1 OR email = $1) AND password = $2',
        [username, password]
    );
    console.log('LOGIN RESULT:', result.rows);
    if (result.rows.length > 0) {
        const user = result.rows[0];
        res.json({ success: true, username: user.username, role: user.role, email: user.email, userId: user.id });
    } else {
        res.status(401).json({ error: 'Неверные данные' });
    }
});


app.get('/api/user/:id', async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [id]);
    if (result.rows.length > 0) {
        res.json(result.rows[0]);
    } else {
        res.status(404).json({ error: 'Пользователь не найден' });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    const exists = await pool.query(
        'SELECT * FROM users WHERE username = $1 OR email = $2',
        [username, email]
    );
    if (exists.rows.length > 0) {
        return res.json({ success: false, error: 'Пользователь с таким именем или email уже существует' });
    }
    await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
        [username, email, password, 'user']
    );
    res.json({ success: true });
});

app.get('/api/users', async (req, res) => {
    const result = await pool.query('SELECT id, username, email, role FROM users ORDER BY id');
    res.json(result.rows);
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
});

app.post('/api/users/:id/role', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    res.json({ success: true });
});

app.post('/api/users/:id/username', async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, id]);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Postgres сервер запущен на http://localhost:${PORT}`);
}); 