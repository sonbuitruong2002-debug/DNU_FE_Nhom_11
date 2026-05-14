const ORDERS_API = 'https://6a0601bec83ba8ad9b3d1dd1.mockapi.io/orders';
let statusModalInstance;

document.addEventListener('DOMContentLoaded', function () {
    const orderTableBody = document.getElementById('order-table-body');
    const refreshOrdersButton = document.getElementById('refresh-orders');
    const statusModalElement = document.getElementById('statusModal');

    if (orderTableBody) {
        loadOrders();
        $('#order-table-body').on('click', '.update-status-btn', function () {
            const orderId = $(this).data('order-id');
            const currentStatus = $(this).data('order-status');
            openStatusModal(orderId, currentStatus);
        });
    }

    if (refreshOrdersButton) {
        refreshOrdersButton.addEventListener('click', loadOrders);
    }

    if (statusModalElement) {
        statusModalInstance = new bootstrap.Modal(statusModalElement);
    }

    $('#save-status-btn').on('click', function () {
        submitStatusUpdate();
    });
});

function loadOrders() {
    fetch(ORDERS_API)
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải danh sách đơn hàng.');
            }
            return response.json();
        })
        .then(orders => {
            renderOrders(orders);
        })
        .catch(error => {
            console.error(error);
            const orderTableBody = document.getElementById('order-table-body');
            if (orderTableBody) {
                orderTableBody.innerHTML = '<tr><td colspan="6"><div class="alert alert-danger mb-0">Lỗi tải dữ liệu đơn hàng.</div></td></tr>';
            }
        });
}

function renderOrders(orders) {
    const orderTableBody = document.getElementById('order-table-body');
    if (!orderTableBody) {
        return;
    }

    if (!Array.isArray(orders) || orders.length === 0) {
        orderTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Chưa có đơn hàng nào.</td></tr>';
        return;
    }

    const rows = [];
    orders.forEach(order => {
        const status = order.status || 'Pending';
        const badge = createStatusBadge(status);
        const totalDisplay = order.total ? formatMoney(order.total) : '0đ';
        const customerName = order.customerName || order.name || 'Khách hàng chưa rõ';
        const itemName = order.item || order.food || 'Món ăn chưa rõ';

        let actionButton = `<button type="button" class="btn btn-sm btn-outline-primary update-status-btn" data-order-id="${order.id}" data-order-status="${status}">Cập nhật</button>`;
        if (status === 'Completed') {
            actionButton = `<button type="button" class="btn btn-sm btn-outline-secondary" disabled>Hoàn thành</button>`;
        }

        rows.push(`
            <tr id="order-row-${order.id}">
                <td>${order.id}</td>
                <td>${customerName}</td>
                <td>${itemName}</td>
                <td>${totalDisplay}</td>
                <td class="status-cell">${badge}</td>
                <td>${actionButton}</td>
            </tr>
        `);
    });

    orderTableBody.innerHTML = rows.join('');
}

function createStatusBadge(status) {
    let badgeClass = 'bg-secondary';
    let statusText = status;

    switch (status) {
        case 'Pending':
            badgeClass = 'bg-warning text-dark';
            break;
        case 'Shipping':
            badgeClass = 'bg-primary';
            break;
        case 'Completed':
            badgeClass = 'bg-success';
            break;
        default:
            if (status.toLowerCase().includes('ship')) {
                badgeClass = 'bg-info text-dark';
            } else {
                badgeClass = 'bg-secondary';
            }
            break;
    }

    if (!statusText) {
        statusText = 'Chưa xác định';
    }

    return `<span class="badge ${badgeClass}">${statusText}</span>`;
}

function openStatusModal(orderId, currentStatus) {
    $('#statusOrderId').val(orderId);
    $('#statusSelect').val(currentStatus || 'Pending');
    if (statusModalInstance) {
        statusModalInstance.show();
    }
}

function submitStatusUpdate() {
    const orderId = $('#statusOrderId').val();
    const newStatus = $('#statusSelect').val();
    if (!orderId || !newStatus) {
        alert('Vui lòng chọn đơn hàng và trạng thái mới.');
        return;
    }

    $.ajax({
        url: `${ORDERS_API}/${encodeURIComponent(orderId)}`,
        method: 'PUT',
        data: JSON.stringify({ status: newStatus }),
        contentType: 'application/json',
        success: function (updatedOrder) {
            const row = $(`#order-row-${orderId}`);
            row.fadeOut(150, function () {
                const badgeHtml = createStatusBadge(updatedOrder.status);
                row.find('.status-cell').html(badgeHtml);

                const newActionButton = updatedOrder.status === 'Completed'
                    ? `<button type="button" class="btn btn-sm btn-outline-secondary" disabled>Hoàn thành</button>`
                    : `<button type="button" class="btn btn-sm btn-outline-primary update-status-btn" data-order-id="${updatedOrder.id}" data-order-status="${updatedOrder.status}">Cập nhật</button>`;

                row.find('td:last-child').html(newActionButton);
                row.fadeIn(150);
            });

            if (statusModalInstance) {
                statusModalInstance.hide();
            }
        },
        error: function () {
            alert('Cập nhật trạng thái đơn hàng thất bại. Vui lòng thử lại.');
        }
    });
}

function formatMoney(value) {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
        return '0đ';
    }
    return numberValue.toLocaleString('vi-VN') + 'đ';
}
