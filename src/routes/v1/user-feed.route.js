const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { userFeedValidation } = require('../../validations');
const { userFeedController } = require('../../controllers');

const router = express.Router();

router.route('/').get(auth('getUserFeeds'), validate(userFeedValidation.getUserFeeds), userFeedController.getUserFeeds);

router.get(
  '/feed-count',
  auth('getUserFeeds'),
  validate(userFeedValidation.getUserFeedCount),
  userFeedController.getUserFeedCount
);

router.post(
  '/mark-read',
  auth('getUserFeeds'),
  validate(userFeedValidation.markUserFeed),
  userFeedController.markUserFeedRead
);

router.post(
  '/mark-important',
  auth('getUserFeeds'),
  validate(userFeedValidation.markUserFeed),
  userFeedController.markUserFeedImportant
);

router.post(
  '/mark-deleted',
  auth('getUserFeeds'),
  validate(userFeedValidation.markUserFeed),
  userFeedController.markUserFeedDeleted
);

router.post(
  '/read-later',
  auth('getUserFeeds'),
  validate(userFeedValidation.markUserFeed),
  userFeedController.markUserFeedReadLater
);

router
  .route('/:userFeedId')
  .get(auth('getUserFeeds'), validate(userFeedValidation.getUserFeed), userFeedController.getUserFeed);

module.exports = router;

/**
 * @swagger
 * userFeeds:
 *   name: UserFeeds
 *   description: UserFeed management and retrieval
 */

/**
 * @swagger
 * /userFeeds:
 *   post:
 *     summary: Create a userFeed
 *     description: Only admins can create other userFeeds.
 *     userFeeds: [UserFeeds]
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
 *                  enum: [userFeed, admin]
 *             example:
 *               name: fake name
 *               email: fake@example.com
 *               password: password1
 *               role: userFeed
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/UserFeed'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all userFeeds
 *     description: Only admins can retrieve all userFeeds.
 *     userFeeds: [UserFeeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: UserFeed name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: UserFeed role
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
 *         description: Maximum number of userFeeds
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
 *                     $ref: '#/components/schemas/UserFeed'
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
 * /userFeeds/{id}:
 *   get:
 *     summary: Get a userFeed
 *     description: Logged in userFeeds can fetch only their own userFeed information. Only admins can fetch other userFeeds.
 *     userFeeds: [UserFeeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UserFeed id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/UserFeed'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a userFeed
 *     description: Logged in userFeeds can only update their own information. Only admins can update other userFeeds.
 *     userFeeds: [UserFeeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UserFeed id
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
 *                $ref: '#/components/schemas/UserFeed'
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
 *     summary: Delete a userFeed
 *     description: Logged in userFeeds can delete only themselves. Only admins can delete other userFeeds.
 *     userFeeds: [UserFeeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UserFeed id
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
