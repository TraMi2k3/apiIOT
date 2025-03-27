// Dữ liệu gốc từ ESP32
export interface SensorDataRequest {
    do_turbid: number;
    tds: number;
    x: number;
    y: number;
}

// Dữ liệu chuẩn hóa gửi về frontend
export interface SensorData {
    NTU: number;          // Độ đục
    TDS: number;          // Tổng chất rắn hòa tan
    x: number;            // Vĩ độ
    y: number;            // Kinh độ
    position: string;     // Tên tỉnh/thành phố
    status: 'good' | 'fair' | 'bad';  // Trạng thái chất lượng nước
}
