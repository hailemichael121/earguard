package com.example.earguard

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.provider.CallLog
import android.provider.Settings
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import org.json.JSONObject

class EarGuardModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "EarGuard"
    private const val TAG = "EarGuardModule"
    const val PREFS_NAME = "EarGuardPrefs"
    private var previewPlayer: MediaPlayer? = null
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun getPreferences(promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
      val map =
          Arguments.createMap().apply {
            putDouble("interval", prefs.getFloat("interval", 30f).toDouble())
            putBoolean("enabled", prefs.getBoolean("enabled", true))
            putBoolean("useSound", prefs.getBoolean("useSound", false))
            putString("sound", prefs.getString("sound", "reminder3.mp3"))
            putBoolean("quietHoursEnabled", prefs.getBoolean("quietHoursEnabled", false))
            putString("quietStart", prefs.getString("quietStart", "22:00"))
            putString("quietEnd", prefs.getString("quietEnd", "07:00"))
            putBoolean("smartIntensity", prefs.getBoolean("smartIntensity", true))
          }
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("PREFS_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun savePreferences(options: ReadableMap, promise: Promise) {
    try {
      val editor = reactContext.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE).edit()
      if (options.hasKey("interval")) {
        editor.putFloat("interval", options.getDouble("interval").toFloat().coerceIn(1f, 30f))
      }
      if (options.hasKey("enabled")) {
        editor.putBoolean("enabled", options.getBoolean("enabled"))
      }
      if (options.hasKey("useSound")) {
        editor.putBoolean("useSound", options.getBoolean("useSound"))
      }
      if (options.hasKey("sound")) {
        editor.putString("sound", options.getString("sound"))
      }
      if (options.hasKey("quietHoursEnabled")) {
        editor.putBoolean("quietHoursEnabled", options.getBoolean("quietHoursEnabled"))
      }
      if (options.hasKey("quietStart")) {
        editor.putString("quietStart", options.getString("quietStart"))
      }
      if (options.hasKey("quietEnd")) {
        editor.putString("quietEnd", options.getString("quietEnd"))
      }
      if (options.hasKey("smartIntensity")) {
        editor.putBoolean("smartIntensity", options.getBoolean("smartIntensity"))
      }
      editor.apply()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("PREFS_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun getOnboardingCompleted(promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
      promise.resolve(prefs.getBoolean("onboardingCompleted", false))
    } catch (e: Exception) {
      promise.reject("PREFS_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun setOnboardingCompleted(completed: Boolean, promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
      prefs.edit().putBoolean("onboardingCompleted", completed).apply()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("PREFS_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun recordCallCompleted(promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
      val totalCalls = prefs.getInt("totalCalls", 0) + 1
      val dailyJson = JSONObject(prefs.getString("dailyStats", "{}") ?: "{}")
      val today = todayKey()
      val todayCount = dailyJson.optInt(today, 0) + 1
      dailyJson.put(today, todayCount)

      prefs.edit()
          .putInt("totalCalls", totalCalls)
          .putString("dailyStats", dailyJson.toString())
          .apply()

      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("INSIGHTS_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun getInsights(promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
      val totalCalls = prefs.getInt("totalCalls", 0)
      val dailyJson = JSONObject(prefs.getString("dailyStats", "{}") ?: "{}")

      val map = Arguments.createMap()
      map.putInt("totalCalls", totalCalls)
      map.putInt("currentStreak", computeStreak(dailyJson))
      map.putInt("weekTotal", computeWeekTotal(dailyJson))
      map.putInt("dailyPoints", totalCalls * 5)
      map.putBoolean("firstTenUnlocked", totalCalls >= 10)
      map.putBoolean("sevenDayUnlocked", computeStreak(dailyJson) >= 7)

      val weekSeries = Arguments.createArray()
      for (dayOffset in 6 downTo 0) {
        val key = dayKey(dayOffset)
        val entry = Arguments.createMap()
        entry.putString("date", key)
        entry.putInt("count", dailyJson.optInt(key, 0))
        weekSeries.pushMap(entry)
      }
      map.putArray("weekSeries", weekSeries)
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("INSIGHTS_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun getCallerInfo(promise: Promise) {
    if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_CALL_LOG) !=
      PackageManager.PERMISSION_GRANTED) {
      promise.resolve("Unknown Caller")
      return
    }

    try {
      val cursor =
          reactContext.contentResolver.query(
              CallLog.Calls.CONTENT_URI,
              arrayOf(CallLog.Calls.CACHED_NAME, CallLog.Calls.NUMBER),
              null,
              null,
              "${CallLog.Calls.DATE} DESC LIMIT 1",
          )
      val result =
          cursor?.use {
            if (it.moveToFirst()) {
              val name = it.getString(it.getColumnIndexOrThrow(CallLog.Calls.CACHED_NAME))
              val number = it.getString(it.getColumnIndexOrThrow(CallLog.Calls.NUMBER))
              name ?: number ?: "Unknown"
            } else {
              "Unknown"
            }
          } ?: "Unknown"
      promise.resolve(result)
    } catch (e: Exception) {
      Log.e(TAG, "Error retrieving caller info: ${e.message}")
      promise.resolve("Unknown Caller")
    }
  }

  @ReactMethod
  fun isMIUI(promise: Promise) {
    val manufacturer = Build.MANUFACTURER.lowercase()
    promise.resolve(
        manufacturer.contains("xiaomi") || System.getProperty("ro.miui.ui.version.name") != null,
    )
  }

  @ReactMethod
  fun getCallState(promise: Promise) {
    try {
      if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_PHONE_STATE) !=
          PackageManager.PERMISSION_GRANTED) {
        promise.resolve("IDLE")
        return
      }
      val telephony =
          reactContext.getSystemService(android.content.Context.TELEPHONY_SERVICE) as TelephonyManager
      val state =
          when (telephony.callState) {
            TelephonyManager.CALL_STATE_RINGING -> "RINGING"
            TelephonyManager.CALL_STATE_OFFHOOK -> "OFFHOOK"
            else -> "IDLE"
          }
      promise.resolve(state)
    } catch (e: Exception) {
      promise.reject("CALL_STATE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun checkOverlayPermission(promise: Promise) {
    promise.resolve(Settings.canDrawOverlays(reactContext))
  }

  @ReactMethod
  fun requestOverlayPermission(promise: Promise) {
    try {
      val activity = reactContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity not available")
        return
      }
      val intent =
          Intent(
              Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
              Uri.parse("package:${reactContext.packageName}"),
          )
      activity.startActivity(intent)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("OVERLAY_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun showOverlay(callerInfo: String?, promise: Promise) {
    try {
      val intent = Intent(reactContext, OverlayService::class.java)
      intent.putExtra("callerInfo", callerInfo ?: "Unknown")
      reactContext.startService(intent)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("OVERLAY_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun hideOverlay(promise: Promise) {
    try {
      val intent = Intent(reactContext, OverlayService::class.java)
      reactContext.stopService(intent)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("OVERLAY_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun startForegroundService(
      phoneState: String?,
      callerInfo: String?,
      interval: Double,
      useSound: Boolean,
      sound: String?,
      promise: Promise,
  ) {
    try {
      val intent = Intent(reactContext, ForegroundService::class.java)
      intent.putExtra("phoneState", phoneState ?: "OFFHOOK")
      intent.putExtra("callerInfo", callerInfo ?: "Unknown")
      intent.putExtra("interval", interval)
      intent.putExtra("useSound", useSound)
      intent.putExtra("sound", sound ?: "reminder3.mp3")
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        reactContext.startForegroundService(intent)
      } else {
        reactContext.startService(intent)
      }
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("SERVICE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun stopForegroundService(promise: Promise) {
    try {
      val intent = Intent(reactContext, ForegroundService::class.java)
      reactContext.stopService(intent)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("SERVICE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun requestIgnoreBatteryOptimizations(promise: Promise) {
    try {
      val activity = reactContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity not available")
        return
      }
      val powerManager = reactContext.getSystemService(android.content.Context.POWER_SERVICE) as PowerManager
      if (powerManager.isIgnoringBatteryOptimizations(reactContext.packageName)) {
        promise.resolve(true)
        return
      }
      val intent =
          Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:${reactContext.packageName}")
          }
      activity.startActivity(intent)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("BATTERY_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun isIgnoringBatteryOptimizations(promise: Promise) {
    try {
      val powerManager = reactContext.getSystemService(android.content.Context.POWER_SERVICE) as PowerManager
      promise.resolve(powerManager.isIgnoringBatteryOptimizations(reactContext.packageName))
    } catch (e: Exception) {
      promise.reject("BATTERY_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun vibrate(durationMs: Double, promise: Promise) {
    try {
      val vibrator = reactContext.getSystemService(android.content.Context.VIBRATOR_SERVICE) as Vibrator?
      vibrator?.let {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          it.vibrate(VibrationEffect.createOneShot(durationMs.toLong(), VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
          @Suppress("DEPRECATION") it.vibrate(durationMs.toLong())
        }
      }
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("VIBRATE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun playSound(soundFile: String?, promise: Promise) {
    try {
      previewPlayer?.release()
      val resId = soundResourceId(soundFile ?: "reminder3.mp3")
      previewPlayer = MediaPlayer.create(reactContext, resId)
      previewPlayer?.setOnCompletionListener {
        it.release()
        previewPlayer = null
      }
      previewPlayer?.start()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("SOUND_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun stopSound(promise: Promise) {
    try {
      previewPlayer?.stop()
      previewPlayer?.release()
      previewPlayer = null
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("SOUND_ERROR", e.message, e)
    }
  }

  private fun soundResourceId(selectedSound: String): Int {
    return when (selectedSound) {
      "reminder1.mp3" -> R.raw.reminder1
      "reminder2.mp3" -> R.raw.reminder2
      "reminder3.mp3" -> R.raw.reminder3
      "reminder4.mp3" -> R.raw.reminder4
      "reminder5.mp3" -> R.raw.reminder5
      "reminder6.mp3" -> R.raw.reminder6
      else -> R.raw.reminder3
    }
  }

  private fun todayKey(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Calendar.getInstance().time)

  private fun dayKey(daysAgo: Int): String {
    val cal = Calendar.getInstance()
    cal.add(Calendar.DAY_OF_YEAR, -daysAgo)
    return SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.time)
  }

  private fun computeWeekTotal(stats: JSONObject): Int {
    var total = 0
    for (dayOffset in 0..6) {
      total += stats.optInt(dayKey(dayOffset), 0)
    }
    return total
  }

  private fun computeStreak(stats: JSONObject): Int {
    var streak = 0
    var dayOffset = 0
    while (true) {
      val count = stats.optInt(dayKey(dayOffset), 0)
      if (count > 0) {
        streak += 1
        dayOffset += 1
      } else {
        break
      }
    }
    return streak
  }
}
