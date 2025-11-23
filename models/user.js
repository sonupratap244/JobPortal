'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Task, { foreignKey: 'userId', as: 'tasks' });
    }
  }
  User.init({
    id: { type: DataTypes.INTEGER, primaryKey: true,autoIncrement: true  },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: true },
    googleId: { type: DataTypes.STRING, allowNull: true },
    resetToken: DataTypes.STRING,
    resetTokenExpiry: DataTypes.DATE,
    role: {
  type: DataTypes.ENUM('admin', 'user'),
  defaultValue: 'user'
},
photo: {
  type: DataTypes.STRING,
  allowNull: true,
},
   phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [10, 15] 
      }
    },
  }, { sequelize, modelName: 'User', tableName: 'Users', timestamps: true });
 

  return User;
};
