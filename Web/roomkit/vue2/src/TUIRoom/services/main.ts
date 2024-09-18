import { chatExtension } from '../extension/chatExtension';
import { roomService } from './roomService';
roomService.useExtension(chatExtension);
