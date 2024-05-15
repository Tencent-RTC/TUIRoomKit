#include "log.h"
#include <assert.h>

#include "CommonDef.h"
#ifdef _WIN32
#include <ShlObj.h>
#include <direct.h>
#include <io.h>
#else
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#endif

static FILE* file = NULL;
void onExitClean(){
    if (NULL != file)    {
        ::fclose(file);
        file = NULL;
    }
}

std::string Log::log_file_path_;
std::string Log::app_name_;
Log::Log(const std::string& file_path, const std::string& function_name, int line)
    : file_path_(file_path)
    , function_name_(function_name)
    , line_(line){
    Log::Write(kInLevel, file_path_, function_name_, line_, (""));
}

Log::~Log(){
    Log::Write(kOutLevel, file_path_, function_name_, line_, (""));
}

void Log::Write(ENM_LOGGER_LEVEL logLevel,
    const std::string& file_path,
    const std::string& function_name,
    int line,
    std::string psz_format, ...){
    size_t last_slash = file_path.rfind(('\\'));
    std::string file_name = (last_slash < file_path.size() - 1 ? file_path.substr(last_slash + 1) : file_path);

    std::string pid_tid = ("[");
#ifdef _WIN32
    pid_tid.append(_GetDWORString(::GetCurrentProcessId()));
    pid_tid.append((", "));
    pid_tid.append(_GetDWORString(::GetCurrentThreadId()));
#endif
    pid_tid.append(("]"));

    std::string date_time = _GetDateTimeString();

    if (kOutLevel != logLevel) {
        file_name.append((":"));
        file_name.append(_GetDWORString(static_cast<long>(line)));
    }

    const int log_buffer_length = 14 * 4096;
    char sz_log[log_buffer_length] = { 0 };
    int nCount = ::sprintf(sz_log, ("%-14s %-24s %-8s %-32s %-24s [")
        , pid_tid.c_str()
        , date_time.c_str()
        , _GetLevel(logLevel).c_str()
        , _GetShortFuncName(function_name).c_str()
        , file_name.c_str());

    if (nCount < 0 || static_cast<size_t>(nCount) >= log_buffer_length) {
        assert(false);
        return;
    }

    va_list ap;
    va_start(ap, psz_format);
    nCount += vsnprintf(sz_log + static_cast<int>(nCount), log_buffer_length - static_cast<int>(nCount), psz_format.c_str(), ap);
    va_end(ap);

    if (nCount < 0 || static_cast<size_t>(nCount) >= log_buffer_length) {
        assert(false);
        return;
    }

    nCount += ::sprintf(sz_log + static_cast<size_t>(nCount), ("]\n"));

    if (NULL == file) {
        std::atexit(onExitClean);
        file = _CreateFile();
    }

    if (NULL != file) {
        ::fputs(sz_log, file);
        ::fflush(file);
    }
}
#include <QDebug>
FILE* Log::_CreateFile() {
    std::string file_path;
    if (!log_file_path_.empty()) {
#ifdef _WIN32
        char file_name[MAX_PATH] = { 0 };
        SYSTEMTIME sys_time = { 0 };
        ::GetLocalTime(&sys_time);
        ::sprintf(file_name, "%s_%04u_%02u_%02u_%02u_%02u_%02u.log"
            , app_name_.c_str()
            , sys_time.wYear, sys_time.wMonth, sys_time.wDay
            , sys_time.wHour, sys_time.wMinute, sys_time.wSecond);

        file_path = log_file_path_ + "/" + file_name;
#else
        file_path = log_file_path_ + "/" + app_name_ + ".log";
#endif
    }
    if (access(file_path.c_str(), 0) == 0) {
        rmdir(file_path.c_str());
    }
    FILE* file = ::fopen(file_path.c_str(), "wb+");
    if (file == NULL) {
        qDebug() << "log file null.";
    }
    else {
        qDebug() << "file_path:" << file_path.c_str();
    }
    return file;
}

std::string Log::_GetShortFuncName(const std::string& function_name) {
    if (function_name.size() <= 2) {
        return function_name;
    }

    std::size_t index_first = function_name.rfind(("::"));
    if (std::string::npos == index_first) {
        return function_name;
    } else {
        std::size_t index_second = function_name.rfind(("::"), 0 == index_first ? 0 : index_first - 1);
        return (std::string::npos == index_second ? function_name : function_name.substr(index_second + 2));
    }
}

std::string Log::_GetDateTimeString() {
    char sz_tmp[32] = { 0 };
#ifdef _WIN32
    SYSTEMTIME st_time = { 0 };
    ::GetLocalTime(&st_time);

    ::sprintf_s(sz_tmp, _countof(sz_tmp), ("[%02u-%02u %02u:%02u:%02u.%u]"), st_time.wMonth, st_time.wDay
        , st_time.wHour, st_time.wMinute, st_time.wSecond, st_time.wMilliseconds);
#else
    time_t tt;
    time(&tt);
    tt = tt + 8*3600;//transform the time zone
    tm* t = gmtime(&tt);
    sprintf(sz_tmp,"%02d-%02d-%02d-%02d-%02d",
                t->tm_mon+1,
                t->tm_mday,t->tm_hour,
                t->tm_min,t->tm_sec);
#endif
    return sz_tmp;
}

std::string Log::_GetDWORString(long dw_val) {
    char sz_tmp[16] = { 0 };
    ::sprintf(sz_tmp, ("%ld"), dw_val);

    return sz_tmp;
}

std::string Log::_GetLevel(ENM_LOGGER_LEVEL log_level) {
    if (kInLevel == log_level) {
        return (("[IN]"));
    } else if (kOutLevel == log_level) {
        return (("[OUT]"));
    } else if (kTrackLevel == log_level) {
        return (("[T]"));
    } else if (kInfoLevel == log_level) {
        return (("[I]"));
    } else if (kWarningLevel == log_level) {
        return (("[W]"));
    } else if (kErrorLevel == log_level) {
        return (("[E]"));
    } else if (kFatalLevel == log_level) {
        return (("[F]"));
    } else {
        assert(false);
        return ("");
    }
}
