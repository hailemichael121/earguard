package com.example.earguard

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
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

class ForegroundService : Service() {

    companion object {
        private const val TAG = "ForegroundService"
        private const val CHANNEL_ID = "EarGuardForegroundChannel"
        private const val NOTIFICATION_ID = 123
        private const val REMINDER_NOTIFICATION_ID = 124
    }

    private var reminderHandler: Handler? = null
    private var isTimerRunning = false

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "[sharuk] ForegroundService created")
        createNotificationChannel()
        reminderHandler = Handler(Looper.getMainLooper())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val phoneState = intent?.getStringExtra("phoneState") ?: "Unknown"
        val callerInfo = intent?.getStringExtra("callerInfo") ?: "Unknown"
        val intervalMinutes = intent?.getDoubleExtra("interval", 30.0)?.toLong() ?: 30L
        val useSound = intent?.getBooleanExtra("useSound", false) ?: false
        val selectedSound = intent?.getStringExtra("sound") ?: "classic_chime.mp3"

        Log.d(TAG, "[sharuk] Received phone state: $phoneState, caller: $callerInfo, interval: $intervalMinutes, useSound: $useSound, sound: $selectedSound")

        val notification = createNotification(callerInfo)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        // Handle phone state logic
        if (phoneState == TelephonyManager.EXTRA_STATE_OFFHOOK && !isTimerRunning) {
            val prefs: SharedPreferences = getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
            val reminderEnabled = prefs.getBoolean("flutter.enabled", true)

            if (reminderEnabled) {
                isTimerRunning = true
                reminderHandler?.postDelayed({
                    triggerReminder(useSound, selectedSound)
                    isTimerRunning = false  // Allow restart if call continues
                    Log.d(TAG, "[sharuk] Reminder triggered for sound: $selectedSound")
                }, intervalMinutes * 60 * 1000)
            } else {
                Log.d(TAG, "[sharuk] Reminder not triggered: reminders disabled")
            }
        } else if (phoneState == TelephonyManager.EXTRA_STATE_IDLE) {
            // Cancel timer on call end
            reminderHandler?.removeCallbacksAndMessages(null)
            isTimerRunning = false
            Log.d(TAG, "[sharuk] Call ended, timer cancelled")
        }

        return START_STICKY
    }

    private fun triggerReminder(useSound: Boolean, selectedSound: String) {
        // Show reminder notification
        val reminderNotification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("EarGuard Reminder")
            .setContentText("Time to switch ears!")
            .setSmallIcon(R.mipmap.launcher_icon)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(REMINDER_NOTIFICATION_ID, reminderNotification)
        Log.d(TAG, "[sharuk] Reminder notification shown")

        // Vibrate
        val vibrator = getSystemService(Vibrator::class.java) as Vibrator?
        vibrator?.let {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                it.vibrate(VibrationEffect.createOneShot(500, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                it.vibrate(500)
            }
            Log.d(TAG, "[sharuk] Vibration triggered")
        }

        // Play sound if enabled
        if (useSound) {
            try {
                val soundResId = when (selectedSound) {
                    "classic_chime.mp3" -> R.raw.classic_chime
                    "reminder1.mp3" -> R.raw.reminder1
                    "reminder2.mp3" -> R.raw.reminder2
                    "reminder3.mp3" -> R.raw.reminder3
                    "reminder4.mp3" -> R.raw.reminder4
                    "reminder5.mp3" -> R.raw.reminder5
                    "reminder6.mp3" -> R.raw.reminder6
                    else -> R.raw.classic_chime
                }
                val player = MediaPlayer.create(this, soundResId)
                player.setOnCompletionListener { it.release() }
                player.start()
                Log.d(TAG, "[sharuk] Playing sound: $selectedSound")
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
            .setSmallIcon(R.mipmap.launcher_icon)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "EarGuard Foreground Service",
                NotificationManager.IMPORTANCE_HIGH
            )
            channel.setShowBadge(true)
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
            Log.d(TAG, "[sharuk] Notification channel created")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        reminderHandler?.removeCallbacksAndMessages(null)
        reminderHandler = null
        isTimerRunning = false
        Log.d(TAG, "[sharuk] ForegroundService destroyed")
        stopForeground(true)
    }
}