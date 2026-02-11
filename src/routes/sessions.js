const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const {
  sessionStartRules,
  messageRules,
  uuidParamRules,
  handleValidationErrors,
} = require('../middleware/validation');

router.get('/', sessionController.listSessions);

router.post(
  '/start',
  sessionStartRules,
  handleValidationErrors,
  sessionController.startSession
);

router.get(
  '/:id',
  uuidParamRules,
  handleValidationErrors,
  sessionController.getSession
);

router.post(
  '/:id/run',
  uuidParamRules,
  handleValidationErrors,
  sessionController.runSession
);

router.post(
  '/:id/message',
  uuidParamRules,
  messageRules,
  handleValidationErrors,
  sessionController.sendMessage
);

module.exports = router;
