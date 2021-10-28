const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const articleValidation = require('../../validations/article.validation');
const articleController = require('../../controllers/article.controller');
const userFeedValidation = require('../../validations/user-feed.validation');
const userFeedController = require('../../controllers/user-feed.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageArticles'), validate(articleValidation.createArticle), articleController.createArticle)
  .get(auth('getArticles'), validate(articleValidation.getArticles), articleController.getArticles);

router
  .route('/create-many')
  .post(auth('manageArticles'), validate(articleValidation.createManyArticles), articleController.createManyArticles);

router
  .route('/search-tags')
  .post(auth('manageArticles'), validate(articleValidation.searchArticleTags), articleController.searchArticleTags);

router.get('/search', auth('getArticles'), validate(articleValidation.searchArticles), articleController.searchArticles);

router.post(
  '/add-tags',
  auth('manageArticles'),
  validate(articleValidation.addArticleTags),
  articleController.addArticleTags
);

router.post(
  '/remove-tags',
  auth('manageArticles'),
  validate(articleValidation.addArticleTags),
  articleController.removeArticleTags
);
// feed related routes
router.post(
  '/mark-read',
  auth('getUserFeeds'),
  validate(userFeedValidation.markArticle),
  userFeedController.markArticleRead
);

router.post(
  '/mark-important',
  auth('getUserFeeds'),
  validate(userFeedValidation.markArticle),
  userFeedController.markArticleImportant
);

router.post(
  '/mark-deleted',
  auth('getUserFeeds'),
  validate(userFeedValidation.markArticle),
  userFeedController.markArticleDeleted
);

router.post(
  '/read-later',
  auth('getUserFeeds'),
  validate(userFeedValidation.markArticle),
  userFeedController.markArticleReadLater
);

router
  .route('/:articleId')
  .get(auth('getArticles'), validate(articleValidation.getArticle), articleController.getArticle)
  .put(auth('manageArticles'), validate(articleValidation.updateArticle), articleController.updateArticle)
  .delete(auth('manageArticles'), validate(articleValidation.deleteArticle), articleController.deleteArticle);

module.exports = router;

/**
 * @swagger
 * articles:
 *   name: Articles
 *   description: Article management and retrieval
 */

/**
 * @swagger
 * /articles:
 *   post:
 *     summary: Create a article
 *     description: Only admins can create other articles.
 *     articles: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: must be unique
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *               role:
 *                  type: string
 *                  enum: [article, admin]
 *             example:
 *               name: fake name
 *               email: fake@example.com
 *               password: password1
 *               role: article
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Article'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all articles
 *     description: Only admins can retrieve all articles.
 *     articles: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Article name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Article role
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. name:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of articles
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /articles/{id}:
 *   get:
 *     summary: Get a article
 *     description: Logged in articles can fetch only their own article information. Only admins can fetch other articles.
 *     articles: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Article'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a article
 *     description: Logged in articles can only update their own information. Only admins can update other articles.
 *     articles: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: must be unique
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *             example:
 *               name: fake name
 *               email: fake@example.com
 *               password: password1
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Article'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a article
 *     description: Logged in articles can delete only themselves. Only admins can delete other articles.
 *     articles: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article id
 *     responses:
 *       "200":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
