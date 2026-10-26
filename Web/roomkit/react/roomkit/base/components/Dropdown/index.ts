import Dropdown from './Dropdown';
import DropdownItem from './DropdownItem';
import DropdownSeparator from './DropdownSeparator';

const DropdownWithParts = Dropdown as typeof Dropdown & {
  Item: typeof DropdownItem;
  Separator: typeof DropdownSeparator;
};

DropdownWithParts.Item = DropdownItem;
DropdownWithParts.Separator = DropdownSeparator;

export { DropdownWithParts as TUIDropdown, DropdownItem as TUIDropdownItem, DropdownSeparator as TUIDropdownSeparator };
export default DropdownWithParts;
