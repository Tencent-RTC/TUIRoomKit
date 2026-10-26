import List from './List.vue';
import ListItem from './ListItem.vue';

const ListWithItem = List as typeof List & { Item: typeof ListItem };
ListWithItem.Item = ListItem;

export { ListWithItem as TUIList, ListItem as TUIListItem };
export default ListWithItem;
