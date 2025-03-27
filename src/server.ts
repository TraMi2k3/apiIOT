import express, { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { SensorData } from './types';
import { evaluateWaterQuality } from './utils/waterQuality';
import { getPositionFromCoordinates } from './utils/geocode';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

// Biến lưu dữ liệu mới nhất
let latestData: SensorData | null = null;

// API nhận dữ liệu từ ESP32
//@ts-ignore
app.post('/api/data', async (req: Request<{}, any, { do_turbid?: number; tds?: number; x?: number; y?: number }>, res: Response) => {
    const { do_turbid, tds, x, y } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (do_turbid === undefined || tds === undefined || x === undefined || y === undefined) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }

    // Lấy vị trí từ Google Maps API
    const position = await getPositionFromCoordinates(x, y);

    // Đánh giá chất lượng nước
    const status = evaluateWaterQuality(do_turbid, tds);

    // Tạo object dữ liệu chuẩn hóa
    const data: SensorData = {
        NTU: do_turbid,
        TDS: tds,
        x,
        y,
        position,
        status
    };

    // Lưu dữ liệu mới nhất
    latestData = data;

    // Phát dữ liệu qua WebSocket tới tất cả client
    io.emit('sensorData', data);

    // Trả về response qua HTTP
    res.status(200).json({ message: 'Dữ liệu nhận thành công', data });
});

// Xử lý kết nối WebSocket
io.on('connection', (socket: Socket) => {
    console.log('Client đã kết nối:', socket.id);

    // Gửi dữ liệu mới nhất cho client vừa kết nối
    if (latestData) {
        socket.emit('sensorData', latestData);
    }

    socket.on('disconnect', () => {
        console.log('Client đã ngắt kết nối:', socket.id);
    });
});

app.get("/", (request, response) => {
    response.status(200).json({ message: "Hello from IOT API!" });
})
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server chạy trên http://localhost:${PORT}`);
});