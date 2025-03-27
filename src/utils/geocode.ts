import axios from 'axios';

// Hàm loại bỏ dấu
function removeAccents(str: string): string {
    return str.normalize('NFD')
             .replace(/[\u0300-\u036f]/g, '')
             .replace(/đ/g, 'd')
             .replace(/Đ/g, 'D');
}

export async function getPositionFromCoordinates(lat: number, lng: number): Promise<string> {
    try {
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );

        const address = response.data.address;
        if (address && address.city) {
            return removeAccents(address.city); // Trả về tên thành phố không dấu
        } else if (address && address.state) {
            return removeAccents(address.state); // Trả về tên tỉnh không dấu
        }
        return removeAccents('Không xác định'); // "Khong xac dinh"
    } catch (error) {
        console.error('Lỗi khi gọi Nominatim API:', error);
        return removeAccents('Không xác định'); // "Khong xac dinh"
    }
}