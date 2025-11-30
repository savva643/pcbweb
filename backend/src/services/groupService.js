const groupRepository = require('../repositories/groupRepository');
const userRepository = require('../repositories/userRepository');
const courseRepository = require('../repositories/courseRepository');
const prisma = require('../config/database');

class GroupService {
  /**
   * Получить все группы преподавателя
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<Array>}
   */
  async getTeacherGroups(teacherId) {
    return groupRepository.findByTeacher(teacherId);
  }

  /**
   * Получить все группы студента
   * @param {string} studentId - ID студента
   * @returns {Promise<Array>}
   */
  async getStudentGroups(studentId) {
    return groupRepository.findByStudent(studentId);
  }

  /**
   * Получить детали группы
   * @param {string} groupId - ID группы
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<object>}
   */
  async getGroupDetails(groupId, userId, userRole) {
    const hasAccess = await groupRepository.isMember(groupId, userId, userRole);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    return groupRepository.findByIdWithDetails(groupId);
  }

  /**
   * Создать группу
   * @param {string} teacherId - ID преподавателя
   * @param {object} data - Данные группы
   * @returns {Promise<object>}
   */
  async createGroup(teacherId, data) {
    return groupRepository.create({
      ...data,
      teacherId
    });
  }

  /**
   * Обновить группу
   * @param {string} groupId - ID группы
   * @param {string} teacherId - ID преподавателя
   * @param {object} data - Данные для обновления
   * @returns {Promise<object>}
   */
  async updateGroup(groupId, teacherId, data) {
    const group = await groupRepository.findById(groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    return groupRepository.update(groupId, data);
  }

  /**
   * Удалить группу
   * @param {string} groupId - ID группы
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<void>}
   */
  async deleteGroup(groupId, teacherId) {
    const group = await groupRepository.findById(groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    return groupRepository.delete(groupId);
  }

  /**
   * Добавить студента в группу
   * @param {string} groupId - ID группы
   * @param {string} teacherId - ID преподавателя
   * @param {string} studentEmail - Email студента
   * @returns {Promise<object>}
   */
  async addStudent(groupId, teacherId, studentEmail) {
    const group = await groupRepository.findById(groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    const student = await userRepository.findStudentByEmail(studentEmail);
    if (!student) {
      throw new Error('Student not found');
    }

    // Проверяем, не является ли студент уже участником
    const existingMember = await prisma.groupMember.findFirst({
      where: {
        groupId,
        studentId: student.id
      }
    });

    if (existingMember) {
      throw new Error('Student already in group');
    }

    // Добавляем студента в группу
    await groupRepository.addMember(groupId, student.id);

    // Если в группе назначены курсы, добавляем студента на эти курсы
    const courseAssignments = await prisma.groupCourseAssignment.findMany({
      where: { groupId },
      include: { course: true }
    });

    for (const assignment of courseAssignments) {
      const existingEnrollment = await courseRepository.findEnrollment(student.id, assignment.courseId);
      if (!existingEnrollment) {
        await courseRepository.createEnrollment(student.id, assignment.courseId);
      }
    }

    return groupRepository.findByIdWithDetails(groupId);
  }

  /**
   * Удалить студента из группы
   * @param {string} groupId - ID группы
   * @param {string} teacherId - ID преподавателя
   * @param {string} studentId - ID студента
   * @returns {Promise<object>}
   */
  async removeStudent(groupId, teacherId, studentId) {
    const group = await groupRepository.findById(groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    await groupRepository.removeMember(groupId, studentId);
    return groupRepository.findByIdWithDetails(groupId);
  }

  /**
   * Назначить курс группе
   * @param {string} groupId - ID группы
   * @param {string} teacherId - ID преподавателя
   * @param {string} courseId - ID курса
   * @returns {Promise<object>}
   */
  async assignCourse(groupId, teacherId, courseId) {
    const group = await groupRepository.findById(groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Проверяем, не назначен ли курс уже группе
    const existingAssignment = await prisma.groupCourseAssignment.findFirst({
      where: {
        groupId,
        courseId
      }
    });

    if (existingAssignment) {
      throw new Error('Course already assigned to group');
    }

    // Создаем назначение
    await prisma.groupCourseAssignment.create({
      data: {
        groupId,
        courseId,
        assignedBy: teacherId
      }
    });

    // Добавляем всех участников группы на курс
    const members = await prisma.groupMember.findMany({
      where: { groupId }
    });

    for (const member of members) {
      const existingEnrollment = await courseRepository.findEnrollment(member.studentId, courseId);
      if (!existingEnrollment) {
        await courseRepository.createEnrollment(member.studentId, courseId);
      }
    }

    return groupRepository.findByIdWithDetails(groupId);
  }

  /**
   * Удалить назначение курса группе
   * @param {string} groupId - ID группы
   * @param {string} teacherId - ID преподавателя
   * @param {string} courseId - ID курса
   * @returns {Promise<object>}
   */
  async unassignCourse(groupId, teacherId, courseId) {
    const group = await groupRepository.findById(groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    await prisma.groupCourseAssignment.deleteMany({
      where: {
        groupId,
        courseId
      }
    });

    return groupRepository.findByIdWithDetails(groupId);
  }

  /**
   * Получить статистику группы
   * @param {string} groupId - ID группы
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<object>}
   */
  async getGroupStats(groupId, teacherId) {
    const group = await groupRepository.findById(groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const homeworks = await prisma.homework.findMany({
      where: { groupId },
      include: {
        submissions: {
          include: {
            grade: true
          }
        }
      }
    });

    // Вычисляем статистику для каждого студента
    const studentStats = members.map(member => {
      const studentHomeworks = homeworks.map(hw => {
        const submission = hw.submissions.find(s => s.studentId === member.studentId);
        return {
          homeworkId: hw.id,
          homeworkTitle: hw.title,
          maxScore: hw.maxScore,
          score: submission?.grade?.score || null,
          status: submission?.status || 'PENDING'
        };
      });

      const completedHomeworks = studentHomeworks.filter(hw => hw.score !== null);
      const totalScore = completedHomeworks.reduce((sum, hw) => sum + hw.score, 0);
      const maxTotalScore = studentHomeworks.reduce((sum, hw) => sum + hw.maxScore, 0);
      const averageScore = completedHomeworks.length > 0 
        ? (totalScore / completedHomeworks.reduce((sum, hw) => sum + hw.maxScore, 0)) * 100 
        : 0;

      return {
        student: member.student,
        homeworks: studentHomeworks,
        completedCount: completedHomeworks.length,
        totalCount: studentHomeworks.length,
        averageScore: averageScore.toFixed(2),
        totalScore,
        maxTotalScore
      };
    });

    // Общая статистика группы
    const totalStudents = members.length;
    const totalHomeworks = homeworks.length;
    const groupAverageScore = studentStats.length > 0
      ? studentStats.reduce((sum, stat) => sum + parseFloat(stat.averageScore), 0) / studentStats.length
      : 0;

    return {
      group: {
        id: group.id,
        name: group.name,
        description: group.description
      },
      totalStudents,
      totalHomeworks,
      groupAverageScore: groupAverageScore.toFixed(2),
      studentStats
    };
  }
}

module.exports = new GroupService();

