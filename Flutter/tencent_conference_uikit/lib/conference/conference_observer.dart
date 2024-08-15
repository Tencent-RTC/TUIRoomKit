import 'package:tencent_conference_uikit/conference/conference_error.dart';

/// Callback listener for conference state changes.
class ConferenceObserver {
  /// Callback function that is called when the conference starts.
  ///
  /// This function is triggered when the conference has successfully started.
  ///
  /// Parameters:
  /// - [conferenceId] : The ID of the conference that has started.
  /// - [error] : An object containing error information if the conference failed to start.
  Function(String conferenceId, ConferenceError error)? onConferenceStarted;

  /// Callback function that is called when the user joins the conference.
  ///
  /// This function is triggered when the user has successfully joined the conference.
  ///
  /// Parameters:
  /// - [conferenceId] : The ID of the conference that has been joined.
  /// - [error] : An object containing error information if the conference failed to join.
  Function(String conferenceId, ConferenceError error)? onConferenceJoined;

  /// Callback function that is called when the conference finishes.
  ///
  /// This function is triggered when the conference is actively ended or the conference is dismissed.
  ///
  /// Parameters:
  /// - [conferenceId] : The ID of the conference that has finished.
  Function(String conferenceId)? onConferenceFinished;

  /// Callback function that is called when the user exits the conference.
  ///
  /// This function is triggered when the user has exited the conference, either voluntarily or by being removed.
  ///
  /// Parameters:
  /// - [conferenceId] : The ID of the conference that has been exited.
  Function(String conferenceId)? onConferenceExited;

  ConferenceObserver(
      {this.onConferenceStarted,
      this.onConferenceJoined,
      this.onConferenceFinished,
      this.onConferenceExited});
}
