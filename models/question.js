module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define("Question", {
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM('Objective', 'Subjective'),
      defaultValue: 'Objective',
      allowNull: false,
    },

    options: {
      type: DataTypes.JSON, 
      allowNull: true,
    },

    correctAnswer: {
      type: DataTypes.STRING,
      allowNull: true, 
    },

    marks: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    timeLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
    },

    testId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'questions',
    timestamps: true,
  });

  Question.associate = (models) => {
    Question.belongsTo(models.Test, {
      foreignKey: 'testId',
      onDelete: 'CASCADE',
    });
     Question.hasMany(models.Answer, { foreignKey: 'questionId', onDelete: 'CASCADE' });
  };

  return Question;
};
