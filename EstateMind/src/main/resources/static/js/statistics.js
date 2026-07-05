document.addEventListener('DOMContentLoaded', function () {
    const monthlyData = window.CHART_DATA?.monthly || [];
    const statusData = window.CHART_DATA?.status || [];

    new Chart(document.getElementById('revenueChart'), {
        type: 'bar',
        data: {
            labels: [...monthlyData].reverse().map(r => 'T' + r[0] + '/' + r[1]),
            datasets: [{
                label: 'Doanh thu (đ)',
                data: [...monthlyData].reverse().map(r => r[2]),
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => v.toLocaleString('vi-VN') + 'đ' }
                }
            }
        }
    });

    const statusColors = {
        'PENDING': '#ffc107',
        'CONFIRMED': '#0d6efd',
        'CHECKED_IN': '#0dcaf0',
        'CHECKED_OUT': '#198754',
        'CANCELLED': '#dc3545'
    };

    new Chart(document.getElementById('statusChart'), {
        type: 'doughnut',
        data: {
            labels: statusData.map(s => s[0]),
            datasets: [{
                data: statusData.map(s => s[1]),
                backgroundColor: statusData.map(s => statusColors[s[0]] || '#6c757d'),
            }]
        },
        options: {
            responsive: true,
            aspectRatio: 1.2,
            plugins: { legend: { position: 'bottom' } }
        }
    });
});