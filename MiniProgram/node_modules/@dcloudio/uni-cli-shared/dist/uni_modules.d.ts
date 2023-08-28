type Define = string | string[] | Record<string, string> | false;
type Defines = {
    [name: string]: Define;
};
interface Exports {
    [name: string]: Define | Defines | false;
}
export declare function parseUniExtApis(vite?: boolean): Injects;
type Injects = {
    [name: string]: string | string[] | false;
};
/**
 *  uni:'getBatteryInfo'
 * import getBatteryInfo from '..'
 *
 * uni:['getBatteryInfo']
 * import { getBatteryInfo } from '..'
 *
 * uni:['openLocation','chooseLocation']
 * import { openLocation, chooseLocation } from '..'
 *
 * uni:{
 *  onUserCaptureScreen: "onCaptureScreen"
 *  offUserCaptureScreen: "offCaptureScreen"
 * }
 *
 * uni.getBatteryInfo = getBatteryInfo
 * @param source
 * @param globalObject
 * @param define
 * @returns
 */
export declare function parseInjects(vite: boolean | undefined, platform: UniApp.PLATFORM, source: string, exports?: Exports): Injects;
export declare function parseInject(vite: boolean | undefined, source: string, globalObject: string, define: Define): Injects;
export {};
