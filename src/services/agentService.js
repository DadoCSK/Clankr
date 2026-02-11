const agentModel = require('../models/agent');
const memoryService = require('./memoryService');
const trustModel = require('../models/trust');

async function registerAgent(profile) {
  return agentModel.create(profile);
}

async function getAgent(id) {
  const agent = await agentModel.findById(id);
  if (!agent) {
    const error = new Error('Agent not found');
    error.statusCode = 404;
    throw error;
  }
  return agent;
}

async function getAgentMemories(id, limit = 10) {
  const agent = await agentModel.findById(id);
  if (!agent) {
    const error = new Error('Agent not found');
    error.statusCode = 404;
    throw error;
  }
  return memoryService.getRecentMemories(id, limit);
}

async function listAgents() {
  return agentModel.findAll();
}

async function getTopAgents(limit = 10) {
  return agentModel.findByReputation(limit);
}

async function getAgentTrust(id) {
  const agent = await agentModel.findById(id);
  if (!agent) {
    const error = new Error('Agent not found');
    error.statusCode = 404;
    throw error;
  }
  return trustModel.getTrustedAgents(id);
}

module.exports = {
  registerAgent,
  getAgent,
  getAgentMemories,
  listAgents,
  getTopAgents,
  getAgentTrust,
};
