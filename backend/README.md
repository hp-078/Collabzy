# Collabzy Backend API

Backend server for Collabzy - An automated influencer-brand marketplace platform.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Security**: Helmet, CORS, bcrypt, Rate Limiting

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
   - Set MongoDB connection string
   - Set JWT secret key
   - Configure CORS origin (your frontend URL)
   - Add YouTube API key (for automation features)

5. Start the server:

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT)

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /api/auth/register` - Register new user (brand/influencer)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `POST /api/auth/logout` - Logout user (Protected)

### User Routes (`/api/users`)

- Coming soon...

### Influencer Routes (`/api/influencers`)

- Coming soon...

### Campaign Routes (`/api/campaigns`)

- Coming soon...

### Application Routes (`/api/applications`)

- Coming soon...

## Database Schema

### Collections

1. **Users** - Authentication and base user data
2. **InfluencerProfiles** - Influencer-specific data with automation
3. **BrandProfiles** - Brand company information
4. **Campaigns** - Brand advertising campaigns
5. **Applications** - Influencer applications to campaigns
6. **Deals** - Confirmed collaborations (coming soon)
7. **Chats** - Messaging between brands and influencers (coming soon)
8. **Reviews** - Post-collaboration reviews (coming soon)

## Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt (salt rounds: 12)
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting (auth routes: 5 req/15min, API routes: 100 req/15min)
- ✅ Input validation with Joi
- ✅ Helmet security headers
- ✅ CORS protection
- ✅ MongoDB injection prevention
- ✅ Error handling middleware

## Testing API

Use these tools to test the API:

1. **Thunder Client** (VS Code extension)
2. **Postman**
3. **curl** (command line)

### Example Requests

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "influencer@example.com",
    "password": "password123",
    "role": "influencer"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "influencer@example.com",
    "password": "password123"
  }'
```

**Get Current User:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Structure

```
backend/
├── config/             # Configuration files
│   └── db.config.js    # MongoDB connection
├── controllers/        # Route controllers
│   └── auth.controller.js
├── middleware/         # Custom middleware
│   ├── auth.middleware.js
│   ├── validation.middleware.js
│   └── error.middleware.js
├── models/            # Mongoose models/schemas
│   ├── User.model.js
│   ├── InfluencerProfile.model.js
│   ├── BrandProfile.model.js
│   ├── Campaign.model.js
│   └── Application.model.js
├── routes/            # API routes
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── influencer.routes.js
│   ├── campaign.routes.js
│   └── application.routes.js
├── services/          # Business logic (coming soon)
├── utils/             # Utility functions (coming soon)
├── .env.example       # Environment variables template
├── .gitignore
├── package.json
└── server.js          # Entry point
```

## Development Status

### ✅ Completed
- Backend server setup
- MongoDB connection
- User authentication (register/login)
- JWT implementation
- Role-based access control
- Database schema design
- Input validation
- Security middleware
- Error handling

### 🔄 In Progress
- Influencer profile automation (YouTube API)
- Campaign management
- Application workflow

### 📋 Upcoming
- Chat system
- Deal tracking
- Review system
- Notification system
- Payment integration

## Contributing

Follow the progress.md file in the Details folder for the complete development roadmap.

## License

MIT
