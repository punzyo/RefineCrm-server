import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
