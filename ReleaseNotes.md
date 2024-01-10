English | [简体中文](ReleaseNotes.zh.md)
## Release Notes:

### Version 2.0.0 @ 2024.01.07
Optimizations for the Conference scenario across all platforms:
#### Room Management:
- Independent room service, no longer relying on IM groups.
- Added a complete set of room list management APIs.
- Added reservation-related REST APIs for meetings and improved the capabilities of REST APIs.
- The SDK provides a singleton interface.
- Optimized the room entry process for increased stability.

#### Member Management:
- Independent background service for more accurate member lists.
- The server-side REST API also supports member management.
- Unbound from IM groups, chat groups, and conference rooms are no longer coupled.
- Updated room member offline detection logic, aligning with Tencent meeting offline detection business logic.
- Support for actively kicking non-online members out of the room, providing a server-side REST API for operations.
- Optimized administrator & room owner status notifications, fixing several issues related to role feedback in version 1.x.

#### Media Device Management:
- Independent call control signaling service.
- Provides server-side operation-related APIs.
- Call control management messages are separated from IM group history messages and no longer pollute chat records.
- Independent seat management service, providing a complete set of seat management REST APIs.
- Unified seat business logic, supporting up to 20.
- Seat supports queuing, no longer requires a mandatory seat index.
- Unified logic for ordered and unordered seat positions, no longer distinguishing between meetings and live.
- Support for pulling the seat request list at any time, solving the problem of lost seat requests in version 1.x when exiting midway.

#### API Changes
For details, see [API changes](./api_change_log.md).

### Version 1.7.1 @ 2024.01.05:
- Android and iOS: Added the administrator function, where the host can set/cancel - administrators to assist the host in performing operations such as muting and approving participants for the meeting.
-  Android: Optimized the volume prompt effect for the simplified Mic icon.
-  Android: Solved the speaker mode conflict: Personal video show cannot enter screen sharing.
-  Android: Solved the issue of incomplete resource release caused by rapid and repeated entry/exit of the meeting.

### Version 1.7.0 @ 2023.12.18
- Android & iOS: Improve beautify UI, adjust rounded corners, background color, size, etc.;
- Android & iOS: Fixed some issues in special scenarios;
- Android: Refine the content of the small screen in the room, and split the refresh into user, video, and audio parts;
- Android: Solve the problem of multiple setting panels appearing when the bottom menu bar is clicked multiple times;
- Android: Optimize the development access process and adapt to Gradle 8.0;
- iOS: Fix the occasional black screen problem;
- iOS: Change the room number generation logic and fix the occasional room creation failure problem;

### Version 1.6.1 @ 2023.11.10
- Android & iOS: Optimize product experience, further beautify the landscape UI;
- Android & iOS: Optimize product experience, solve the jitter of the small screen switching in speaker mode, and set the small screen switching interval to 5 seconds;
- Android & iOS: Increase the readability of the source code, adjust the file directory and file naming of the UI;

### Version 1.6.0 @ 2023.10.27
- iOS & Android: Optimize the interface;
- iOS & Android: Add landscape and portrait screen adaptation;

### Version 1.5.1 @ 2023.09.28
- iOS & Android: Optimize the development access process, update the TUIRoomKit interface;
- iOS & Android: Optimize product experience, update the UI interface;
- iOS & Android: Optimize product experience, make microphone switch speed smoother;
- iOS & Android: Layout adaptation RTL, add Arabic;

### Version 1.5.0 @ 2023.09.08
- iOS: Remove beauty feature;

### Version 1.4.5 @ 2023.08.14
- iOS: Modify the problem that the quick meeting message sent by IM can be replied by long press;

### Version 1.4.4 @ 2023.08.03
- Android: Add video floating window function, prioritize screen sharing screen, followed by the owner's screen;
- Android: Optimize product experience, change the default audio output when entering the room to the speaker;
- Android: Optimize product experience, add a prompt when the account is kicked offline;
- Android: Optimize product experience, add a prompt for successful transfer of the homeowner;
- Android: Optimize the development access process, remove the tuivideoseat module, and merge its functions into tuiroomkit;
- iOS: Add video floating window function, prioritize screen sharing screen, followed by the owner's screen;
- iOS: Optimize product experience, change the default audio output when entering the room to the speaker;
- iOS: Optimize product experience, add a prompt for successful transfer of the homeowner;
- iOS: Optimize the development access process, remove the TUIVideoSeat module, and merge its functions into TUIRoomKit;

### Version 1.4.3 @ 2023.07.28
- iOS: Fix the problem of overlapping meetings when two people share the screen at the same time;

### Version 1.4.2 @ 2023.07.24
- Android & iOS: Fix the occasional Crash when frequently obtaining user information;
- Android & iOS: Fix the abnormal audio volume callback problem caused by turning off the microphone in some scenarios;

