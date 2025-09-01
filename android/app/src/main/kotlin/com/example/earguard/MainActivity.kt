package com.example.earguard

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.provider.CallLog
import android.content.Intent
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    companion object {
        private const val CALLER_CHANNEL = "com.example.earguard/caller"
        private const val OVERLAY_CHANNEL = "com.example.earguard/overlay"
        private const val TAG = "EarGuardMainActivity"
        private const val OVERLAY_PERMISSION_REQUEST_CODE = 1001
        private const val PERMISSION_REQUEST_CODE = 1000

        private val REQUIRED_PERMISSIONS = arrayOf(
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.READ_CALL_LOG,
            Manifest.permission.FOREGROUND_SERVICE,
            Manifest.permission.SYSTEM_ALERT_WINDOW
        )
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // Request runtime permissions at startup
        requestNecessaryPermissions()

        // --- Caller Info Channel ---
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CALLER_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "getCallerInfo" -> result.success(getCallerInfo())
                "isMIUI" -> result.success(isMIUIDevice())
                else -> result.notImplemented()
            }
        }

        // --- Overlay & Foreground Service Channel ---
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, OVERLAY_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "checkOverlayPermission" -> {
                    val hasPermission = Settings.canDrawOverlays(this)
                    result.success(hasPermission)
                }
                "requestOverlayPermission" -> {
                    requestOverlayPermission()
                    result.success(null)
                }
                "showOverlay" -> {
                    val callerInfo: String? = call.argument("callerInfo")
                    showOverlay(callerInfo)
                    result.success(null)
                }
                "hideOverlay" -> {
                    hideOverlay()
                    result.success(null)
                }
                "startForegroundService" -> {
                    val phoneState: String? = call.argument("phoneState")
                    val callerInfo: String? = call.argument("callerInfo")
                    startForegroundService(phoneState, callerInfo)
                    result.success(null)
                }
                "stopForegroundService" -> {
                    stopForegroundService()
                    result.success(null)
                }
                else -> result.notImplemented()
            }
        }
    }

    // --- Permission Handling ---
    private fun requestNecessaryPermissions() {
        val permissionsToRequest = REQUIRED_PERMISSIONS.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsToRequest.toTypedArray(), PERMISSION_REQUEST_CODE)
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                Toast.makeText(this, "Permissions granted", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Some permissions denied", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // --- Caller Info ---
    private fun getCallerInfo(): String {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CALL_LOG) != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "READ_CALL_LOG permission not granted")
            return "PermissionDenied"
        }

        return try {
            val cursor = contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                arrayOf(CallLog.Calls.CACHED_NAME, CallLog.Calls.NUMBER),
                null, null,
                "${CallLog.Calls.DATE} DESC LIMIT 1"
            )
            cursor?.use {
                if (it.moveToFirst()) {
                    val name = it.getString(it.getColumnIndexOrThrow(CallLog.Calls.CACHED_NAME))
                    val number = it.getString(it.getColumnIndexOrThrow(CallLog.Calls.NUMBER))
                    name ?: number ?: "Unknown"
                } else "Unknown"
            } ?: "Unknown"
        } catch (e: Exception) {
            Log.e(TAG, "Error retrieving caller info: ${e.message}")
            "Unknown"
        }
    }

    private fun isMIUIDevice(): Boolean {
        val manufacturer = Build.MANUFACTURER.lowercase()
        return manufacturer.contains("xiaomi") || System.getProperty("ro.miui.ui.version.name") != null
    }

    // --- Overlay Permissions & Service ---
    private fun requestOverlayPermission() {
        val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)
        startActivityForResult(intent, OVERLAY_PERMISSION_REQUEST_CODE)
    }

    private fun showOverlay(callerInfo: String?) {
        val intent = Intent(this, OverlayService::class.java)
        intent.putExtra("callerInfo", callerInfo)
        startService(intent)
    }

    private fun hideOverlay() {
        val intent = Intent(this, OverlayService::class.java)
        stopService(intent)
    }

    // --- Foreground Service Control ---
    private fun startForegroundService(phoneState: String?, callerInfo: String?) {
        val intent = Intent(this, ForegroundService::class.java)
        intent.putExtra("phoneState", phoneState)
        intent.putExtra("callerInfo", callerInfo)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun stopForegroundService() {
        val intent = Intent(this, ForegroundService::class.java)
        stopService(intent)
    }

    // --- Handle Overlay Permission Result ---
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == OVERLAY_PERMISSION_REQUEST_CODE) {
            if (Settings.canDrawOverlays(this)) {
                Toast.makeText(this, "Overlay permission granted", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Overlay permission denied", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
