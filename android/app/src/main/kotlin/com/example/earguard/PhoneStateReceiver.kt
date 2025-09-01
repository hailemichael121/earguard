package com.example.earguard

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log

class PhoneStateReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "PhoneStateReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        try {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)
            Log.d(TAG, "Phone state: $state, Number: $incomingNumber")

            val serviceIntent = Intent(context, ForegroundService::class.java)
            serviceIntent.putExtra("phone_state", state)
            serviceIntent.putExtra("incoming_number", incomingNumber)
            context.startService(serviceIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Error in PhoneStateReceiver: ${e.message}")
        }
    }
}