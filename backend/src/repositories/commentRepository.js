const BaseRepository = require('./baseRepository');
const prisma = require('../config/database');

/**
 * Репозиторий для работы с комментариями
 * @class CommentRepository
 * @extends BaseRepository
 */
class CommentRepository extends BaseRepository {
  constructor() {
    super('comment');
  }

  /**
   * Получить комментарии к отправке
   * @param {string} submissionId - ID отправки
   * @returns {Promise<Array>}
   */
  async findBySubmission(submissionId) {
    return prisma.comment.findMany({
      where: { submissionId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}

module.exports = new CommentRepository();

