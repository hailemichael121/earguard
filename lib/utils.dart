// utils.dart
import 'dart:async';
import 'package:flutter/services.dart';
import 'package:another_telephony/telephony.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_neumorphic_plus/flutter_neumorphic.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:vibration/vibration.dart';
import 'package:flutter/material.dart';

Future<CallState> checkCallState(dynamic ignored) async {
  try {
    final telephony = Telephony.instance;
    return await telephony.callState;
  } catch (e) {
    print('[sharuk] Error getting call state in isolate: $e');
    return CallState.IDLE;
  }
}

Future<void> initNotifications() async {
  try {
    final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
    const androidInit = AndroidInitializationSettings('splash_icon');
    const initSettings = InitializationSettings(android: androidInit);
    await flutterLocalNotificationsPlugin.initialize(initSettings);
    print('[sharuk] Notification initialized with icon: splash_icon');
  } catch (e) {
    print('[sharuk] Notification initialization failed: $e');
  }
}

@pragma('vm:entry-point')
Future<void> backgroundMessageHandler(SmsMessage message) async {
  try {
    final notificationsPlugin = FlutterLocalNotificationsPlugin();
    const androidInit = AndroidInitializationSettings('splash_icon');
    const initSettings = InitializationSettings(android: androidInit);
    await notificationsPlugin.initialize(initSettings);

    final prefs = await SharedPreferences.getInstance();
    final reminderEnabled = prefs.getBool('enabled') ?? true;
    final useSound = prefs.getBool('useSound') ?? false;
    final selectedSound = prefs.getString('sound') ?? 'reminder3.mp3';

    if (reminderEnabled) {
      await notificationsPlugin.show(
        0,
        'EarGuard Reminder',
        'Time to switch ears!',
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'earguard_channel',
            'EarGuard Notifications',
            importance: Importance.high,
            priority: Priority.high,
            icon: 'splash_icon',
          ),
        ),
      );

      await Vibration.vibrate(duration: 500);

      if (useSound) {
        final audioPlayer = AudioPlayer();
        try {
          await audioPlayer.play(AssetSource('sounds/$selectedSound'));
        } catch (e) {
          print('[sharuk] Sound play error in background: $e');
        } finally {
          await audioPlayer.dispose();
        }
      }
      print('[sharuk] Background reminder triggered successfully');
    }
  } catch (e) {
    print('[sharuk] Background message handler error: $e');
  }
}

Future<bool> isMIUIDevice() async {
  try {
    const platform = MethodChannel('com.example.earguard/caller');
    final result = await platform.invokeMethod('isMIUI');
    print('[sharuk] MIUI detection result: $result');
    return result == true;
  } catch (e) {
    print('[sharuk] Failed to detect MIUI: $e');
    return false;
  }
}

void addDebugLog(
  List<DebugLog> debugLogs,
  String message,
  String category, {
  bool useSharukTag = false,
  Function(void)? setState,
}) {
  final log = DebugLog(
    message: message,
    category: category,
    timestamp: DateTime.now(),
  );

  if (setState != null) {
    setState(() {
      debugLogs.add(log);
    });
  } else {
    debugLogs.add(log);
  }

  if (useSharukTag) {
    print('[sharuk] $category - $message');
  }
}

class NeumorphicLoadingIndicator extends StatelessWidget {
  const NeumorphicLoadingIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Neumorphic(
        style: NeumorphicStyle(
          shape: NeumorphicShape.concave,
          boxShape: NeumorphicBoxShape.circle(),
          depth: 4,
          intensity: 0.5,
          color: Colors.white,
        ),
        child: SizedBox(
          width: 50,
          height: 50,
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2979FF)),
            strokeWidth: 3,
          ),
        ),
      ),
    );
  }
}
