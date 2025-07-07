import qrcode

# 要显示的内容
data = "Successfully Recharged!"

# 生成二维码
qr = qrcode.QRCode(
    version=1,  # 控制二维码大小（1 到 40）
    error_correction=qrcode.constants.ERROR_CORRECT_H,  # 容错率
    box_size=10,  # 每个小格子的像素数
    border=4,  # 边框厚度（格子数）
)
qr.add_data(data)
qr.make(fit=True)

# 渲染成图片
img = qr.make_image(fill_color="black", back_color="white")
img.save("success_qr.png")
