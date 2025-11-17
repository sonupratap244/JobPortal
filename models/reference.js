module.exports = (sequelize, DataTypes) => {
  const Reference = sequelize.define("Reference", {
    candidateId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    designation: DataTypes.STRING,
    company: DataTypes.STRING,
  });
  Reference.associate = (models) => {
    Reference.belongsTo(models.Candidate, { foreignKey: "candidateId", as: "candidate" });
  };
  return Reference;
};
