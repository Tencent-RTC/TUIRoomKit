/**
 * Emoji input interface in the chat screen.
 * It should be noted that the emoticons in TUIRoomKit are copyrighted. The purchased IM service does not include the
 * right to use the emoticons. Please replace them with your own emoticons when you go online, otherwise you will
 * face legal risks.
 * The yellow face emoji is copyrighted by Tencent Cloud. To use it, authorization is required.
 * Please contact us through the following link.
 *
 * https://cloud.tencent.com/document/product/269/59590
 */

export const emojiBaseUrl =
  'https://web.sdk.qcloud.com/im/assets/emoji-plugin/';
const deprecatedEmojiBaseUrl = 'https://web.sdk.qcloud.com/im/assets/emoji/';
export const emojiMap: Record<string, string> = {
  '[期待]': 'emoji_0@2x.png',
  '[眨眼]': 'emoji_1@2x.png',
  '[大笑]': 'emoji_2@2x.png',
  '[姨母笑]': 'emoji_3@2x.png',
  '[哈哈哈]': 'emoji_4@2x.png',
  '[愉快]': 'emoji_5@2x.png',
  '[微笑]': 'emoji_6@2x.png',
  '[悲伤]': 'emoji_7@2x.png',
  '[无语]': 'emoji_8@2x.png',
  '[惊讶]': 'emoji_9@2x.png',
  '[得意]': 'emoji_10@2x.png',
  '[色]': 'emoji_11@2x.png',
  '[星星眼]': 'emoji_12@2x.png',
  '[憨笑]': 'emoji_13@2x.png',
  '[恶魔]': 'emoji_14@2x.png',
  '[恶魔怒]': 'emoji_15@2x.png',
  '[打哈欠]': 'emoji_16@2x.png',
  '[哭笑]': 'emoji_17@2x.png',
  '[傻了]': 'emoji_18@2x.png',
  '[大哭]': 'emoji_19@2x.png',
  '[亲亲]': 'emoji_20@2x.png',
  '[困]': 'emoji_21@2x.png',
  '[恐惧]': 'emoji_22@2x.png',
  '[龇牙]': 'emoji_23@2x.png',
  '[发怒]': 'emoji_24@2x.png',
  '[机智]': 'emoji_25@2x.png',
  '[便便]': 'emoji_26@2x.png',
  '[闭嘴]': 'emoji_27@2x.png',
  '[叹气]': 'emoji_28@2x.png',
  '[呵呵]': 'emoji_29@2x.png',
  '[收声]': 'emoji_30@2x.png',
  '[骷髅]': 'emoji_31@2x.png',
  '[口罩]': 'emoji_32@2x.png',
  '[啤酒]': 'emoji_33@2x.png',
  '[蛋糕]': 'emoji_34@2x.png',
  '[红包]': 'emoji_35@2x.png',
  '[炸弹]': 'emoji_36@2x.png',
  '[AI]': 'emoji_37@2x.png',
  '[庆祝]': 'emoji_38@2x.png',
  '[福]': 'emoji_39@2x.png',
  '[花]': 'emoji_40@2x.png',
  '[瓜]': 'emoji_41@2x.png',
  '[牛]': 'emoji_42@2x.png',
  '[衰]': 'emoji_43@2x.png',
  '[惊喜]': 'emoji_44@2x.png',
  '[白眼]': 'emoji_45@2x.png',
  '[怪兽]': 'emoji_46@2x.png',
  '[猪]': 'emoji_47@2x.png',
  '[咖啡]': 'emoji_48@2x.png',
  '[OK]': 'emoji_49@2x.png',
  '[爱心]': 'emoji_50@2x.png',
  '[太阳]': 'emoji_51@2x.png',
  '[月亮]': 'emoji_52@2x.png',
  '[星星]': 'emoji_53@2x.png',
  '[壕]': 'emoji_54@2x.png',
  '[发]': 'emoji_55@2x.png',
  '[857]': 'emoji_56@2x.png',
  '[666]': 'emoji_57@2x.png',
  '[禁]': 'emoji_58@2x.png',
  '[服]': 'emoji_59@2x.png',
  '[刀]': 'emoji_60@2x.png',
  '[赞]': 'emoji_61@2x.png',
};
const emojiNameMapping: Record<string, string> = {
  '[微笑]': '[TUIEmoji_Smile]',
  '[期待]': '[TUIEmoji_Expect]',
  '[眨眼]': '[TUIEmoji_Blink]',
  '[大笑]': '[TUIEmoji_Guffaw]',
  '[姨母笑]': '[TUIEmoji_KindSmile]',
  '[哈哈哈]': '[TUIEmoji_Haha]',
  '[愉快]': '[TUIEmoji_Cheerful]',
  '[无语]': '[TUIEmoji_Speechless]',
  '[惊讶]': '[TUIEmoji_Amazed]',
  '[悲伤]': '[TUIEmoji_Sorrow]',
  '[得意]': '[TUIEmoji_Complacent]',
  '[傻了]': '[TUIEmoji_Silly]',
  '[色]': '[TUIEmoji_Lustful]',
  '[憨笑]': '[TUIEmoji_Giggle]',
  '[亲亲]': '[TUIEmoji_Kiss]',
  '[大哭]': '[TUIEmoji_Wail]',
  '[哭笑]': '[TUIEmoji_TearsLaugh]',
  '[困]': '[TUIEmoji_Trapped]',
  '[口罩]': '[TUIEmoji_Mask]',
  '[恐惧]': '[TUIEmoji_Fear]',
  '[龇牙]': '[TUIEmoji_BareTeeth]',
  '[发怒]': '[TUIEmoji_FlareUp]',
  '[打哈欠]': '[TUIEmoji_Yawn]',
  '[机智]': '[TUIEmoji_Tact]',
  '[星星眼]': '[TUIEmoji_Stareyes]',
  '[闭嘴]': '[TUIEmoji_ShutUp]',
  '[叹气]': '[TUIEmoji_Sigh]',
  '[呵呵]': '[TUIEmoji_Hehe]',
  '[收声]': '[TUIEmoji_Silent]',
  '[惊喜]': '[TUIEmoji_Surprised]',
  '[白眼]': '[TUIEmoji_Askance]',
  '[OK]': '[TUIEmoji_Ok]',
  '[便便]': '[TUIEmoji_Shit]',
  '[怪兽]': '[TUIEmoji_Monster]',
  '[恶魔]': '[TUIEmoji_Daemon]',
  '[恶魔怒]': '[TUIEmoji_Rage]',
  '[衰]': '[TUIEmoji_Fool]',
  '[猪]': '[TUIEmoji_Pig]',
  '[牛]': '[TUIEmoji_Cow]',
  '[AI]': '[TUIEmoji_Ai]',
  '[骷髅]': '[TUIEmoji_Skull]',
  '[炸弹]': '[TUIEmoji_Bombs]',
  '[咖啡]': '[TUIEmoji_Coffee]',
  '[蛋糕]': '[TUIEmoji_Cake]',
  '[啤酒]': '[TUIEmoji_Beer]',
  '[花]': '[TUIEmoji_Flower]',
  '[瓜]': '[TUIEmoji_Watermelon]',
  '[壕]': '[TUIEmoji_Rich]',
  '[爱心]': '[TUIEmoji_Heart]',
  '[月亮]': '[TUIEmoji_Moon]',
  '[太阳]': '[TUIEmoji_Sun]',
  '[星星]': '[TUIEmoji_Star]',
  '[红包]': '[TUIEmoji_RedPacket]',
  '[庆祝]': '[TUIEmoji_Celebrate]',
  '[福]': '[TUIEmoji_Bless]',
  '[发]': '[TUIEmoji_Fortune]',
  '[服]': '[TUIEmoji_Convinced]',
  '[禁]': '[TUIEmoji_Prohibit]',
  '[666]': '[TUIEmoji_666]',
  '[857]': '[TUIEmoji_857]',
  '[刀]': '[TUIEmoji_Knife]',
  '[赞]': '[TUIEmoji_Like]',
};
const emojiUrlMapping: Record<string, string> = {
  '[TUIEmoji_Expect]': 'emoji_0@2x.png',
  '[TUIEmoji_Blink]': 'emoji_1@2x.png',
  '[TUIEmoji_Guffaw]': 'emoji_2@2x.png',
  '[TUIEmoji_KindSmile]': 'emoji_3@2x.png',
  '[TUIEmoji_Haha]': 'emoji_4@2x.png',
  '[TUIEmoji_Cheerful]': 'emoji_5@2x.png',
  '[TUIEmoji_Smile]': 'emoji_6@2x.png',
  '[TUIEmoji_Sorrow]': 'emoji_7@2x.png',
  '[TUIEmoji_Speechless]': 'emoji_8@2x.png',
  '[TUIEmoji_Amazed]': 'emoji_9@2x.png',
  '[TUIEmoji_Complacent]': 'emoji_10@2x.png',
  '[TUIEmoji_Lustful]': 'emoji_11@2x.png',
  '[TUIEmoji_Stareyes]': 'emoji_12@2x.png',
  '[TUIEmoji_Giggle]': 'emoji_13@2x.png',
  '[TUIEmoji_Daemon]': 'emoji_14@2x.png',
  '[TUIEmoji_Rage]': 'emoji_15@2x.png',
  '[TUIEmoji_Yawn]': 'emoji_16@2x.png',
  '[TUIEmoji_TearsLaugh]': 'emoji_17@2x.png',
  '[TUIEmoji_Silly]': 'emoji_18@2x.png',
  '[TUIEmoji_Wail]': 'emoji_19@2x.png',
  '[TUIEmoji_Kiss]': 'emoji_20@2x.png',
  '[TUIEmoji_Trapped]': 'emoji_21@2x.png',
  '[TUIEmoji_Fear]': 'emoji_22@2x.png',
  '[TUIEmoji_BareTeeth]': 'emoji_23@2x.png',
  '[TUIEmoji_FlareUp]': 'emoji_24@2x.png',
  '[TUIEmoji_Tact]': 'emoji_25@2x.png',
  '[TUIEmoji_Shit]': 'emoji_26@2x.png',
  '[TUIEmoji_ShutUp]': 'emoji_27@2x.png',
  '[TUIEmoji_Sigh]': 'emoji_28@2x.png',
  '[TUIEmoji_Hehe]': 'emoji_29@2x.png',
  '[TUIEmoji_Silent]': 'emoji_30@2x.png',
  '[TUIEmoji_Skull]': 'emoji_31@2x.png',
  '[TUIEmoji_Mask]': 'emoji_32@2x.png',
  '[TUIEmoji_Beer]': 'emoji_33@2x.png',
  '[TUIEmoji_Cake]': 'emoji_34@2x.png',
  '[TUIEmoji_RedPacket]': 'emoji_35@2x.png',
  '[TUIEmoji_Bombs]': 'emoji_36@2x.png',
  '[TUIEmoji_Ai]': 'emoji_37@2x.png',
  '[TUIEmoji_Celebrate]': 'emoji_38@2x.png',
  '[TUIEmoji_Bless]': 'emoji_39@2x.png',
  '[TUIEmoji_Flower]': 'emoji_40@2x.png',
  '[TUIEmoji_Watermelon]': 'emoji_41@2x.png',
  '[TUIEmoji_Cow]': 'emoji_42@2x.png',
  '[TUIEmoji_Fool]': 'emoji_43@2x.png',
  '[TUIEmoji_Surprised]': 'emoji_44@2x.png',
  '[TUIEmoji_Askance]': 'emoji_45@2x.png',
  '[TUIEmoji_Monster]': 'emoji_46@2x.png',
  '[TUIEmoji_Pig]': 'emoji_47@2x.png',
  '[TUIEmoji_Coffee]': 'emoji_48@2x.png',
  '[TUIEmoji_Ok]': 'emoji_49@2x.png',
  '[TUIEmoji_Heart]': 'emoji_50@2x.png',
  '[TUIEmoji_Sun]': 'emoji_51@2x.png',
  '[TUIEmoji_Moon]': 'emoji_52@2x.png',
  '[TUIEmoji_Star]': 'emoji_53@2x.png',
  '[TUIEmoji_Rich]': 'emoji_54@2x.png',
  '[TUIEmoji_Fortune]': 'emoji_55@2x.png',
  '[TUIEmoji_857]': 'emoji_56@2x.png',
  '[TUIEmoji_666]': 'emoji_57@2x.png',
  '[TUIEmoji_Prohibit]': 'emoji_58@2x.png',
  '[TUIEmoji_Convinced]': 'emoji_59@2x.png',
  '[TUIEmoji_Knife]': 'emoji_60@2x.png',
  '[TUIEmoji_Like]': 'emoji_61@2x.png',
};
const deprecatedEmojiMap: Record<string, string> = {
  '[NO]': 'emoji_0@2x.png',
  '[OK]': 'emoji_1@2x.png',
  '[下雨]': 'emoji_2@2x.png',
  '[么么哒]': 'emoji_3@2x.png',
  '[乒乓]': 'emoji_4@2x.png',
  '[便便]': 'emoji_5@2x.png',
  '[信封]': 'emoji_6@2x.png',
  '[偷笑]': 'emoji_7@2x.png',
  '[傲慢]': 'emoji_8@2x.png',
  '[再见]': 'emoji_9@2x.png',
  '[冷汗]': 'emoji_10@2x.png',
  '[凋谢]': 'emoji_11@2x.png',
  '[刀]': 'emoji_12@2x.png',
  '[删除]': 'emoji_13@2x.png',
  '[勾引]': 'emoji_14@2x.png',
  '[发呆]': 'emoji_15@2x.png',
  '[发抖]': 'emoji_16@2x.png',
  '[可怜]': 'emoji_17@2x.png',
  '[可爱]': 'emoji_18@2x.png',
  '[右哼哼]': 'emoji_19@2x.png',
  '[右太极]': 'emoji_20@2x.png',
  '[右车头]': 'emoji_21@2x.png',
  '[吐]': 'emoji_22@2x.png',
  '[吓]': 'emoji_23@2x.png',
  '[咒骂]': 'emoji_24@2x.png',
  '[咖啡]': 'emoji_25@2x.png',
  '[啤酒]': 'emoji_26@2x.png',
  '[嘘]': 'emoji_27@2x.png',
  '[回头]': 'emoji_28@2x.png',
  '[困]': 'emoji_29@2x.png',
  '[坏笑]': 'emoji_30@2x.png',
  '[多云]': 'emoji_31@2x.png',
  '[大兵]': 'emoji_32@2x.png',
  '[大哭]': 'emoji_33@2x.png',
  '[太阳]': 'emoji_34@2x.png',
  '[奋斗]': 'emoji_35@2x.png',
  '[奶瓶]': 'emoji_36@2x.png',
  '[委屈]': 'emoji_37@2x.png',
  '[害羞]': 'emoji_38@2x.png',
  '[尴尬]': 'emoji_39@2x.png',
  '[左哼哼]': 'emoji_40@2x.png',
  '[左太极]': 'emoji_41@2x.png',
  '[左车头]': 'emoji_42@2x.png',
  '[差劲]': 'emoji_43@2x.png',
  '[弱]': 'emoji_44@2x.png',
  '[强]': 'emoji_45@2x.png',
  '[彩带]': 'emoji_46@2x.png',
  '[彩球]': 'emoji_47@2x.png',
  '[得意]': 'emoji_48@2x.png',
  '[微笑]': 'emoji_49@2x.png',
  '[心碎了]': 'emoji_50@2x.png',
  '[快哭了]': 'emoji_51@2x.png',
  '[怄火]': 'emoji_52@2x.png',
  '[怒]': 'emoji_53@2x.png',
  '[惊恐]': 'emoji_54@2x.png',
  '[惊讶]': 'emoji_55@2x.png',
  '[憨笑]': 'emoji_56@2x.png',
  '[手枪]': 'emoji_57@2x.png',
  '[打哈欠]': 'emoji_58@2x.png',
  '[抓狂]': 'emoji_59@2x.png',
  '[折磨]': 'emoji_60@2x.png',
  '[抠鼻]': 'emoji_61@2x.png',
  '[抱抱]': 'emoji_62@2x.png',
  '[抱拳]': 'emoji_63@2x.png',
  '[拳头]': 'emoji_64@2x.png',
  '[挥手]': 'emoji_65@2x.png',
  '[握手]': 'emoji_66@2x.png',
  '[撇嘴]': 'emoji_67@2x.png',
  '[擦汗]': 'emoji_68@2x.png',
  '[敲打]': 'emoji_69@2x.png',
  '[晕]': 'emoji_70@2x.png',
  '[月亮]': 'emoji_71@2x.png',
  '[棒棒糖]': 'emoji_72@2x.png',
  '[汽车]': 'emoji_73@2x.png',
  '[沙发]': 'emoji_74@2x.png',
  '[流汗]': 'emoji_75@2x.png',
  '[流泪]': 'emoji_76@2x.png',
  '[激动]': 'emoji_77@2x.png',
  '[灯泡]': 'emoji_78@2x.png',
  '[炸弹]': 'emoji_79@2x.png',
  '[熊猫]': 'emoji_80@2x.png',
  '[爆筋]': 'emoji_81@2x.png',
  '[爱你]': 'emoji_82@2x.png',
  '[爱心]': 'emoji_83@2x.png',
  '[爱情]': 'emoji_84@2x.png',
  '[猪头]': 'emoji_85@2x.png',
  '[猫咪]': 'emoji_86@2x.png',
  '[献吻]': 'emoji_87@2x.png',
  '[玫瑰]': 'emoji_88@2x.png',
  '[瓢虫]': 'emoji_89@2x.png',
  '[疑问]': 'emoji_90@2x.png',
  '[白眼]': 'emoji_91@2x.png',
  '[皮球]': 'emoji_92@2x.png',
  '[睡觉]': 'emoji_93@2x.png',
  '[磕头]': 'emoji_94@2x.png',
  '[示爱]': 'emoji_95@2x.png',
  '[礼品袋]': 'emoji_96@2x.png',
  '[礼物]': 'emoji_97@2x.png',
  '[篮球]': 'emoji_98@2x.png',
  '[米饭]': 'emoji_99@2x.png',
  '[糗大了]': 'emoji_100@2x.png',
  '[红双喜]': 'emoji_101@2x.png',
  '[红灯笼]': 'emoji_102@2x.png',
  '[纸巾]': 'emoji_103@2x.png',
  '[胜利]': 'emoji_104@2x.png',
  '[色]': 'emoji_105@2x.png',
  '[药]': 'emoji_106@2x.png',
  '[菜刀]': 'emoji_107@2x.png',
  '[蛋糕]': 'emoji_108@2x.png',
  '[蜡烛]': 'emoji_109@2x.png',
  '[街舞]': 'emoji_110@2x.png',
  '[衰]': 'emoji_111@2x.png',
  '[西瓜]': 'emoji_112@2x.png',
  '[调皮]': 'emoji_113@2x.png',
  '[象棋]': 'emoji_114@2x.png',
  '[跳绳]': 'emoji_115@2x.png',
  '[跳跳]': 'emoji_116@2x.png',
  '[车厢]': 'emoji_117@2x.png',
  '[转圈]': 'emoji_118@2x.png',
  '[鄙视]': 'emoji_119@2x.png',
  '[酷]': 'emoji_120@2x.png',
  '[钞票]': 'emoji_121@2x.png',
  '[钻戒]': 'emoji_122@2x.png',
  '[闪电]': 'emoji_123@2x.png',
  '[闭嘴]': 'emoji_124@2x.png',
  '[闹钟]': 'emoji_125@2x.png',
  '[阴险]': 'emoji_126@2x.png',
  '[难过]': 'emoji_127@2x.png',
  '[雨伞]': 'emoji_128@2x.png',
  '[青蛙]': 'emoji_129@2x.png',
  '[面条]': 'emoji_130@2x.png',
  '[鞭炮]': 'emoji_131@2x.png',
  '[风车]': 'emoji_132@2x.png',
  '[飞吻]': 'emoji_133@2x.png',
  '[飞机]': 'emoji_134@2x.png',
  '[饥饿]': 'emoji_135@2x.png',
  '[香蕉]': 'emoji_136@2x.png',
  '[骷髅]': 'emoji_137@2x.png',
  '[麦克风]': 'emoji_138@2x.png',
  '[麻将]': 'emoji_139@2x.png',
  '[鼓掌]': 'emoji_140@2x.png',
  '[龇牙]': 'emoji_141@2x.png',
};
export const emojiList = Object.keys(emojiMap);

