module.exports = (sequelize, DataTypes) => {
  const Qualification = sequelize.define("Qualification", {
    candidateId: DataTypes.INTEGER,
    course: DataTypes.STRING,
    board: DataTypes.STRING,
    year: DataTypes.STRING,
    division: DataTypes.STRING,
  });
  Qualification.associate = (models) => {
    Qualification.belongsTo(models.Candidate, { foreignKey: "candidateId", as: "candidate" });
  };
  return Qualification;
};
