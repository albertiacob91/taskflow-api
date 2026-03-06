import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityService } from './activity.service';

@ApiTags('activity')
@Controller('projects/:id/activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'List activity for a project (owner or member)' })
  list(
    @Req() req: any,
    @Param('id') projectId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.activity.list(
      req.user.userId,
      projectId,
      Number(page),
      Number(limit),
    );
  }
}