/**
 * This constant defines the module, i.e., it is used for each ts module in the main directory, and also for the main/preload.
 * js module, which is defined here in the node.js module format, and can be used for both of these types of modules.
 *
 * If this is defined as an ES 6 module (using import/export ),
 * the preload.js module cannot be used because the preload.js file is a native node.js module executable,
 * which can be considered for subsequent use if preload.js takes on too many responsibilities and has greater code complexity.
 */
export enum EUserEventNames {
  ON_CHANGE_LOG_LEVEL = 'onChangeLogLevel',
}

export default {
  EUserEventNames,
};
