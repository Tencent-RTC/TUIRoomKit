class TUIRoomError extends Error {
  code: number;

  message: string;

  data?: any;

  constructor(code: number, message: string, data?: any) {
    super(message);
    this.code = code;
    this.message = message;
    this.data = data;
  }

  static error(code: number, message: string, data?: any) {
    if (data) {
      return new TUIRoomError(code, message, data);
    }
    return new TUIRoomError(code, message);
  }
}

export default TUIRoomError;
