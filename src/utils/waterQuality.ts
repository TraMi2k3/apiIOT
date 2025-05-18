export function evaluateWaterQuality(ntu: number, tds: number): 'good' | 'fair' | 'bad' {
    let ntuStatus: 'good' | 'fair' | 'bad';
    let tdsStatus: 'good' | 'fair' | 'bad';

    // Đánh giá NTU theo tiêu chuẩn trong ảnh
    if (ntu <= 1) {
        ntuStatus = 'good';
    } else if (ntu <= 150) {
        ntuStatus = 'fair';
    } else {
        ntuStatus = 'bad';
    }

    // Đánh giá TDS theo tiêu chuẩn trong ảnh
    if (tds <= 500) {
        tdsStatus = 'good';
    } else if (tds <= 1000) {
        tdsStatus = 'fair';
    } else {
        tdsStatus = 'bad';
    }

    // Tổng hợp kết quả
    if (ntuStatus === 'bad' || tdsStatus === 'bad') {
        return 'bad';
    } else if (ntuStatus === 'fair' || tdsStatus === 'fair') {
        return 'fair';
    } else {
        return 'good';
    }
}
