const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://web-chi-tieu.onrender.com';

const getHeaders = (includeJson = true) => {
    const headers = {};
    if (includeJson) headers['Content-Type'] = 'application/json';

    // Always attach the user's PIN to the request if they are logged in
    const pin = localStorage.getItem('userPin');
    if (pin) {
        headers['X-User-Pin'] = pin;
    }
    return headers;
}

export const login = async (code) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Login failed');
    return data;
};

export const addPin = async (adminCode, newCode) => {
    const res = await fetch(`${API_URL}/auth/add-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminCode, newCode })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to add PIN');
    return data;
};

export const deletePin = async (adminCode, targetCode) => {
    const res = await fetch(`${API_URL}/auth/delete-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminCode, targetCode })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to delete PIN');
    return data;
};

export const getExpenses = async (start, end) => {
    let url = `${API_URL}/expenses`;
    if (start && end) {
        url += `?start=${start}&end=${end}`;
    }
    const res = await fetch(url, { headers: getHeaders(false) });
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
};

export const createExpense = async (date, amount, note) => {
    const res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ date, amount, note })
    });
    if (!res.ok) throw new Error('Failed to create expense');
    return res.json();
};

export const deleteExpense = async (id) => {
    const res = await fetch(`${API_URL}/expenses/${id}`, {
        method: 'DELETE',
        headers: getHeaders(false)
    });
    if (!res.ok) throw new Error('Failed to delete expense');
    return res.json();
};

export const updateExpense = async (id, data) => {
    const res = await fetch(`${API_URL}/expenses/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update expense');
    return res.json();
};
