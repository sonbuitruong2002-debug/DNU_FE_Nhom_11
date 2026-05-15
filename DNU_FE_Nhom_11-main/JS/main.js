document.addEventListener('DOMContentLoaded', function () {
    const restaurantList = document.querySelector('#restaurant-list');
    const orderForm = document.querySelector('#orderForm');

    if (restaurantList) {
        restaurantList.style.display = 'none';
        loadRestaurants(restaurantList);
    }

    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }

    const orderModal = document.getElementById('orderModal');
    if (orderModal) {
        orderModal.addEventListener('hidden.bs.modal', function () {
            resetOrderForm();
        });
    }
});

function loadRestaurants(container) {
    getRestaurants()
        .then(restaurants => {
            if (!Array.isArray(restaurants) || restaurants.length === 0) {
                container.innerHTML = '<div class="col-12"><div class="alert alert-warning">Không có quán ăn để hiển thị.</div></div>';
            } else {
                renderRestaurantCards(container, restaurants);
            }
            $(container).fadeIn(400);
        })
        .catch(error => {
            console.error(error);
            container.innerHTML = '<div class="col-12"><div class="alert alert-danger">Lỗi tải dữ liệu quán ăn.</div></div>';
            $(container).fadeIn(400);
        });
}

function renderRestaurantCards(container, restaurants) {
    const cards = [];

    restaurants.forEach((restaurant, index) => {
        const title = restaurant.Name || 'Quán ăn chưa rõ tên';
        const description = restaurant.description || 'Thực đơn đa dạng, giao nhanh trong khu nội bộ.';
        const imageUrl = restaurant.image || 'https://via.placeholder.com/600x300?text=QuickOrder';
        const priceTag = 'Giá tham khảo';

        let badgeClass = 'bg-secondary';
        let badgeText = 'Quán ăn';
        switch ((restaurant.category || '').toLowerCase()) {
            case 'fastfood':
                badgeClass = 'bg-primary';
                badgeText = 'Fastfood';
                break;
            case 'local':
                badgeClass = 'bg-success';
                badgeText = 'Địa phương';
                break;
            case 'vegetarian':
                badgeClass = 'bg-info text-dark';
                badgeText = 'Chay';
                break;
            default:
                badgeClass = 'bg-secondary';
                badgeText = restaurant.category || 'Quán ăn';
                break;
        }

        let cardBorder = 'border-0';
        if (index % 2 === 0) {
            cardBorder = 'border-primary';
        } else if (index % 3 === 0) {
            cardBorder = 'border-success';
        }

        cards.push(`
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm ${cardBorder}">
                    <img src="${imageUrl}" class="card-img-top" alt="${title}">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title mb-0">${title}</h5>
                            <span class="badge ${badgeClass}">${badgeText}</span>
                        </div>
                        <p class="card-text text-muted">${description}</p>
                        <div class="mt-auto pt-2">
                            <p class="mb-2 text-body-secondary">${priceTag}</p>
                            <button type="button" class="btn btn-primary w-100" onclick="openOrderModal('${restaurant.id}', '${title}')">
                                Đặt ngay
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    });

    container.innerHTML = cards.join('');
}

function handleOrderSubmit(event) {
    event.preventDefault();
    clearErrors();

    const nameInput = document.querySelector('#customerName');
    const phoneInput = document.querySelector('#customerPhone');
    const addressInput = document.querySelector('#customerAddress');

    const formData = {
        name: nameInput ? nameInput.value : '',
        phone: phoneInput ? phoneInput.value : '',
        address: addressInput ? addressInput.value : ''
    };

    const validation = validateOrderForm(formData);
    if (!validation.valid) {
        if (validation.errors.name && nameInput) {
            showInlineError(nameInput, validation.errors.name);
        }
        if (validation.errors.phone && phoneInput) {
            showInlineError(phoneInput, validation.errors.phone);
        }
        if (validation.errors.address && addressInput) {
            showInlineError(addressInput, validation.errors.address);
        }
        return;
    }

    // Lấy các items được chọn
    const selectedItems = [];
    document.querySelectorAll('input[name="menu-item"]:checked').forEach(checkbox => {
        selectedItems.push({
            id: checkbox.value,
            name: checkbox.dataset.name,
            price: parseFloat(checkbox.dataset.price)
        });
    });

    const orderPayload = {
        customerName: formData.name,
        phone: formData.phone,
        address: formData.address,
        restaurantId: document.getElementById('selectedRestaurantId').value,
        item: selectedItems.map(i => i.name).join(', ') || 'Không chọn',
        total: parseFloat(document.getElementById('total-price').textContent.replace('đ', '').replace(/\./g, '')) || 0,
        status: 'Pending'
    };

    createOrder(orderPayload)
        .then(() => {
            alert('Đặt hàng thành công!');
            const modalDialog = $('#orderModal .modal-dialog');
            modalDialog.slideUp(200, function () {
                $('#orderModal').modal('hide');
                modalDialog.show();
            });
            event.target.reset();
        })
        .catch(error => {
            console.error(error);
        });
}

function openOrderModal(restaurantId, restaurantName) {
    document.getElementById('selectedRestaurantId').value = restaurantId;
    document.querySelector('#orderModalLabel').textContent = `Đặt hàng - ${restaurantName}`;
    loadMenuItems(restaurantId);
    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
}

function loadMenuItems(restaurantId) {
    const container = document.getElementById('menu-items-container');
    container.innerHTML = '<p class="text-muted text-center">Đang tải menu...</p>';

    getItemsByRestaurant(restaurantId)
        .then(items => {
            if (!Array.isArray(items) || items.length === 0) {
                container.innerHTML = '<p class="text-muted text-center">Không có món ăn nào.</p>';
            } else {
                renderMenuItems(items);
            }
        })
        .catch(error => {
            console.error(error);
            container.innerHTML = '<p class="text-danger text-center">Lỗi tải menu.</p>';
        });
}

function renderMenuItems(items) {
    const container = document.getElementById('menu-items-container');
    const menuHTML = items.map((item, index) => `
        <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" id="item-${index}" name="menu-item" value="${item.id}" 
                   data-name="${item.name || 'Món ăn'}" data-price="${item.price || 0}" 
                   onchange="calculateTotalPrice()">
            <label class="form-check-label w-100" for="item-${index}">
                <div class="d-flex justify-content-between align-items-center">
                    <span>${item.name || 'Món ăn'}</span>
                    <span class="badge bg-info">${formatCurrency(item.price || 0)}</span>
                </div>
            </label>
        </div>
    `).join('');

    container.innerHTML = menuHTML;
}

function calculateTotalPrice() {
    let total = 0;
    document.querySelectorAll('input[name="menu-item"]:checked').forEach(checkbox => {
        total += parseFloat(checkbox.dataset.price) || 0;
    });
    document.getElementById('total-price').textContent = formatCurrency(total);
}

function resetOrderForm() {
    document.getElementById('orderForm').reset();
    document.querySelectorAll('input[name="menu-item"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('total-price').textContent = '0đ';
    document.getElementById('menu-items-container').innerHTML = '<p class="text-muted text-center">Chọn nhà hàng để xem menu</p>';
}
