const matchService = require('../services/matchService');

async function findMatches(req, res, next) {
  try {
    const matches = await matchService.findMatches(req.body.agent_id);
    res.json({ matches });
  } catch (err) {
    next(err);
  }
}

async function getPairScore(req, res, next) {
  try {
    const { agent_a, agent_b } = req.body;
    const result = await matchService.getPairScore(agent_a, agent_b);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  findMatches,
  getPairScore,
};
