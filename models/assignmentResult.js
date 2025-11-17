module.exports = (sequelize, DataTypes) => {
  const AssignmentResult = sequelize.define('AssignmentResult', {
    assignmentId: { type: DataTypes.INTEGER, allowNull: false },
    candidateId: DataTypes.INTEGER,
    candidateEmail: DataTypes.STRING,
    answers: { type: DataTypes.JSON }, 
    score: DataTypes.INTEGER,
    passed: DataTypes.BOOLEAN
  }, {});

  AssignmentResult.associate = (models) => {
    AssignmentResult.belongsTo(models.Assignment, { foreignKey: 'assignmentId' });
  };

  return AssignmentResult;
};