### Version 1.3.4 @ 2023.07.12
- Android: Add background survival logic to ensure the normal use of audio and video when the app is in the background;
- Android: Remove Basic and TUIBeauty modules;
- Android: Optimize video screen flicker, multiple refreshes, and other issues;
- Android: TUIRoomKit supports chat function;
- iOS: Add background survival logic to solve the problem that you can't hear the other party's voice when you go to the background
- iOS: Modify the problem that the preview setting page does not have horizontal and vertical screen induction
- iOS: If the system access to the camera and microphone is not allowed, open the microphone and camera to increase the permission access later
- iOS: Integrate TUIRoomKit with IM

### Version 1.3.3 @ 2023.06.21
- iOS: Modify the problem of watching screen sharing in the hand-raising speaking room
- iOS: Modify the conference QR code

### Version 1.3.2 @ 2023.06.05
- iOS: Modify the room entry time

### Version 1.3.1 @ 2023.05.30
- iOS: Display the corresponding button according to whether the beauty and chat are imported

### Version 1.3.0 @ 2023.05.22
- iOS: Fix unresponsive click issue
- iOS: Adapt to OC
- iOS: Add Chinese and English switching
- iOS: Fix the initial state problem of microphone and camera

### Version 1.2.3 @ 2023.05.06
- iOS: Fix issues caused by simultaneous access to TUIRoomKit and TUICallKit

### Version 1.2.2 @ 2023.04.28
- iOS: Fix routing jump problem

### Version 1.2.1 @ 2023.04.27
- iOS: Fix the problem of directly displaying the create room or enter room page without a preview page

### Version 1.2.0 @ 2023.04.25
- iOS: TUIRoomKit adds landscape mode
- iOS: TUIRoomKit adds hand-raising speaking room on-mic prompt
- iOS: TUIVideoSeat adds landscape mode and two-finger zoom function

### Version 1.1.0 @ 2023.04.14
- iOS & Android: Adapt `RoomEngine` `V1.2.0` changes
- iOS: VideoSeat adds speaker mode
- iOS: Fix the problem that the beauty setting is not saved
- iOS: Fix the problem that the hand-raising speaking request times out but the request is not removed from the hand-raising list
- iOS: Fix the problem that every time you click settings, the audio and video parameters are default values
- iOS: Fix the problem that sending pictures in chat will crash
- iOS: Fix the problem of jumping after transferring the homeowner and leaving the room page
- Android: Add landscape mode for a better viewing experience
- Android: Optimize UI interface popup animation

### Version 1.0.6 @ 2023.03.27
- Android: Dual-mode supports video screen switching to the other party's screen
- Android: Optimize video mic position `TUIVideoSeat` layout for better interaction experience

### Version 1.0.5 @ 2023.03.27
- Android: Adapt `RoomEngine` `V1.0.2` changes, `requestId` changed from `int` to `String`
- Android: Update `imsdk` version to `7.1.3925`
- iOS: Add `TUIChat` chat function
- iOS: Fix the problem of black screen display in the video
- iOS: Fix the problem that the homeowner cannot get off the stage after the hand-raising speaking room is converted

### Version 1.0.4 @ 2023.03.10
- iOS & Android: Add `logout` interface
- Android: Integrate `TUIChat` chat function
- Android: Fix text display issues on some models
- Android: Fix the problem that the video mic position homeowner icon is displayed abnormally after the homeowner transfers in specific situations
- Android: Optimize `Toast` prompts after some operations
- iOS: Fix the problem of homeowner management of members on the member list page
- iOS: Fix the problem of microphone and camera after getting on the stage and leaving the room, and re-entering the room

### Version 1.0.3 @ 2023.03.06
- iOS & Android: Modify `enterRoom` callback, delete `RoomScene` parameter
- iOS & Android: Modify `onExitRoom` callback parameter to no parameter
- iOS & Android: Fix the problem that the front and rear cameras and video mirroring settings before entering the room do not take effect in the room
- Android: Fix the problem that the user who has not been on the stage will crash after the homeowner leaves the room in the hand-raising speaking mode
- Android: Upgrade the project compileSdkVersion and targetSdkVersion to 30
- Android: Fix the problem that you cannot enter the room when there are too many people in the room
- Android: Upgrade gradle version to 6.7.1
- iOS: Fix callback exception caused by memory leak in roomEngine
- iOS: Fix the abnormal display of homeowner status

### Version 1.0.2 @ 2023.02.24
- iOS & Android: Modify `setUp` interface `login` interface
- iOS & Android: Add interface for setting user avatar and nickname `setSelfInfo`
- iOS & Android: Add onLogin login result callback
- iOS & Android: Add preparation page, you can preview the video before entering the room
- iOS & Android: Add hand-raising speaking mode, the host can control the user's on and off the microphone, and the audience needs to apply for the microphone before they can speak normally
