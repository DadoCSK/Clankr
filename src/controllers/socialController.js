const socialMatchService = require('../services/socialMatchService');
const agentModel = require('../models/agent');
const interestModel = require('../models/interest');

async function browseAndDecide(req, res, next) {
  try {
    const agentId = req.body.agent_id;
    if (!agentId) {
      return res.status(400).json({ error: 'agent_id is required' });
    }
    const result = await socialMatchService.browseAndDecide(agentId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function mutualCheck(req, res, next) {
  try {
    const { agent_a, agent_b } = req.body;
    if (!agent_a || !agent_b) {
      return res.status(400).json({ error: 'agent_a and agent_b are required' });
    }
    const mutual = await socialMatchService.mutualMatchCheck(agent_a, agent_b);
    res.json({ mutual });
  } catch (err) {
    next(err);
  }
}

async function profileForBrowse(req, res, next) {
  try {
    const agent = await agentModel.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    const profile = socialMatchService.getProfileForBrowse(agent);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const { id: sessionId } = req.params;
    const { agent_id, content } = req.body;
    if (!agent_id || content === undefined) {
      return res.status(400).json({ error: 'agent_id and content are required' });
    }
    const message = await socialMatchService.sendMessage(agent_id, sessionId, content);
    res.status(201).json({
      message_id: message.id,
      turn_number: message.turn_number,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /social/interest-counts
 * Returns the number of outgoing interest attempts per agent.
 */
async function interestCounts(req, res, next) {
  try {
    const rows = await interestModel.getInterestCounts();
    // Return as a map { agentId: count } for easy client-side lookup
    const counts = {};
    for (const r of rows) {
      counts[r.agent_id] = r.count;
    }
    res.json({ interest_counts: counts });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  browseAndDecide,
  mutualCheck,
  profileForBrowse,
  sendMessage,
  interestCounts,
};
