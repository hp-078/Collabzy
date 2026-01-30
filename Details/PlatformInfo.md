# Collabzy - Platform Information

## About Collabzy

Collabzy is a cutting-edge influencer and brand collaboration platform designed to bridge the gap between content creators and businesses seeking authentic partnerships.

## Quick Start Guide

### For Developers

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   Open http://localhost:5173 in your browser

### For Users

#### Demo Accounts
Test the platform with these pre-configured accounts:

| Role | Email | Password |
|------|-------|----------|
| Influencer | demo@influencer.com | password123 |
| Brand | demo@brand.com | password123 |

## Platform Features

### 🔍 Discovery
- Browse 1000+ influencers across various niches
- Advanced search and filtering options
- View detailed profiles with engagement metrics

### 🤝 Collaboration
- Send collaboration requests directly to influencers
- Track request status in real-time
- Manage multiple collaborations simultaneously

### 💬 Communication
- Built-in messaging system
- No need for external communication tools
- Keep all project discussions in one place

### 📊 Dashboard
- Role-specific dashboards for influencers and brands
- Quick overview of active collaborations
- Pending requests and recent activity

## User Roles

### Influencers Can:
- Create and customize their profile
- List services with pricing
- Accept or decline collaboration requests
- Manage ongoing collaborations
- Message brands directly

### Brands Can:
- Discover relevant influencers
- Send collaboration proposals
- Track collaboration progress
- Communicate with influencers
- Review past collaborations

## Technical Specifications

| Component | Technology |
|-----------|------------|
| Frontend | React 19.2.0 |
| Build Tool | Vite 7.2.4 |
| Routing | React Router DOM |
| Icons | Lucide React |
| Styling | Custom CSS |
| State | React Context API |

## Design System

### Color Palette
- **Primary:** Teal (#14b8a6) - Trust, professionalism
- **Secondary:** Emerald (#10b981) - Growth, success
- **Neutral:** Gray scale for text and backgrounds

### Typography
- Font Family: Inter, system fonts fallback
- Responsive sizing with rem units

## Project Structure Overview

```
src/
├── components/common/    → Reusable UI components
├── context/              → State management
├── pages/                → Route components
├── assets/               → Static resources
└── *.css                 → Styling files
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Known Limitations

1. **Data Persistence:** Currently uses localStorage; data clears on browser reset
2. **No Backend:** Frontend-only demo; no real API integration
3. **Mock Data:** Sample influencers and brands are pre-populated

## Roadmap

### Version 1.1
- Notification system
- Enhanced search
- Calendar integration

### Version 1.2
- Payment processing
- Contract management
- Analytics dashboard

### Version 2.0
- Backend API
- Database integration
- Mobile application

## Support

For issues or suggestions, please refer to the project documentation or contact the development team.

---

© 2025 Collabzy. All rights reserved.
