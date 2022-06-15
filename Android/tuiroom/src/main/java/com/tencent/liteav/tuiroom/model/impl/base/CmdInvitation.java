package com.tencent.liteav.tuiroom.model.impl.base;

import com.tencent.liteav.tuiroom.model.TUIRoomCoreCallback;

import java.util.Set;

public class CmdInvitation {
    public String                                 cmd;
    public String                                 inviteId;
    public boolean                                isGroupInvite;
    public Set<String>                            inviteIdList;
    public boolean                                isNeedAgree;
    public TUIRoomCoreCallback.ActionCallback     actionCallback;
    public TUIRoomCoreCallback.InvitationCallback invitationCallback;
}
