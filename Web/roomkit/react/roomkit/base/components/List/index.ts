import List from './List';
import ListItem from './ListItem';

const ListWithItem = List as typeof List & { Item: typeof ListItem };
ListWithItem.Item = ListItem;

export { ListWithItem as TUIList, ListItem as TUIListItem };
export default ListWithItem;
