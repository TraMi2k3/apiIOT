import express, { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { SensorDataRequest, SensorData } from './types';
import dotenv from 'dotenv';

// Load biến môi trường từ file .env
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",  // Chấp nhận tất cả frontend (CÓ THỂ ĐỔI THÀNH FE CỦA BẠN)
        methods: ["GET", "POST"]
    }
});

app.use(cors());  // Cho phép CORS để frontend có thể gọi API
app.use(express.json());  // Middleware để xử lý JSON từ ESP32

let latestData: SensorData | null = null;

// API nhận dữ liệu từ ESP32
//@ts-ignore
app.post('/api/data', (req: Request<{}, {}, SensorDataRequest>, res: Response) => {
    const { do_turbid, tds, x, y } = req.body;

    // Kiểm tra dữ liệu hợp lệ
    if (do_turbid === undefined || tds === undefined || x === undefined || y === undefined) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }

    // Chuyển đổi định dạng dữ liệu
    const data: SensorData = {
        NTU: do_turbid,  // Chuyển `do_turbid` thành `NTU`
        TDS: tds,
        x,
        y
    };

    latestData = data;

    // Gửi dữ liệu cho tất cả client WebSocket
    io.emit('sensorData', data);

    res.status(200).json({ message: 'Dữ liệu nhận thành công', data });
});

// Phục vụ file tĩnh (trang hiển thị dữ liệu)
app.use(express.static('public'));

// Kết nối WebSocket
io.on('connection', (socket: Socket) => {
    console.log('Client đã kết nối:', socket.id);

    // Gửi dữ liệu mới nhất nếu có
    if (latestData) {
        socket.emit('sensorData', latestData);
    }

    socket.on('disconnect', () => {
        console.log('Client đã ngắt kết nối:', socket.id);
    });
});

app.get("/", (request, response) => {
    response.status(200).json({ message: "Hello from IOT API!" });
});

export default app;
