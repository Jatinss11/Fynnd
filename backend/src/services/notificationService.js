const Notification = require('../models/Notification');

async function createNotification({ userId, type, title, message, link, meta }) {
  try {
    await Notification.create({ userId, type, title, message, link, meta });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}

async function notifyPipelineMove({ userId, candidateName, jobTitle, stage, pipelineId }) {
  await createNotification({
    userId,
    type: 'pipeline_update',
    title: 'Candidate Stage Updated',
    message: `${candidateName} moved to "${stage}" for ${jobTitle}`,
    link: `/pipeline?id=${pipelineId}`,
  });
}

async function notifyInterviewScheduled({ userId, candidateName, jobTitle, scheduledAt, interviewId }) {
  await createNotification({
    userId,
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    message: `Interview for ${candidateName} (${jobTitle}) on ${new Date(scheduledAt).toLocaleString('en-IN')}`,
    link: `/interviews/${interviewId}`,
  });
}

module.exports = { createNotification, notifyPipelineMove, notifyInterviewScheduled };
