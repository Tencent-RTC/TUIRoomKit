//
//  GenerateTestUserSig.swift
//  TRTCKaraokeApp
//
//  Created by abyyxwang on 2021/5/7.
//

import Foundation
import CommonCrypto
import zlib

/**
 * Tencent Cloud SDKAppID. Set it to the SDKAppID of your account.
 * You can view your `SDKAppId` after creating an application in the [IM console](https://console.cloud.tencent.com/avc).
 * SDKAppID uniquely identifies a Tencent Cloud account.
 */
let SDKAPPID: Int = 0_400_704_311

/**
 * Signature validity period, which should not be set too short
 * Time unit: Second
 * Default value: 604800 (7 days)
 */
let EXPIRETIME: Int = 604_800

/**
 * Follow the steps below to obtain the key required for UserSig calculation.
 * Step 1. Log in to the [IM console](https://console.cloud.tencent.com/avc). If you don't have an application yet, create one.
 * Step 2. Click your application and find “Basic Information”.
 * Step 3. Click “Display Key” to view the key used for UserSig calculation. Copy and paste the key to the variable below.
 * Note: This method is for testing only. Before commercial launch,
 * please migrate the UserSig calculation code and key to your backend server to prevent key disclosure and traffic stealing.
 * Documentation: https://cloud.tencent.com/document/product/269/32688#Server
 */
let SECRETKEY = ""

/**
 * XMagic License【Optional】
 *
 * Tencent Effect
 * Documentation://cloud.tencent.com/document/product/616/65878
 */
let XMagicLicenseURL = ""
let XMagicLicenseKey = ""


class GenerateTestUserSig {
    
    class func genTestUserSig(identifier: String) -> String {
        let current = CFAbsoluteTimeGetCurrent() + kCFAbsoluteTimeIntervalSince1970
        let TLSTime: CLong = CLong(floor(current))
        var obj: [String: Any] = [
            "TLS.ver": "2.0",
            "TLS.identifier": identifier,
            "TLS.sdkappid": SDKAPPID,
            "TLS.expire": EXPIRETIME,
            "TLS.time": TLSTime,
        ]
        let keyOrder = [
            "TLS.identifier",
            "TLS.sdkappid",
            "TLS.time",
            "TLS.expire",
        ]
        var stringToSign = ""
        keyOrder.forEach { (key) in
            if let value = obj[key] {
                stringToSign += "\(key):\(value)\n"
            }
        }
        print("string to sign: \(stringToSign)")
        guard let sig = hmac(stringToSign) else {
            return ""
        }
        obj["TLS.sig"] = sig
        print("sig: \(String(describing: sig))")
        guard let jsonData = try? JSONSerialization.data(withJSONObject: obj, options: .sortedKeys) else { return "" }
        
        let bytes = jsonData.withUnsafeBytes { (result) -> UnsafePointer<Bytef>? in
            return result.bindMemory(to: Bytef.self).baseAddress
        }
        let srcLen: uLongf = uLongf(jsonData.count)
        let upperBound: uLong = compressBound(srcLen)
        let capacity: Int = Int(upperBound)
        let dest: UnsafeMutablePointer<Bytef> = UnsafeMutablePointer<Bytef>.allocate(capacity: capacity)
        var destLen = upperBound
        let ret = compress2(dest, &destLen, bytes, srcLen, Z_BEST_SPEED)
        if ret != Z_OK {
            print("[Error] Compress Error \(ret), upper bound: \(upperBound)")
            dest.deallocate()
            return ""
        }
        let count = Int(destLen)
        let result = self.base64URL(data: Data(bytesNoCopy: dest, count: count, deallocator: .free))
        return result
    }
    
    class func hmac(_ plainText: String) -> String? {
        guard let cKey = SECRETKEY.cString(using: String.Encoding.ascii) else {
            return ""
        }
        let cData = plainText.cString(using: String.Encoding.ascii)
        
        let cKeyLen = SECRETKEY.lengthOfBytes(using: .ascii)
        let cDataLen = plainText.lengthOfBytes(using: .ascii)
        
        var cHMAC = [CUnsignedChar].init(repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        let pointer = cHMAC.withUnsafeMutableBufferPointer { (unsafeBufferPointer) in
            return unsafeBufferPointer
        }
        CCHmac(CCHmacAlgorithm(kCCHmacAlgSHA256), cKey, cKeyLen, cData, cDataLen, pointer.baseAddress)
        if let adress = pointer.baseAddress {
            let data = Data(bytes: adress, count: cHMAC.count)
            return data.base64EncodedString(options: [])
        }
        return ""
    }
    
    class func base64URL(data: Data) -> String {
        let result = data.base64EncodedString(options: Data.Base64EncodingOptions(rawValue: 0))
        var final = ""
        result.forEach { (char) in
            switch char {
            case "+":
                final += "*"
            case "/":
                final += "-"
            case "=":
                final += "_"
            default:
                final += "\(char)"
            }
        }
        return final
    }
}
