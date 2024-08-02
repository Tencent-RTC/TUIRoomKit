import 'package:flutter/material.dart';
import 'package:room_flutter_example/common/style/colors.dart';

class AppTheme {
  static ThemeData get defaultTheme => ThemeData(
        appBarTheme: const AppBarTheme(
          elevation: 0,
          backgroundColor: AppColors.mainBlack,
          iconTheme: IconThemeData(color: Colors.white),
          titleTextStyle: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        dividerColor: Colors.white,
        useMaterial3: false,
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ButtonStyle(
            elevation: MaterialStateProperty.all(0),
            backgroundColor:
                MaterialStateProperty.all<Color>(AppColors.btnBackgroundBlue),
            shape: MaterialStateProperty.all(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            padding: MaterialStateProperty.all(
              const EdgeInsets.all(16),
            ),
          ),
        ),
        textTheme: const TextTheme(
          headlineMedium: TextStyle(
            fontSize: 16,
            color: Colors.black,
            fontWeight: FontWeight.bold,
          ),
          displayMedium: TextStyle(
            fontSize: 16,
            color: Colors.black,
          ),
          bodyMedium: TextStyle(
            fontSize: 16,
            color: Colors.white,
          ),
          labelLarge: TextStyle(
            fontSize: 18,
            color: Colors.white,
          ),
          labelMedium: TextStyle(
            fontSize: 16,
            color: AppColors.textHintGrey,
          ),
        ),
      );
}
