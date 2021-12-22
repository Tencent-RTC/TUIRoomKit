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
  void Init(int major_ver, int minor_ver, int build_no);

 private:
  bool LoadBugReportDll();
  bool InitBugReport(std::wstring product_name,
                     std::wstring process_name,
                     int major_ver,
                     int minor_ver,
                     int build_no);

  void InitAttachExceptionFilter();
  static LONG WINAPI
  UnhandledExceptionFilter(struct _EXCEPTION_POINTERS* pExceptionInfo);

  LPTOP_LEVEL_EXCEPTION_FILTER exception_filter_ = nullptr;
  ICrashAgent* crash_agent_ = nullptr;
};

#endif  // CRASH_DUMP_H
