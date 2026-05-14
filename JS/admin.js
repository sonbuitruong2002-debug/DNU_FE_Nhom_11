const ORDERS_API = 'https://6a0601bec83ba8ad9b3d1dd1.mockapi.io/orders';
let statusModalInstance;
let currentOrderSnapshot = '';
let refreshTimerId = null;

function checkAdminAccess() {
    const isAdmin = sessionStorage.getItem('isAdmin');
    if (isAdmin === 'true') {
        return true;
    }

    const code = prompt('Mã quản trị');
    if (code === 'Admin@123') {
        sessionStorage.setItem('isAdmin', 'true');
        return true;
    }

    alert('Bạn không có quyền truy cập');
    window.location.href = 'index.html';
    return false;
}

document.addEventListener('DOMContentLoaded', function () {
    if (!checkAdminAccess()) {
        return;
    }

    const orderTableBody = document.getElementById('order-table-body');
    const refreshOrdersButton = document.getElementById('refresh-orders');
    const statusModalElement = document.getElementById('statusModal');

    if (orderTableBody) {
        loadOrders().then(() => {
            startAutoRefreshOrders();
        });
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

function startAutoRefreshOrders() {
    if (refreshTimerId) {
        clearInterval(refreshTimerId);
    }
    refreshTimerId = setInterval(autoRefreshOrders, 10000);
}

function autoRefreshOrders() {
    fetch(ORDERS_API)
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải danh sách đơn hàng.');
            }
            return response.json();
        })
        .then(orders => {
            const newSnapshot = getOrdersSnapshot(orders);
            if (currentOrderSnapshot && newSnapshot !== currentOrderSnapshot) {
                const previousOrders = JSON.parse(currentOrderSnapshot);
                if (Array.isArray(previousOrders) && orders.length > previousOrders.length) {
                    showNewOrderToast(orders.length - previousOrders.length);
                }
                renderOrders(orders);
            }
            currentOrderSnapshot = newSnapshot;
        })
        .catch(error => {
            console.error(error);
        });
}

function getOrdersSnapshot(orders) {
    if (!Array.isArray(orders)) {
        return '';
    }

    const snapshotArray = orders.slice().sort((a, b) => {
        const idA = String(a.id);
        const idB = String(b.id);
        return idA.localeCompare(idB, undefined, { numeric: true });
    }).map(order => ({
        id: order.id,
        status: order.status,
        customerName: order.customerName || order.name,
        item: order.item || order.food,
        total: order.total
    }));

    return JSON.stringify(snapshotArray);
}

function showNewOrderToast(newCount) {
    const toast = $('#new-order-toast');
    toast.text(`Có ${newCount} đơn hàng mới vừa được đặt!`).stop(true, true).slideDown(200).delay(3000).slideUp(200);
}

function loadOrders() {
    return fetch(ORDERS_API)
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải danh sách đơn hàng.');
            }
            return response.json();
        })
        .then(orders => {
            renderOrders(orders);
            currentOrderSnapshot = getOrdersSnapshot(orders);
            return orders;
        })
        .catch(error => {
            console.error(error);
            const orderTableBody = document.getElementById('order-table-body');
            if (orderTableBody) {
                orderTableBody.innerHTML = '<tr><td colspan="6"><div class="alert alert-danger mb-0">Lỗi tải dữ liệu đơn hàng.</div></td></tr>';
            }
            return [];
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
            if (typeof status === 'string' && status.toLowerCase().includes('ship')) {
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
            currentOrderSnapshot = getOrdersSnapshot(collectCurrentOrders());
        },
        error: function () {
            alert('Cập nhật trạng thái đơn hàng thất bại. Vui lòng thử lại.');
        }
    });
}

function collectCurrentOrders() {
    const rows = [];
    $('#order-table-body tr').each(function () {
        const row = $(this);
        const id = row.attr('id')?.replace('order-row-', '') || '';
        const customerName = row.find('td').eq(1).text().trim();
        const itemName = row.find('td').eq(2).text().trim();
        const totalText = row.find('td').eq(3).text().trim().replace('đ', '').replace(/\./g, '');
        const statusText = row.find('.status-cell .badge').text().trim();
        rows.push({ id, customerName, item: itemName, total: Number(totalText) || 0, status: statusText });
    });
    return rows;
}

function formatMoney(value) {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
        return '0đ';
    }
    return numberValue.toLocaleString('vi-VN') + 'đ';
}
