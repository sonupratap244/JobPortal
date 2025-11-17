module.exports = (sequelize, DataTypes) => {
  const PasswordReset = sequelize.define('PasswordReset', {
    token: DataTypes.STRING,
    expiresAt: DataTypes.DATE
  });

  PasswordReset.associate = (models) => {
    PasswordReset.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return PasswordReset;
};
