from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_socketio import SocketIO, join_room, leave_room, emit
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
import random
import string
import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()
# Get credentials from environment variables
MONGO_URI = os.getenv('MONGO_URI')
SECRET_KEY = os.getenv('SECRET_KEY')


app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY

socketio = SocketIO(app, cors_allowed_origins="*")
bcrypt = Bcrypt(app)

# MongoDB Atlas Connection
client = MongoClient(MONGO_URI, server_api=ServerApi('1'))

# Test the connection
try:
    client.admin.command('ping')
    print("Connected successfully to MongoDB Atlas!")
except Exception as e:
    print(f"MongoDB Connection Error: {e}")

# Database & Collections
db = client['video_sync_db']
users_collection = db['users']
rooms_collection = db['rooms']

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin):
    def __init__(self, id, username):
        self.id = str(id)
        self.username = username

@login_manager.user_loader
def load_user(user_id):
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if user:
        return User(user['_id'], user['username'])
    return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = users_collection.find_one({'username': username})
        if user and bcrypt.check_password_hash(user['password'], password):
            login_user(User(user['_id'], user['username']))
            return redirect(url_for('dashboard'))
        flash('Invalid username or password', 'danger')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = bcrypt.generate_password_hash(request.form['password']).decode('utf-8')
        if users_collection.find_one({'username': username}):
            flash('Username already exists', 'danger')
        else:
            users_collection.insert_one({'username': username, 'password': password})
            flash('Registration successful, please login', 'success')
            return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', username=current_user.username)

@app.route('/create_room', methods=['POST'])
@login_required
def create_room():
    room_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    rooms_collection.insert_one({'code': room_code, 'host': current_user.username})
    return redirect(url_for('room_view', room_code=room_code))

@app.route('/room/<room_code>')
@login_required
def room_view(room_code):
    room = rooms_collection.find_one({'code': room_code})
    if not room:
        flash('Room not found', 'danger')
        return redirect(url_for('dashboard'))
    return render_template('room.html', room_code=room_code, username=current_user.username)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/join_room', methods=['POST'])
@login_required
def join_existing_room():
    room_code = request.form['room_code'].strip()
    room = rooms_collection.find_one({'code': room_code})
    
    if not room:
        flash('Room not found', 'danger')
        return redirect(url_for('dashboard'))
    
    # Redirecting to the correct room URL
    return redirect(url_for('room_view', room_code=room_code))





video_hosts = {}  # Dictionary to track the host of each room

@socketio.on('video_update')
def handle_video_update(data):
    room_code = data['room_code']
    video_id = data['video_id']
    emit('sync_video', {'video_id': video_id}, room=room_code)

@socketio.on('video_control')
def handle_video_control(data):
    room_code = data['room_code']
    state = data['state']  # 1 = play, 2 = pause
    emit('sync_control', {'state': state}, room=room_code)




user_rooms = {}
# WebSocket Events
@socketio.on('join')
def handle_join(data):
    room_code = data['room_code']
    username = data['username']

    room = rooms_collection.find_one({'code': room_code})
    if room:
        if 'users' not in room:
            room['users'] = []
        if username not in room['users']:
            room['users'].append(username)
            rooms_collection.update_one({'code': room_code}, {"$set": {"users": room['users']}})

    join_room(room_code)
    emit('update_users', {'users': room['users']}, room=room_code)



@socketio.on('leave')
def handle_leave(data):
    room_code = data['room_code']
    username = data['username']
    
    room = rooms_collection.find_one({'code': room_code})
    if not room:
        return

    users = room.get('users', [])
    if username in users:
        users.remove(username)
        rooms_collection.update_one({'code': room_code}, {'$set': {'users': users}})
    
    leave_room(room_code)
    emit('remove_user', {'users': users}, room=room_code)


@socketio.on('chat_message')
def handle_chat_message(data):
    emit('receive_message', data, room=data['room_code'])



if __name__ == '__main__':
    socketio.run(app, debug=True)
