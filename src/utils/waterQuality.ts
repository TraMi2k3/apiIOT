export function evaluateWaterQuality(ntu: number, tds: number): 'good' | 'fair' | 'bad' {
    let ntuStatus: 'good' | 'fair' | 'bad';
    let tdsStatus: 'good' | 'fair' | 'bad';

    // Đánh giá NTU
    if (ntu <= 1) {
        ntuStatus = 'good';
    } else if (ntu <= 5) {
        ntuStatus = 'fair';
    } else {
        ntuStatus = 'bad';
    }

    // Đánh giá TDS
    if (tds >= 50 && tds <= 300) {
        tdsStatus = 'good';
    } else if (tds <= 600) {
        tdsStatus = 'fair';
    } else {
        tdsStatus = 'bad';
    }

    // Tiêu chí tổng hợp
    if (ntuStatus === 'bad' || tdsStatus === 'bad') {
        return 'bad';
    } else if (ntuStatus === 'fair' || tdsStatus === 'fair') {
        return 'fair';
    } else {
        return 'good';
    }
}