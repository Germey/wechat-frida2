// WeChat消息监听
let hook_info = {
    moduleName: "WeChatWin.dll",
    recvMsgOffset: 0x2205510, // 这个地址根据你的代码定义
};

let msgQueue = [];
let msgSock; // 用于发送消息的socket，这里需要根据你的实现来配置

function getStringByWstrAddr(addr) {
    let strLength = addr.add(8).readU32();
    return strLength ? addr.readUtf16String(strLength) : "";
}

function dispatchMsg(arg1, arg2) {
    console.log('arg', arg1, arg2);
    id = arg2.add(OS_RECV_MSG_ID).readQWord();
    console.log('id', id);
    let wxMsg = {
        id: arg2.add(OS_RECV_MSG_ID).readQWord(),
        type: arg2.add(OS_RECV_MSG_TYPE).readU32(),
        is_self: arg2.add(OS_RECV_MSG_SELF).readU32(),
        ts: arg2.add(OS_RECV_MSG_TS).readU32(),
        content: getStringByWstrAddr(arg2.add(OS_RECV_MSG_CONTENT)),
        sign: getStringByWstrAddr(arg2.add(OS_RECV_MSG_SIGN)),
        roomid: getStringByWstrAddr(arg2.add(OS_RECV_MSG_ROOMID)),
        thumb: getStringByWstrAddr(arg2.add(OS_RECV_MSG_THUMB)),
        extra: getStringByWstrAddr(arg2.add(OS_RECV_MSG_EXTRA)),
    };

    if (wxMsg.roomid.includes("@chatroom")) {
        wxMsg.is_group = true;
        wxMsg.sender = wxMsg.is_self ? getSelfWxid() : wxMsg.roomid;
    } else {
        wxMsg.is_group = false;
        wxMsg.sender = wxMsg.is_self ? getSelfWxid() : wxMsg.roomid;
    }

    msgQueue.push(wxMsg);
    notifyMessage(wxMsg); // 这里可以调用你发送消息的函数
}

function notifyMessage(wxMsg) {
    console.log('send message', JSON.stringify(wxMsg));
    // // 发送到消息队列或socket
    // let rsp = {
    //     msg: {
    //         wxmsg: wxMsg,
    //     },
    // };
    // let buffer = new ArrayBuffer(G_BUF_SIZE);
    // let stream = new ProtobufWriter(buffer); // 使用protobuf库来编码数据
    // if (!stream.encode(Response_fields, rsp)) {
    //     console.error("Encoding failed.");
    //     return;
    // }
    
    // let rv = nng_send(msgSock, buffer, stream.bytes_written, 0);
    // if (rv !== 0) {
    //     console.error("msgSock-nng_send error:", rv);
    // }
}

Interceptor.replace(Module.findBaseAddress(hook_info.moduleName).add(hook_info.recvMsgOffset), new NativeCallback(dispatchMsg, 'uint64', ['uint64', 'uint64']));

rpc.exports.listenmessage = function () {
    console.log("Listening for WeChat messages...");
};
