# Collabzy Backend API

Backend server for Collabzy - Automated Influencer-Brand Marketplace Platform

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables:
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and add your configuration:
# - MongoDB URI
# - JWT Secret
# - YouTube API Key
```

3. Start MongoDB (if using local):
```bash
mongod
```

4. Run the server:

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── models/                # Mongoose schemas (to be added)
├── routes/                # API routes (to be added)
├── controllers/           # Business logic (to be added)
├── middleware/            # Auth & validation (to be added)
├── services/              # External APIs (YouTube, etc.)
├── server.js              # Main entry point
├── package.json           # Dependencies
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Example environment variables
└── .gitignore             # Git ignore rules
```

## 🔧 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🌐 API Endpoints

### Health Check
- `GET /api/health` - Check if server is running

### Coming Soon
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/influencers` - List influencers
- `POST /api/campaigns` - Create campaign
- And more...

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment (development/production) | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/collabzy |
| `JWT_SECRET` | Secret key for JWT tokens | - |
| `JWT_EXPIRE` | JWT token expiration | 7d |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | - |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |

## 🛠 Technologies

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **express-rate-limit** - Rate limiting
- **Joi** - Validation
- **dotenv** - Environment variables

## 📝 Next Steps

1. ✅ Backend folder structure created
2. ⏳ Install dependencies: `npm install`
3. ⏳ Set up MongoDB database
4. ⏳ Create User model
5. ⏳ Implement authentication routes
6. ⏳ Add YouTube API integration
7. ⏳ Create Campaign & Application models
8. ⏳ Implement real-time chat with Socket.io

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- For MongoDB Atlas, whitelist your IP address

### Port Already in Use
- Change PORT in .env file
- Or kill the process using the port

### Module Not Found
- Run `npm install` to install dependencies

## 📄 License

ISC
