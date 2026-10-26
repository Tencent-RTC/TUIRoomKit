import Select from './Select.vue';
import Option from './Option.vue';

const SelectWithOption = Select as typeof Select & { Option: typeof Option };
SelectWithOption.Option = Option;

export { SelectWithOption as TUISelect, Option as TUIOption };
export default SelectWithOption;
