const cron = require("node-cron");
const { sendWeeklyReminders } = require("./emailReminderService");

function initReminderScheduler() {
  // Fires every Monday at 09:00 (server local time)
  cron.schedule("0 9 * * 1", async () => {
    console.log(`\n🕘 [${new Date().toISOString()}] Weekly reminder cron triggered`);
    try {
      const result = await sendWeeklyReminders();
      console.log(`📊 Result: ${result.sent} sent, ${result.failed} failed\n`);
    } catch (err) {
      console.error("❌ Reminder cron failed:", err);
    }
  });

  console.log("⏰ Weekly reminder cron scheduled — fires every Monday at 09:00");
}

module.exports = { initReminderScheduler };