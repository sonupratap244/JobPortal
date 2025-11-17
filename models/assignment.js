module.exports = (sequelize, DataTypes) => {
  const Assignment = sequelize.define('Assignment', {
    title: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    code: { type: DataTypes.STRING, unique: true },
    testId: { type: DataTypes.INTEGER, allowNull: false },
    jobId: DataTypes.INTEGER,
    candidateId: DataTypes.INTEGER,
    duration: DataTypes.INTEGER,
    passingMarks: DataTypes.INTEGER,
  }, {});

  Assignment.associate = (models) => {
    Assignment.belongsTo(models.Test, { foreignKey: 'testId', as: 'test' });
    Assignment.hasMany(models.AssignmentQuestion, { foreignKey: 'assignmentId', onDelete: 'CASCADE' });
    Assignment.hasMany(models.AssignmentResult, { foreignKey: 'assignmentId', onDelete: 'CASCADE' });
  };

  return Assignment;
};
