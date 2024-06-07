import { stringify } from './queryString';

interface ILocation {
  path?: string;
  query?: Record<string, any>;
  isTab?: boolean;
  reLaunch?: boolean;
}

function parseUrl(location: ILocation) {
  if (typeof location === 'string') return location;
  const { path, query } = location;
  const queryStr = stringify(query);
  if (!queryStr) return path;
  return `${path}?${queryStr}`;
}

function parseRoute($mp: any) {
  const _$mp = $mp || {};
  const path = _$mp.route;
  return {
    page: `/${path}`,
    params: {},
    query: _$mp.query,
    hash: '',
    fullPath: parseUrl({
      path: `/${path}`,
      query: _$mp.query,
    }),
    name: path && path.replace(/\/(\w)/g, ($0: any, $1: string) => $1.toUpperCase()),
  };
}
declare const uni: any;
declare const getCurrentPages: any;
uni.onAppRoute
  && uni.onAppRoute(() => {
    const page = getCurrentPages();
    const thisPage = page[page.length - 1];
    route.setRoute(parseRoute(thisPage));
  });

class Route {
  route: any = {};
  setRoute(route: any) {
    this.route = route;
  }
  static useRoute() {
    return route.route;
  }
}
export const route = new Route();

class Router {
  push(location: ILocation, complete?: any, fail?: any, success?: any) {
    const url = parseUrl(location);

    const params = {
      url,
      complete,
      fail,
      success,
    } as any;

    if (location?.isTab) {
      uni.switchTab(params);
    }

    if (location?.reLaunch) {
      uni.reLaunch(params);
    }

    uni.navigateTo(params);
  }

  replace(location: ILocation, complete?: any, fail?: any, success?: any) {
    const url = parseUrl(location);
    const params = {
      url,
      complete,
      fail,
      success,
    } as any;
    route.setRoute(parseRoute(location));
		uni.setStorageSync('routeInfo', parseRoute(location));
    uni.redirectTo(params);
  }

  go(delta: any) {
    uni.navigateBack(delta);
  }

  back() {
    uni.navigateBack();
  }
}
export default Router;

export const { useRoute } = Route;
