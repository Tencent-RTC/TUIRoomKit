enum ConferenceError {
  /// Operation Successful
  success,

  /// UnCategorized General Error
  errFailed,

  /// The conference didn't exist when we entered. It may have been disbanded
  errConferenceIdNotExist,

  /// The custom ID must be a printable ASCII character (0x20-0x7e) with a maximum of 48 bytes
  errConferenceIdInvalid,

  /// The conference ID is already in use. Please select a different conference ID
  errConferenceIdOccupied,

  /// The conference name is invalid, the maximum name is 30 bytes, if contains Chinese, the character encoding must be UTF-8
  errConferenceNameInvalid,
}

extension ConferenceErrorExt on ConferenceError {
  static ConferenceError fromValue(int value) {
    return ConferenceError.values.firstWhere(
      (error) => error.value() == value,
      orElse: () => ConferenceError.errFailed,
    );
  }

  int value() {
    return _conferenceErrorEnumMap[this]!;
  }
}

const _conferenceErrorEnumMap = {
  ConferenceError.success: 0,
  ConferenceError.errFailed: -1,
  ConferenceError.errConferenceIdNotExist: 100004,
  ConferenceError.errConferenceIdInvalid: -2105,
  ConferenceError.errConferenceIdOccupied: 100003,
  ConferenceError.errConferenceNameInvalid: -2107,
};
