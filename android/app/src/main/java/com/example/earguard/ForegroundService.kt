package com.example.earguard

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.app.NotificationCompat
import java.util.Calendar

class ForegroundService : Service() {

  companion object {
    private const val TAG = "ForegroundService"
    private const val CHANNEL_ID = "earguard_channel"
    private const val NOTIFICATION_ID = 123
    private const val REMINDER_NOTIFICATION_ID = 124
  }

  private var reminderHandler: Handler? = null
  private var isTimerRunning = false

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    reminderHandler = Handler(Looper.getMainLooper())
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val phoneState = intent?.getStringExtra("phoneState") ?: TelephonyManager.EXTRA_STATE_OFFHOOK
    val callerInfo = intent?.getStringExtra("callerInfo") ?: "Unknown"
    val prefs = getSharedPreferences(EarGuardModule.PREFS_NAME, Context.MODE_PRIVATE)
    val intervalMinutes =
        intent?.getDoubleExtra("interval", prefs.getFloat("interval", 30f).toDouble())?.toLong()
            ?: prefs.getFloat("interval", 30f).toLong()
    val useSound = intent?.getBooleanExtra("useSound", prefs.getBoolean("useSound", false)) ?: false
    val selectedSound = intent?.getStringExtra("sound") ?: prefs.getString("sound", "reminder3.mp3")
    val quietHoursEnabled = prefs.getBoolean("quietHoursEnabled", false)
    val quietStart = prefs.getString("quietStart", "22:00") ?: "22:00"
    val quietEnd = prefs.getString("quietEnd", "07:00") ?: "07:00"
    val smartIntensity = prefs.getBoolean("smartIntensity", true)

    val notification = createNotification(callerInfo)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
          NOTIFICATION_ID,
          notification,
          ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL,
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }

    if (phoneState == TelephonyManager.EXTRA_STATE_OFFHOOK && !isTimerRunning) {
      val reminderEnabled = prefs.getBoolean("enabled", true)
      if (reminderEnabled) {
        isTimerRunning = true
        reminderHandler?.postDelayed(
            {
              triggerReminder(
                  useSound = useSound,
                  selectedSound = selectedSound ?: "reminder3.mp3",
                  intervalMinutes = intervalMinutes.toInt(),
                  quietHoursEnabled = quietHoursEnabled,
                  quietStart = quietStart,
                  quietEnd = quietEnd,
                  smartIntensity = smartIntensity,
              )
              isTimerRunning = false
              Log.d(TAG, "[sharuk] Reminder triggered for sound: $selectedSound")
            },
            intervalMinutes * 60 * 1000,
        )
      }
    } else if (phoneState == TelephonyManager.EXTRA_STATE_IDLE) {
      reminderHandler?.removeCallbacksAndMessages(null)
      isTimerRunning = false
    }

    return START_STICKY
  }

  private fun triggerReminder(
      useSound: Boolean,
      selectedSound: String,
      intervalMinutes: Int,
      quietHoursEnabled: Boolean,
      quietStart: String,
      quietEnd: String,
      smartIntensity: Boolean,
  ) {
    val inQuietHours = quietHoursEnabled && isQuietHoursNow(quietStart, quietEnd)
    val vibrationMs =
        if (inQuietHours) {
          180L
        } else if (!smartIntensity) {
          500L
        } else if (intervalMinutes <= 10) {
          700L
        } else if (intervalMinutes <= 20) {
          450L
        } else {
          260L
        }

    val reminderNotification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("EarGuard Reminder")
            .setContentText("Time to switch ears!")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

    val notificationManager = getSystemService(NotificationManager::class.java)
    notificationManager.notify(REMINDER_NOTIFICATION_ID, reminderNotification)

    val vibrator = getSystemService(Vibrator::class.java)
    vibrator?.let {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        it.vibrate(VibrationEffect.createOneShot(vibrationMs, VibrationEffect.DEFAULT_AMPLITUDE))
      } else {
        @Suppress("DEPRECATION") it.vibrate(vibrationMs)
      }
    }

    if (useSound && !inQuietHours) {
      try {
        val soundResId =
            when (selectedSound) {
              "reminder1.mp3" -> R.raw.reminder1
              "reminder2.mp3" -> R.raw.reminder2
              "reminder3.mp3" -> R.raw.reminder3
              "reminder4.mp3" -> R.raw.reminder4
              "reminder5.mp3" -> R.raw.reminder5
              "reminder6.mp3" -> R.raw.reminder6
              else -> R.raw.reminder3
            }
        val player = MediaPlayer.create(this, soundResId)
        player.setOnCompletionListener { mediaPlayer -> mediaPlayer.release() }
        player.start()
      } catch (e: Exception) {
        Log.e(TAG, "[sharuk] Error playing sound: ${e.message}")
      }
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun createNotification(callerInfo: String): Notification {
    return NotificationCompat.Builder(this, CHANNEL_ID)
        .setContentTitle("EarGuard - Call Monitoring")
        .setContentText("Tracking call with: $callerInfo")
        .setSmallIcon(R.mipmap.ic_launcher)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setOngoing(true)
        .build()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel =
          NotificationChannel(CHANNEL_ID, "EarGuard Notifications", NotificationManager.IMPORTANCE_HIGH)
      channel.setShowBadge(true)
      getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    reminderHandler?.removeCallbacksAndMessages(null)
    reminderHandler = null
    isTimerRunning = false
    @Suppress("DEPRECATION") stopForeground(true)
  }

  private fun isQuietHoursNow(start: String, end: String): Boolean {
    val nowCal = Calendar.getInstance()
    val nowMinutes = nowCal.get(Calendar.HOUR_OF_DAY) * 60 + nowCal.get(Calendar.MINUTE)
    val startMinutes = parseClockMinutes(start)
    val endMinutes = parseClockMinutes(end)
    return if (startMinutes <= endMinutes) {
      nowMinutes in startMinutes until endMinutes
    } else {
      nowMinutes >= startMinutes || nowMinutes < endMinutes
    }
  }

  private fun parseClockMinutes(value: String): Int {
    val parts = value.split(":")
    val hour = parts.getOrNull(0)?.toIntOrNull()?.coerceIn(0, 23) ?: 22
    val minute = parts.getOrNull(1)?.toIntOrNull()?.coerceIn(0, 59) ?: 0
    return hour * 60 + minute
  }
}
