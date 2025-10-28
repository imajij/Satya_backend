import cron from 'node-cron';
import Article from '../models/Article';

export const startCleanupJob = (): void => {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🧹 Starting cleanup job...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Article.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });

      console.log(`✅ Cleanup completed. Removed ${result.deletedCount} old articles.`);
    } catch (error) {
      console.error('❌ Cleanup job error:', error);
    }
  });

  console.log('📅 Cleanup cron job scheduled (daily at 2 AM)');
};
