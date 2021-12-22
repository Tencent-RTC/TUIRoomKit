// Copyright (c) 2021 Tencent. All rights reserved.

#ifndef __V2TIM_DEFINE_H__
#define __V2TIM_DEFINE_H__

/////////////////////////////////////////////////////////////////////////////////
//
//                    （一）整型定义
//
/////////////////////////////////////////////////////////////////////////////////

#ifndef _MSC_VER
// stdint.h is part of C99 but MSVC doesn't have it.
#include <stdint.h>
#endif

// define int types
#if defined(__GNUC__)

#ifndef _STDINT_H

// FreeBSD has these C99 int types defined in /sys/inttypes.h already
#ifndef _SYS_TYPES_H
typedef signed char int8_t;
typedef signed short int16_t;
typedef signed int int32_t;
typedef signed long long int64_t;
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;
typedef unsigned long long uint64_t;
#else
typedef u_int8_t uint8_t;
typedef u_int16_t uint16_t;
typedef u_int32_t uint32_t;
typedef u_int64_t uint64_t;
#endif  // _SYS_TYPES_H

#endif  // _STDINT_H

#elif defined(_MSC_VER)
typedef signed char int8_t;
typedef signed short int16_t;
typedef signed int int32_t;
typedef signed __int64 int64_t;
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;
typedef unsigned __int64 uint64_t;

/* the following definitions are from VS2010's stdint.h */
#ifndef _INTPTR_T_DEFINED
#define _INTPTR_T_DEFINED
#ifdef _WIN64
typedef __int64 intptr_t;
#else  /* _WIN64 */
typedef int intptr_t;
#endif /* _WIN64 */
#endif /* _INTPTR_T_DEFINED */

#ifndef _UINTPTR_T_DEFINED
#define _UINTPTR_T_DEFINED
#ifdef _WIN64
typedef unsigned __int64 uintptr_t;
#else  /* _WIN64 */
typedef unsigned int uintptr_t;
#endif /* _WIN64 */
#endif /* _UINTPTR_T_DEFINED */

#endif  // COMPILER_GCC/COMPILER_MSVC

/////////////////////////////////////////////////////////////////////////////////
//
//                    （二）导出宏定义
//
/////////////////////////////////////////////////////////////////////////////////

#ifdef _WIN32
#if defined(TIM_EXPORT)
#define TIM_API __declspec(dllexport)
#else
#define TIM_API __declspec(dllimport)
#endif
#else
#define TIM_API __attribute__((visibility("default")))
#endif

/////////////////////////////////////////////////////////////////////////////////
//
//                    （三）Vector 宏定义
//
/////////////////////////////////////////////////////////////////////////////////

#define DEFINE_VECTOR(class_name)                                             \
    class TX##class_name##VectorIMPL;                                         \
                                                                              \
    class TIM_API TX##class_name##Vector {                                    \
    public:                                                                   \
        TX##class_name##Vector();                                             \
                                                                              \
        TX##class_name##Vector(const TX##class_name##Vector& vect);           \
                                                                              \
        virtual ~TX##class_name##Vector();                                    \
                                                                              \
        void PushBack(class_name const& obj);                                 \
                                                                              \
        void PopBack();                                                       \
                                                                              \
        class_name& operator[](size_t index);                                 \
                                                                              \
        class_name const& operator[](size_t index) const;                     \
                                                                              \
        TX##class_name##Vector& operator=(const TX##class_name##Vector& vec); \
                                                                              \
        size_t Size() const;                                                  \
                                                                              \
        bool Empty() const;                                                   \
                                                                              \
        void Clear();                                                         \
                                                                              \
        void Erase(size_t index);                                             \
                                                                              \
    private:                                                                  \
        TX##class_name##VectorIMPL* impl_;                                    \
    };

#define DEFINE_POINT_VECTOR(class_name)                                         \
    class TXP##class_name##VectorIMPL;                                          \
                                                                                \
    class TIM_API TXP##class_name##Vector {                                     \
    public:                                                                     \
        TXP##class_name##Vector();                                              \
                                                                                \
        TXP##class_name##Vector(const TXP##class_name##Vector& vect);           \
                                                                                \
        virtual ~TXP##class_name##Vector();                                     \
                                                                                \
        void PushBack(class_name* const& obj);                                  \
                                                                                \
        void PopBack();                                                         \
                                                                                \
        class_name*& operator[](size_t index);                                  \
                                                                                \
        class_name* const& operator[](size_t index) const;                      \
                                                                                \
        TXP##class_name##Vector& operator=(const TXP##class_name##Vector& vec); \
                                                                                \
        size_t Size() const;                                                    \
                                                                                \
        bool Empty() const;                                                     \
                                                                                \
        void Clear();                                                           \
                                                                                \
        void Erase(size_t index);                                               \
                                                                                \
    private:                                                                    \
        TXP##class_name##VectorIMPL* impl_;                                     \
    };

/////////////////////////////////////////////////////////////////////////////////
//
//                    （四）Map 宏定义
//
/////////////////////////////////////////////////////////////////////////////////

#define DEFINE_MAP(class_key, class_value)                                                   \
    class TX##class_key##To##class_value##MapIMPL;                                           \
                                                                                             \
    class TIM_API TX##class_key##To##class_value##Map {                                      \
    public:                                                                                  \
        TX##class_key##To##class_value##Map();                                               \
                                                                                             \
        TX##class_key##To##class_value##Map(const TX##class_key##To##class_value##Map& map); \
                                                                                             \
        virtual ~TX##class_key##To##class_value##Map();                                      \
                                                                                             \
        bool Insert(const class_key& key, const class_value& value);                         \
                                                                                             \
        void Erase(const class_key& key);                                                    \
                                                                                             \
        size_t Count(const class_key& key) const;                                            \
                                                                                             \
        size_t Size() const;                                                                 \
                                                                                             \
        class_value Get(const class_key& key) const;                                         \
                                                                                             \
        class_value& operator[](const class_key& key);                                       \
                                                                                             \
        TX##class_key##To##class_value##Map& operator=(                                      \
            const TX##class_key##To##class_value##Map& map);                                 \
                                                                                             \
        const class_key##Vector AllKeys() const;                                             \
                                                                                             \
    private:                                                                                 \
        TX##class_key##To##class_value##MapIMPL* impl_;                                      \
    };

#endif /* __V2TIM_DEFINE_H__ */
