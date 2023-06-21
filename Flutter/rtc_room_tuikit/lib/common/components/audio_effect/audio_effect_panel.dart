import 'package:flutter/material.dart';

enum MusicMenuItem {
  FIRST,
  SECOND,
  THIRD,
}

class AudioEffectSetting extends StatefulWidget {
  const AudioEffectSetting(
      {Key? key,
      this.onClose,
      this.onSelectMusic,
      this.playMusicTips = "",
      required this.onVoiceReverbTypeChange,
      required this.onVoiceChangerTypeChange,
      required this.onVoiceVolumeChange,
      required this.onAllMusicVolumeChange,
      required this.onMusicPitchChange})
      : super(key: key);
  final Function()? onClose;
  final Function(String path, String musicTip)? onSelectMusic;
  final Function(int type) onVoiceReverbTypeChange;
  final Function(int type) onVoiceChangerTypeChange;
  final Function(double value) onVoiceVolumeChange;
  final Function(double value) onMusicPitchChange;
  final Function(double value) onAllMusicVolumeChange;
  final String playMusicTips;
  @override
  _AudioEffectSettingState createState() => _AudioEffectSettingState();
}

class _AudioEffectSettingState extends State<AudioEffectSetting> {
  double musicVolume = 100;
  double voiceVolume = 100;
  double musicPitch = 0;
  String _playMusicTips = "";
  @override
  void initState() {
    super.initState();
    setState(() {
      _playMusicTips = widget.playMusicTips;
    });
  }

