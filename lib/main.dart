import 'dart:async';
import 'package:flutter/services.dart';
import 'package:another_telephony/telephony.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_neumorphic_plus/flutter_neumorphic.dart';
import 'package:vibration/vibration.dart';

// Shared sound map for HomeScreen and SettingsScreen
final Map<String, String> _soundMap = {
  'Classic Chime': 'reminder3.mp3',
  'Soft Beep': 'reminder3.mp3',
  'Tone': 'reminder1.mp3',
  'Tone 2': 'reminder2.mp3',
  'Access Tone': 'reminder5.mp3',
  'Funny Tone': 'reminder6.mp3',
};

Future<CallState> checkCallState(dynamic ignored) async {
  try {
    final telephony = Telephony.instance;
    return await telephony.callState;
  } catch (e) {
    print('[sharuk] Error getting call state in isolate: $e');
    return CallState.IDLE;
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await _initNotifications();
  runApp(const MyApp());
}

Future<void> _initNotifications() async {
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
      print('[sharuk] Background reminder triggered');
    }
  } catch (e) {
    print('[sharuk] Background message handler error: $e');
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return NeumorphicApp(
      title: 'EarGuard',
      theme: NeumorphicThemeData(
        baseColor: const Color(0xFFF5F5F5),
        lightSource: LightSource.topLeft,
        depth: 4,
        intensity: 0.5,
        shadowLightColor: Colors.white,
        shadowDarkColor: Colors.grey.shade400,
        defaultTextColor: const Color(0xFF212121),
        variantColor: const Color(0xFF2979FF),
      ),
      home: const HomeScreen(),
    );
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

class DebugLog {
  final String message;
  final String category;
  final DateTime timestamp;

  DebugLog({
    required this.message,
    required this.category,
    required this.timestamp,
  });
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  final AudioPlayer audioPlayer = AudioPlayer();
  final FlutterLocalNotificationsPlugin notificationsPlugin =
      FlutterLocalNotificationsPlugin();
  static const platform = MethodChannel('com.example.earguard/caller');
  static const overlayChannel = MethodChannel('com.example.earguard/overlay');
  Timer? _callStateTimer;
  Timer? _vibrationTimer;
  Timer? _debounceTimer;
  bool _isInCall = false;
  bool _reminderEnabled = true;
  bool _useSound = false;
  double _healthyIntervalMinutes = 30.0;
  String _statusMessage = 'Ready. Waiting for calls...';
  bool _isSimulating = false;
  bool _isLoading = true;
  String? _errorMessage;
  String _selectedSound = 'reminder3.mp3';
  String _callerInfo = 'Unknown';
  final List<DebugLog> _debugLogs = [];
  late AnimationController _animationController;
  late Animation<double> _buttonScaleAnimation;
  late AnimationController _toastAnimationController;
  late Animation<double> _toastOpacityAnimation;
  late Animation<Offset> _toastSlideAnimation;
  bool _isUpdating = false;
  bool _showReminderOverlay = false;
  bool _disposed = false;

  void _addDebugLog(
    String message,
    String category, {
    bool useSharukTag = false,
  }) {
    if (!mounted || _disposed) {
      print(
        '${useSharukTag ? '[sharuk] ' : ''}$category - $message (disposed)',
      );
      return;
    }
    setState(() {
      _debugLogs.add(
        DebugLog(
          message: message,
          category: category,
          timestamp: DateTime.now(),
        ),
      );
    });
    if (useSharukTag) {
      print('[sharuk] $category - $message');
    }
  }

  Future<String> _getCallerInfo() async {
    try {
      final phoneStatus = await Permission.phone.status;
      if (!phoneStatus.isGranted) {
        await Permission.phone.request();
        if (!await Permission.phone.status.isGranted) {
          _addDebugLog(
            'PHONE permission not granted',
            'Warning',
            useSharukTag: true,
          );
          return 'Unknown Caller';
        }
      }
      final String? result = await platform.invokeMethod('getCallerInfo');
      _addDebugLog(
        'Caller info retrieved: ${result ?? 'Unknown'}',
        'Info',
        useSharukTag: true,
      );
      return result ?? 'Unknown Caller';
    } catch (e) {
      _addDebugLog(
        'Failed to get caller info: $e',
        'Error',
        useSharukTag: true,
      );
      return 'Unknown Caller';
    }
  }

  void _showCallTrackingToast() async {
    if (!mounted || _disposed) {
      _addDebugLog(
        'Cannot show toast: widget not mounted',
        'Error',
        useSharukTag: true,
      );
      return;
    }
    try {
      final hasPermission =
          await overlayChannel.invokeMethod<bool>('checkOverlayPermission') ??
          false;
      if (!hasPermission) {
        _addDebugLog(
          'Overlay permission not granted, requesting',
          'Warning',
          useSharukTag: true,
        );
        await overlayChannel.invokeMethod('requestOverlayPermission');
        if (!(await overlayChannel.invokeMethod<bool>(
              'checkOverlayPermission',
            ) ??
            false)) {
          _showErrorDialog(
            'Overlay permission required. Enable it in settings (Settings > Apps > EarGuard > Other Permissions on MIUI).',
          );
          _showFallbackSnackBar(
            'EarGuard is tracking your call with $_callerInfo.',
          );
          _addDebugLog(
            'Overlay permission denied, using fallback',
            'Warning',
            useSharukTag: true,
          );
          return;
        }
      }
      await overlayChannel.invokeMethod('showOverlay', {
        'callerInfo': _callerInfo,
      });
      _addDebugLog(
        'Call tracking toast shown for $_callerInfo',
        'Info',
        useSharukTag: true,
      );
      Future.delayed(Duration(seconds: 5), () async {
        if (mounted && !_disposed) {
          await overlayChannel.invokeMethod('hideOverlay');
          _addDebugLog(
            'Call tracking toast auto-dismissed',
            'Info',
            useSharukTag: true,
          );
        }
      });
    } catch (e) {
      _addDebugLog(
        'Failed to show call tracking toast: $e',
        'Error',
        useSharukTag: true,
      );
      _showFallbackSnackBar('Error showing call toast');
    }
  }

  void _displayReminderOverlay() async {
    if (!mounted || _disposed) {
      _addDebugLog(
        'Cannot show reminder overlay: widget not mounted',
        'Error',
        useSharukTag: true,
      );
      return;
    }
    try {
      final overlayStatus = await Permission.systemAlertWindow.status;
      if (!overlayStatus.isGranted) {
        _addDebugLog(
          'Overlay permission not granted for reminder',
          'Warning',
          useSharukTag: true,
        );
        await Permission.systemAlertWindow.request();
        if (!await Permission.systemAlertWindow.status.isGranted) {
          _showErrorDialog(
            'Overlay permission is required to show reminders. '
            'Please enable "Display pop-up windows while running in the background" in settings. '
            'On MIUI, go to Settings > Apps > EarGuard > Other Permissions.',
          );
          _showFallbackSnackBar('EarGuard Reminder: Time to switch ears!');
          _addDebugLog(
            'Overlay permission denied for reminder',
            'Warning',
            useSharukTag: true,
          );
          return;
        }
      }
      if (mounted && !_disposed) {
        setState(() => _showReminderOverlay = true);
        _addDebugLog('Reminder overlay shown', 'Info', useSharukTag: true);
      }
      Future.delayed(Duration(seconds: 10), () {
        if (mounted && !_disposed && _showReminderOverlay) {
          setState(() => _showReminderOverlay = false);
          _stopVibration();
          _addDebugLog(
            'Reminder overlay auto-dismissed',
            'Info',
            useSharukTag: true,
          );
        }
      });
    } catch (e) {
      _addDebugLog(
        'Failed to display reminder overlay: $e',
        'Error',
        useSharukTag: true,
      );
      _showFallbackSnackBar('Error showing reminder');
    }
  }

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _buttonScaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _toastAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _toastOpacityAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _toastAnimationController, curve: Curves.easeIn),
    );
    _toastSlideAnimation = Tween<Offset>(begin: Offset(0, 1), end: Offset.zero)
        .animate(
          CurvedAnimation(
            parent: _toastAnimationController,
            curve: Curves.easeInOut,
          ),
        );
    _toastAnimationController.forward();
    _addDebugLog('HomeScreen initialized', 'Info', useSharukTag: true);
    _loadPreferences();
    _requestPermissions();
    _checkBatteryOptimization();
    _setupCallListener();
  }

  Future<bool> _isMIUIDevice() async {
    try {
      final result = await platform.invokeMethod('isMIUI');
      _addDebugLog('MIUI detection: $result', 'Info', useSharukTag: true);
      return result == true;
    } catch (e) {
      _addDebugLog('Failed to detect MIUI: $e', 'Error', useSharukTag: true);
      return false;
    }
  }

  Future<void> _loadPreferences() async {
    _addDebugLog('Loading preferences', 'Info', useSharukTag: true);
    try {
      final prefs = await SharedPreferences.getInstance();
      if (mounted && !_disposed) {
        setState(() {
          _healthyIntervalMinutes = (prefs.getDouble('interval') ?? 30.0).clamp(
            1,
            30,
          );
          _reminderEnabled = prefs.getBool('enabled') ?? true;
          _useSound = prefs.getBool('useSound') ?? false;
          _selectedSound = prefs.getString('sound') ?? 'reminder3.mp3';
          _isLoading = false;
        });
        _addDebugLog(
          'Preferences loaded successfully',
          'Info',
          useSharukTag: true,
        );
      }
    } catch (e) {
      if (mounted && !_disposed) {
        setState(() {
          _statusMessage = 'Error loading preferences';
          _errorMessage = 'Failed to load preferences: $e';
          _isLoading = false;
        });
      }
      _addDebugLog(
        'Failed to load preferences: $e',
        'Error',
        useSharukTag: true,
      );
    }
  }

  void _showFallbackSnackBar(String message) {
    if (!mounted || _disposed) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: Duration(seconds: 5),
        backgroundColor: Color(0xFF2979FF),
      ),
    );
    _addDebugLog(
      'Fallback SnackBar shown: $message',
      'Info',
      useSharukTag: true,
    );
  }

  Future<void> _requestPermissions() async {
    _addDebugLog('Requesting permissions', 'Info', useSharukTag: true);
    if (mounted && !_disposed) setState(() => _isLoading = true);
    try {
      final statuses = await [
        Permission.phone,
        Permission.notification,
        Permission.ignoreBatteryOptimizations,
        Permission.systemAlertWindow,
      ].request();
      if (!mounted || _disposed) return;
      _addDebugLog(
        'Permission statuses: phone=${statuses[Permission.phone]}, notification=${statuses[Permission.notification]}, overlay=${statuses[Permission.systemAlertWindow]}',
        'Info',
        useSharukTag: true,
      );
      if (statuses[Permission.phone]!.isGranted &&
          statuses[Permission.notification]!.isGranted &&
          statuses[Permission.systemAlertWindow]!.isGranted) {
        if (mounted && !_disposed) {
          setState(() {
            _statusMessage = 'App is working. Ready to monitor calls.';
            _errorMessage = null;
          });
          _addDebugLog('All permissions granted', 'Info', useSharukTag: true);
        }
      } else {
        if (mounted && !_disposed) {
          setState(() {
            _statusMessage = 'Permissions denied';
            _errorMessage =
                'Required permissions are missing. Please grant phone, notification, and overlay permissions.';
          });
        }
        _addDebugLog('Some permissions denied', 'Warning', useSharukTag: true);
        final isMIUI = await _isMIUIDevice();
        if ((statuses[Permission.phone]!.isPermanentlyDenied ||
                statuses[Permission.systemAlertWindow]!.isPermanentlyDenied) &&
            mounted &&
            !_disposed) {
          await openAppSettings();
          _showErrorDialog(
            'Please grant phone, notification, and overlay permissions in settings. '
            '${isMIUI ? 'On MIUI, go to Settings > Apps > EarGuard > Other Permissions and enable "Display pop-up windows while running in the background".' : ''}',
          );
        }
      }
    } catch (e) {
      if (mounted && !_disposed) {
        setState(() {
          _statusMessage = 'Error requesting permissions';
          _errorMessage = 'Permission error: $e';
        });
      }
      _addDebugLog('Permission error: $e', 'Error', useSharukTag: true);
    } finally {
      if (mounted && !_disposed) setState(() => _isLoading = false);
    }
  }

  Future<void> _checkBatteryOptimization() async {
    _addDebugLog('Checking battery optimization', 'Info', useSharukTag: true);
    if (mounted && !_disposed) setState(() => _isLoading = true);
    try {
      final status = await Permission.ignoreBatteryOptimizations.status;
      if (!mounted || _disposed) return;
      if (!status.isGranted) {
        final isMIUI = await _isMIUIDevice();
        if (!mounted || _disposed) return;
        await showDialog(
          context: context,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            backgroundColor: Colors.white,
            title: Text(
              'Enable Background Running',
              style: TextStyle(color: Color(0xFF212121)),
            ),
            content: Text(
              'Allow EarGuard to run in the background for timely reminders. '
              '${isMIUI ? 'On MIUI, go to Settings > Apps > EarGuard > Battery > No restrictions and enable "Display pop-up windows while running in the background".' : ''}',
              style: TextStyle(color: Color(0xFF212121)),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text('Later', style: TextStyle(color: Colors.grey)),
              ),
              TextButton(
                onPressed: () async {
                  await Permission.ignoreBatteryOptimizations.request();
                  if (!mounted || _disposed) return;
                  Navigator.pop(context);
                  _addDebugLog(
                    'Battery optimization permission requested',
                    'Info',
                    useSharukTag: true,
                  );
                },
                child: Text(
                  'Allow',
                  style: TextStyle(color: Color(0xFF2979FF)),
                ),
              ),
            ],
          ),
        );
      } else {
        _addDebugLog(
          'Battery optimization permission granted',
          'Info',
          useSharukTag: true,
        );
      }
    } catch (e) {
      _addDebugLog(
        'Battery optimization error: $e',
        'Error',
        useSharukTag: true,
      );
    } finally {
      if (mounted && !_disposed) setState(() => _isLoading = false);
    }
  }

  void _setupCallListener() {
    _addDebugLog('Setting up call listener', 'Info', useSharukTag: true);
    try {
      _callStateTimer = Timer.periodic(const Duration(seconds: 10), (_) async {
        if (!mounted || _disposed || _isUpdating) return;
        _isUpdating = true;
        try {
          final telephony = Telephony.instance;
          final state = await telephony.callState;
          _addDebugLog('Call state: $state', 'Info', useSharukTag: true);

          if (mounted && !_disposed) {
            if (state == CallState.RINGING || state == CallState.OFFHOOK) {
              if (!_isInCall && !_isSimulating) {
                setState(() {
                  _isInCall = true;
                  _statusMessage = 'Call started. Timer activated.';
                  _errorMessage = null;
                });

                _getCallerInfo()
                    .then((info) {
                      if (mounted && !_disposed) {
                        setState(() => _callerInfo = info);
                        _showCallTrackingToast();
                      }
                    })
                    .catchError((e) {
                      _addDebugLog(
                        'Failed to get caller info: $e',
                        'Error',
                        useSharukTag: true,
                      );
                    });

                try {
                  await overlayChannel.invokeMethod('startForegroundService', {
                    'phoneState': 'OFFHOOK',
                    'callerInfo': _callerInfo,
                    'interval': _healthyIntervalMinutes,
                    'useSound': _useSound,
                    'sound': _selectedSound,
                  });
                  _addDebugLog(
                    'Foreground service started',
                    'Info',
                    useSharukTag: true,
                  );
                } catch (e) {
                  _addDebugLog(
                    'Failed to start foreground service: $e',
                    'Error',
                    useSharukTag: true,
                  );
                  if (mounted && !_disposed) {
                    setState(() {
                      _statusMessage = 'Error starting service';
                      _errorMessage = 'Service error: $e';
                    });
                  }
                }
              }
            } else if (state == CallState.IDLE) {
              if (_isInCall && !_isSimulating) {
                setState(() {
                  _isInCall = false;
                  _statusMessage = 'Call ended. App is working.';
                  _errorMessage = null;
                });

                try {
                  await overlayChannel.invokeMethod('stopForegroundService');
                  _addDebugLog(
                    'Foreground service stopped',
                    'Info',
                    useSharukTag: true,
                  );
                } catch (e) {
                  _addDebugLog(
                    'Failed to stop foreground service: $e',
                    'Error',
                    useSharukTag: true,
                  );
                  if (mounted && !_disposed) {
                    setState(() {
                      _statusMessage = 'Error stopping service';
                      _errorMessage = 'Service error: $e';
                    });
                  }
                }
              }
            }
          }
        } catch (e) {
          if (mounted && !_disposed) {
            setState(() {
              _statusMessage = 'Error monitoring calls';
              _errorMessage = 'Call listener error: $e';
            });
          }
          _addDebugLog('Call listener error: $e', 'Error', useSharukTag: true);
        } finally {
          _isUpdating = false;
        }
      });
    } catch (e) {
      if (mounted && !_disposed) {
        setState(() {
          _statusMessage = 'Error setting up call listener';
          _errorMessage = 'Call listener setup error: $e';
        });
      }
      _addDebugLog(
        'Call listener setup error: $e',
        'Error',
        useSharukTag: true,
      );
    }
  }

  void _startVibration() {
    if (_vibrationTimer == null && _reminderEnabled && _isSimulating) {
      _vibrationTimer = Timer.periodic(Duration(milliseconds: 1000), (timer) {
        Vibration.vibrate(duration: 500);
      });
      _addDebugLog('Persistent vibration started', 'Info', useSharukTag: true);
    }
  }

  void _stopVibration() {
    _vibrationTimer?.cancel();
    _vibrationTimer = null;
    if (mounted && !_disposed) {
      setState(() => _showReminderOverlay = false);
    }
    _addDebugLog('Persistent vibration stopped', 'Info', useSharukTag: true);
  }

  void _simulateCall() {
    if (!mounted || _disposed) {
      _addDebugLog(
        'Cannot simulate call: widget not mounted',
        'Error',
        useSharukTag: true,
      );
      return;
    }
    _animationController.forward().then((_) => _animationController.reverse());
    setState(() {
      _isSimulating = !_isSimulating;
      if (_isSimulating) {
        _isInCall = true;
        _statusMessage = 'Simulating call... Timer started.';
        _errorMessage = null;
        _callerInfo = 'Simulated Caller';
        _showCallTrackingToast();
        _displayReminderOverlay();
        _startVibration();
        _addDebugLog('Simulation started', 'Info', useSharukTag: true);
      } else {
        _isInCall = false;
        _statusMessage = 'Simulation stopped. App is working.';
        _errorMessage = null;
        _stopVibration();
        _addDebugLog('Simulation stopped', 'Info', useSharukTag: true);
      }
    });
  }

  void _showErrorDialog(String message) {
    if (!mounted || _disposed) return;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        backgroundColor: Colors.white,
        title: Text('Error', style: TextStyle(color: Color(0xFFFF5252))),
        content: Text(message, style: TextStyle(color: Color(0xFF212121))),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK', style: TextStyle(color: Color(0xFF2979FF))),
          ),
        ],
      ),
    );
    _addDebugLog('Error dialog shown: $message', 'Error', useSharukTag: true);
  }

  IconData _getStatusIcon() {
    if (_statusMessage.contains('Ready') ||
        _statusMessage.contains('App is working')) {
      return Icons.check_circle;
    }
    if (_statusMessage.contains('Simulating') ||
        _statusMessage.contains('Call started')) {
      return Icons.phone;
    }
    if (_statusMessage.contains('Reminder')) return Icons.notifications;
    return Icons.warning;
  }

  @override
  void dispose() {
    _addDebugLog('HomeScreen disposed', 'Info', useSharukTag: true);
    _callStateTimer?.cancel();
    _vibrationTimer?.cancel();
    _debounceTimer?.cancel();
    _animationController.dispose();
    _toastAnimationController.dispose();
    audioPlayer.stop();
    audioPlayer.dispose();
    _disposed = true;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Scaffold(
          backgroundColor: const Color(0xFFF5F5F5),
          floatingActionButton: FloatingActionButton(
            onPressed: () {
              showModalBottomSheet(
                context: context,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                ),
                builder: (context) => Container(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Text(
                        'Debug Logs',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF212121),
                        ),
                      ),
                      SizedBox(height: 8),
                      Expanded(
                        child: ListView.builder(
                          itemCount: _debugLogs.length,
                          itemBuilder: (context, index) {
                            final log = _debugLogs[index];
                            return ListTile(
                              leading: Icon(
                                log.category == 'Error'
                                    ? Icons.error
                                    : log.category == 'Warning'
                                    ? Icons.warning
                                    : Icons.info,
                                color: log.category == 'Error'
                                    ? Color(0xFFFF5252)
                                    : log.category == 'Warning'
                                    ? Colors.orange
                                    : Color(0xFF2979FF),
                              ),
                              title: Text(
                                log.message,
                                style: TextStyle(color: Color(0xFF212121)),
                              ),
                              subtitle: Text(
                                log.timestamp.toString(),
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 12,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              );
              _addDebugLog(
                'Opened debug log bottom sheet',
                'Info',
                useSharukTag: true,
              );
            },
            backgroundColor: Color(0xFF2979FF),
            child: Icon(Icons.bug_report, color: Colors.white),
          ),
          body: AnimatedOpacity(
            opacity: _isLoading ? 0.5 : 1.0,
            duration: Duration(milliseconds: 300),
            child: _isLoading
                ? Center(child: NeumorphicLoadingIndicator())
                : SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'EarGuard',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF212121),
                            ),
                          ),
                          SizedBox(height: 32),
                          Center(
                            child: Neumorphic(
                              style: NeumorphicStyle(
                                shape: NeumorphicShape.concave,
                                boxShape: NeumorphicBoxShape.circle(),
                                depth: 4,
                                intensity: 0.5,
                                color: Colors.white,
                              ),
                              child: Container(
                                width: 150,
                                height: 150,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [Colors.green, Colors.blue],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  _getStatusIcon(),
                                  size: 80,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                          SizedBox(height: 16),
                          Text(
                            _statusMessage,
                            style: TextStyle(
                              fontSize: 18,
                              color: Color(0xFF212121),
                            ),
                            textAlign: TextAlign.center,
                          ),
                          if (_errorMessage != null) ...[
                            SizedBox(height: 8),
                            Text(
                              _errorMessage!,
                              style: TextStyle(
                                color: Color(0xFFFF5252),
                                fontSize: 14,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                          SizedBox(height: 8),
                          Center(
                            child: Opacity(
                              opacity: 0.6,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.timer,
                                    color: Color(0xFF2979FF).withOpacity(0.6),
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'Interval: ${_healthyIntervalMinutes.toInt()} minutes',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Color(0xFF212121).withOpacity(0.6),
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          SizedBox(height: 8),
                          Center(
                            child: Opacity(
                              opacity: 0.6,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.music_note,
                                    color: Color(0xFF2979FF).withOpacity(0.6),
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'Ringtone: ${_soundMap.entries.firstWhere((entry) => entry.value == _selectedSound, orElse: () => MapEntry('Custom', _selectedSound)).key}',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Color(0xFF212121).withOpacity(0.6),
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          SizedBox(height: 32),
                          AnimatedBuilder(
                            animation: _animationController,
                            builder: (context, child) => Transform.scale(
                              scale: _buttonScaleAnimation.value,
                              child: NeumorphicButton(
                                onPressed: _simulateCall,
                                style: NeumorphicStyle(
                                  boxShape: NeumorphicBoxShape.roundRect(
                                    BorderRadius.circular(16),
                                  ),
                                  color: Colors.orange,
                                  depth: 6,
                                  shadowLightColor: Colors.white,
                                  shadowDarkColor: Colors.grey.shade400,
                                ),
                                child: Padding(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 12,
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.phone,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                      SizedBox(width: 8),
                                      Text(
                                        _isSimulating
                                            ? 'Stop Simulation'
                                            : 'Simulate Call',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                          SizedBox(height: 16),
                          NeumorphicButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => SettingsScreen(
                                    onSettingsChanged: _loadPreferences,
                                  ),
                                ),
                              );
                              _addDebugLog(
                                'Navigated to SettingsScreen',
                                'Info',
                                useSharukTag: true,
                              );
                            },
                            style: NeumorphicStyle(
                              boxShape: NeumorphicBoxShape.roundRect(
                                BorderRadius.circular(16),
                              ),
                              color: Colors.grey.shade300,
                              depth: 6,
                              shadowLightColor: Colors.white,
                              shadowDarkColor: Colors.grey.shade400,
                            ),
                            child: Padding(
                              padding: EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 12,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.settings,
                                    color: Colors.black,
                                    size: 20,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'Settings',
                                    style: TextStyle(
                                      color: Colors.black,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          SizedBox(height: 16),
                          NeumorphicButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => AboutScreen(
                                    interval: _healthyIntervalMinutes,
                                    selectedSound: _selectedSound,
                                  ),
                                ),
                              );
                              _addDebugLog(
                                'Navigated to AboutScreen',
                                'Info',
                                useSharukTag: true,
                              );
                            },
                            style: NeumorphicStyle(
                              boxShape: NeumorphicBoxShape.roundRect(
                                BorderRadius.circular(16),
                              ),
                              color: Colors.grey.shade300,
                              depth: 6,
                              shadowLightColor: Colors.white,
                              shadowDarkColor: Colors.grey.shade400,
                            ),
                            child: Padding(
                              padding: EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 12,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.info,
                                    color: Colors.black,
                                    size: 20,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'About EarGuard',
                                    style: TextStyle(
                                      color: Colors.black,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
          ),
        ),
        if (_showReminderOverlay)
          Stack(
            children: [
              GestureDetector(
                onTap: () {
                  if (mounted && !_disposed) {
                    setState(() => _showReminderOverlay = false);
                    _stopVibration();
                    _addDebugLog(
                      'Reminder overlay dismissed by tap',
                      'Info',
                      useSharukTag: true,
                    );
                  }
                },
                child: Container(
                  color: Colors.black.withAlpha(128),
                  child: Center(
                    child: SizedBox(
                      width: double.infinity,
                      child: Dismissible(
                        key: UniqueKey(),
                        direction: DismissDirection.horizontal,
                        onDismissed: (direction) {
                          if (mounted && !_disposed) {
                            setState(() => _showReminderOverlay = false);
                            _stopVibration();
                            _addDebugLog(
                              'Reminder overlay dismissed by swipe',
                              'Info',
                              useSharukTag: true,
                            );
                          }
                        },
                        child: Neumorphic(
                          style: NeumorphicStyle(
                            boxShape: NeumorphicBoxShape.roundRect(
                              BorderRadius.circular(16),
                            ),
                            depth: 6,
                            color: Colors.white,
                          ),
                          child: Padding(
                            padding: EdgeInsets.all(20),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'EarGuard Reminder',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF212121),
                                  ),
                                ),
                                SizedBox(height: 8),
                                Text(
                                  'Time to switch ears!',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Color(0xFF212121),
                                  ),
                                ),
                                SizedBox(height: 16),
                                NeumorphicButton(
                                  onPressed: () {
                                    if (mounted && !_disposed) {
                                      setState(
                                        () => _showReminderOverlay = false,
                                      );
                                      _stopVibration();
                                      _addDebugLog(
                                        'Reminder overlay dismissed by button',
                                        'Info',
                                        useSharukTag: true,
                                      );
                                    }
                                  },
                                  style: NeumorphicStyle(
                                    boxShape: NeumorphicBoxShape.roundRect(
                                      BorderRadius.circular(12),
                                    ),
                                    color: Color(0xFF2979FF),
                                  ),
                                  child: Text(
                                    'Acknowledge',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
      ],
    );
  }
}

class SettingsScreen extends StatefulWidget {
  final VoidCallback onSettingsChanged;

  const SettingsScreen({super.key, required this.onSettingsChanged});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen>
    with TickerProviderStateMixin {
  final AudioPlayer audioPlayer = AudioPlayer();
  bool _reminderEnabled = true;
  bool _useSound = false;
  double _healthyIntervalMinutes = 30.0;
  String _selectedSound = 'reminder3.mp3';
  String _selectedSoundName = 'Classic Chime';
  late AnimationController _animationController;
  late Animation<double> _buttonScaleAnimation;
  late AnimationController _toastAnimationController;
  late Animation<double> _toastOpacityAnimation;
  late Animation<Offset> _toastSlideAnimation;
  Timer? _debounceTimer;
  final List<DebugLog> _debugLogs = [];
  bool _disposed = false;

  void _addDebugLog(
    String message,
    String category, {
    bool useSharukTag = false,
  }) {
    if (mounted && !_disposed) {
      setState(() {
        _debugLogs.add(
          DebugLog(
            message: message,
            category: category,
            timestamp: DateTime.now(),
          ),
        );
      });
    }
    if (useSharukTag) {
      print('[sharuk] $category - $message');
    }
  }

  void _showSettingsToast(BuildContext context) {
    if (!mounted || _disposed) {
      _addDebugLog(
        'Cannot show toast: widget not mounted or disposed',
        'Error',
        useSharukTag: true,
      );
      return;
    }
    try {
      final overlayState = Overlay.of(context, rootOverlay: true);
      if (overlayState == null) {
        _addDebugLog('Overlay not found', 'Error', useSharukTag: true);
        return;
      }
      final overlayEntry = OverlayEntry(
        builder: (context) => SafeArea(
          child: Stack(
            children: [
              Positioned(
                bottom: 20,
                left: 20,
                right: 20,
                child: FadeTransition(
                  opacity: _toastOpacityAnimation,
                  child: SlideTransition(
                    position: _toastSlideAnimation,
                    child: Neumorphic(
                      style: NeumorphicStyle(
                        boxShape: NeumorphicBoxShape.roundRect(
                          BorderRadius.circular(12),
                        ),
                        depth: 4,
                        color: Colors.white,
                        shadowLightColor: Colors.white,
                        shadowDarkColor: Colors.grey.shade400,
                      ),
                      child: Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.check_circle,
                              color: Color(0xFF2979FF),
                              size: 24,
                            ),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Settings saved successfully',
                                style: TextStyle(
                                  color: Color(0xFF212121),
                                  fontSize: 16,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
      overlayState.insert(overlayEntry);
      _addDebugLog('Settings toast shown', 'Info', useSharukTag: true);
      Future.delayed(Duration(seconds: 2), () {
        if (mounted && !_disposed) {
          overlayEntry.remove();
          _addDebugLog('Settings toast dismissed', 'Info', useSharukTag: true);
        }
      });
    } catch (e) {
      _addDebugLog(
        'Failed to show settings toast: $e',
        'Error',
        useSharukTag: true,
      );
    }
  }

  void _showSoundSelectionModal() {
    String tempSelected = _selectedSoundName;
    if (!mounted || _disposed) {
      _addDebugLog(
        'Cannot show sound selection modal: widget not mounted',
        'Error',
        useSharukTag: true,
      );
      return;
    }
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      backgroundColor: Colors.white,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Select Reminder Sound',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close, color: Colors.grey[700]),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              SizedBox(height: 16),
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: _soundMap.keys.map((name) {
                    bool isSelected = tempSelected == name;
                    return Container(
                      margin: EdgeInsets.symmetric(vertical: 6),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: isSelected
                              ? Color(0xFF2979FF)
                              : Colors.grey[300]!,
                          width: isSelected ? 2 : 1,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        color: isSelected
                            ? Color(0xFF2979FF).withOpacity(0.08)
                            : Colors.grey[50],
                      ),
                      child: ListTile(
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 4,
                        ),
                        title: Text(
                          name,
                          style: TextStyle(
                            color: isSelected
                                ? Color(0xFF2979FF)
                                : Colors.black87,
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.w400,
                          ),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(
                                Icons.play_arrow,
                                color: isSelected
                                    ? Color(0xFF2979FF)
                                    : Colors.grey[700],
                              ),
                              onPressed: () async {
                                try {
                                  await audioPlayer.stop();
                                  await audioPlayer.play(
                                    AssetSource('sounds/${_soundMap[name]}'),
                                  );
                                  _addDebugLog(
                                    'Previewed sound: $name',
                                    'Info',
                                    useSharukTag: true,
                                  );
                                } catch (e) {
                                  _addDebugLog(
                                    'Sound preview error: $e',
                                    'Error',
                                    useSharukTag: true,
                                  );
                                }
                              },
                            ),
                            if (isSelected)
                              Icon(
                                Icons.check_circle,
                                color: Color(0xFF2979FF),
                                size: 22,
                              ),
                          ],
                        ),
                        onTap: () async {
                          setModalState(() => tempSelected = name);
                          try {
                            await audioPlayer.stop();
                            await audioPlayer.play(
                              AssetSource('sounds/${_soundMap[name]}'),
                            );
                            _addDebugLog(
                              'Selected and previewed sound: $name',
                              'Info',
                              useSharukTag: true,
                            );
                          } catch (e) {
                            _addDebugLog(
                              'Sound preview error on selection: $e',
                              'Error',
                              useSharukTag: true,
                            );
                          }
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
              SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 14),
                    side: BorderSide(color: Color(0xFF2979FF), width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    backgroundColor: Color(0xFF2979FF),
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () {
                    if (mounted && !_disposed) {
                      setState(() {
                        _selectedSoundName = tempSelected;
                        _selectedSound = _soundMap[tempSelected]!;
                      });
                      _savePreferences();
                    }
                    Navigator.pop(context);
                    _addDebugLog(
                      'Confirmed sound selection: $tempSelected',
                      'Info',
                      useSharukTag: true,
                    );
                  },
                  child: Text(
                    'Confirm Selection',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _buttonScaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _toastAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _toastOpacityAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _toastAnimationController, curve: Curves.easeIn),
    );
    _toastSlideAnimation = Tween<Offset>(begin: Offset(0, 1), end: Offset.zero)
        .animate(
          CurvedAnimation(
            parent: _toastAnimationController,
            curve: Curves.easeInOut,
          ),
        );
    _toastAnimationController.forward();
    _addDebugLog('SettingsScreen initialized', 'Info', useSharukTag: true);
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    _addDebugLog('Loading preferences', 'Info', useSharukTag: true);
    try {
      final prefs = await SharedPreferences.getInstance();
      if (mounted && !_disposed) {
        setState(() {
          _healthyIntervalMinutes = (prefs.getDouble('interval') ?? 30.0).clamp(
            1,
            30,
          );
          _reminderEnabled = prefs.getBool('enabled') ?? true;
          _useSound = prefs.getBool('useSound') ?? false;
          _selectedSound = prefs.getString('sound') ?? 'reminder3.mp3';
          _selectedSoundName = _soundMap.entries
              .firstWhere(
                (entry) => entry.value == _selectedSound,
                orElse: () => MapEntry('Classic Chime', 'reminder3.mp3'),
              )
              .key;
        });
        _addDebugLog(
          'Preferences loaded successfully',
          'Info',
          useSharukTag: true,
        );
      }
    } catch (e) {
      _addDebugLog(
        'Failed to load preferences: $e',
        'Error',
        useSharukTag: true,
      );
    }
  }

  Future<void> _savePreferences() async {
    _addDebugLog('Saving preferences', 'Info', useSharukTag: true);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setDouble('interval', _healthyIntervalMinutes);
      await prefs.setBool('enabled', _reminderEnabled);
      await prefs.setBool('useSound', _useSound);
      await prefs.setString('sound', _selectedSound);
      widget.onSettingsChanged();
      _showSettingsToast(context);
      _addDebugLog(
        'Preferences saved successfully',
        'Info',
        useSharukTag: true,
      );
    } catch (e) {
      _addDebugLog(
        'Failed to save preferences: $e',
        'Error',
        useSharukTag: true,
      );
    }
  }

  @override
  void dispose() {
    _addDebugLog('SettingsScreen disposed', 'Info', useSharukTag: true);
    _debounceTimer?.cancel();
    _animationController.dispose();
    _toastAnimationController.dispose();
    audioPlayer.stop();
    audioPlayer.dispose();
    _disposed = true;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Settings',
          style: TextStyle(color: Color(0xFF212121), fontSize: 24),
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Color(0xFF2979FF)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Neumorphic(
              style: NeumorphicStyle(
                boxShape: NeumorphicBoxShape.roundRect(
                  BorderRadius.circular(16),
                ),
                depth: 4,
                color: Colors.white,
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16.0,
                  vertical: 12.0,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Enable Reminders',
                        style: TextStyle(
                          fontSize: 16,
                          color: Color(0xFF212121),
                        ),
                      ),
                    ),
                    AnimatedSwitcher(
                      duration: Duration(milliseconds: 300),
                      child: Transform.scale(
                        scale: _buttonScaleAnimation.value,
                        key: ValueKey(_reminderEnabled),
                        child: NeumorphicSwitch(
                          value: _reminderEnabled,
                          style: NeumorphicSwitchStyle(
                            activeTrackColor: Color(0xFF2979FF),
                            inactiveTrackColor: Color(0xFFBDBDBD),
                          ),
                          onChanged: (value) {
                            _animationController.forward().then(
                              (_) => _animationController.reverse(),
                            );
                            if (mounted && !_disposed) {
                              setState(() {
                                _reminderEnabled = value;
                                _savePreferences();
                              });
                              _addDebugLog(
                                'Reminders toggled: $value',
                                'Info',
                                useSharukTag: true,
                              );
                            }
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 16),
            Neumorphic(
              style: NeumorphicStyle(
                boxShape: NeumorphicBoxShape.roundRect(
                  BorderRadius.circular(16),
                ),
                depth: 4,
                color: Colors.white,
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16.0,
                  vertical: 12.0,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Enable Sound',
                        style: TextStyle(
                          fontSize: 16,
                          color: Color(0xFF212121),
                        ),
                      ),
                    ),
                    AnimatedSwitcher(
                      duration: Duration(milliseconds: 300),
                      child: Transform.scale(
                        scale: _buttonScaleAnimation.value,
                        key: ValueKey(_useSound),
                        child: NeumorphicSwitch(
                          value: _useSound,
                          style: NeumorphicSwitchStyle(
                            activeTrackColor: Color(0xFF2979FF),
                            inactiveTrackColor: Color(0xFFBDBDBD),
                          ),
                          onChanged: (value) {
                            _animationController.forward().then(
                              (_) => _animationController.reverse(),
                            );
                            if (mounted && !_disposed) {
                              setState(() {
                                _useSound = value;
                                _savePreferences();
                              });
                              _addDebugLog(
                                'Sound enabled: $value',
                                'Info',
                                useSharukTag: true,
                              );
                            }
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 16),
            if (_useSound) ...[
              AnimatedBuilder(
                animation: _animationController,
                builder: (context, child) => Transform.scale(
                  scale: _buttonScaleAnimation.value,
                  child: NeumorphicButton(
                    onPressed: () {
                      _animationController.forward().then(
                        (_) => _animationController.reverse(),
                      );
                      _showSoundSelectionModal();
                      _addDebugLog(
                        'Opened sound selection modal',
                        'Info',
                        useSharukTag: true,
                      );
                    },
                    style: NeumorphicStyle(
                      boxShape: NeumorphicBoxShape.roundRect(
                        BorderRadius.circular(16),
                      ),
                      depth: 4,
                      color: Color(0xFF2979FF),
                    ),
                    child: Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Select Reminder Sound',
                            style: TextStyle(color: Colors.white, fontSize: 16),
                          ),
                          Icon(Icons.arrow_drop_down, color: Colors.white),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Selected: $_selectedSoundName',
                style: TextStyle(color: Colors.grey, fontSize: 14),
              ),
            ],
            SizedBox(height: 16),
            Neumorphic(
              style: NeumorphicStyle(
                boxShape: NeumorphicBoxShape.roundRect(
                  BorderRadius.circular(16),
                ),
                depth: 4,
                color: Colors.white,
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16.0,
                  vertical: 12.0,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Reminder Interval',
                      style: TextStyle(fontSize: 16, color: Color(0xFF212121)),
                    ),
                    SizedBox(height: 8),
                    Text(
                      '${_healthyIntervalMinutes.toInt()} minutes',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF212121),
                      ),
                    ),
                    SizedBox(height: 8),
                    SliderTheme(
                      data: SliderThemeData(
                        thumbColor: Color(0xFF2979FF),
                        activeTrackColor: Color(0xFF2979FF),
                        inactiveTrackColor: Color(0xFFBDBDBD),
                        showValueIndicator: ShowValueIndicator.onDrag,
                      ),
                      child: NeumorphicSlider(
                        value: _healthyIntervalMinutes,
                        min: 1,
                        max: 30,
                        onChanged: (value) {
                          _debounceTimer?.cancel();
                          if (mounted && !_disposed) {
                            setState(() {
                              _healthyIntervalMinutes = value.clamp(1, 30);
                            });
                          }
                        },
                        onChangeEnd: (value) {
                          _debounceTimer = Timer(
                            Duration(milliseconds: 500),
                            () {
                              if (mounted && !_disposed) {
                                setState(() {
                                  _healthyIntervalMinutes = value.clamp(1, 30);
                                  _savePreferences();
                                });
                                _addDebugLog(
                                  'Interval set to ${value.toInt()} minutes',
                                  'Info',
                                  useSharukTag: true,
                                );
                              }
                            },
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AboutScreen extends StatelessWidget {
  final double interval;
  final String selectedSound;

  const AboutScreen({
    super.key,
    required this.interval,
    required this.selectedSound,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'About EarGuard',
          style: TextStyle(color: Color(0xFF212121), fontSize: 24),
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Color(0xFF2979FF)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Neumorphic(
              style: NeumorphicStyle(
                boxShape: NeumorphicBoxShape.roundRect(
                  BorderRadius.circular(16),
                ),
                depth: 4,
                color: Colors.white,
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'About EarGuard',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF212121),
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'EarGuard helps you maintain healthy phone usage by reminding you to switch ears during calls to reduce strain. Stay safe and comfortable with our intuitive reminders.',
                      style: TextStyle(fontSize: 16, color: Color(0xFF212121)),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Current Settings',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF212121),
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Interval: ${interval.toInt()} minutes',
                      style: TextStyle(fontSize: 16, color: Color(0xFF212121)),
                    ),
                    Text(
                      'Sound: ${_soundMap.entries.firstWhere((entry) => entry.value == selectedSound, orElse: () => MapEntry('Custom', selectedSound)).key}',
                      style: TextStyle(fontSize: 16, color: Color(0xFF212121)),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
