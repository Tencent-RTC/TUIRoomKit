import Swiper from './Swiper';
import SwiperItem from './SwiperItem';

const SwiperWithItem = Swiper as typeof Swiper & { Item: typeof SwiperItem };
SwiperWithItem.Item = SwiperItem;

export { SwiperWithItem as TUISwiper, SwiperItem as TUISwiperItem };
export default SwiperWithItem;
export * from './types';
