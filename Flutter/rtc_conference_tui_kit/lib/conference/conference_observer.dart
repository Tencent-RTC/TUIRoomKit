import 'package:rtc_conference_tui_kit/conference/conference_error.dart';

class ConferenceObserver {
  Function(String conferenceId, ConferenceError error)? onConferenceStarted;
  Function(String conferenceId, ConferenceError error)? onConferenceJoined;
  Function(String conferenceId)? onConferenceFinished;
  Function(String conferenceId)? onConferenceExited;

  ConferenceObserver(
      {this.onConferenceStarted,
      this.onConferenceJoined,
      this.onConferenceFinished,
      this.onConferenceExited});
}
