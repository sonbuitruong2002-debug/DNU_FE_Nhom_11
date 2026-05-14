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
        const title = restaurant.name || 'Quán ăn chưa rõ tên';
        const description = restaurant.description || 'Thực đơn đa dạng, giao nhanh trong khu nội bộ.';
        const imageUrl = restaurant.avatar || 'https://via.placeholder.com/600x300?text=QuickOrder';
        const priceTag = restaurant.averagePrice ? formatCurrency(restaurant.averagePrice) : 'Giá tham khảo';

        let badgeClass = 'bg-secondary';
        let badgeText = 'Quán ăn';
        switch ((restaurant.type || '').toLowerCase()) {
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
                badgeText = 'Quán ăn';
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
                            <button type="button" class="btn btn-primary w-100" data-bs-toggle="modal" data-bs-target="#orderModal">
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

    const orderPayload = {
        customerName: formData.name,
        phone: formData.phone,
        address: formData.address,
        status: 'Mới'
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
