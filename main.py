import ctypes
# 加载 sdk.dll （需要绝对路径）
sdk = ctypes.cdll.LoadLibrary(
    "D:/Projects/WeChatFerry/WeChatFerry/x64/Debug/sdk.dll")

# 初始化
sdk.WxInitSDK(False, 10086)

# 退出 SDK
# sdk.WxDestroySDK()

# 注意关闭 Python 进程
