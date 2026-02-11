function formatForModel(messages) {
  return messages.map((m) => ({
    role: 'user',
    content: m.content,
  }));
}

module.exports = {
  formatForModel,
};
