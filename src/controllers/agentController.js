const agentService = require('../services/agentService');

async function register(req, res, next) {
  try {
    const agent = await agentService.registerAgent(req.body);
    res.status(201).json({ agent_id: agent.id });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const agents = await agentService.listAgents();
    res.json({ agents });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const agent = await agentService.getAgent(req.params.id);
    res.json(agent);
  } catch (err) {
    next(err);
  }
}

async function getMemories(req, res, next) {
  try {
    const memories = await agentService.getAgentMemories(req.params.id);
    res.json({ memories });
  } catch (err) {
    next(err);
  }
}

async function getTop(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const agents = await agentService.getTopAgents(limit);
    res.json({ agents });
  } catch (err) {
    next(err);
  }
}

async function getTrust(req, res, next) {
  try {
    const trusted = await agentService.getAgentTrust(req.params.id);
    res.json({ trust: trusted });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  list,
  getById,
  getMemories,
  getTop,
  getTrust,
};
