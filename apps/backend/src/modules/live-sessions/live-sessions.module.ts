import { Module } from '@nestjs/common';
import { LiveSessionsController } from './live-sessions.controller';
import { LiveSessionsService } from './live-sessions.service';
import { LiveSessionsGateway } from './live-sessions.gateway';

@Module({ controllers: [LiveSessionsController], providers: [LiveSessionsService, LiveSessionsGateway] })
export class LiveSessionsModule {}
