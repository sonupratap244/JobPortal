module.exports = (sequelize, DataTypes) => {
  const Candidate = sequelize.define("Candidate", {
    jobId: DataTypes.INTEGER,
    experienceYears: DataTypes.STRING,
    fresher: DataTypes.BOOLEAN,
    name: DataTypes.STRING,
    dob: DataTypes.DATE,
    age: DataTypes.INTEGER,
    maritalStatus: DataTypes.STRING,
    address: DataTypes.TEXT,
    contactNo: DataTypes.STRING,
    email: DataTypes.STRING,
    currentCTC: DataTypes.FLOAT,
    expectedCTC: DataTypes.FLOAT,
    technicalSkills: DataTypes.STRING,
    strengths: DataTypes.STRING,
    achievements: DataTypes.STRING,
    noticePeriod: DataTypes.STRING,
    documents: DataTypes.STRING,
   status: {
  type: DataTypes.STRING,
  allowNull: false,
  defaultValue: 'Pending'
},testAssigned: {
  type: DataTypes.INTEGER,
  allowNull: true
},userEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },

  });

  Candidate.associate = (models) => {
    // Candidate.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Candidate.belongsTo(models.Job, { foreignKey: "jobId", as: "job" });
    Candidate.hasMany(models.Experience, { foreignKey: "candidateId", as: "Experiences" });
    Candidate.hasMany(models.Qualification, { foreignKey: "candidateId", as: "Qualifications" });
    Candidate.hasMany(models.Reference, { foreignKey: "candidateId", as: "References" });
    Candidate.hasOne(models.Questionnaire, { foreignKey: "candidateId", as: "Questionnaire" });
    Candidate.hasMany(models.Result, {
    foreignKey: 'candidateId',
      as: 'results',
         // same alias use karna controller me
    onDelete: 'CASCADE'
  });
  };

  return Candidate;
};
