module.exports = (sequelize, DataTypes) => {
  const Option = sequelize.define('Option', {
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.STRING, allowNull: false },
    isCorrect: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {});

  Option.associate = (models) => {
    Option.belongsTo(models.Question, { foreignKey: 'questionId', as: 'question' });
    
  };

  return Option;
};
