export declare function hasThemeJson(themeLocation: string): boolean;
export declare const parseThemeJson: (themeLocation?: string) => UniApp.ThemeJson;
export declare const normalizeThemeConfigOnce: (manifestJsonPlatform?: Record<string, any>) => UniApp.ThemeJson;
export declare function initTheme<T extends object>(manifestJson: Record<string, any>, pagesJson: T): T;
