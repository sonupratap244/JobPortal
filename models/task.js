'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Task.belongsTo(models.Course, { foreignKey: 'courseId', as: 'course' });
    }
  }
  Task.init({
    id: { type: DataTypes.INTEGER, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    userId: { type: DataTypes.INTEGER },
    courseId: { type: DataTypes.INTEGER }
  }, { sequelize, modelName: 'Task', tableName: 'Tasks' });
  return Task;
};
