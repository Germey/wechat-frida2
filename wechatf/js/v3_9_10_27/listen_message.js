// hook信息
let hook_info = {
  // 模块名称
  moduleName: "WeChatWin.dll",

  // HOOK地址
  hook_offset: 0x2205510,

  // 寄存器
  register: "eax",

  // 消息偏移
  // offset_wxid: 0x40,
  // offset_msg: 0x68,
  // offset_nickName: null,
  // offset_type: 0x30,
  // msg_type: { 1: "text", 3: "image" },
  MsgIDOffset: 0x30, // 消息ID
  MsgTypeOffset: 0x38, // 消息类型
  MsgContentOffset: 0x88, // 消息内容
  MsgWxIDOffset: 0x240, // 发送者WxID
  MsgRoomIDOffset: 0x48, // 群聊ID
  MsgSelfOffset: 0x3c, // 是否为自己发送的消息
  MsgTsOffset: 0x44, // 消息时间戳
};

// hook接受地址
function hook_recv_message() {
  // 获取基地值
  let baseAddress = Module.findBaseAddress(hook_info.moduleName);

  // hook地址
  let addr = baseAddress.add(hook_info.hook_offset);

  // console.log(addr)
  // 在函数内部进行 hook
  Interceptor.attach(addr, {
    onEnter: function (args) {
      try {
        // let eax= this.context.eax;

        // 动态获取基地址指针
        let base_pointer = this.context[hook_info.register];
        // console.log(base_pointer)

        // 消息类型
        // let msg_type = { 1: "text", 3: "image" }
        // 获取消息类型
        let _msg_type_int = base_pointer.add(hook_info.offset_type).readU32();
        let _msg_type_str = "";

        // // 转换消息类型
        // if (_msg_type_int in hook_info.msg_type) {
        //   _msg_type_str = hook_info.msg_type[_msg_type_int];
        // } else {
        //   _msg_type_str = "" + _msg_type_int;
        // }

        // // 组件返回结构
        // let result = {
        //   wxid: base_pointer
        //     .add(hook_info.offset_wxid)
        //     .readPointer()
        //     .readUtf16String(),
        //   message: base_pointer
        //     .add(hook_info.offset_msg)
        //     .readPointer()
        //     .readUtf16String(),
        //   nick_name: "",
        //   type: _msg_type_str,
        // };

        // // 发送到python
        // send({ api: "recv_message", data: result });
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
        // for(let i=0;i<0x60;i=i+4){
        //     console.log("offset: 0x" + i.toString(16) +": 0x"+ base_pointer.add(i).readU32().toString(16))
        // }
        // console.log("---------------------")
      } catch (error) {
        // 打印堆栈信息
        console.error(error.stack);
      }
    },
  });
}

// 安全调用
function entry() {
  try {
    hook_recv_message();
  } catch (error) {
    console.error("error:", error.stack);
  }
}

entry();
