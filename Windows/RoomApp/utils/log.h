#ifndef __LOG_H__
#define __LOG_H__

#define WIN32_LEAN_AND_MEAN
//#include <Windows.h>
#include <string>
#include <assert.h>
#define USE_LOG
typedef enum LOGGER_LEVEL
{
    kTrackLevel      = 0,
    kInfoLevel       = 1,
    kWarningLevel = 2,
    kErrorLevel = 3,
    kFatalLevel = 4,

    // 标识函数进入和退出
    kInLevel         = 5,
    kOutLevel        = 6
} ENM_LOGGER_LEVEL;

class Log
{
public:
    Log(const std::string& file_path, const std::string& function_name, int line);
    ~Log();
public:
    static void SetLogPath(const std::string& path) { log_file_path_ = path; };
    static void Write(ENM_LOGGER_LEVEL log_level,
        const std::string& file_path,
        const std::string& function_name,
        int line,
        std::string psz_ormat, ...);
public:
    static FILE* _CreateFile();
    static std::string _GetShortFuncName(const std::string& strFunctionName);
    static std::string _GetDateTimeString();
    static std::string _GetDWORString(long dwVal);
    static std::string _GetLevel(ENM_LOGGER_LEVEL logLevel);
private:
    const std::string      file_path_;
    const std::string      function_name_;
    int                     line_;
    static std::string       log_file_path_;
};

#if defined(USE_LOG)
    #define SET_LOG_PATH(path)       Log::SetLogPath(path)
    #define LTRACE(format, ...)      Log::Write(kTrackLevel,    (__FILE__), (__FUNCTION__), __LINE__, format, ##__VA_ARGS__)
    #define LINFO(format, ...)       Log::Write(kInfoLevel,     (__FILE__), (__FUNCTION__), __LINE__, format, ##__VA_ARGS__)

    #define LWARNING(format, ...)                                                                            \
            do                                                                                                  \
            {                                                                                                   \
                Log::Write(kWarningLevel, (__FILE__), (__FUNCTION__), __LINE__, format, ##__VA_ARGS__);   \
                assert(FALSE);                                                                               \
            } while (false)

    #define LERROR(format, ...)                                                                              \
            do                                                                                                  \
            {                                                                                                   \
                Log::Write(kErrorLevel, (__FILE__), (__FUNCTION__), __LINE__, format, ##__VA_ARGS__);     \
                assert(FALSE);                                                                               \
            } while (false)

    #define LFATAL(format, ...)                                                                              \
            do                                                                                                  \
            {                                                                                                   \
                Log::Write(kFatalLevel, (__FILE__), (__FUNCTION__), __LINE__, format, ##__VA_ARGS__);     \
                assert(FALSE);                                                                               \
            } while (false)

    #define LOGOUT(level, format, ...)                                                                       \
            do                                                                                                  \
            {                                                                                                   \
                Log::Write(level, (__FILE__), (__FUNCTION__), __LINE__, format, ##__VA_ARGS__)           \
                if (kWarningLevel == level || kErrorLevel == level || kFatalLevel == level)                        \
                {                                                                                               \
                    assert(FALSE);                                                                           \
                }                                                                                               \
            } while (false)

    #define LOGGER                      Log __tmp_logger__((__FILE__), (__FUNCTION__), __LINE__)
#else
    #define LTRACE(formatstr, ...)
    #define LINFO(formatstr, ...)
    #define LWARNING(formatstr, ...)
    #define LERROR(formatstr, ...)
    #define LFATAL(formatstr, ...)
    #define LOGOUT(level, formatstr, ...)

    #define LOGGER
#endif

#endif /* __LOG_H__ */
