import { Request, Response, NextFunction } from 'express';
import { VoiceService } from '@/services/voice/voice.service';
import { singleton } from '@/shared/decorators/singleton';
import {
  IVoiceApiRequest,
  IVoiceApiResponse,
  ISpeechToTextApiRequest,
  ISpeechToTextApiResponse,
} from '@/shared/models/api/voice/voice.api';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';

@singleton
export class VoiceController extends BaseController {
  constructor(private voiceService: VoiceService) {
    super();
  }

  synthesizeSpeech = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<IVoiceApiResponse>(req, res, next, async () => {
      const request = createIApiRequest<IVoiceApiRequest>(req);
      return await this.voiceService.synthesizeSpeech(request.data);
    });
  };

  transcribeSpeech = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<ISpeechToTextApiResponse>(req, res, next, async () => {
      const request = createIApiRequest<ISpeechToTextApiRequest>(req);
      return await this.voiceService.transcribeSpeech(request.data);
    });
  };
}
