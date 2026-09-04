document.addEventListener('DOMContentLoaded', function () {
    const moderationData = window.CHART_DATA?.moderation || [];

    const moderationLabels = {
        'PENDING': 'Đang chờ duyệt',
        'APPROVED': 'Đã duyệt',
        'REJECTED': 'Bị từ chối'
    };

    const moderationColors = {
        'PENDING': '#ffc107',
        'APPROVED': '#198754',
        'REJECTED': '#dc3545'
    };

    new Chart(document.getElementById('moderationChart'), {
        type: 'doughnut',
        data: {
            labels: moderationData.map(m => moderationLabels[m[0]] || m[0]),
            datasets: [{
                data: moderationData.map(m => m[1]),
                backgroundColor: moderationData.map(m => moderationColors[m[0]] || '#6c757d'),
            }]
        },
        options: {
            responsive: true,
            aspectRatio: 1.4,
            plugins: { legend: { position: 'bottom' } }
        }
    });
});