export function decodeMessageText(payload: string) {
  const renderDom: { name: string; text?: string; src?: string }[] = [];
  function pushTextNode(text: string) {
    renderDom.push({
      name: 'text',
      text,
    });
  }

  function pushEmojiNode(src: string) {
    renderDom.push({
      name: 'img',
      src,
    });
  }

  /**
   * Text Message
   *
   **/
  let temp = payload;
  let left = -1;
  let right = -1;
  while (temp !== '') {
    left = temp.indexOf('[');
    right = temp.indexOf(']');
    switch (left) {
      case 0:
        if (right === -1) {
          pushTextNode(temp);
          temp = '';
        } else {
          const emojiKey = temp.slice(0, right + 1);
          const emojiSrc = emojiUrlMapping[emojiKey]
            ? emojiBaseUrl + emojiUrlMapping[emojiKey]
            : deprecatedEmojiMap[emojiKey]
              ? deprecatedEmojiBaseUrl + deprecatedEmojiMap[emojiKey]
              : null;
          if (emojiSrc) {
            pushEmojiNode(emojiSrc);
            temp = temp.substring(right + 1);
          } else {
            pushTextNode('[');
            temp = temp.slice(1);
          }
        }
        break;
      case -1:
        pushTextNode(temp);
        temp = '';
        break;
      default:
        pushTextNode(temp.slice(0, left));
        temp = temp.substring(left);
        break;
    }
  }
  return renderDom;
}

export function decodeSendTextMsg(payload: string) {
  /**
   * Text Message
   *
   **/
  let temp = payload;
  let left = -1;
  let right = -1;
  let result = '';

  while (temp !== '') {
    temp = temp.replace('\n', '');
    left = temp.indexOf('[');
    right = temp.indexOf(']');

    switch (left) {
      case 0:
        if (right === -1) {
          result += temp;
          temp = '';
        } else {
          const emojiKey = temp.slice(0, right + 1);
          if (emojiKey in emojiNameMapping) {
            result += emojiNameMapping[emojiKey];
            temp = temp.substring(right + 1);
          } else {
            result += '[';
            temp = temp.slice(1);
          }
        }
        break;
      case -1:
        result += temp;
        temp = '';
        break;
      default:
        result += temp.slice(0, left);
        temp = temp.substring(left);
        break;
    }
  }
  return result;
}
