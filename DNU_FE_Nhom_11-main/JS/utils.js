function formatCurrency(amount) {
    const value = Number(amount);
    if (Number.isNaN(value)) {
        return '0đ';
    }

    return value.toLocaleString('vi-VN') + 'đ';
}

function validateOrderForm(formData) {
    const errors = {};
    const name = typeof formData.name === 'string' ? formData.name.trim() : '';
    const phone = typeof formData.phone === 'string' ? formData.phone.trim() : '';
    const address = typeof formData.address === 'string' ? formData.address.trim() : '';

    if (!name) {
        errors.name = 'Tên khách hàng không được để trống.';
    }

    const phoneRegex = /^(0|\+84)(\d{9}|\d{10})$/;
    if (!phone) {
        errors.phone = 'Số điện thoại không được để trống.';
    } else if (!phoneRegex.test(phone)) {
        errors.phone = 'Số điện thoại không hợp lệ.';
    }

    if (!address) {
        errors.address = 'Địa chỉ không được để trống.';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

function showInlineError(inputElement, message) {
    if (!inputElement || !message) {
        return;
    }

    let errorMessage = inputElement.parentElement.querySelector('.inline-error');
    if (!errorMessage) {
        errorMessage = document.createElement('span');
        errorMessage.className = 'inline-error text-danger d-block mt-1';
        inputElement.parentElement.appendChild(errorMessage);
    }
    errorMessage.textContent = message;
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.inline-error');
    errorElements.forEach(element => element.remove());
}
