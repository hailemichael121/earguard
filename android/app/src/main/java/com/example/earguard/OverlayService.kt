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
  private var dismissable = false

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
    overlayView?.findViewById<View>(R.id.overlay_close)?.setOnClickListener {
      stopSelf()
    }
    overlayView?.setOnClickListener {
      if (dismissable) {
        stopSelf()
      }
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val title = intent?.getStringExtra("title")
    val body = intent?.getStringExtra("body")
    val subtext = intent?.getStringExtra("subtext")
    dismissable = intent?.getBooleanExtra("dismissable", false) ?: false
    updateOverlayText(title, body, subtext, dismissable)
    return START_STICKY
  }

  private fun updateOverlayText(title: String?, body: String?, subtext: String?, dismissable: Boolean) {
    overlayView?.findViewById<TextView>(R.id.overlay_title)?.text = title ?: "EarGuard"
    overlayView?.findViewById<TextView>(R.id.overlay_body)?.text = body ?: "EarGuard is tracking your call."
    overlayView?.findViewById<TextView>(R.id.overlay_subtext)?.text = subtext ?: ""
    overlayView?.findViewById<TextView>(R.id.overlay_close)?.visibility =
        if (dismissable) View.VISIBLE else View.GONE
  }

  override fun onDestroy() {
    super.onDestroy()
    overlayView?.let { view ->
      windowManager.removeView(view)
      overlayView = null
    }
  }
}
