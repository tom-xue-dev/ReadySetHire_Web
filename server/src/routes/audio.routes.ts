import { Router } from 'express';
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { AudioController } from '../controllers';
import { whisperService } from '../services/whisper';

const router = Router();
const audioController = new AudioController(whisperService);

router.head('/model/whisper', (req, res) => {
  res.status(200).end();
});
router.post('/model/whisper', express.raw({ type: 'application/octet-stream' }), authenticateToken, audioController.transcribe.bind(audioController));

export default router;


