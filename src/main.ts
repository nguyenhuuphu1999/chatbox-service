import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { APP_CONFIG } from './shared/config/app.config';
import 'dotenv/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.enableCors(APP_CONFIG.SERVER.CORS);
  app.useGlobalPipes(new ValidationPipe());

  const PORT = APP_CONFIG.SERVER.PORT;
  Logger.log(`Socket.IO Chat Server starting on port ${PORT}`);
  
  try {
    await app.listen(PORT, () => {
      Logger.log(`🚀 Socket.IO Chat Server is running on port http://localhost:${PORT}`);
      Logger.log(`📡 Socket.IO namespaces:`);
      Logger.log(`   - Chat: http://localhost:${PORT}/chat`);
      Logger.log(`     Events: connection, disconnect, user_online, user_offline`);
      Logger.log(`     Message Events: send_message, get_message_history, typing_start, typing_stop, message_delivered, message_read`);
      Logger.log(`     Responses: new_message, message_history, user_typing, message_status_update`);
      Logger.log(`   - Upload: http://localhost:${PORT}/chat/upload`);
      Logger.log(`     Events: upload_file_chunk`);
      Logger.log(`     Responses: upload_progress, upload_complete`);
      Logger.log(`🔧 REST API endpoints:`);
      Logger.log(`   - POST /users - Create user`);
      Logger.log(`   - GET /users/:userKey - Get user`);
      Logger.log(`   - GET /health - Health check`);
      Logger.log(`   - GET /health/database - Database health check`);
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      Logger.error(`❌ Port ${PORT} is already in use. Please kill the process using this port or use a different port.`);
      Logger.error(`💡 Try running: lsof -i :${PORT} && kill -9 <PID>`);
      process.exit(1);
    }
    throw error;
  }
}
bootstrap();