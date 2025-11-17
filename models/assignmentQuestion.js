module.exports = (sequelize, DataTypes) => {
  const AssignmentQuestion = sequelize.define('AssignmentQuestion', {
    assignmentId: { type: DataTypes.INTEGER, allowNull: false },
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    order: { type: DataTypes.INTEGER, defaultValue: 0 } // optional ordering
  }, {});

  AssignmentQuestion.associate = (models) => {
    AssignmentQuestion.belongsTo(models.Assignment, { foreignKey: 'assignmentId' });
    AssignmentQuestion.belongsTo(models.Question, { foreignKey: 'questionId' });
  };

  return AssignmentQuestion;
};
