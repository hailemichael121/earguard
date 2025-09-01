// settings_screen.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_neumorphic_plus/flutter_neumorphic.dart';
import 'models.dart';
import 'utils.dart';
import 'constants.dart';

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
    addDebugLog(
      _debugLogs,
      message,
      category,
      useSharukTag: useSharukTag,
      setState: (fn) => setState(fn),
    );
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
                              color: primaryColor,
                              size: 24,
                            ),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Settings saved successfully',
                                style: TextStyle(
                                  color: textColor,
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
                  children: soundMap.keys.map((name) {
                    bool isSelected = tempSelected == name;
                    return Container(
                      margin: EdgeInsets.symmetric(vertical: 6),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: isSelected ? primaryColor : Colors.grey[300]!,
                          width: isSelected ? 2 : 1,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        color: isSelected
                            ? primaryColor.withOpacity(0.08)
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
                            color: isSelected ? primaryColor : Colors.black87,
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
                                    ? primaryColor
                                    : Colors.grey[700],
                              ),
                              onPressed: () async {
                                try {
                                  await audioPlayer.stop();
                                  await audioPlayer.play(
                                    AssetSource('sounds/${soundMap[name]}'),
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
                                color: primaryColor,
                                size: 22,
                              ),
                          ],
                        ),
                        onTap: () async {
                          setModalState(() => tempSelected = name);
                          try {
                            await audioPlayer.stop();
                            await audioPlayer.play(
                              AssetSource('sounds/${soundMap[name]}'),
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
                    side: BorderSide(color: primaryColor, width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    backgroundColor: primaryColor,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () {
                    if (mounted && !_disposed) {
                      setState(() {
                        _selectedSoundName = tempSelected;
                        _selectedSound = soundMap[tempSelected]!;
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
          _selectedSoundName = soundMap.entries
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
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Settings',
          style: TextStyle(color: textColor, fontSize: 24),
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: primaryColor),
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
                        style: TextStyle(fontSize: 16, color: textColor),
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
                            activeTrackColor: primaryColor,
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
                        style: TextStyle(fontSize: 16, color: textColor),
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
                            activeTrackColor: primaryColor,
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
                      color: primaryColor,
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
                      style: TextStyle(fontSize: 16, color: textColor),
                    ),
                    SizedBox(height: 8),
                    Text(
                      '${_healthyIntervalMinutes.toInt()} minutes',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                    SizedBox(height: 8),
                    SliderTheme(
                      data: SliderThemeData(
                        thumbColor: primaryColor,
                        activeTrackColor: primaryColor,
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
