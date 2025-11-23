module.exports = (sequelize, DataTypes) => {
  const Result = sequelize.define("Result", {
    testId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tests",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    candidateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users", // reference to users table
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    candidateName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    obtainedMarks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalMarks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Pending", 
    },
    reviewStatus: {
    type: DataTypes.STRING,
    defaultValue: "Pending", 
  },
  });

  Result.associate = (models) => {
    Result.belongsTo(models.Candidate, { foreignKey: 'candidateId',as:'candidate' });
    Result.belongsTo(models.Test, { foreignKey: "testId",as:"Test"});
    Result.belongsTo(models.Candidate, { foreignKey: "candidateId" }); 
    Result.hasMany(models.Answer, { foreignKey: "resultId", onDelete: "CASCADE" });
  };

  return Result;
};
