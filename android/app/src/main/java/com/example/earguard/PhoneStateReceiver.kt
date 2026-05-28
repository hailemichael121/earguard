package com.example.earguard

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telephony.TelephonyManager
import android.util.Log

class PhoneStateReceiver : BroadcastReceiver() {
  companion object {
    private const val TAG = "PhoneStateReceiver"
  }

  override fun onReceive(context: Context, intent: Intent) {
    try {
      val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
      Log.d(TAG, "Phone state: $state")

      val serviceIntent = Intent(context, ForegroundService::class.java)
      serviceIntent.putExtra("phoneState", state)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
          (state == TelephonyManager.EXTRA_STATE_OFFHOOK ||
              state == TelephonyManager.EXTRA_STATE_RINGING)) {
        context.startForegroundService(serviceIntent)
      } else {
        context.startService(serviceIntent)
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error in PhoneStateReceiver: ${e.message}")
    }
  }
}
