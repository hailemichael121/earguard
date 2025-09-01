// about_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_neumorphic_plus/flutter_neumorphic.dart';
import 'constants.dart';

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
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'About EarGuard',
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
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'About EarGuard',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'EarGuard helps you maintain healthy phone usage by reminding you to switch ears during calls to reduce strain. Stay safe and comfortable with our intuitive reminders.',
                      style: TextStyle(fontSize: 16, color: textColor),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Current Settings',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: textColor,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Interval: ${interval.toInt()} minutes',
                      style: TextStyle(fontSize: 16, color: textColor),
                    ),
                    Text(
                      'Sound: ${soundMap.entries.firstWhere((entry) => entry.value == selectedSound, orElse: () => MapEntry('Custom', selectedSound)).key}',
                      style: TextStyle(fontSize: 16, color: textColor),
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
