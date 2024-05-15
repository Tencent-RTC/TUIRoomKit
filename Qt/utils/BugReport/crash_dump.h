// Copyright (c) 2021 Tencent. All rights reserved.

#ifndef CRASH_DUMP_H
#define CRASH_DUMP_H

#include <string>
#include <Windows.h>

class ICrashAgent;
class CrashDump {
 public:
  CrashDump();
  ~CrashDump();
  void Init(const std::string& appinfo, const std::string& version);

 private:
  bool InitCrashSight(const std::string& appinfo, const std::string& version);

  void InitAttachExceptionFilter();
  static LONG WINAPI
  UnhandledExceptionFilter(struct _EXCEPTION_POINTERS* pExceptionInfo);

  LPTOP_LEVEL_EXCEPTION_FILTER exception_filter_ = nullptr;
};

#endif  // CRASH_DUMP_H
