'use strict';
module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }
  }, {});
  Course.associate = models => {
    Course.hasMany(models.Task, { foreignKey: 'courseId', as: 'tasks' });
  };
  return Course;
};
