/* ===== Easy Workflow Admin Dashboard — JavaScript ===== */
/* 
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  FIREBASE SETUP INSTRUCTIONS                                     │
 * │                                                                   │
 * │  1. Go to https://console.firebase.google.com                     │
 * │  2. Create a new project (or use existing one)                   │
 * │  3. Enable Firestore Database (start in Production mode)          │
 * │  4. Enable Authentication → Email/Password                       │
 * │  5. Create an admin user in Auth → Users → Add User              │
 * │  6. Copy your Firebase config below                               │
 * │  7. Set Firestore Security Rules (see bottom of this file)       │
 * └──────────────────────────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════
// 🔑 FIREBASE CONFIGURATION — REPLACE WITH YOUR OWN
// ═══════════════════════════════════════════════════════════════════
const firebaseConfig = {
    apiKey: "AIzaSyDE0F8ZF1yGWuju-tBUmzCAvN8_LinhW9Y",
    authDomain: "easy-workflow-pro.firebaseapp.com",
    projectId: "easy-workflow-pro",
    storageBucket: "easy-workflow-pro.firebasestorage.app",
    messagingSenderId: "326042721605",
    appId: "1:326042721605:web:759d3d272f263299dd722c",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ═══════════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════════
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');
const loginBtnText = document.getElementById('login-btn-text');
const loginBtnLoader = document.getElementById('login-btn-loader');
const logoutBtn = document.getElementById('logout-btn');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebar-close');
const hamburgerAdmin = document.getElementById('hamburger-admin');
const pageTitle = document.getElementById('page-title');

// All data stores
const USD_TO_INR = 92; // Fixed exchange rate for dashboard reporting
let allLeads = [];
let allPayments = [];
let allCoupons = [];
let unsubLeads = null;
let unsubPayments = null;
let unsubCoupons = null;
let unsubLicenses = null;
let analyticsChartInstance = null;
let allLicenses = [];

// ═══════════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ═══════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════
auth.onAuthStateChanged(user => {
    if (user) {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'flex';
        document.getElementById('admin-name').textContent = user.displayName || 'Admin';
        document.getElementById('admin-email').textContent = user.email;
        initDashboard();
    } else {
        loginScreen.style.display = 'flex';
        dashboard.style.display = 'none';
        // Cleanup listeners
        if (unsubLeads) unsubLeads();
        if (unsubPayments) unsubPayments();
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    loginBtn.disabled = true;
    loginBtnText.style.display = 'none';
    loginBtnLoader.style.display = 'inline-block';
    loginError.style.display = 'none';

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
        let msg = 'Invalid email or password.';
        if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
        if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
        if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
        loginError.textContent = msg;
        loginError.style.display = 'block';
    } finally {
        loginBtn.disabled = false;
        loginBtnText.style.display = 'inline';
        loginBtnLoader.style.display = 'none';
    }
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR NAVIGATION
// ═══════════════════════════════════════════════════════════════════
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = item.dataset.page;

        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        pages.forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${targetPage}`).classList.add('active');

        const titleMap = {
            overview: 'Overview',
            leads: 'Leads & Customers',
            pricing: 'Pricing',
            payments: 'Payments',
            coupons: 'Promo Codes',
            licenses: 'License Management',
            settings: 'Site Settings'
        };
        pageTitle.textContent = titleMap[targetPage] || targetPage;

        // Close mobile sidebar
        sidebar.classList.remove('open');
    });
});

// Mobile sidebar toggle
hamburgerAdmin.addEventListener('click', () => sidebar.classList.add('open'));
sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD INITIALIZATION — Real-time Firestore Listeners
// ═══════════════════════════════════════════════════════════════════
function initDashboard() {
    startConfigListeners();
    listenToLeads();
    listenToPayments();
    listenToCoupons();
    listenToLicenses();
}

// ═══════════════════════════════════════════════════════════════════
// CONFIG MANAGEMENT — Real-time Listeners
// ═══════════════════════════════════════════════════════════════════
let pricingUnsub = null;
let settingsUnsub = null;

function startConfigListeners() {
    // 1. Pricing Listener
    if (pricingUnsub) pricingUnsub();
    pricingUnsub = db.collection('config').doc('pricing').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('price-basic-inr').value = data.basic_inr || 100;
            document.getElementById('price-basic-usd').value = data.basic_usd || 2;
            document.getElementById('price-pro-inr').value = data.pro_inr || 1500;
            document.getElementById('price-pro-usd').value = data.pro_usd || 18;
            document.getElementById('price-autocaptions-inr').value = data.autocaptions_inr || 800;
            document.getElementById('price-autocaptions-usd').value = data.autocaptions_usd || 10;
        }
    }, err => console.error('Pricing sync error:', err));

    // 2. Settings Listener
    if (settingsUnsub) settingsUnsub();
    settingsUnsub = db.collection('config').doc('settings').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.deadlineDate) {
                let d = new Date(data.deadlineDate);
                let formatted = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
                document.getElementById('site-deadline-date').value = formatted;
            }
            if (data.bannerText !== undefined) {
                document.getElementById('site-banner-text').value = data.bannerText;
            }
        }
    }, err => console.error('Settings sync error:', err));
}

document.getElementById('save-pricing-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-pricing-btn');
    const statusEl = document.getElementById('pricing-save-status');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const pricing = {
        basic_inr: parseInt(document.getElementById('price-basic-inr').value) || 100,
        basic_usd: parseInt(document.getElementById('price-basic-usd').value) || 2,
        pro_inr: parseInt(document.getElementById('price-pro-inr').value) || 1500,
        pro_usd: parseInt(document.getElementById('price-pro-usd').value) || 18,
        autocaptions_inr: parseInt(document.getElementById('price-autocaptions-inr').value) || 800,
        autocaptions_usd: parseInt(document.getElementById('price-autocaptions-usd').value) || 10,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('config').doc('pricing').set(pricing, { merge: true });
        showToast('Prices saved successfully! Website will update in real-time.', 'success');
        statusEl.textContent = '✓ Saved just now';
        setTimeout(() => { statusEl.textContent = ''; }, 5000);
    } catch (err) {
        console.error('Failed to save pricing:', err);
        showToast('Failed to save prices: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save All Prices';
    }
});

// ═══════════════════════════════════════════════════════════════════
// LEADS — Real-time Listener
// ═══════════════════════════════════════════════════════════════════
function listenToLeads() {
    unsubLeads = db.collection('leads')
        .orderBy('timestamp', 'desc')
        .onSnapshot(snapshot => {
            allLeads = [];
            snapshot.forEach(doc => {
                allLeads.push({ id: doc.id, ...doc.data() });
            });
            renderLeads();
            updateOverviewStats();
            updateRecentActivity();
        }, err => {
            console.error('Leads listener error:', err);
        });
}

function renderLeads(filterStatus = 'all', filterTier = 'all', search = '') {
    const tbody = document.getElementById('leads-tbody');
    const emptyState = document.getElementById('leads-empty');
    const searchLower = search.toLowerCase();

    let filtered = allLeads.filter(lead => {
        if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
        if (filterTier !== 'all') {
            const tierLower = (lead.tier || '').toLowerCase();
            if (!tierLower.includes(filterTier)) return false;
        }
        if (search) {
            const haystack = `${lead.name || ''} ${lead.email || ''} ${lead.phone || ''}`.toLowerCase();
            if (!haystack.includes(searchLower)) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }
    emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(lead => {
        const statusClass = lead.status || 'interested';
        const statusLabel = statusClass.charAt(0).toUpperCase() + statusClass.slice(1);
        const date = lead.timestamp ? formatDate(lead.timestamp) : '—';
        const phone = lead.phone || '—';
        const gateway = lead.gateway || '—';
        const tier = lead.tier || '—';

        return `
            <tr>
                <td>
                    <div class="customer-cell">
                        <span class="customer-name">${escapeHtml(lead.name || 'Unknown')}</span>
                        <span class="customer-email">${escapeHtml(lead.email || '—')}</span>
                    </div>
                </td>
                <td>${escapeHtml(phone)}</td>
                <td>${escapeHtml(tier)}</td>
                <td><span class="status-badge status-${statusClass}">${statusLabel}</span></td>
                <td><span class="gateway-badge">${escapeHtml(gateway)}</span></td>
                <td>${date}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn" title="View Details" onclick="viewLead('${lead.id}')">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="table-btn whatsapp" title="WhatsApp" onclick="openWhatsApp('${escapeAttr(phone)}', '${escapeAttr(lead.name || '')}', '${escapeAttr(lead.status || '')}', '${escapeAttr(tier)}')">
                            <i class="fa-brands fa-whatsapp"></i>
                        </button>
                        <button class="table-btn delete" title="Delete" onclick="deleteLead('${lead.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Update count badge
    document.getElementById('leads-count-badge').textContent = allLeads.length;
}

// Lead Filters / Search
document.getElementById('leads-search').addEventListener('input', applyLeadFilters);
document.getElementById('leads-filter').addEventListener('change', applyLeadFilters);
document.getElementById('leads-tier-filter').addEventListener('change', applyLeadFilters);

function applyLeadFilters() {
    const search = document.getElementById('leads-search').value;
    const status = document.getElementById('leads-filter').value;
    const tier = document.getElementById('leads-tier-filter').value;
    renderLeads(status, tier, search);
}

// View Lead Details
window.viewLead = function (leadId) {
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) return;

    const modal = document.getElementById('lead-modal');
    const body = document.getElementById('lead-modal-body');
    const footer = document.getElementById('lead-modal-footer');
    const statusClass = lead.status || 'interested';

    body.innerHTML = `
        <div class="modal-detail-row">
            <span class="modal-detail-label">Name</span>
            <span class="modal-detail-value">${escapeHtml(lead.name || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Email</span>
            <span class="modal-detail-value">${escapeHtml(lead.email || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Phone</span>
            <span class="modal-detail-value">${escapeHtml(lead.phone || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Product</span>
            <span class="modal-detail-value">${escapeHtml(lead.tier || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Status</span>
            <span class="modal-detail-value"><span class="status-badge status-${statusClass}">${statusClass.charAt(0).toUpperCase() + statusClass.slice(1)}</span></span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Gateway</span>
            <span class="modal-detail-value">${escapeHtml(lead.gateway || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Payment ID</span>
            <span class="modal-detail-value" style="font-family:monospace;font-size:12px;">${escapeHtml(lead.paymentId || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Amount</span>
            <span class="modal-detail-value" style="color:var(--accent-green);font-weight:600;">${escapeHtml(lead.amount || '—')}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Date</span>
            <span class="modal-detail-value">${lead.timestamp ? formatDate(lead.timestamp, true) : '—'}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Session Nonce</span>
            <span class="modal-detail-value" style="font-family:monospace;font-size:10px;max-width:180px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(lead.nonce || '—')}</span>
        </div>
    `;

    // Action buttons based on status
    let actions = `
        <button class="modal-action-btn whatsapp-btn" onclick="openWhatsApp('${escapeAttr(lead.phone || '')}', '${escapeAttr(lead.name || '')}', '${escapeAttr(lead.status || '')}', '${escapeAttr(lead.tier || '')}')">
            <i class="fa-brands fa-whatsapp"></i> WhatsApp
        </button>
        <button class="modal-action-btn primary" onclick="openLicenseComposer('${lead.id}')">
            <i class="fa-solid fa-paper-plane"></i> Send License
        </button>
        <button class="modal-action-btn success" onclick="copyLeadEmail('${escapeAttr(lead.email || '')}')">
            <i class="fa-solid fa-envelope"></i> Copy Email
        </button>
    `;

    if (lead.status === 'interested') {
        actions += `
            <button class="modal-action-btn success" onclick="updateLeadStatus('${lead.id}', 'paid')">
                <i class="fa-solid fa-check"></i> Mark as Paid
            </button>
        `;
    }
    if (lead.status === 'paid') {
        actions += `
            <button class="modal-action-btn success" onclick="updateLeadStatus('${lead.id}', 'verified')">
                <i class="fa-solid fa-shield-check"></i> Mark Verified
            </button>
        `;
    }
    actions += `
        <button class="modal-action-btn danger" onclick="deleteLead('${lead.id}'); closeLeadModal();">
            <i class="fa-solid fa-trash-can"></i> Delete
        </button>
    `;

    footer.innerHTML = actions;
    modal.style.display = 'flex';
    // Reset composer state
    closeLicenseComposer();
};

// License Email Composer Logic
let currentEditingLeadId = null;

window.openLicenseComposer = function (leadId) {
    currentEditingLeadId = leadId;
    const composer = document.getElementById('license-composer');
    const lead = allLeads.find(l => l.id === leadId);

    // Auto-fill some defaults if possible
    document.getElementById('manual-license-link').value = '';
    document.getElementById('manual-license-message').value = `Hey ${lead.name || 'Creator'}, thank you for your purchase! Here is your access link to download the files.`;

    composer.style.display = 'block';
    composer.scrollIntoView({ behavior: 'smooth' });
};

window.closeLicenseComposer = function () {
    const composer = document.getElementById('license-composer');
    if (composer) composer.style.display = 'none';
};

document.getElementById('cancel-license-btn').addEventListener('click', closeLicenseComposer);

document.getElementById('send-license-btn').addEventListener('click', async () => {
    const leadId = currentEditingLeadId;
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) return;

    const licenseLink = document.getElementById('manual-license-link').value.trim();
    const message = document.getElementById('manual-license-message').value.trim();
    const sendBtn = document.getElementById('send-license-btn');

    if (!licenseLink) {
        showToast('Please provide a Gumroad diskcount link.', 'error');
        return;
    }

    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

    try {
        const BACKEND_URL = '/api/send-license';

        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: lead.email,
                name: lead.name,
                tier: lead.tier,
                licenseLink: licenseLink,
                message: message
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('License email sent successfully!', 'success');
            // If it was paid, automatically mark as verified
            if (lead.status === 'paid') {
                await updateLeadStatus(leadId, 'verified');
            }
            closeLicenseComposer();
        } else {
            throw new Error(data.error || 'Failed to send email.');
        }
    } catch (err) {
        console.error('Send License Error:', err);
        showToast('Error: ' + err.message, 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send License Now';
    }
});

// Close modal
document.getElementById('lead-modal-close').addEventListener('click', closeLeadModal);
document.getElementById('lead-modal').addEventListener('click', (e) => {
    if (e.target.id === 'lead-modal') closeLeadModal();
});

function closeLeadModal() {
    document.getElementById('lead-modal').style.display = 'none';
}

// Update lead status
window.updateLeadStatus = async function (leadId, newStatus) {
    try {
        const leadRef = db.collection('leads').doc(leadId);
        const leadDoc = await leadRef.get();
        const leadData = leadDoc.data();

        // 1. Update the lead status
        await leadRef.update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2. If marking as paid/verified, ensure it shows up in the Payments section
        if (newStatus === 'paid' || newStatus === 'verified') {
            // Check if payment already exists to avoid duplicates
            const paymentSnap = await db.collection('payments').where('email', '==', leadData.email).limit(1).get();
            
            if (paymentSnap.empty) {
                await db.collection('payments').add({
                    paymentId: leadData.paymentId || 'MANUAL-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                    name: leadData.name || 'Unknown',
                    email: leadData.email || '—',
                    amount: leadData.amount || '₹0',
                    tier: leadData.tier || '—',
                    gateway: leadData.gateway || 'Manual',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    verified: newStatus === 'verified'
                });
                showToast(`Status updated & payment record created!`, 'success');
            } else {
                showToast(`Status updated to "${newStatus}"`, 'success');
            }
        } else {
            showToast(`Status updated to "${newStatus}"`, 'success');
        }

        closeLeadModal();
    } catch (err) {
        console.error('Update Status Error:', err);
        showToast('Failed to update: ' + err.message, 'error');
    }
};

// Delete lead
window.deleteLead = async function (leadId) {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
        await db.collection('leads').doc(leadId).delete();
        showToast('Lead deleted.', 'success');
    } catch (err) {
        showToast('Failed to delete: ' + err.message, 'error');
    }
};

// WhatsApp (Enhanced for Abandoned Carts)
window.openWhatsApp = function (phone, name, status, product) {
    if (!phone || phone === '—') {
        showToast('No phone number available.', 'error');
        return;
    }
    let cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);

    let msg = `Hi ${name || ''}, thank you for your interest in Easy Workflow! `;
    if (status === 'interested') {
        msg = `Hi ${name || ''}, noticed you were trying to grab the ${product || 'Easy Workflow Pro'} but couldn't complete the payment. Did you face any issues with the gateway? Let me know if I can help!`;
    }

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
};

// Copy email
window.copyLeadEmail = function (email) {
    if (!email || email === '—') return;
    navigator.clipboard.writeText(email).then(() => showToast('Email copied!', 'success'));
};

// Export CSV
document.getElementById('export-leads-btn').addEventListener('click', () => {
    if (allLeads.length === 0) {
        showToast('No leads to export.', 'error');
        return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Product', 'Status', 'Gateway', 'Payment ID', 'Amount', 'Date'];
    const rows = allLeads.map(l => [
        l.name || '',
        l.email || '',
        l.phone || '',
        l.tier || '',
        l.status || '',
        l.gateway || '',
        l.paymentId || '',
        l.amount || '',
        l.timestamp ? formatDate(l.timestamp, true) : ''
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `easy-workflow-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!', 'success');
});

// ═══════════════════════════════════════════════════════════════════
// UTILS — Currency & Parsing
// ═══════════════════════════════════════════════════════════════════
function parseAmountToInr(amountStr) {
    if (!amountStr) return 0;
    const isUsd = amountStr.includes('$');
    const numMatch = amountStr.match(/[\d,.]+/);
    if (!numMatch) return 0;

    let value = parseFloat(numMatch[0].replace(/,/g, ''));
    if (isUsd) {
        value = value * USD_TO_INR;
    }
    return value;
}

// ═══════════════════════════════════════════════════════════════════
// PAYMENTS — Real-time Listener 
// ═══════════════════════════════════════════════════════════════════
function listenToPayments() {
    unsubPayments = db.collection('payments')
        .orderBy('timestamp', 'desc')
        .onSnapshot(snapshot => {
            allPayments = [];
            snapshot.forEach(doc => {
                allPayments.push({ id: doc.id, ...doc.data() });
            });
            renderPayments();
        }, err => {
            console.error('Payments listener error:', err);
        });
}

function renderPayments(search = '') {
    const tbody = document.getElementById('payments-tbody');
    const emptyState = document.getElementById('payments-empty');
    const searchLower = search.toLowerCase();

    let filtered = allPayments;
    if (search) {
        filtered = allPayments.filter(p => {
            const haystack = `${p.paymentId || ''} ${p.name || ''} ${p.email || ''}`.toLowerCase();
            return haystack.includes(searchLower);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }
    emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(p => {
        const date = p.timestamp ? formatDate(p.timestamp) : '—';
        const verified = p.verified ? 'verified' : 'paid';

        return `
            <tr>
                <td style="font-family:monospace;font-size:12px;color:var(--accent-cyan);">${escapeHtml(p.paymentId || '—')}</td>
                <td>
                    <div class="customer-cell">
                        <span class="customer-name">${escapeHtml(p.name || 'Unknown')}</span>
                        <span class="customer-email">${escapeHtml(p.email || '—')}</span>
                    </div>
                </td>
                <td>${escapeHtml(p.tier || '—')}</td>
                <td style="color:var(--accent-green);font-weight:600;">${escapeHtml(p.amount || '—')}</td>
                <td><span class="gateway-badge">${escapeHtml(p.gateway || '—')}</span></td>
                <td><span class="status-badge status-${verified}">${verified === 'verified' ? 'Verified' : 'Paid'}</span></td>
                <td>${date}</td>
            </tr>
        `;
    }).join('');
}

document.getElementById('payments-search').addEventListener('input', (e) => {
    renderPayments(e.target.value);
});

// ═══════════════════════════════════════════════════════════════════
// LICENSES — Real-time Listener
// ═══════════════════════════════════════════════════════════════════
function listenToLicenses() {
    unsubLicenses = db.collection('licenses')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            allLicenses = [];
            snapshot.forEach(doc => {
                allLicenses.push({ id: doc.id, ...doc.data() });
            });
            renderLicenses();
        }, err => {
            console.error('Licenses listener error:', err);
        });
}

function renderLicenses(filterProduct = 'all', search = '') {
    const tbody = document.getElementById('licenses-tbody');
    const emptyState = document.getElementById('licenses-empty');
    const searchLower = search.toLowerCase();

    let filtered = allLicenses.filter(license => {
        if (filterProduct !== 'all' && !license.product.includes(filterProduct)) return false;
        if (search) {
            const haystack = `${license.licenseKey || ''} ${license.email || ''} ${license.name || ''}`.toLowerCase();
            if (!haystack.includes(searchLower)) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }
    emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(license => {
        const date = license.createdAt ? formatDate(license.createdAt) : '—';
        const isActive = license.isActive !== false;
        const statusClass = isActive ? 'verified' : 'interested';
        const statusLabel = isActive ? 'Active' : 'Revoked';
        const activations = `${license.activationCount || 0} / ${license.maxActivations || 2}`;

        return `
            <tr>
                <td>
                    <div class="license-cell">
                        <span class="license-key" style="font-family:monospace; font-weight:700; color:var(--accent-cyan); letter-spacing:1px;">${escapeHtml(license.licenseKey)}</span>
                        <span class="license-sig" style="font-size:9px; color:rgba(255,255,255,0.2); font-family:monospace;">SIG: ${license.signature ? license.signature.substring(0, 8) + '...' : 'NONE'}</span>
                    </div>
                </td>
                <td>
                    <div class="customer-cell">
                        <span class="customer-name">${escapeHtml(license.name || 'Unknown')}</span>
                        <span class="customer-email">${escapeHtml(license.email || '—')}</span>
                    </div>
                </td>
                <td>${escapeHtml(license.product || '—')}</td>
                <td>
                    <div class="activation-pill ${license.activationCount > 0 ? 'active' : ''}">
                        ${activations}
                    </div>
                </td>
                <td><span class="status-badge status-${statusClass}">${statusLabel}</span></td>
                <td>${date}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn" title="${isActive ? 'Revoke' : 'Activate'}" onclick="toggleLicenseStatus('${license.id}', ${isActive})">
                            <i class="fa-solid ${isActive ? 'fa-ban' : 'fa-check'}"></i>
                        </button>
                        <button class="table-btn delete" title="Delete" onclick="deleteLicense('${license.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Update count badge
    document.getElementById('licenses-count-badge').textContent = allLicenses.length;
}

// License Filters / Search
document.getElementById('licenses-search').addEventListener('input', applyLicenseFilters);
document.getElementById('licenses-product-filter').addEventListener('change', applyLicenseFilters);

function applyLicenseFilters() {
    const search = document.getElementById('licenses-search').value;
    const product = document.getElementById('licenses-product-filter').value;
    renderLicenses(product, search);
}

// Toggle License Status
window.toggleLicenseStatus = async function (id, currentActive) {
    if (!confirm(`Are you sure you want to ${currentActive ? 'REVOKE' : 'ACTIVATE'} this license?`)) return;
    try {
        await db.collection('licenses').doc(id).update({
            isActive: !currentActive,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Also update the email lookup
        const license = allLicenses.find(l => l.id === id);
        if (license && license.email) {
            await db.collection('license_by_email').doc(license.email.toLowerCase()).update({
                isActive: !currentActive
            });
        }
        
        showToast(`License ${currentActive ? 'revoked' : 'activated'}.`, 'success');
    } catch (err) {
        showToast('Failed to update license: ' + err.message, 'error');
    }
};

// Delete License
window.deleteLicense = async function (id) {
    if (!confirm('PERMANENTLY DELETE this license? This cannot be undone.')) return;
    try {
        const license = allLicenses.find(l => l.id === id);
        await db.collection('licenses').doc(id).delete();
        
        // Also delete the email lookup
        if (license && license.email) {
            await db.collection('license_by_email').doc(license.email.toLowerCase()).delete();
        }
        
        showToast('License deleted permanently.', 'success');
    } catch (err) {
        showToast('Failed to delete license: ' + err.message, 'error');
    }
};

// Manual License Generation from Admin
document.getElementById('gen-license-btn').addEventListener('click', async () => {
    const email = prompt("Enter customer email:");
    if (!email) return;
    const name = prompt("Enter customer name (optional):") || "";
    const product = prompt("Enter product name (e.g. Project Manager Pro):", "Project Manager Pro");
    if (!product) return;

    showToast("Requesting license generation...", "info");

    try {
        // We use the same API for manual generation but maybe with a "manual" gateway flag
        // However, the current API requires a paymentId. 
        // For admin use, we'll hit the generate-license endpoint with a bypass token or just use a manual ID
        const res = await fetch('/api/generate-license', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentId: 'MANUAL-' + Date.now(),
                method: 'admin',
                email: email,
                name: name,
                tier: product,
                adminBypass: true // We'd need to update the function to support this if we want full automation
            })
        });

        // NOTE: The current generate-license function verifies payments. 
        // For admin manual creation, we should probably just write directly to Firestore from here
        // since the admin is already authenticated in the browser.
        
        const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        let key = '';
        const randomValues = new Uint8Array(16);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < 16; i++) {
            key += alphabet[randomValues[i] % alphabet.length];
        }
        const formattedKey = `${key.slice(0, 4)}-${key.slice(4, 8)}-${key.slice(8, 12)}-${key.slice(12, 16)}`;
        const normalizedEmail = email.toLowerCase().trim();
        
        const licenseDoc = {
            licenseKey: formattedKey,
            email: normalizedEmail,
            name: name,
            product: product,
            paymentId: 'MANUAL-' + Date.now(),
            gateway: 'admin',
            isActive: true,
            activationCount: 0,
            maxActivations: 2,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('licenses').doc(formattedKey.replace(/-/g, '')).set(licenseDoc);
        await db.collection('license_by_email').doc(normalizedEmail).set({
            licenseKey: formattedKey,
            product: product,
            isActive: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        showToast(`Manual license generated: ${formattedKey}`, 'success');
        alert(`License Generated!\nKey: ${formattedKey}\nEmail: ${normalizedEmail}`);
    } catch (err) {
        console.error('Manual License Error:', err);
        showToast('Failed: ' + err.message, 'error');
    }
});

// ═══════════════════════════════════════════════════════════════════
// OVERVIEW — Stats + Recent Activity
// ═══════════════════════════════════════════════════════════════════
function updateOverviewStats() {
    const totalLeads = allLeads.length;
    const paid = allLeads.filter(l => l.status === 'paid' || l.status === 'verified').length;
    const pending = allLeads.filter(l => l.status === 'interested').length;

    // Calculate revenue from paid leads (auto-converting USD to INR)
    let revenue = 0;
    allLeads.forEach(l => {
        if (l.status === 'paid' || l.status === 'verified') {
            revenue += parseAmountToInr(l.amount);
        }
    });

    animateValue('stat-total-leads', totalLeads);
    animateValue('stat-paid', paid);
    animateValue('stat-pending', pending);
    document.getElementById('stat-revenue').textContent = `₹${revenue.toLocaleString()}`;

    // Update Conversion Rate
    const conversionRate = totalLeads > 0 ? Math.round((paid / totalLeads) * 100) : 0;
    const statPaidEl = document.getElementById('stat-paid');
    if (statPaidEl) statPaidEl.textContent = `${conversionRate}%`;

    // Render Chart.js
    renderAnalyticsChart();
}

function renderAnalyticsChart() {
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) return;

    // Group leads by recent 7 days
    const days = 7;
    const labels = [];
    const revenueData = [];
    const leadsData = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }));

        let dayRevenue = 0;
        let dayLeads = 0;

        allLeads.forEach(l => {
            if (!l.timestamp) return;
            const lDate = l.timestamp.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
            if (lDate.getDate() === d.getDate() && lDate.getMonth() === d.getMonth() && lDate.getFullYear() === d.getFullYear()) {
                dayLeads++;
                if (l.status === 'paid' || l.status === 'verified') {
                    dayRevenue += parseAmountToInr(l.amount);
                }
            }
        });

        revenueData.push(dayRevenue);
        leadsData.push(dayLeads);
    }

    if (analyticsChartInstance) {
        analyticsChartInstance.destroy();
    }

    analyticsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue (₹)',
                    data: revenueData,
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124,58,237,0.1)',
                    yAxisID: 'y',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'New Leads',
                    data: leadsData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'transparent',
                    yAxisID: 'y1',
                    fill: false,
                    tension: 0.4,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: 'rgba(255,255,255,0.7)' } }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: 'rgba(255,255,255,0.5)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: 'rgba(255,255,255,0.5)' }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: 'rgba(255,255,255,0.5)' }
                }
            }
        }
    });
}

function animateValue(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

function updateRecentActivity() {
    const container = document.getElementById('recent-activity');
    const recent = allLeads.slice(0, 15); // Last 15

    if (recent.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No activity yet. Leads will appear here in real-time.</p></div>';
        return;
    }

    container.innerHTML = recent.map(lead => {
        const statusClass = lead.status || 'interested';
        const action = statusClass === 'verified' ? 'Payment verified' :
            statusClass === 'paid' ? 'Payment received' : 'New lead';
        const date = lead.timestamp ? timeAgo(lead.timestamp) : '';

        return `
            <div class="activity-item">
                <span class="activity-dot ${statusClass}"></span>
                <div class="activity-info">
                    <span class="activity-name">${escapeHtml(lead.name || 'Unknown')}</span>
                    <span class="activity-detail">${action} — ${escapeHtml(lead.tier || 'N/A')}</span>
                </div>
                <span class="activity-time">${date}</span>
            </div>
        `;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════
function formatDate(ts, full = false) {
    let date;
    if (ts && ts.toDate) {
        date = ts.toDate();
    } else if (ts instanceof Date) {
        date = ts;
    } else if (typeof ts === 'string') {
        date = new Date(ts);
    } else {
        return '—';
    }

    if (full) {
        return date.toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(ts) {
    let date;
    if (ts && ts.toDate) date = ts.toDate();
    else if (ts instanceof Date) date = ts;
    else if (typeof ts === 'string') date = new Date(ts);
    else return '';

    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(ts);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════════
// SITE SETTINGS (Countdown & Banner)
// ═══════════════════════════════════════════════════════════════════
// loadSettings refactored into startConfigListeners() acima

document.getElementById('save-settings-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-settings-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const rawDate = document.getElementById('site-deadline-date').value;
    const bannerText = document.getElementById('site-banner-text').value.trim();

    let isoDateStr = '';
    if (rawDate) {
        isoDateStr = new Date(rawDate).toISOString();
    }

    try {
        await db.collection('config').doc('settings').set({
            deadlineDate: isoDateStr,
            bannerText: bannerText,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        showToast('Site settings updated!', 'success');
    } catch (err) {
        showToast('Error saving settings: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Site Settings';
    }
});

// ═══════════════════════════════════════════════════════════════════
// COUPONS / PROMO CODES
// ═══════════════════════════════════════════════════════════════════
function listenToCoupons() {
    unsubCoupons = db.collection('coupons')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            allCoupons = [];
            snapshot.forEach(doc => {
                allCoupons.push({ id: doc.id, ...doc.data() });
            });
            renderCoupons();
        }, err => {
            console.error('Coupons listener error:', err);
        });
}

function renderCoupons() {
    const tbody = document.getElementById('coupons-tbody');
    if (allCoupons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">No promo codes created yet.</td></tr>';
        return;
    }

    tbody.innerHTML = allCoupons.map(coupon => {
        const isActive = coupon.active !== false;
        const statusBadge = isActive ? '<span class="status-badge status-verified">Active</span>' : '<span class="status-badge" style="background:#333;color:#999;border:1px solid #444;">Disabled</span>';

        return `
            <tr style="opacity: ${isActive ? '1' : '0.5'}">
                <td style="font-family:monospace;font-weight:700;font-size:14px;color:var(--text-primary);">${escapeHtml(coupon.id)}</td>
                <td style="color:var(--accent-green);font-weight:700;">${coupon.discountPercent}% OFF</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn" title="Toggle Active" onclick="toggleCoupon('${escapeAttr(coupon.id)}', ${isActive})">
                            <i class="fa-solid fa-power-off"></i>
                        </button>
                        <button class="table-btn delete" title="Delete" onclick="deleteCoupon('${escapeAttr(coupon.id)}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

document.getElementById('create-coupon-btn').addEventListener('click', async () => {
    const codeInput = document.getElementById('new-coupon-code');
    const discountInput = document.getElementById('new-coupon-discount');

    const code = codeInput.value.trim().toUpperCase();
    const discount = parseInt(discountInput.value);

    if (!code || isNaN(discount) || discount < 1 || discount > 100) {
        showToast('Please enter a valid code and a discount between 1-100', 'error');
        return;
    }

    try {
        await db.collection('coupons').doc(code).set({
            discountPercent: discount,
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast(`Promo code ${code} created!`, 'success');
        codeInput.value = '';
        discountInput.value = '';
    } catch (err) {
        showToast('Error creating code: ' + err.message, 'error');
    }
});

window.toggleCoupon = async function (id, currentActive) {
    try {
        await db.collection('coupons').doc(id).update({ active: !currentActive });
    } catch (err) { showToast('Error toggling code: ' + err.message, 'error'); }
}

window.deleteCoupon = async function (id) {
    if (!confirm(`Delete promo code ${id}?`)) return;
    try {
        await db.collection('coupons').doc(id).delete();
    } catch (err) { showToast('Error deleting code: ' + err.message, 'error'); }
}

/*
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  FIRESTORE SECURITY RULES                                        │
 * │                                                                   │
 * │  Copy this to Firebase Console → Firestore → Rules:              │
 * │                                                                   │
 * │  rules_version = '2';                                             │
 * │  service cloud.firestore {                                        │
 * │    match /databases/{database}/documents {                        │
 * │                                                                   │
 * │      // Pricing & Config — anyone can read, only admin can write   │
 * │      match /config/{doc} {                                        │
 * │        allow read: if true;                                       │
 * │        allow write: if request.auth != null;                     │
 * │      }                                                            │
 * │                                                                   │
 * │      // Coupons — anyone can read, only admin can write           │
 * │      match /coupons/{code} {                                      │
 * │        allow read: if true;                                       │
 * │        allow write: if request.auth != null;                     │
 * │      }                                                            │
 * │                                                                   │
 * │      // Leads — anyone can create, only admin can read/edit      │
 * │      match /leads/{lead} {                                        │
 * │        allow create: if true;                                     │
 * │        allow read, update, delete: if request.auth != null;      │
 * │      }                                                            │
 * │                                                                   │
 * │      // Payments — anyone can create, only admin can read        │
 * │      match /payments/{payment} {                                  │
 * │        allow create: if true;                                     │
 * │        allow read, update, delete: if request.auth != null;      │
 * │      }                                                            │
 * │    }                                                              │
 * │  }                                                                │
 * │                                                                   │
 * └──────────────────────────────────────────────────────────────────┘
 */
