import 'dart:io';
import 'package:flutter/material.dart';
import 'package:open_file/open_file.dart';
import 'package:get/get.dart';

import '../index.dart';

class FileBrowser extends GetView<PrepareController> {
  final Directory? startDirectory;

  const FileBrowser({Key? key, this.startDirectory}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Directory? currentDirectory = startDirectory ?? controller.currentDirectory;

    if (currentDirectory == null) {
      return const Center(child: CircularProgressIndicator());
    }

    var files = currentDirectory.listSync();
    files.sort((a, b) => b.path.compareTo(a.path));

    return Scaffold(
      appBar: AppBar(
        title: Text(currentDirectory.path),
      ),
      body: ListView.builder(
        itemCount: files.length,
        itemBuilder: (context, index) {
          FileSystemEntity file = files[index];
          return ListTile(
            title: Text(file.path.split('/').last),
            onTap: () async {
              if (file is Directory) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => FileBrowser(startDirectory: file),
                  ),
                );
              } else {
                await OpenFile.open(file.path);
              }
            },
          );
        },
      ),
    );
  }
}
