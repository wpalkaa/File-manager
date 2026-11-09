export function humanizeFileSize(size) {
    if (size === undefined || size === null || isNaN(Number(size))) return '--';
    const units = [ 'B', 'KB', 'MB', 'GB', 'TB' ];
    let newSize = Number(size);
    let unitIndex = 0;

    while( newSize >= 1024 && unitIndex < units.length-1 ) {
        newSize /= 1024;
        unitIndex++;
    }
    return `${newSize.toFixed(2)} ${units[unitIndex]}`;
}

export function formatDate(date) {
    if(!date) return '--';

    const newDate = new Date(date);
    if (isNaN(newDate.getTime())) return '--';

    const h = newDate.getHours().toString().padStart(2, '0');
    const m = newDate.getMinutes().toString().padStart(2, '0');
    const s = newDate.getSeconds().toString().padStart(2, '0');

    const D = newDate.getDate().toString().padStart(2, '0');
    const M = `${newDate.getMonth() + 1}`.toString().padStart(2, '0');
    const Y = newDate.getFullYear().toString();

    return `${h}:${m}:${s} | ${D}.${M}.${Y}`;
}
