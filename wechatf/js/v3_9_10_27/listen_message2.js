// Hook信息
let hook_info = {
  // 模块名称
  moduleName: "WeChatWin.dll",

  // 消息相关的基地址和偏移量
  RecvMsgCallOffset: 0x2205510, // 消息接收函数地址
  MsgIDOffset: 0x30, // 消息ID
  MsgTypeOffset: 0x38, // 消息类型
  MsgContentOffset: 0x88, // 消息内容
  MsgWxIDOffset: 0x240, // 发送者WxID
  MsgRoomIDOffset: 0x48, // 群聊ID
  MsgSelfOffset: 0x3c, // 是否为自己发送的消息
  MsgTsOffset: 0x44, // 消息时间戳
};

function dispatch_message(arg1, arg2) {
  try {
    // 基础模块地址
    let baseAddr = Module.findBaseAddress(hook_info.moduleName);

    // 获取消息内容
    let msgID = arg2.add(hook_info.MsgIDOffset).readPointer().toString();
    let msgType = arg2.add(hook_info.MsgTypeOffset).readU32();
    let msgContent = arg2.add(hook_info.MsgContentOffset).readUtf16String();
    let senderWxID = arg2.add(hook_info.MsgWxIDOffset).readUtf16String();
    let roomID = arg2.add(hook_info.MsgRoomIDOffset).readUtf16String();
    let isSelf = arg2.add(hook_info.MsgSelfOffset).readU32();
    let timestamp = arg2.add(hook_info.MsgTsOffset).readU32();

    let isGroup = roomID.indexOf("@chatroom") !== -1;
    let sender = isSelf ? "自己" : isGroup ? senderWxID : roomID;

    // 打印消息日志
    console.log(`消息ID: ${msgID}`);
    console.log(`消息类型: ${msgType}`);
    console.log(`消息内容: ${msgContent}`);
    console.log(`发送者: ${sender}`);
    console.log(`是否群聊: ${isGroup}`);
    console.log(`时间戳: ${timestamp}`);
  } catch (error) {
    console.error(`Error processing message: ${error}`);
  }
}

// Hook 消息接收函数
function listen_message() {
  let baseAddr = Module.findBaseAddress(hook_info.moduleName);
  let recvMsgCallAddr = baseAddr.add(hook_info.RecvMsgCallOffset);
  console.log("消息接收函数地址", recvMsgCallAddr);

  Interceptor.attach(recvMsgCallAddr, {
    onEnter: function (args) {
      console.log("消息接收函数参数1", args[0], args[1]);
      dispatch_message(args[0], args[1]);
    },
    onLeave: function (retval) {
      // 可以处理返回值
    },
  });
}

// 导出供RPC调用
rpc.exports = {
  listenmessage: function () {
    listen_message();
    return "微信消息监听已启动";
  },
};
