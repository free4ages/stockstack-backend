# StockStack Backend

A comprehensive Node.js backend service for stock market data aggregation, news feed management, and real-time financial information delivery.

## 📱 Application Overview

![StockStack Application](./stockstack.png "StockStack Application Screenshot")

**StockStack** is a modern web application designed for aggregating and displaying financial news and market feeds. The application features a clean, intuitive interface with real-time updates and intelligent content categorization.

### Key Interface Features:

- **Topic-based Filtering**: Left sidebar allows users to filter content by specific topics (TCS, BEL, GLOBAL, RELIANCE, etc.) with real-time update timestamps
- **Feed Management**: Central panel displays aggregated news articles with source attribution and timestamps
- **Smart Tagging**: Articles are automatically tagged with relevant keywords for easy categorization
- **Interactive Elements**: Bookmark, star, and share functionality for personalized content management
- **Real-time Updates**: Live feed updates with timestamps showing when content was last refreshed
- **Responsive Design**: Clean, modern interface optimized for efficient news consumption

The application aggregates content from multiple financial news sources including Livemint, The Hindu, and others, providing users with comprehensive market intelligence and breaking financial news.

## 🚀 Features

- **Real-time Data Processing**: WebSocket support for live stock data and news updates
- **News Feed Aggregation**: Automated RSS feed crawling and article processing
- **User Management**: Complete authentication and authorization system
- **Stock Data Management**: Equity tracking and price monitoring
- **Tag-based Content Organization**: Categorization system for articles and feeds
- **Scalable Architecture**: Microservices with worker and scheduler processes
- **API Documentation**: Swagger/OpenAPI documentation
- **Docker Support**: Containerized deployment with Docker Compose
- **Testing**: Comprehensive test suite with Jest
- **Code Quality**: ESLint, Prettier, and Husky for code standards

## 🏗️ Architecture

The application consists of multiple services:

- **Main API Server**: RESTful API endpoints and WebSocket server
- **Worker Service**: Background job processing for data aggregation
- **Scheduler Service**: Cron jobs and scheduled tasks
- **MongoDB**: Primary database for data persistence
- **Redis**: Caching and session management
- **ZeroMQ**: Inter-service communication

## 📋 Prerequisites

- Node.js >= 12.0.0
- MongoDB 4.4+
- Redis 6.2+
- Docker & Docker Compose (for containerized deployment)

## 🛠️ Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stockstack-backend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   yarn dev
   ```

### Docker Deployment

1. **Start all services**
   ```bash
   yarn docker:dev
   ```

2. **For production**
   ```bash
   yarn docker:prod
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000
SOCKET_PORT=3006
WORKER_PORT=3001
SCHEDULER_PORT=3007

# Database
MONGODB_URL=mongodb://localhost:27017/stockstack
AGENDA_URL=mongodb://localhost:27017/stockstack

# Authentication
JWT_SECRET=your-jwt-secret
JWT_ACCESS_EXPIRATION_MINUTES=1000
JWT_REFRESH_EXPIRATION_DAYS=30

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@stockstack.com

# Redis
REDIS_URL=redis://localhost:6379

# ZeroMQ
ZMQ_PULL_URL=tcp://localhost:5555
ZMQ_PUSH_URL=tcp://localhost:5556

# Web URL
WEB_URL=http://localhost:3000

# Crawler Configuration
CRAWLER_TIMEOUT=60
CRAWLER_USER_AGENT=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36
CRAWLER_SKIP_AFTER_DAYS=5
CRAWLER_DEAD_AFTER_DAYS=30
CRAWLER_DISABLE_AFTER_ERROR_COUNT=10
CRAWLER_FETCH_PER_MINUTE=1

# Feed Configuration
FEED_MIN_EXPIRES=600
FEED_MAX_EXPIRES=432000
```

## 📚 API Endpoints

### Authentication
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/login` - User login
- `POST /v1/auth/refresh-tokens` - Refresh access token
- `POST /v1/auth/forgot-password` - Forgot password
- `POST /v1/auth/reset-password` - Reset password
- `POST /v1/auth/send-verification-email` - Send verification email
- `POST /v1/auth/verify-email` - Verify email

