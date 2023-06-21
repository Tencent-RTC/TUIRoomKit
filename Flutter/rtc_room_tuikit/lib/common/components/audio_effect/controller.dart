import 'package:get/get.dart';
import 'package:tencent_trtc_cloud/trtc_cloud.dart';
import 'package:tencent_trtc_cloud/trtc_cloud_def.dart';
import 'package:tencent_trtc_cloud/tx_audio_effect_manager.dart';

class AudioEffectController extends GetxController {
  AudioEffectController();
  late TXAudioEffectManager _audioEffectManager;

  @override
  void onInit() async {
    super.onInit();
    var trtcCloud = (await TRTCCloud.sharedInstance())!;
    _audioEffectManager = trtcCloud.getAudioEffectManager();
  }

  startPlayMusic(String path) {
    _audioEffectManager.startPlayMusic(AudioMusicParam(id: 0, path: path));
  }

  setAllMusicVolume(int volume) {
    _audioEffectManager.setAllMusicVolume(volume);
  }

  setMusicPitch(int id) {
    _audioEffectManager.setMusicPitch(id, 0);
  }

  setVoiceCaptureVolume(int volume) {
    _audioEffectManager.setVoiceCaptureVolume(volume);
  }

  setVoiceChangerType(int type) {
    _audioEffectManager.setVoiceChangerType(type);
  }

  setVoiceReverbType(int type) {
    _audioEffectManager.setVoiceReverbType(type);
  }
}
