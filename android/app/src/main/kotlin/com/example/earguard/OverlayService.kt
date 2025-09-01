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

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        // Inflate the overlay layout
        overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_layout, null)

        // Set up window manager layout parameters
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL // Align to bottom and center horizontally
            x = 0
            y = 0 // Adjust this value if you want padding from the bottom (e.g., y = -50 for 50px above bottom)
        }

        // Add overlay view to window manager
        windowManager.addView(overlayView, params)
    }

    fun updateOverlayText(callerInfo: String?) {
        overlayView?.let { view ->
            val textView = view.findViewById<TextView>(R.id.overlay_text)
            textView?.text = "Call with: ${callerInfo ?: "Unknown"}"
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        overlayView?.let { view ->
            windowManager.removeView(view)
            overlayView = null
        }
    }
}