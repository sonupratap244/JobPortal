module.exports = (sequelize, DataTypes) => {
  const Answer = sequelize.define("Answer", {
    resultId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    givenAnswer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
     isCorrect: DataTypes.BOOLEAN,
    obtainedMarks: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    questionMarks: { 
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
  });

  Answer.associate = (models) => {
    Answer.belongsTo(models.Result, { foreignKey: "resultId" });
    Answer.belongsTo(models.Question, { foreignKey: "questionId" });
  };

  return Answer;
};
