const { requireRoles } = require('./authMiddleware');

const isUser = requireRoles(['Usuario']);

module.exports = {
    isUser
};
