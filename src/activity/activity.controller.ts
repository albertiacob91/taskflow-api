import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryActivityDto } from './dto/query-activity.dto';
import { ActivityService } from './activity.service';

@ApiTags('activity')
@Controller()
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get('projects/:id/activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'List project activity (owner or member)' })
  listProjectActivity(
    @Req() req: any,
    @Param('id') projectId: string,
    @Query() query: QueryActivityDto,
  ) {
    return this.activity.listProjectActivity(req.user.userId, projectId, query);
  }

  @Get('activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'List my activity' })
  listMyActivity(@Req() req: any, @Query() query: QueryActivityDto) {
    return this.activity.listMyActivity(req.user.userId, query);
  }

  @Get('users/:id/activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'List a user activity (ADMIN only)' })
  listUserActivity(
    @Req() req: any,
    @Param('id') userId: string,
    @Query() query: QueryActivityDto,
  ) {
    return this.activity.listUserActivity(req.user.userId, userId, query);
  }
}