import 'package:rtc_conference_tui_kit/conference/conference_error.dart';

class ConferenceObserver {
  Function(String, ConferenceError)? onConferenceStarted;
  Function(String, ConferenceError)? onConferenceJoined;
  Function(String)? onConferenceFinished;
  Function(String)? onConferenceExited;

  ConferenceObserver(
      {this.onConferenceStarted,
      this.onConferenceJoined,
      this.onConferenceFinished,
      this.onConferenceExited});
}
