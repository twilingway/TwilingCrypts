import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TasksService } from './tasks.service';

@Module({
  imports: [HttpModule],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
