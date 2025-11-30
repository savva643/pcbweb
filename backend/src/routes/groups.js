const express = require('express');
const groupController = require('../controllers/groupController');
const groupValidators = require('../validators/groupValidators');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Получить все группы преподавателя
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, requireRole('TEACHER'), groupController.getTeacherGroups);

/**
 * @swagger
 * /api/groups/student:
 *   get:
 *     summary: Получить все группы студента
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.get('/student', authenticate, requireRole('STUDENT'), groupController.getStudentGroups);

/**
 * @swagger
 * /api/groups/:id:
 *   get:
 *     summary: Получить детали группы
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, groupValidators.groupId, groupController.getGroupDetails);

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Создать группу
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, requireRole('TEACHER'), groupValidators.createGroup, groupController.createGroup);

/**
 * @swagger
 * /api/groups/:id:
 *   put:
 *     summary: Обновить группу
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticate, requireRole('TEACHER'), groupValidators.updateGroup, groupController.updateGroup);

/**
 * @swagger
 * /api/groups/:id:
 *   delete:
 *     summary: Удалить группу
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, requireRole('TEACHER'), groupValidators.groupId, groupController.deleteGroup);

/**
 * @swagger
 * /api/groups/:id/students:
 *   post:
 *     summary: Добавить студента в группу
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/students', authenticate, requireRole('TEACHER'), groupValidators.addStudent, groupController.addStudent);

/**
 * @swagger
 * /api/groups/:id/students/:studentId:
 *   delete:
 *     summary: Удалить студента из группы
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id/students/:studentId', authenticate, requireRole('TEACHER'), groupValidators.studentId, groupController.removeStudent);

/**
 * @swagger
 * /api/groups/:id/courses:
 *   post:
 *     summary: Назначить курс группе
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/courses', authenticate, requireRole('TEACHER'), groupValidators.assignCourse, groupController.assignCourse);

/**
 * @swagger
 * /api/groups/:id/courses/:courseId:
 *   delete:
 *     summary: Удалить назначение курса группе
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id/courses/:courseId', authenticate, requireRole('TEACHER'), groupValidators.courseId, groupController.unassignCourse);

/**
 * @swagger
 * /api/groups/:id/stats:
 *   get:
 *     summary: Получить статистику группы
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/stats', authenticate, requireRole('TEACHER'), groupValidators.groupId, groupController.getGroupStats);

// Grade records routes
const gradeRecordController = require('../controllers/gradeRecordController');
const gradeRecordValidators = require('../validators/gradeRecordValidators');

/**
 * @swagger
 * /api/groups/{groupId}/grades:
 *   get:
 *     summary: Получить успеваемость всех студентов группы
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:groupId/grades', authenticate, requireRole('TEACHER'), gradeRecordValidators.groupId, gradeRecordValidators.yearMonth, gradeRecordController.getGroupGrades);

/**
 * @swagger
 * /api/groups/{groupId}/students/{studentId}/grades:
 *   get:
 *     summary: Получить успеваемость студента в группе
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:groupId/students/:studentId/grades', authenticate, gradeRecordValidators.groupId, gradeRecordValidators.studentId, gradeRecordValidators.yearMonth, gradeRecordController.getStudentGrades);

/**
 * @swagger
 * /api/groups/{groupId}/grades/{gradeType}/{relatedId}:
 *   get:
 *     summary: Получить успеваемость по курсу/ДЗ/тесту
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:groupId/grades/:gradeType/:relatedId', authenticate, requireRole('TEACHER'), gradeRecordValidators.groupId, gradeRecordValidators.gradeType, gradeRecordController.getGradesByRelated);

/**
 * @swagger
 * /api/groups/{groupId}/grades:
 *   post:
 *     summary: Создать или обновить запись успеваемости
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:groupId/grades', authenticate, requireRole('TEACHER'), gradeRecordValidators.groupId, gradeRecordValidators.upsertGradeRecord, gradeRecordController.upsertGradeRecord);

/**
 * @swagger
 * /api/groups/{groupId}/grades/{recordId}:
 *   delete:
 *     summary: Удалить запись успеваемости
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:groupId/grades/:recordId', authenticate, requireRole('TEACHER'), gradeRecordValidators.groupId, gradeRecordValidators.recordId, gradeRecordController.deleteGradeRecord);

/**
 * @swagger
 * /api/groups/{groupId}/students/{studentId}/stats:
 *   get:
 *     summary: Получить статистику студента в группе
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:groupId/students/:studentId/stats', authenticate, gradeRecordValidators.groupId, gradeRecordValidators.studentId, gradeRecordController.getStudentStats);

module.exports = router;

