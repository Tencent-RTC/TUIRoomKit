class TimeZone {
  TimeZone({
    required double offset,
    required String name,
    this.isSelected = false,
  })  : _offset = offset,
        _name = name;

  final double _offset;
  final String _name;
  bool isSelected;

  double get offset => _offset;
  String get name => _name;

  String formatTimeZoneName() {
    final int hours = offset.truncate();
    final int minutes = ((offset - hours) * 60).round();

    final String offsetSign = hours >= 0 ? '+' : '-';
    final String offsetString =
        '$offsetSign${hours.abs().toString().padLeft(2, '0')}:${minutes.abs().toString().padLeft(2, '0')}';
    return '(GMT$offsetString) $name';
  }
}
