'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Assignments', 'candidateId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Candidates',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Assignments', 'candidateId');
  }
};
