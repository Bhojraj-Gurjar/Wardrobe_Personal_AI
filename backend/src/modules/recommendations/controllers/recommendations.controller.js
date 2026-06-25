import { Inject, Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { RecommendationsService } from '../services/recommendations.service';
import { QueryRecommendationsDto } from '../dto/query-recommendations.dto';

const queryRecommendationsPipe = DtoValidationPipe(QueryRecommendationsDto);

export @ApiTags('recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
class RecommendationsController {
  constructor(@Inject(RecommendationsService) recommendationsService) {
    this.recommendationsService = recommendationsService;
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get daily personalized recommendations' })
  getDaily(
    @CurrentUser() user,
    @Query(queryRecommendationsPipe) query,
  ) {
    return this.recommendationsService.getRecommendations(user.userId, {
      ...query,
      type: 'daily',
    });
  }

  @Get('seasonal')
  @ApiOperation({ summary: 'Get seasonal recommendations' })
  getSeasonal(
    @CurrentUser() user,
    @Query(queryRecommendationsPipe) query,
  ) {
    return this.recommendationsService.getRecommendations(user.userId, {
      ...query,
      type: 'seasonal',
    });
  }

  @Get('event')
  @ApiOperation({ summary: 'Get event-based recommendations' })
  getEvent(
    @CurrentUser() user,
    @Query(queryRecommendationsPipe) query,
  ) {
    return this.recommendationsService.getRecommendations(user.userId, {
      ...query,
      type: 'event',
      event: query.event,
    });
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending recommendations' })
  getTrending(
    @CurrentUser() user,
    @Query(queryRecommendationsPipe) query,
  ) {
    return this.recommendationsService.getRecommendations(user.userId, {
      ...query,
      type: 'trending',
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Get personalized product recommendations',
  })
  @ApiResponse({
    status: 200,
    description: 'Recommendations retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getRecommendations(
    @CurrentUser() user,
    @Query(queryRecommendationsPipe) query,
  ) {
    return this.recommendationsService.getRecommendations(user.userId, query);
  }
}
