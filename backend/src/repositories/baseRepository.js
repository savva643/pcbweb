const prisma = require('../config/database');

/**
 * Базовый репозиторий с общими методами для работы с БД
 * @class BaseRepository
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
    this.prisma = prisma;
  }

  /**
   * Найти запись по ID
   * @param {string} id - ID записи
   * @param {object} include - Включить связанные данные
   * @returns {Promise<object|null>}
   */
  async findById(id, include = {}) {
    return this.prisma[this.model].findUnique({
      where: { id },
      include
    });
  }

  /**
   * Найти все записи
   * @param {object} where - Условия фильтрации
   * @param {object} include - Включить связанные данные
   * @param {object} orderBy - Сортировка
   * @param {number} skip - Пропустить записей
   * @param {number} take - Взять записей
   * @returns {Promise<Array>}
   */
  async findAll({ where = {}, include = {}, orderBy = {}, skip, take } = {}) {
    return this.prisma[this.model].findMany({
      where,
      include,
      orderBy,
      skip,
      take
    });
  }

  /**
   * Создать запись
   * @param {object} data - Данные для создания
   * @param {object} include - Включить связанные данные
   * @returns {Promise<object>}
   */
  async create(data, include = {}) {
    return this.prisma[this.model].create({
      data,
      include
    });
  }

  /**
   * Обновить запись
   * @param {string} id - ID записи
   * @param {object} data - Данные для обновления
   * @param {object} include - Включить связанные данные
   * @returns {Promise<object>}
   */
  async update(id, data, include = {}) {
    return this.prisma[this.model].update({
      where: { id },
      data,
      include
    });
  }

  /**
   * Удалить запись
   * @param {string} id - ID записи
   * @returns {Promise<object>}
   */
  async delete(id) {
    return this.prisma[this.model].delete({
      where: { id }
    });
  }

  /**
   * Найти первую запись по условию
   * @param {object} where - Условия поиска
   * @param {object} include - Включить связанные данные
   * @returns {Promise<object|null>}
   */
  async findFirst(where, include = {}) {
    return this.prisma[this.model].findFirst({
      where,
      include
    });
  }

  /**
   * Подсчитать количество записей
   * @param {object} where - Условия фильтрации
   * @returns {Promise<number>}
   */
  async count(where = {}) {
    return this.prisma[this.model].count({
      where
    });
  }

  /**
   * Создать или обновить запись (upsert)
   * @param {object} where - Условия поиска
   * @param {object} create - Данные для создания
   * @param {object} update - Данные для обновления
   * @param {object} include - Включить связанные данные
   * @returns {Promise<object>}
   */
  async upsert(where, create, update, include = {}) {
    return this.prisma[this.model].upsert({
      where,
      create,
      update,
      include
    });
  }
}

module.exports = BaseRepository;

