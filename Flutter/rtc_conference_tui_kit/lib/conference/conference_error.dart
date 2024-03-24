enum ConferenceError {
  success,
  errFailed,
  errConferenceIdNotExist,
  errConferenceIdInvalid,
  errConferenceIdOccupied,
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
  ConferenceError.errConferenceIdNotExist: -2100,
  ConferenceError.errConferenceIdInvalid: -2105,
  ConferenceError.errConferenceIdOccupied: -2106,
  ConferenceError.errConferenceNameInvalid: -2107,
};
