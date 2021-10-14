const allRoles = {
  user: [
    'getTags',
    'getEquities',
  ],
  admin: [
    'getUsers', 
    'manageUsers',
    'getTags',
    'manageTags',
    'getEquities',
    'manageEquities',
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
