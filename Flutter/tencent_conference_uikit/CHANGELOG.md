## Changelog

### 2.8.4(2025-01-16)
- Fixed the issue where the member count is displayed abnormally when there are a large number of user in the conference.
- Fixed the issue that when there are a large number of user in the conference, the user on the seat cannot be seen after entering the room.

### 2.8.3(2025-01-08)
- Fixed the issue that when users mute local audio in the free speech mode in the room, it still occupies the audio uplink quota.
- Upgraded rtc_room_engine dependencies.

### 2.8.0(2024-12-23)
- Support floating windows outside Android platform applications.

### 2.7.2(2024-11-19)
- Support in-app floating window function

### 2.7.0(2024-11-07)
- Support flutter 3.24.
- Fixed the bug that camera and microphone permissions cannot be applied in some cases.

### 2.6.6(2024-10-17)

- Resolved the issue of not being able to run under Flutter 3.24.
- Upgraded rtc_room_engine dependencies.

### 2.6.0(2024-09-14)

- Upgraded rtc_room_engine dependencies.

### 2.5.1(2024-09-09)

- Lowered the minimum Flutter version to 3.7.0, Lowered the minimum Dart version to 2.19.0.

### 2.5.0(2024-08-02)

- Adapted UI for large screens such as iPad.
- Added a schedule conference feature: a new ConferenceListWidget for the conference list and a ScheduleConferencePage for the schedule conference interface.
- Upgraded rtc_room_engine dependencies.

### 2.4.4(2024-07-08)

- Compatible with Android API 34.

### 2.4.3(2024-07-05)

- Added an example project.
- Added support for in-conference chat configurations: `chatWidget` parameter added to `ConferenceMainPage`. For detailed usage, please refer to [In-Conference Chat](https://trtc.io/document/61632) or the example project.

### 2.4.2(2024-07-01)

- **Breaking Change**: The plugin has been renamed from `rtc_conference_tui_kit` to `tencent_conference_uikit`.If you want to access versions 2.4.1 or earlier, you can visit [rtc_conference_tui_kit](https://pub.dev/packages/rtc_conference_tui_kit).

### 2.4.1(2024-06-26)

- Added floating chat feature. To use the floating chat feature, you need to log in to the chat. For more details, please refer to README.md. If you do not need this feature, you can disable it in the settings.

### 2.4.0(2024-06-06)

- Added support for landscape mode.
- Changed the default language to the system language.
- Fixed an issue where the conference name in the top bar did not match the settings.
- Fixed an issue with dragging in the large and small window layout.
- Modified the parameters in `ConferenceMainPage` from `roomId` to `conferenceId`, and `isCreateRoom` to `isCreateConference`.
- Improved the parameters in each callback within the `ConferenceObserver`.
- Upgraded rtc_room_engine dependencies.

### 2.2.1(2024-03-29)

- Upgraded rtc_room_engine dependencies.

### 2.2.0(2024-03-22)

- Renamed **rtc_conference_tuikit.dart** to **rtc_conference_tui_kit.dart**.
- Added dynamic volume display on the user's microphone button and the microphone icon below the video screen.
- Displayed the person speaking in the top-right corner while watching screen sharing.
- Deprecated `TUIRoomKit`, use `ConferenceSession` instead. After starting a quick meeting or joining a meeting, you can control the route navigation to the conference page(`ConferenceMainPage`) on your own. For more details, please refer to README.md.
- Upgraded rtc_room_engine dependencies.

### 2.1.0(2024-03-01)

- Fix the issue where the on-stage management list does not refresh for other administrators after a stage application is rejected
- Fix the issue where a user who is prohibited from sending messages cannot speak after becoming the room owner.
- Upgrade the dependencies of rtc_room_engine

### 2.0.3(2024-02-02)

- Fixed some known bugs and issues
- Upgrade the dependencies of rtc_room_engine

### 2.0.2(2024-01-26)

- Fixed some UI details
- Upgrade the dependencies of rtc_room_engine

### 2.0.1(2024-01-19)

- Fixed some known bugs and issues
- Added auto-hide function for top and bottom toolbars
- Upgrade the dependencies of rtc_room_engine

### 2.0.0(2024-01-11)

- Upgrade the dependencies of rtc_room_engine
- After adapting to the rtc_room_engine update, the speechMode field in TUIRoomInfo is abandoned and isSeatEnabled and seatMode are used instead.

### 1.7.1(2024-01-08)

- Added administrator function
- Upgrade the dependencies of rtc_room_engine

### 1.7.0(2023-12-18)

- Release the official version of rtc_conference_tui_kit
- Fixed some known bugs and issues
- Upgrade the dependencies of rtc_room_engine

### 1.6.1-rc(2023-11-14)

- Release candidate version of rtc_conference_tui_kit
- Supports only Android and iOS platforms
