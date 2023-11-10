package com.tencent.cloud.tuikit.roomkit.model.entity;

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.qcloud.tuicore.TUILogin;

public class UserModel {
    public String             userId;
    public String             userName;
    public String             userAvatar;
    public TUIRoomDefine.Role role;
    public SeatStatus         seatStatus = SeatStatus.OFF_SEAT;
    public String             takeSeatRequestId;

    public UserModel() {
        userId = TUILogin.getUserId();
        userName = TUILogin.getNickName();
        userAvatar = TUILogin.getFaceUrl();
    }

    public enum SeatStatus {
        OFF_SEAT,
        APPLYING_TAKE_SEAT,
        ON_SEAT
    }

    public boolean isOnSeat() {
        return seatStatus == SeatStatus.ON_SEAT;
    }

    public boolean isOffSeat() {
        return seatStatus == SeatStatus.OFF_SEAT;
    }
}
