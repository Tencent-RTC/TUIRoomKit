import Dropdown from './Dropdown.vue';
import DropdownItem from './DropdownItem.vue';
import DropdownSeparator from './DropdownSeparator.vue';

const DropdownWithParts = Dropdown as typeof Dropdown & {
  Item: typeof DropdownItem;
  Separator: typeof DropdownSeparator;
};

DropdownWithParts.Item = DropdownItem;
DropdownWithParts.Separator = DropdownSeparator;

export { DropdownWithParts as TUIDropdown, DropdownItem as TUIDropdownItem, DropdownSeparator as TUIDropdownSeparator };
export default DropdownWithParts;
