package com.example.earguard

import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.TextView

class OverlayService : Service() {
  private lateinit var windowManager: WindowManager
  private var overlayView: View? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_layout, null)

    val params =
        WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                  WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                  @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE
                },
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT,
            )
            .apply {
              gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
            }

    windowManager.addView(overlayView, params)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val callerInfo = intent?.getStringExtra("callerInfo")
    updateOverlayText(callerInfo)
    return START_STICKY
  }

  private fun updateOverlayText(callerInfo: String?) {
    overlayView?.findViewById<TextView>(R.id.overlay_text)?.text =
        "EarGuard is tracking your call with ${callerInfo ?: "Unknown"}."
  }

  override fun onDestroy() {
    super.onDestroy()
    overlayView?.let { view ->
      windowManager.removeView(view)
      overlayView = null
    }
  }
}
