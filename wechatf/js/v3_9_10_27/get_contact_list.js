// 获取联系人列表

// hook信息
let hook_info = {
    // 模块名称
    moduleName: "WeChatWin.dll",

    // 偏移地址
    GetContactMgr_offset: 0x1C0BDE0,   // 获取联系人管理器的偏移
    GetContactList_offset: 0x2265540,  // 获取联系人列表的偏移

    // 联系人信息相关的偏移
    ContactBin_offset: 0x200,
    ContactBinLen_offset: 0x208,
    WxID_offset: 0x10,
    Code_offset: 0x30,
    Remark_offset: 0x80,
    Name_offset: 0xA0,
    Gender_offset: 0x0E,
    ContactStep: 0x6A8,

    // 地址特征
    FEAT_COUNTRY: [0xA4, 0xD9, 0x02, 0x4A, 0x18],
    FEAT_PROVINCE: [0xE2, 0xEA, 0xA8, 0xD1, 0x18],
    FEAT_CITY: [0x1D, 0x02, 0x5B, 0xBF, 0x18]
};

function getStringByAddress(addr) {
    let strLength = addr.add(8).readU32();  // 获取字符串长度
    if (strLength === 0) return "";         // 如果长度为 0，返回空字符串
    
    let str = addr.readUtf16String(strLength); // 尝试读取 UTF-16 字符串
    console.log("String Length:", strLength);
    console.log("String:", str);
    return str;
}

// 查找内存中特定字节模式的位置
function findMem(start, end, target) {
    let len = target.length;
    for (let p = start; p.compare(end) < 0; p = p.add(1)) {
        let matched = true;
        for (let i = 0; i < len; i++) {
            if (p.add(i).readU8() !== target[i]) {
                matched = false;
                break;
            }
        }
        if (matched) {
            return p;
        }
    }
    return null;
}

// 通过特征获取联系人信息的字符串
function getContactString(start, end, feat) {
    let pfeat = findMem(start, end, feat);
    if (pfeat === null) return "";
    
    let lfeat = pfeat.add(feat.length).readU32();
    if (lfeat <= 2) return "";

    return pfeat.add(feat.length + 4).readUtf16String(lfeat);
}

// 获取联系人信息
function get_contacts() {
    let ModAddress = Module.findBaseAddress(hook_info.moduleName);
    console.log("mod address", ModAddress);

    let GetContactMgr = new NativeFunction(ModAddress.add(hook_info.GetContactMgr_offset), 'pointer', []);
    let GetContactList = new NativeFunction(ModAddress.add(hook_info.GetContactList_offset), 'int', ['pointer', 'pointer']);
    console.log('func', GetContactMgr);
    let mgr = GetContactMgr();
    console.log("mgr", mgr);
    let addr = Memory.alloc(Process.pointerSize * 3); // 用来存放三个地址

    if (GetContactList(mgr, addr) !== 1) {
        console.error("获取联系人列表失败");
        return [];
    }

    let pstart = addr.readPointer(); // 起始地址
    console.log('Pstart', pstart);
    let pend = addr.add(Process.pointerSize * 2).readPointer(); // 结束地址
    console.log('pend', pend);

    let contacts = [];
    
    while (pstart.compare(pend) < 0) {
        let contact = {};
        let pbin = pstart.add(hook_info.ContactBin_offset).readPointer();
        console.log('pbin', pbin);
        let lenbin = pstart.add(hook_info.ContactBinLen_offset).readU32();
        console.log('lenbin', lenbin);

        // contact.wxid = pstart.add(hook_info.WxID_offset).readUtf16String();
        // contact.code = pstart.add(hook_info.Code_offset).readUtf16String();
        // contact.remark = pstart.add(hook_info.Remark_offset).readUtf16String();
        // contact.name = pstart.add(hook_info.Name_offset).readUtf16String();
        contact.wxid = getStringByAddress(pstart.add(hook_info.WxID_offset));
        contact.code = getStringByAddress(pstart.add(hook_info.Code_offset));
        contact.remark = getStringByAddress(pstart.add(hook_info.Remark_offset));
        contact.name = getStringByAddress(pstart.add(hook_info.Name_offset));
        console.log('contact', contact);

        // 获取国家、省份和城市信息
        contact.country = getContactString(pbin, pbin.add(lenbin), hook_info.FEAT_COUNTRY);
        contact.province = getContactString(pbin, pbin.add(lenbin), hook_info.FEAT_PROVINCE);
        contact.city = getContactString(pbin, pbin.add(lenbin), hook_info.FEAT_CITY);

        // 性别信息
        if (pbin.isNull()) {
            contact.gender = 0;
        } else {
            contact.gender = pbin.add(hook_info.Gender_offset).readU8();
        }
        console.log('contact', JSON.stringify(contact));
        

        contacts.push(contact);

        pstart = pstart.add(hook_info.ContactStep); // 移动到下一个联系人
    }

    return contacts;
}

// 暴露RPC方法供外部调用
rpc.exports.getcontactlist = function () {
    try {
        return get_contacts();
    } catch (error) {
        console.error(error.stack);
        return [];
    }
};
