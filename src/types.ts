// Dữ liệu gốc từ ESP32
export interface SensorDataRequest {
    do_turbid: number;
    tds: number;
    x: number;
    y: number;
}

// Dữ liệu chuẩn hóa gửi về frontend
export interface SensorData {
    NTU: number;
    TDS: number;
    x: number;
    y: number;
}
