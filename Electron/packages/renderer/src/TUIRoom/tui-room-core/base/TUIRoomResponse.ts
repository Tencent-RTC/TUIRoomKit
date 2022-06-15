class TUIRoomResponse<T> {
  code = 0;

  message: string;

  data: T;

  constructor(code: number, message: string, data: T) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  static success<T>(data?: T) {
    return new TUIRoomResponse(0, '', data || null);
  }

  static fail<T>(code: number, message: string, data?: T) {
    return new TUIRoomResponse(code, message, data || null);
  }
}

export default TUIRoomResponse;
