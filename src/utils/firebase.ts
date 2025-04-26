// Trước tiên, cài đặt thư viện firebase
// npm install firebase
import 'dotenv/config';
// Tạo file src/utils/firebase.ts để cấu hình và khởi tạo Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, get, child, DatabaseReference } from 'firebase/database';
import { SensorData } from '../types';

// Cấu hình Firebase - thay thế bằng cấu hình của bạn từ Firebase Console
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Hàm lưu dữ liệu cảm biến vào Firebase
export async function saveSensorData(data: SensorData): Promise<SensorData & { id: string }> {
  try {
    // Tạo key mới cho dữ liệu (timestamp)
    const sensorRef = ref(database, 'sensor-history');
    const newDataRef = push(sensorRef);
    
    // Hãy dùng cách lưu timestamp với múi giờ Việt Nam
    const now = new Date();
    const vietnamTime = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
    }).format(now);

    // Thêm trường timestamp vào dữ liệu
    const dataWithTimestamp = {
      ...data,
      timestamp: vietnamTime
    };
    
    // Lưu dữ liệu
    await set(newDataRef, dataWithTimestamp);
    console.log('Đã lưu dữ liệu vào Firebase:', newDataRef.key);
    
    // Cập nhật dữ liệu mới nhất
    const latestRef = ref(database, 'latest-data');
    await set(latestRef, dataWithTimestamp);
    
    return {
        id: newDataRef.key || '',
        ...dataWithTimestamp
    };
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu vào Firebase:', error);
    throw error;
  }
}

// Hàm lấy lịch sử dữ liệu cảm biến
export async function getSensorHistory(limit: number = 100): Promise<SensorData[]> {
  try {
    const historyRef = ref(database, 'sensor-history');
    const snapshot = await get(historyRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Chuyển đổi từ object sang array và sắp xếp theo thời gian
      return Object.entries(data)
        .map(([key, value]) => ({ id: key, ...value as any }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    }
    
    return [];
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử từ Firebase:', error);
    return [];
  }
}

// Hàm lấy dữ liệu mới nhất
export async function getLatestData(): Promise<SensorData | null> {
  try {
    const latestRef = ref(database, 'latest-data');
    const snapshot = await get(latestRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as SensorData;
    }
    
    return null;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu mới nhất từ Firebase:', error);
    return null;
  }
}