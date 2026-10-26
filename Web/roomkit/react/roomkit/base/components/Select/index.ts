import Select from './Select';
import Option from './Option';

const SelectWithOption = Select as typeof Select & { Option: typeof Option };
SelectWithOption.Option = Option;

export { SelectWithOption as TUISelect, Option as TUIOption };
export default SelectWithOption;
