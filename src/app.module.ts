import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatModule } from 'src/modules/chat/chat.module';
import { UserModule } from 'src/modules/users/user.module';
import { RepositoriesModule } from 'src/repositories/repositories.module';
import { APP_CONFIG } from './shared/config/app.config';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(APP_CONFIG.DATABASE.URI, {
      connectionFactory: (connection) => {
        console.log('🔧 Setting up MongoDB connection listeners...');
        console.log('🔗 MongoDB URI:', APP_CONFIG.DATABASE.URI);
        
        connection.on('connected', () => {
          console.log('✅ MongoDB connected successfully');
          console.log('📊 Database name:', connection.db?.databaseName);
        });
        
        connection.on('error', (err) => {
          console.error('❌ MongoDB connection error:', err);
        });
        
        connection.on('disconnected', () => {
          console.log('⚠️ MongoDB disconnected');
        });
        
        connection.on('connecting', () => {
          console.log('🔄 MongoDB connecting...');
        });
        
        return connection;
      },
    }),
    RepositoriesModule,
    UserModule,
    ChatModule,
    HealthModule,
  ],
})
export class AppModule {}
