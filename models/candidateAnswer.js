module.exports = (sequelize, DataTypes) => {
  const CandidateAnswer = sequelize.define('CandidateAnswer', {
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    testId: { type: DataTypes.INTEGER, allowNull: false },
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    selectedOptionId: { type: DataTypes.INTEGER, allowNull: true },
    textAnswer: { type: DataTypes.TEXT, allowNull: true }
  }, {});

  CandidateAnswer.associate = (models) => {
    CandidateAnswer.belongsTo(models.Candidate, { foreignKey: 'candidateId', as: 'candidate' });
    CandidateAnswer.belongsTo(models.Test, { foreignKey: 'testId', as: 'test' });
    CandidateAnswer.belongsTo(models.Question, { foreignKey: 'questionId', as: 'question' });
    CandidateAnswer.belongsTo(models.Option, { foreignKey: 'selectedOptionId', as: 'selectedOption' });
  };

  return CandidateAnswer;
};
