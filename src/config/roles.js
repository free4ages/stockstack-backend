const allRoles = {
  user: [
    'getTags',
    'getEquities',
    'getArticles',
    'getUserFeeds',
  ],
  admin: [
    'getUsers', 
    'manageUsers',
    'getTags',
    'manageTags',
    'getEquities',
    'manageEquities',
    'manageFeeds',
    'getFeeds',
    'manageArticles',
    'getArticles',
    'getUserTags',
    'manageUserTags',
    'getUserFeeds',
    'manageUserFeeds',
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
