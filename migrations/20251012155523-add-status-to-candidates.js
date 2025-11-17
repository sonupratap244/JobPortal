module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Candidates', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Pending',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Candidates', 'status');
  }
};
