const progressRepository = require('../repositories/progressRepository');
const materialRepository = require('../repositories/materialRepository');
const assignmentRepository = require('../repositories/assignmentRepository');
const submissionRepository = require('../repositories/submissionRepository');
const courseRepository = require('../repositories/courseRepository');

/**
 * Сервис для работы с прогрессом
 * @class ProgressService
 */
class ProgressService {
  /**
   * Получить прогресс студента по курсу
   * @param {string} courseId - ID курса
   * @param {string} studentId - ID студента
   * @returns {Promise<object>} Прогресс
   */
  async getCourseProgress(courseId, studentId) {
    // Проверка записи на курс
    const enrollment = await courseRepository.findEnrollment(studentId, courseId);
    if (!enrollment) {
      throw new Error('Access denied');
    }

    // Получить материалы
    const materials = await materialRepository.findByCourse(courseId);

    // Получить записи прогресса
    const progressRecords = await progressRepository.findByCourseAndStudent(courseId, studentId);

    // Получить задания и отправки
    const assignments = await assignmentRepository.findByCourse(courseId);
    const submissions = await submissionRepository.findAll({
      where: {
        studentId,
        assignmentId: {
          in: assignments.map(a => a.id)
        }
      },
      include: {
        grade: true
      }
    });

    // Расчет прогресса
    const completedMaterials = progressRecords.filter(p => p.completed && p.materialId).length;
    const totalMaterials = materials.length;
    const completedAssignments = submissions.filter(s => s.status === 'GRADED').length;
    const totalAssignments = assignments.length;

    const materialProgress = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;
    const assignmentProgress = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
    const overallProgress = (materialProgress + assignmentProgress) / 2;

    return {
      courseId,
      materials: {
        completed: completedMaterials,
        total: totalMaterials,
        progress: materialProgress
      },
      assignments: {
        completed: completedAssignments,
        total: totalAssignments,
        progress: assignmentProgress
      },
      overallProgress,
      progressRecords,
      submissions
    };
  }

  /**
   * Отметить материал как пройденный
   * @param {string} materialId - ID материала
   * @param {string} studentId - ID студента
   * @returns {Promise<object>} Запись прогресса
   */
  async markMaterialComplete(materialId, studentId) {
    const material = await materialRepository.findById(materialId, {
      course: true
    });

    if (!material) {
      throw new Error('Material not found');
    }

    // Проверка записи на курс
    const enrollment = await courseRepository.findEnrollment(studentId, material.courseId);
    if (!enrollment) {
      throw new Error('Access denied');
    }

    return progressRepository.upsertProgress(
      material.courseId,
      studentId,
      material.id,
      {
        completed: true,
        completedAt: new Date()
      }
    );
  }
}

module.exports = new ProgressService();

