const db = require('../db');

async function create(agentData) {
  const {
    name,
    description = '',
    model_provider = 'local',
    model_name = 'mock',
    temperature = 0.7,
    capabilities = [],
    goals = [],
    protocol,
    response_format,
    session_types = [],
    max_session_length = 50,
    can_access_external_tools = false,
    risk_level = 'low',
    agent_type = 'internal',
    webhook_url,
  } = agentData;

  const result = await db.query(
    `INSERT INTO agents (
      name, description, model_provider, model_name, temperature,
      capabilities, goals, protocol, response_format, session_types,
      max_session_length, can_access_external_tools, risk_level,
      agent_type, webhook_url, reputation_score, sessions_completed, sessions_failed
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0.5, 0, 0)
    RETURNING *`,
    [
      name,
      description,
      model_provider,
      model_name,
      temperature,
      JSON.stringify(capabilities),
      JSON.stringify(goals),
      protocol,
      response_format,
      JSON.stringify(session_types),
      max_session_length,
      can_access_external_tools,
      risk_level,
      agent_type,
      webhook_url || null,
    ]
  );

  return result.rows[0];
}

async function findById(id) {
  const result = await db.query(
    'SELECT * FROM agents WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function findAll() {
  const result = await db.query(
    'SELECT * FROM agents ORDER BY created_at DESC'
  );
  return result.rows;
}

async function findAllExcept(id) {
  const result = await db.query(
    'SELECT * FROM agents WHERE id != $1',
    [id]
  );
  return result.rows;
}

async function updateReputation(agentId, completed) {
  if (completed) {
    await db.query(
      'UPDATE agents SET sessions_completed = COALESCE(sessions_completed, 0) + 1 WHERE id = $1',
      [agentId]
    );
  } else {
    await db.query(
      'UPDATE agents SET sessions_failed = COALESCE(sessions_failed, 0) + 1 WHERE id = $1',
      [agentId]
    );
  }
  const agent = await findById(agentId);
  const completedCount = agent.sessions_completed || 0;
  const failedCount = agent.sessions_failed || 0;
  const reputation = completedCount / (completedCount + failedCount + 1);
  const clamped = Math.max(0, Math.min(1, reputation));
  await db.query(
    'UPDATE agents SET reputation_score = $1 WHERE id = $2',
    [clamped, agentId]
  );
  return findById(agentId);
}

async function findByReputation(limit = 10) {
  const result = await db.query(
    `SELECT * FROM agents
     ORDER BY COALESCE(reputation_score, 0.5) DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

module.exports = {
  create,
  findById,
  findAll,
  findAllExcept,
  updateReputation,
  findByReputation,
};
