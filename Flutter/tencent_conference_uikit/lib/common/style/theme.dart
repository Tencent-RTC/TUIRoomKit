import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class RoomTheme {
  static ThemeData get defaultTheme => ThemeData(
        scaffoldBackgroundColor: RoomColors.darkBlack,
        appBarTheme: const AppBarTheme(
          elevation: 0,
          backgroundColor: RoomColors.mainBlack,
          titleTextStyle: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        dividerColor: RoomColors.dividerGrey,
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ButtonStyle(
            elevation: MaterialStateProperty.all(0),
            backgroundColor: MaterialStateProperty.all<Color>(
              RoomColors.btnLightGrey,
            ),
            shape: MaterialStateProperty.all(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            padding: MaterialStateProperty.all(
              const EdgeInsets.all(0),
            ),
          ),
        ),
        menuButtonTheme: MenuButtonThemeData(
          style: ButtonStyle(
            backgroundColor: MaterialStateProperty.all<Color>(
              RoomColors.menuButtonBlue,
            ),
            shape: MaterialStateProperty.all(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            padding: MaterialStateProperty.all(
              const EdgeInsets.all(0),
            ),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: ButtonStyle(
            overlayColor: MaterialStateProperty.all<Color>(
              Colors.transparent,
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: ButtonStyle(
            backgroundColor: MaterialStateProperty.all<Color>(
              RoomColors.btnRed,
            ),
            shape: MaterialStateProperty.all(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            padding: MaterialStateProperty.all(
              const EdgeInsets.all(0),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          hintStyle: const TextStyle(
            color: RoomColors.hintGrey,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(
              color: RoomColors.btnBackgroundBlue,
            ),
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(
              color: RoomColors.btnBackgroundBlue,
            ),
          ),
        ),
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            fontSize: 20,
            color: RoomColors.textWhite,
          ),
          headlineMedium: TextStyle(
            fontSize: 18,
            color: Colors.black,
            fontWeight: FontWeight.bold,
          ),
          headlineSmall: TextStyle(
            fontSize: 14,
            color: Colors.black,
            fontWeight: FontWeight.normal,
          ),
          bodyLarge: TextStyle(
            fontSize: 16,
            color: RoomColors.textWhite,
          ),
          bodySmall: TextStyle(
            fontSize: 12,
            color: RoomColors.textWhite,
          ),
          titleSmall: TextStyle(
            fontSize: 14,
            color: RoomColors.hintGrey,
          ),
          bodyMedium: TextStyle(
            fontSize: 14,
            color: RoomColors.textWhite,
          ),
          labelLarge: TextStyle(
            fontSize: 14,
            color: RoomColors.btnTextGrey,
          ),
          labelMedium: TextStyle(
            fontSize: 14,
            color: RoomColors.btnTextRed,
          ),
          labelSmall: TextStyle(
            fontSize: 10,
            color: RoomColors.btnTextWhite,
          ),
          displayLarge: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
          displayMedium: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: RoomColors.btnBlue,
          ),
          displaySmall: TextStyle(
            fontSize: 12,
            color: RoomColors.tipGrey,
          ),
          titleLarge: TextStyle(
            fontSize: 18,
            color: RoomColors.btnBackgroundBlue,
          ),
          titleMedium: TextStyle(
            fontSize: 18,
            color: RoomColors.textRed,
          ),
        ),
      );
}
