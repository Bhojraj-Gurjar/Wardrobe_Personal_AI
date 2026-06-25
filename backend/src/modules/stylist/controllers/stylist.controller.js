import {
  Inject,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { StylistService } from '../services/stylist.service';
import { CreateStylistSessionDto, StylistChatDto } from '../dto/stylist-chat.dto';

const chatPipe = DtoValidationPipe(StylistChatDto);
const createSessionPipe = DtoValidationPipe(CreateStylistSessionDto);

export @ApiTags('stylist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stylist')
class StylistController {
  constructor(@Inject(StylistService) stylistService) {
    this.stylistService = stylistService;
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Example queries and stylist capabilities' })
  getSuggestions() {
    return this.stylistService.getSuggestions();
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List stylist chat sessions' })
  listSessions(@CurrentUser() user) {
    return this.stylistService.listSessions(user.userId);
  }

  @Post('sessions')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new stylist chat session' })
  createSession(@CurrentUser() user, @Body(createSessionPipe) dto) {
    return this.stylistService.createSession(user.userId, dto.title);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get stylist chat session with messages' })
  getSession(@CurrentUser() user, @Param('id') id) {
    return this.stylistService.getSession(user.userId, id);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete stylist chat session' })
  deleteSession(@CurrentUser() user, @Param('id') id) {
    return this.stylistService.deleteSession(user.userId, id);
  }

  @Post('chat')
  @HttpCode(200)
  @ApiOperation({ summary: 'Send a message to the AI stylist' })
  chat(@CurrentUser() user, @Body(chatPipe) dto) {
    return this.stylistService.chat(user.userId, dto);
  }
}

export { StylistController };
