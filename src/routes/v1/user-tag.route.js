const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const {userTagValidation} = require('../../validations');
const {userTagController} = require('../../controllers');

const router = express.Router();

router
  .route('/')
  .post(auth('manageUserTags'), validate(userTagValidation.createUserTag), userTagController.createUserTag)
  .get(auth('getUserTags'), validate(userTagValidation.getUserTags), userTagController.getUserTags);

router.post(
  "/subscribe",
  auth("getTags"),
  validate(userTagValidation.subscribeTag),
  userTagController.subscribeTag
);

router.post(
  "/unsubscribe",
  auth("getTags"),
  validate(userTagValidation.unSubscribeTag),
  userTagController.unSubscribeTag
);

router.get(
  "/me",
  auth("getTags"),
  userTagController.getAuthUserTags
);


router
  .route('/:userTagId')
  .get(auth('getUserTags'), validate(userTagValidation.getUserTag), userTagController.getUserTag)
  .put(auth('manageUserTags'), validate(userTagValidation.updateUserTag), userTagController.updateUserTag)
  .delete(auth('manageUserTags'), validate(userTagValidation.deleteUserTag), userTagController.deleteUserTag);

module.exports = router;

/**
 * @swagger
 * userTags:
 *   name: UserTags
 *   description: UserTag management and retrieval
 */

/**
 * @swagger
 * /userTags:
 *   post:
 *     summary: Create a userTag
 *     description: Only admins can create other userTags.
 *     userTags: [UserTags]
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
 *                  enum: [userTag, admin]
 *             example:
 *               name: fake name
 *               email: fake@example.com
 *               password: password1
 *               role: userTag
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/UserTag'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all userTags
 *     description: Only admins can retrieve all userTags.
 *     userTags: [UserTags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: UserTag name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: UserTag role
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
 *         description: Maximum number of userTags
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
 *                     $ref: '#/components/schemas/UserTag'
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
 * /userTags/{id}:
 *   get:
 *     summary: Get a userTag
 *     description: Logged in userTags can fetch only their own userTag information. Only admins can fetch other userTags.
 *     userTags: [UserTags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UserTag id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/UserTag'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a userTag
 *     description: Logged in userTags can only update their own information. Only admins can update other userTags.
 *     userTags: [UserTags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UserTag id
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
 *                $ref: '#/components/schemas/UserTag'
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
 *     summary: Delete a userTag
 *     description: Logged in userTags can delete only themselves. Only admins can delete other userTags.
 *     userTags: [UserTags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UserTag id
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


