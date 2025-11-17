const { Candidate, Job, User, Sequelize } = require('../models');
const { Op } = Sequelize;

exports.dashboard = async (req, res) => {
  try {
    // Total candidates
    const totalCandidates = await Candidate.count();

    // Freshers
    const freshers = await Candidate.count({ where: { fresher: true } });

    // Total Jobs
    const totalJobs = await Job.count();

    // Active Users 
    let activeUsers = 0;
    if (User.rawAttributes.isActive) {
      activeUsers = await User.count({ where: { isActive: true } });
    }

    // Monthly candidates for line chart
    const monthlyCandidates = await Candidate.findAll({
      attributes: [
        [Sequelize.fn('MONTH', Sequelize.col('createdAt')), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: [Sequelize.fn('MONTH', Sequelize.col('createdAt'))],
      raw: true,
      order: [[Sequelize.fn('MONTH', Sequelize.col('createdAt')), 'ASC']]
    });

    // Weekly candidates 
    
    const weeklyCandidates = await Candidate.findAll({
      attributes: [
        [Sequelize.fn('WEEK', Sequelize.col('createdAt')), 'week'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: [Sequelize.fn('WEEK', Sequelize.col('createdAt'))],
      raw: true,
      order: [[Sequelize.fn('WEEK', Sequelize.col('createdAt')), 'ASC']]
    });

    res.render('home', {
      user: req.user,
      totalCandidates,
      freshers,
      totalJobs,
      activeUsers,
      monthlyCandidates: monthlyCandidates || [],
      weeklyCandidates: weeklyCandidates || []
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.render('home', {
      user: req.user,
      totalCandidates: 0,
      freshers: 0,
      totalJobs: 0,
      activeUsers: 0,
      monthlyCandidates: [],
      weeklyCandidates: []
    });
  }
};