  Widget getRowSlider(
      {required String title,
      double min = 0,
      double max = 100,
      int divisions = 100,
      required double value,
      required Function(double value) onChange}) {
    return Row(
      children: [
        SizedBox(
          width: 85,
          height: 28,
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              color: Color(
                0xFF666666,
              ),
            ),
          ),
        ),
        Expanded(
          child: Slider(
            value: value,
            min: min,
            max: max,
            divisions: divisions,
            activeColor: const Color(0xFF006EFF),
            onChanged: (double value) {
              onChange(value);
            },
          ),
        ),
        SizedBox(
          width: 60,
          height: 28,
          child: Text(
            value.toStringAsFixed(min >= 0 ? 0 : 2),
            textAlign: TextAlign.start,
            style: const TextStyle(
              fontSize: 16,
              color: Color(
                0xFF333333,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget getMusicSelectWidget() {
    return Row(
      children: [
        const Text(
          '版权曲库©',
          style: TextStyle(
            fontSize: 16,
            color: Color(
              0xFF666666,
            ),
          ),
        ),
        Expanded(
          flex: 2,
          child: PopupMenuButton<MusicMenuItem>(
            child: Padding(
              padding: const EdgeInsets.only(right: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: _playMusicTips == ""
                    ? [
                        const Text('选择歌曲'),
                        const Icon(
                          Icons.arrow_right,
                        ),
                      ]
                    : [
                        Text(_playMusicTips),
                        const Icon(
                          Icons.music_video,
                        ),
                      ],
              ),
            ),
            onSelected: (MusicMenuItem result) {
              switch (result) {
                case MusicMenuItem.FIRST:
                  {
                    setState(() {
                      _playMusicTips = "正在播放:欢快";
                    });
                    widget.onSelectMusic!(
                        "https://sdk-liteav-1252463788.cos.ap-hongkong.myqcloud.com/app/res/bgm/trtc/PositiveHappyAdvertising.mp3",
                        "正在播放:欢快");
                  }
                  break;
                case MusicMenuItem.SECOND:
                  {
                    setState(() {
                      _playMusicTips = "正在播放:忧郁";
                    });
                    widget.onSelectMusic!(
                        "https://sdk-liteav-1252463788.cos.ap-hongkong.myqcloud.com/app/res/bgm/trtc/SadCinematicPiano.mp3",
                        "正在播放:忧郁");
                  }

                  break;
                case MusicMenuItem.THIRD:
                  {
                    setState(() {
                      _playMusicTips = "正在播放:神奇世界";
                    });
                    widget.onSelectMusic!(
                        "https://sdk-liteav-1252463788.cos.ap-hongkong.myqcloud.com/app/res/bgm/trtc/WonderWorld.mp3",
                        "正在播放:神奇世界");
                  }
                  break;
              }
            },
            itemBuilder: (BuildContext context) =>
                <PopupMenuEntry<MusicMenuItem>>[
              const PopupMenuItem<MusicMenuItem>(
                value: MusicMenuItem.FIRST,
                child: Text('欢乐'),
              ),
              const PopupMenuItem<MusicMenuItem>(
                value: MusicMenuItem.SECOND,
                child: Text('忧郁'),
              ),
              const PopupMenuItem<MusicMenuItem>(
                value: MusicMenuItem.THIRD,
                child: Text('神奇世界'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      height: 530,
      width: MediaQuery.of(context).size.width,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const Expanded(
                flex: 2,
                child: ListTile(
                  title: Text("音效设置"),
                  subtitle: Text("请带上耳机获得更好体验"),
                ),
              ),
              InkWell(
                onTap: () {
                  if (widget.onClose != null) widget.onClose!();
                },
                child: const Padding(
                  padding: EdgeInsets.only(right: 15),
                  child: Text("关闭"),
                ),
              ),
            ],
          ),
          getMusicSelectWidget(),
          getRowSlider(
            title: "音乐音量",
            value: musicVolume,
            onChange: (double value) {
              setState(() {
                musicVolume = value;
              });
              widget.onAllMusicVolumeChange(value);
            },
          ),
          getRowSlider(
            title: "人声音量",
            value: voiceVolume,
            onChange: (double value) {
              setState(() {
                voiceVolume = value;
              });
              widget.onVoiceVolumeChange(value);
            },
          ),
          getRowSlider(
            title: "音乐升降调",
            value: musicPitch,
            min: -1,
            max: 1,
            onChange: (double value) {
              setState(() {
                musicPitch = value;
              });
              widget.onMusicPitchChange(value);
            },
          ),
          const Row(
            children: [
              Text(
                '变声',
                style: TextStyle(
                  fontSize: 16,
                  color: Color(
                    0xFF666666,
                  ),
                ),
              )
            ],
          ),
          RowImgSelectWidget(
            bntList: const [
              ImgItemInfo("无效果", "no_select", 0),
              ImgItemInfo("熊孩子", "changetype_child", 1),
              ImgItemInfo("萝莉", "changetype_luoli", 2),
              ImgItemInfo("大叔", "changetype_dashu", 3),
              ImgItemInfo("空灵", "changetype_kongling", 11),
            ],
            selectImgKey: "no_select",
            onChange: (value) {
              widget.onVoiceChangerTypeChange(value);
            },
          ),
          const Row(
            children: [
              Text(
                '混响效果',
                style: TextStyle(
                  fontSize: 16,
                  color: Color(
                    0xFF666666,
                  ),
                ),
              )
            ],
          ),
          RowImgSelectWidget(
            bntList: const [
              ImgItemInfo("无效果", "no_select", 0),
              ImgItemInfo("KTV", "reverbtype_ktv", 1),
              ImgItemInfo("低沉", "reverbtype_lowdeep", 4),
              ImgItemInfo("重金属", "reverbtype_heavymetal", 6),
              ImgItemInfo("洪亮", "reverbtype_hongliang", 5),
            ],
            selectImgKey: "no_select",
            onChange: (value) {},
          ),
        ],
      ),
    );
  }
}

class ImgItemInfo {
  const ImgItemInfo(this.title, this.imgKey, this.value);
  final String title;
  final String imgKey;
  final int value;
}

class RowImgSelectWidget extends StatefulWidget {
  const RowImgSelectWidget(
      {Key? key, this.selectImgKey = '', required this.bntList, this.onChange})
      : super(key: key);
  final String selectImgKey;
  final List<ImgItemInfo> bntList;
  final Function(int)? onChange;
  @override
  _RowImgSelectWidgetState createState() => _RowImgSelectWidgetState();
}

class _RowImgSelectWidgetState extends State<RowImgSelectWidget> {
  String _selectImgKeyValue = '';
  @override
  void initState() {
    super.initState();
    setState(() {
      _selectImgKeyValue = widget.selectImgKey;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: widget.bntList.map((ImgItemInfo bntInfo) {
        String imgUrl = "assets/images/music/";
        bool itemIsSelect = false;
        if (_selectImgKeyValue == bntInfo.imgKey) {
          itemIsSelect = true;
          imgUrl += "${bntInfo.imgKey}_hover.png";
        } else {
          imgUrl += "${bntInfo.imgKey}_normal.png";
        }
        return SizedBox(
          height: 90,
          width: 60,
          child: InkWell(
            onTap: () {
              setState(() {
                _selectImgKeyValue = bntInfo.imgKey;
              });
              if (widget.onChange != null) {
                widget.onChange!(bntInfo.value);
              }
            },
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  margin: const EdgeInsets.all(5),
                  child: Image.asset(
                    imgUrl,
                    package: 'rtc_room_tuikit',
                    height: 50,
                    width: 50,
                  ),
                ),
                Text(
                  bntInfo.title,
                  style: TextStyle(
                      fontSize: 12,
                      color: itemIsSelect
                          ? const Color(0xFF006EFF)
                          : const Color(0xFF666666)),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
