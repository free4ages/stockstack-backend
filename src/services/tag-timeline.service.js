const articleService = require('./article.service');
const tagService = require('./tag.service');

/**
 * Convert articleId or tagName
 * @param {Article|ObjectId} article
 * @param {string} tagName
 * @returns {Promise<UserTag>}
 */
const resolveArticleTag = async ({ userId, tagName, raise = true }) => {
  const [user, tag] = await Promise.all([
    userService.getUserInstance(userId, { raise }),
    tagService.getTagInstance(tagId, { raise }),
  ]);
  return { user, tag };
};

const populateArticleData = async (article, timelineObj) => {
  const articleData = {
    title: article.displayTitle || article.title,
    shortText: article.shortText,
    pubDate: article.pubDate,
    retrieveDate: article.retrieveDate,
    link: article.link,
    attachmentLink: article.attachmentLink,
    article: article._id,
  };  
  Object.assign(timelineObj,articleData);
  return timelineObj;
}

const addArticleToTag = async (articleId,tagName) => {
  const article = articleService.getArticleInstance(articleId,{raise:true});
  const tag = tagService.getTagByName(tagName);
  const timelineObj = {
    tag: tag.name
  };
  const body = await populateArticleData(timelineObj);
  const tagTimeLine=await TagTimeLine.create(body);
  return tagTimeLine;
}
