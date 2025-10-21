# Docker Setup for Chat Socket App

This document explains how to run the Chat Socket App using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### Production Environment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Development Environment

```bash
# Build and start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

## Services

### Production (`docker-compose.yml`)

- **chat-app**: NestJS Socket.IO application (Port 3000)
- **mongodb**: MongoDB database (Port 27017)
- **redis**: Redis cache (Port 6379)

### Development (`docker-compose.dev.yml`)

- **chat-app**: NestJS application with hot reload
- **mongodb**: MongoDB database for development
- **redis**: Redis cache for development

## Environment Variables

### Application Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `MONGODB_URI` | `mongodb://admin:password123@mongodb:27017/chat-socket-app?authSource=admin` | MongoDB connection string |
| `PORT` | `3000` | Application port |
| `CORS_ORIGIN` | `*` | CORS origin |
| `MAX_FILE_SIZE` | `52428800` | Maximum file size (50MB) |
| `ALLOWED_FILE_TYPES` | `image/*,video/*,application/pdf` | Allowed file types |
| `UPLOAD_PATH` | `./uploads` | Upload directory |
| `CHUNK_SIZE` | `1048576` | Chunk size (1MB) |
| `SOCKET_NAMESPACE` | `/chat` | Socket.IO namespace |
| `SOCKET_PING_TIMEOUT` | `60000` | Socket ping timeout |
| `SOCKET_PING_INTERVAL` | `25000` | Socket ping interval |

### MongoDB Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_INITDB_ROOT_USERNAME` | `admin` | MongoDB root username |
| `MONGO_INITDB_ROOT_PASSWORD` | `password123` | MongoDB root password |
| `MONGO_INITDB_DATABASE` | `chat-socket-app` | Initial database name |

## Volumes

- `mongodb_data`: MongoDB data persistence
- `uploads_data`: File uploads persistence
- `redis_data`: Redis data persistence

## Networks

- `chat-network`: Internal network for production services
- `chat-dev-network`: Internal network for development services

## Health Checks

All services include health checks:

- **MongoDB**: `mongosh --eval "db.adminCommand('ping')"`
- **Redis**: `redis-cli ping`
- **Chat App**: Socket.IO endpoint check

## Socket.IO Endpoints

Once running, the application provides these Socket.IO namespaces:

- **Main**: `http://localhost:3000/chat`
- **Rooms**: `http://localhost:3000/chat/rooms`
- **Messages**: `http://localhost:3000/chat/messages`
- **Upload**: `http://localhost:3000/chat/upload`

## Database Initialization

MongoDB is automatically initialized with:

- Database: `chat-socket-app` (production) / `chat-socket-app-dev` (development)
- Collections: `users`, `chatRooms`, `chatMessages`
- Indexes for optimal performance
- Validation schemas

## File Uploads

Uploaded files are stored in Docker volumes:

- **Production**: `uploads_data` volume
- **Development**: `uploads_dev_data` volume

## Troubleshooting

### Check Service Status

```bash
# Check all services
docker-compose ps

# Check specific service logs
docker-compose logs chat-app
docker-compose logs mongodb
```

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all
```

### Access MongoDB

```bash
# Connect to MongoDB container
docker-compose exec mongodb mongosh -u admin -p password123 --authenticationDatabase admin

# Or use MongoDB Compass with connection string:
# mongodb://admin:password123@localhost:27017/chat-socket-app?authSource=admin
```

### Access Redis

```bash
# Connect to Redis container
docker-compose exec redis redis-cli
```

## Security Notes

⚠️ **For Production Use:**

1. Change default passwords in environment variables
2. Use proper secrets management
3. Configure proper CORS origins
4. Use HTTPS in production
5. Set up proper firewall rules
6. Regular security updates

## Performance Tuning

For production deployments, consider:

1. **MongoDB**: Configure replica sets for high availability
2. **Redis**: Configure persistence and memory limits
3. **Application**: Use PM2 or similar process manager
4. **Load Balancing**: Use nginx or similar for multiple app instances

