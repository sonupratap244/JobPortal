module.exports = (sequelize, DataTypes) => {
  const Questionnaire = sequelize.define("Questionnaire", {
    candidateId: DataTypes.INTEGER,
    keyTechnicalExpertise: DataTypes.TEXT,
    majorStrengths: DataTypes.TEXT,
    improvementArea: DataTypes.TEXT,
    reasonLeavingPreviousJobs: DataTypes.TEXT,
    majorAchievements: DataTypes.TEXT,
    valueAddition: DataTypes.TEXT,
  });
  Questionnaire.associate = (models) => {
    Questionnaire.belongsTo(models.Candidate, { foreignKey: "candidateId", as: "candidate" });
  };
  return Questionnaire;
};
