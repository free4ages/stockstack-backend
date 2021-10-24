const allRoles = {
  user: [
    'getTags',
    'getEquities',
    'getArticles',
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
    'getArticles'
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
