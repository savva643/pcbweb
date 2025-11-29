const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get chat topics for a course
router.get('/course/:courseId/topics', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check course access
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId
          }
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'TEACHER' && course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const topics = await prisma.chatTopic.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(topics);
  } catch (error) {
    console.error('Get chat topics error:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Create chat topic
router.post('/course/:courseId/topics', authenticate, [
  body('title').trim().notEmpty(),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId } = req.params;
    const { title, description } = req.body;

    // Check course access
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId
          }
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'TEACHER' && course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const topic = await prisma.chatTopic.create({
      data: {
        courseId,
        title,
        description,
        createdBy: req.user.id
      }
    });

    res.status(201).json(topic);
  } catch (error) {
    console.error('Create chat topic error:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// Get messages for a topic
router.get('/topics/:topicId/messages', authenticate, async (req, res) => {
  try {
    const { topicId } = req.params;

    const topic = await prisma.chatTopic.findUnique({
      where: { id: topicId },
      include: { course: true }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Check access
    if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId: topic.courseId
          }
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'TEACHER' && topic.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { topicId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message to topic
router.post('/topics/:topicId/messages', authenticate, [
  body('content').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topicId } = req.params;
    const { content } = req.body;

    const topic = await prisma.chatTopic.findUnique({
      where: { id: topicId },
      include: { course: true }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Check access
    if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId: topic.courseId
          }
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'TEACHER' && topic.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        topicId,
        authorId: req.user.id,
        content
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Update message (only author)
router.put('/messages/:id', authenticate, [
  body('content').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;

    const message = await prisma.chatMessage.findUnique({
      where: { id }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.json(updatedMessage);
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete message (only author or teacher)
router.delete('/messages/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await prisma.chatMessage.findUnique({
      where: { id },
      include: {
        topic: {
          include: {
            course: true
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if author or teacher
    const isAuthor = message.authorId === req.user.id;
    const isTeacher = req.user.role === 'TEACHER' && message.topic.course.teacherId === req.user.id;

    if (!isAuthor && !isTeacher) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.chatMessage.delete({
      where: { id }
    });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;

