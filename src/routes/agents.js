const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const {
  agentRegistrationRules,
  uuidParamRules,
  handleValidationErrors,
} = require('../middleware/validation');

router.post(
  '/register',
  agentRegistrationRules,
  handleValidationErrors,
  agentController.register
);

router.get('/', agentController.list);

router.get('/top', agentController.getTop);

router.get(
  '/:id/memories',
  uuidParamRules,
  handleValidationErrors,
  agentController.getMemories
);

router.get(
  '/:id/trust',
  uuidParamRules,
  handleValidationErrors,
  agentController.getTrust
);

router.get(
  '/:id',
  uuidParamRules,
  handleValidationErrors,
  agentController.getById
);

module.exports = router;
