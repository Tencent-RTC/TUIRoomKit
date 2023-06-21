import 'package:flutter/material.dart';

class BeautySettingWidget extends StatefulWidget {
  const BeautySettingWidget({Key? key, this.onChanged, this.onClose})
      : super(key: key);
  final Function(String, double)? onChanged;
  final Function()? onClose;
  @override
  State createState() => _BeautySettingWidgetState();
  // 美颜值默认为6
  static Map<String, double> initBeautyValue = {
    'pitu': 6,
    'smooth': 6,
    'nature': 6,
    'whitening': 0,
    'ruddy': 0
  };
}

class _BeautySettingWidgetState extends State<BeautySettingWidget> {
  String curBeauty = 'pitu'; //默认为P图
  Map<String, double> curBeautyValue = BeautySettingWidget.initBeautyValue;

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      height: 180,
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
                  title: Text("美颜设置"),
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
          Row(
            children: [
              const Padding(
                padding: EdgeInsets.only(
                  left: 15,
                ),
                child: Text("强度",
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.black)),
              ),
              Expanded(
                flex: 2,
                child: Slider(
                  value: curBeautyValue[curBeauty]!,
                  min: 0,
                  max: 9,
                  divisions: 9,
                  onChanged: (double value) {
                    if (widget.onChanged != null) {
                      widget.onChanged!(curBeauty, value);
                    }
                    setState(() {
                      curBeautyValue[curBeauty] = value;
                    });
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(
                  right: 15,
                ),
                child: Text(curBeautyValue[curBeauty]!.toString(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.black)),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(top: 20, left: 0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                GestureDetector(
                  child: Container(
                    alignment: Alignment.centerLeft,
                    width: 80.0,
                    child: Text(
                      '美颜(光滑)',
                      style: TextStyle(
                          color: curBeauty == 'smooth'
                              ? const Color.fromRGBO(64, 158, 255, 1)
                              : Colors.black),
                    ),
                  ),
                  onTap: () => setState(() {
                    curBeauty = 'smooth';
                    if (widget.onChanged != null) {
                      widget.onChanged!(curBeauty, curBeautyValue[curBeauty]!);
                    }
                  }),
                ),
                GestureDetector(
                  child: Container(
                    alignment: Alignment.centerLeft,
                    width: 80.0,
                    child: Text(
                      '美颜(自然)',
                      style: TextStyle(
                          color: curBeauty == 'nature'
                              ? const Color.fromRGBO(64, 158, 255, 1)
                              : Colors.black),
                    ),
                  ),
                  onTap: () => setState(() {
                    curBeauty = 'nature';
                    if (widget.onChanged != null) {
                      widget.onChanged!(curBeauty, curBeautyValue[curBeauty]!);
                    }
                  }),
                ),
                GestureDetector(
                  child: Container(
                    alignment: Alignment.centerLeft,
                    width: 80.0,
                    child: Text(
                      '美颜(P图)',
                      style: TextStyle(
                          color: curBeauty == 'pitu'
                              ? const Color.fromRGBO(64, 158, 255, 1)
                              : Colors.black),
                    ),
                  ),
                  onTap: () => setState(() {
                    curBeauty = 'pitu';
                    if (widget.onChanged != null) {
                      widget.onChanged!(curBeauty, curBeautyValue[curBeauty]!);
                    }
                  }),
                ),
                GestureDetector(
                  child: Container(
                    alignment: Alignment.centerLeft,
                    width: 45.0,
                    child: Text(
                      '美白',
                      style: TextStyle(
                          color: curBeauty == 'whitening'
                              ? const Color.fromRGBO(64, 158, 255, 1)
                              : Colors.black),
                    ),
                  ),
                  onTap: () => setState(() {
                    curBeauty = 'whitening';
                    if (widget.onChanged != null) {
                      widget.onChanged!(curBeauty, curBeautyValue[curBeauty]!);
                    }
                  }),
                ),
                GestureDetector(
                  child: Container(
                    alignment: Alignment.centerLeft,
                    width: 45.0,
                    child: Text(
                      '红润',
                      style: TextStyle(
                          color: curBeauty == 'ruddy'
                              ? const Color.fromRGBO(64, 158, 255, 1)
                              : Colors.black),
                    ),
                  ),
                  onTap: () => setState(() {
                    curBeauty = 'ruddy';
                    if (widget.onChanged != null) {
                      widget.onChanged!(curBeauty, curBeautyValue[curBeauty]!);
                    }
                  }),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