### Users
- `GET /v1/users` - Get all users
- `POST /v1/users` - Create user
- `GET /v1/users/:userId` - Get user by ID
- `PATCH /v1/users/:userId` - Update user
- `DELETE /v1/users/:userId` - Delete user

### Tags
- `GET /v1/tags` - Get all tags
- `POST /v1/tags` - Create tag
- `GET /v1/tags/:tagId` - Get tag by ID
- `PATCH /v1/tags/:tagId` - Update tag
- `DELETE /v1/tags/:tagId` - Delete tag

### Feeds
- `GET /v1/feeds` - Get all feeds
- `POST /v1/feeds` - Create feed
- `GET /v1/feeds/:feedId` - Get feed by ID
- `PATCH /v1/feeds/:feedId` - Update feed
- `DELETE /v1/feeds/:feedId` - Delete feed

### Articles
- `GET /v1/articles` - Get all articles
- `POST /v1/articles` - Create article
- `GET /v1/articles/:articleId` - Get article by ID
- `PATCH /v1/articles/:articleId` - Update article
- `DELETE /v1/articles/:articleId` - Delete article

### Equities
- `GET /v1/equities` - Get all equities
- `POST /v1/equities` - Create equity
- `GET /v1/equities/:equityId` - Get equity by ID
- `PATCH /v1/equities/:equityId` - Update equity
- `DELETE /v1/equities/:equityId` - Delete equity

### User Tags
- `GET /v1/user-tags` - Get user tags
- `POST /v1/user-tags` - Create user tag
- `DELETE /v1/user-tags/:userTagId` - Delete user tag

### User Feeds
- `GET /v1/user-feeds` - Get user feeds
- `POST /v1/user-feeds` - Create user feed
- `DELETE /v1/user-feeds/:userFeedId` - Delete user feed

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Generate coverage report
yarn coverage
```

## 🐳 Docker Commands

```bash
# Development environment
yarn docker:dev

# Production environment
yarn docker:prod

# Test environment
yarn docker:test
```

## 📝 Available Scripts

```bash
# Development
yarn dev                    # Start development server
yarn worker                 # Start worker service
yarn scheduler              # Start scheduler service

# Production
yarn start                  # Start with PM2
yarn start:worker           # Start worker with PM2
yarn start:scheduler        # Start scheduler with PM2

# Testing
yarn test                   # Run tests
yarn test:watch             # Run tests in watch mode
yarn coverage               # Generate coverage report

# Code Quality
yarn lint                   # Run ESLint
yarn lint:fix               # Fix ESLint issues
yarn prettier               # Check Prettier formatting
yarn prettier:fix           # Fix Prettier formatting

# Docker
yarn docker:prod            # Start production containers
yarn docker:dev             # Start development containers
yarn docker:test            # Start test containers
```

## 📁 Project Structure

```
src/
├── config/                 # Configuration files
├── controllers/            # Route controllers
├── crawlers/              # Web scraping modules
├── docs/                  # API documentation
├── middlewares/           # Custom middleware
├── models/                # Mongoose models
├── payload/               # Request/response payloads
├── publishers/            # Event publishers
├── routes/                # API routes
├── services/              # Business logic
├── subscribers/           # Event subscribers
├── tasks/                 # Background tasks
├── utils/                 # Utility functions
├── validations/           # Request validation schemas
├── wshandlers/            # WebSocket handlers
├── app.js                 # Express app setup
├── index.js               # Main entry point
├── pubsub.js              # Pub/Sub setup
├── pubSubRoutes.js        # Pub/Sub routes
├── scheduler.js           # Scheduler service
├── socketio.js            # WebSocket setup
└── worker.js              # Worker service
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Request validation with Joi
- XSS protection
- CORS configuration
- Rate limiting
- Helmet security headers
- MongoDB query sanitization

## 📊 Monitoring & Logging

- Winston logger for structured logging
- Morgan for HTTP request logging
- PM2 for process management
- Comprehensive error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository or contact the development team. 