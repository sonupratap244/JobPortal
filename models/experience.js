module.exports = (sequelize, DataTypes) => {
  const Experience = sequelize.define('Experience', {
    company: DataTypes.STRING,
    designation: DataTypes.STRING,
    from: DataTypes.DATE,
    to: DataTypes.DATE,
    salary: DataTypes.FLOAT,
    reasonLeaving: DataTypes.STRING,
  });

  Experience.associate = (models) => {
    if (models.Candidate) {
      Experience.belongsTo(models.Candidate, { foreignKey: 'candidateId' });
    }
  };

  return Experience;
};
