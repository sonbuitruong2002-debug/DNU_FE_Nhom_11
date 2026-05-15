const BASE_URL = "https://6a058aafaa826ca75c0a1693.mockapi.io";
const ORDERS_URL = "https://6a0601bec83ba8ad9b3d1dd1.mockapi.io";

function showLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.add('active');
    }
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.remove('active');
    }
}

function getRestaurants() {
    showLoadingSpinner();
    return fetch(`${BASE_URL}/restaurants`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải danh sách quán ăn.');
            }
            return response.json();
        })
        .then(data => {
            hideLoadingSpinner();
            return data;
        })
        .catch(error => {
            hideLoadingSpinner();
            alert(error.message || 'Lỗi khi gọi API getRestaurants.');
            return Promise.reject(error);
        });
}

function getItemsByRestaurant(restaurantId) {
    showLoadingSpinner();
    return fetch(`${BASE_URL}/items?restaurantId=${encodeURIComponent(restaurantId)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải món ăn.');
            }
            return response.json();
        })
        .then(data => {
            hideLoadingSpinner();
            return data;
        })
        .catch(error => {
            hideLoadingSpinner();
            alert(error.message || 'Lỗi khi gọi API getItemsByRestaurant.');
            return Promise.reject(error);
        });
}

function createOrder(orderData) {
    showLoadingSpinner();
    return fetch(`${ORDERS_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tạo đơn hàng mới.');
            }
            return response.json();
        })
        .then(data => {
            hideLoadingSpinner();
            return data;
        })
        .catch(error => {
            hideLoadingSpinner();
            alert(error.message || 'Lỗi khi gọi API createOrder.');
            return Promise.reject(error);
        });
}

function updateOrderStatus(orderId, status) {
    showLoadingSpinner();
    return fetch(`${ORDERS_URL}/orders/${encodeURIComponent(orderId)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể cập nhật trạng thái đơn hàng.');
            }
            return response.json();
        })
        .then(data => {
            hideLoadingSpinner();
            return data;
        })
        .catch(error => {
            hideLoadingSpinner();
            alert(error.message || 'Lỗi khi gọi API updateOrderStatus.');
            return Promise.reject(error);
        });
}

function deleteOrder(orderId) {
    return fetch(`${ORDERS_URL}/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể xóa đơn hàng.');
            }
            return response.text().then(text => text ? JSON.parse(text) : {});
        })
        .catch(error => {
            console.error(error);
            alert(error.message || 'Lỗi khi xóa đơn hàng.');
            return Promise.reject(error);
        });
}
