import express, { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { SensorData } from './types';
import { evaluateWaterQuality } from './utils/waterQuality';
import { getPositionFromCoordinates } from './utils/geocode';
import { saveSensorData, getSensorHistory, getLatestData } from './utils/firebase';
import dotenv from 'dotenv'; // Nhớ cài đặt: npm install dotenv
import cors from 'cors';

// Load biến môi trường từ file .env
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors());

// Biến lưu dữ liệu mới nhất trong bộ nhớ (vẫn giữ để tương thích)
let latestData: SensorData | null = null;

// Khởi động server - tải dữ liệu mới nhất từ Firebase
(async () => {
    try {
        latestData = await getLatestData();
        console.log('Đã tải dữ liệu mới nhất từ Firebase');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu từ Firebase:', error);
    }
})();

// API nhận dữ liệu từ ESP32
//@ts-ignore
app.post('api/data', async (req: Request<{}, any, { do_turbid?: number; tds?: number; x?: number; y?: number }>, res: Response) => {
    const { do_turbid, tds, x, y } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (do_turbid === undefined || tds === undefined || x === undefined || y === undefined) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }

    try {
        // Lấy vị trí từ OpenStreetMap API
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

        // Lưu dữ liệu vào Firebase
        const savedData = await saveSensorData(data);

        // Cập nhật latestData
        latestData = savedData;

        // Phát dữ liệu qua WebSocket tới tất cả client
        io.emit('sensorData', savedData);

        // Trả về response qua HTTP
        res.status(200).json({ message: 'Dữ liệu nhận và lưu thành công', savedData });
    } catch (error) {
        console.error('Lỗi xử lý dữ liệu:', error);
        res.status(500).json({ error: 'Lỗi xử lý dữ liệu' });
    }
});

// API lấy lịch sử dữ liệu
app.get('api/history', async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const history = await getSensorHistory(limit);
        res.status(200).json(history);
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử:', error);
        res.status(500).json({ error: 'Lỗi khi lấy lịch sử dữ liệu' });
    }
});

// API lấy dữ liệu mới nhất
app.get('api/latest', async (req: Request, res: Response) => {
    try {
        // Lấy từ Firebase thay vì bộ nhớ để đảm bảo dữ liệu nhất quán
        const latest = await getLatestData();
        if (latest) {
            res.status(200).json(latest);
        } else {
            res.status(404).json({ error: 'Chưa có dữ liệu nào' });
        }
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu mới nhất:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu mới nhất' });
    }
});

// Xử lý kết nối WebSocket
io.on('connection', async (socket: Socket) => {
    console.log('Client đã kết nối:', socket.id);

    // Gửi dữ liệu mới nhất cho client vừa kết nối
    if (latestData) {
        socket.emit('sensorData', latestData);
    } else {
        // Thử lấy từ Firebase nếu không có trong bộ nhớ
        const latest = await getLatestData();
        if (latest) {
            socket.emit('sensorData', latest);
        }
    }

    // Client yêu cầu lịch sử
    socket.on('getHistory', async (limit = 100) => {
        try {
            const history = await getSensorHistory(limit);
            socket.emit('sensorHistory', history);
        } catch (error) {
            console.error('Lỗi khi gửi lịch sử qua socket:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client đã ngắt kết nối:', socket.id);
    });
});

app.get("/", (request, response) => {
    response.status(200).json({ message: "Hello from IOT API!" });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server chạy trên http://localhost:${PORT}`);
});