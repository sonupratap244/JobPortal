module.exports = (sequelize, DataTypes) => {
  const Test = sequelize.define("Test", {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    totalMarks: DataTypes.INTEGER,
    passingMarks: DataTypes.INTEGER,
    durationMinutes: DataTypes.INTEGER,
    createdBy: DataTypes.INTEGER,
  }, {
    tableName: 'tests',
    timestamps: true,
  });

  Test.associate = (models) => {
    
    Test.hasMany(models.Question, { foreignKey: 'testId', onDelete: 'CASCADE' });
    Test.hasMany(models.Result, {foreignKey: 'testId',onDelete: 'CASCADE' });
  };

  return Test;
};
