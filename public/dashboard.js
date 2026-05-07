// Dashboard JavaScript
class OpenClawDashboard {
  constructor() {
    this.apiUrl = window.location.origin;
    this.refreshInterval = 5000; // 5 seconds
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.refreshData();
    this.setupAutoRefresh();
  }

  setupEventListeners() {
    // Section navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchSection(link.dataset.section);
      });
    });

    // Search and action buttons
    document.getElementById('search-phone-btn')?.addEventListener('click', () => this.searchByPhone());
    document.getElementById('search-name-btn')?.addEventListener('click', () => this.searchByName());
    document.getElementById('send-message-btn')?.addEventListener('click', () => this.sendMessage());
    document.getElementById('refresh-messages')?.addEventListener('click', () => this.loadMessages());

    // Enter key support
    document.getElementById('phone-search')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchByPhone();
    });

    document.getElementById('name-search')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchByName();
    });
  }

  switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
    });

    // Remove active from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName)?.classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');
  }

  async refreshData() {
    try {
      // Load stats
      const statsResponse = await fetch(`${this.apiUrl}/api/stats`);
      const statsData = await statsResponse.json();

      if (statsData.success) {
        this.updateStats(statsData);
      }

      // Load configuration
      await this.loadConfiguration();

      // Update status
      this.setStatus(true);
    } catch (error) {
      console.error('Error refreshing data:', error);
      this.setStatus(false);
    }
  }

  updateStats(data) {
    const { system, cache } = data;

    document.getElementById('stat-messages').textContent = system.messagesProcessed;
    document.getElementById('stat-orders').textContent = system.ordersMatched;
    document.getElementById('stat-uptime').textContent = system.uptime;
    document.getElementById('stat-cache').textContent = cache.hitRate;

    // Update performance stats
    const perfStats = document.getElementById('perf-stats');
    if (perfStats) {
      perfStats.innerHTML = `
        <li><strong>Messages Processed:</strong> <span>${system.messagesProcessed}</span></li>
        <li><strong>Orders Matched:</strong> <span>${system.ordersMatched}</span></li>
        <li><strong>Errors:</strong> <span>${system.errors}</span></li>
        <li><strong>Uptime:</strong> <span>${system.uptime}</span></li>
      `;
    }

    // Update cache stats
    const cacheStats = document.getElementById('cache-stats');
    if (cacheStats) {
      cacheStats.innerHTML = `
        <li><strong>Hit Rate:</strong> <span>${cache.hitRate}</span></li>
        <li><strong>Cache Hits:</strong> <span>${cache.hits}</span></li>
        <li><strong>Cache Misses:</strong> <span>${cache.misses}</span></li>
        <li><strong>Cache Size:</strong> <span>${cache.size} keys</span></li>
      `;
    }
  }

  async loadConfiguration() {
    try {
      const response = await fetch(`${this.apiUrl}/api/docs`);
      const data = await response.json();

      const configInfo = document.getElementById('config-info');
      if (configInfo) {
        configInfo.innerHTML = `
          <p><strong>Environment:</strong> ${data.config.environment}</p>
          <p><strong>Port:</strong> ${data.config.port}</p>
          <p><strong>WhatsApp:</strong> ${data.config.whatsappConfigured ? '✅ Configured' : '❌ Not Configured'}</p>
          <p><strong>Order System:</strong> ${data.config.orderSystemConfigured ? '✅ Configured' : '❌ Not Configured'}</p>
        `;
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }

  async loadMessages() {
    try {
      const response = await fetch(`${this.apiUrl}/api/messages?limit=20`);
      const data = await response.json();

      const tbody = document.getElementById('messages-body');
      if (!tbody) return;

      if (data.messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No messages yet</td></tr>';
        return;
      }

      tbody.innerHTML = data.messages.map(msg => `
        <tr>
          <td><strong>${this.formatPhone(msg.from || msg.to)}</strong></td>
          <td>${this.truncate(msg.text || '(no text)', 50)}</td>
          <td><span class="badge">${msg.type}</span></td>
          <td>${msg.processed ? '✅' : '⏳'}</td>
          <td><small>${this.formatTime(msg.timestamp)}</small></td>
        </tr>
      `).join('');
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async searchByPhone() {
    const phone = document.getElementById('phone-search')?.value;
    if (!phone) {
      alert('Please enter a phone number');
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/orders/match-by-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      const data = await response.json();
      this.displaySearchResults(data);
    } catch (error) {
      console.error('Error searching by phone:', error);
      this.showError('Failed to search by phone number');
    }
  }

  async searchByName() {
    const name = document.getElementById('name-search')?.value;
    if (!name) {
      alert('Please enter a customer name');
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/orders/match-by-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name }),
      });

      const data = await response.json();
      this.displaySearchResults(data);
    } catch (error) {
      console.error('Error searching by name:', error);
      this.showError('Failed to search by customer name');
    }
  }

  displaySearchResults(data) {
    const resultsDiv = document.getElementById('search-results');
    if (!resultsDiv) return;

    if (!data.success || data.orders.length === 0) {
      resultsDiv.innerHTML = `
        <div class="alert alert-error">
          <strong>❌ No Match</strong>
          <p>${data.message || 'The system fails to match the order. Please recheck the customer name or customer phone number.'}</p>
        </div>
      `;
      return;
    }

    const matchType = data.matchType || 'EXACT_PHONE';
    const isExact = matchType === 'EXACT_PHONE';
    const cardClass = isExact ? 'result-card' : 'result-card fuzzy';

    resultsDiv.innerHTML = data.orders.map(order => `
      <div class="${cardClass}">
        <h4>
          ${isExact ? '✅ Exact Match' : '🔍 Fuzzy Match'}
          ${!isExact ? `(${(order.similarity || 0).toFixed(1)}% confidence)` : ''}
        </h4>
        <p><strong>Customer Name:</strong> ${order.customerName}</p>
        <p><strong>IMEI:</strong> <code>${order.imei}</code></p>
        <p><strong>Phone:</strong> ${order.phoneNumber || 'N/A'}</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
      </div>
    `).join('');
  }

  async sendMessage() {
    const phone = document.getElementById('recipient')?.value;
    const message = document.getElementById('message-text')?.value;

    if (!phone || !message) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, message }),
      });

      const data = await response.json();

      const resultDiv = document.getElementById('send-result');
      if (resultDiv) {
        if (data.success) {
          resultDiv.className = 'alert alert-success';
          resultDiv.innerHTML = `<strong>✅ Success!</strong> Message sent to ${phone}`;
          document.getElementById('message-text').value = '';
        } else {
          resultDiv.className = 'alert alert-error';
          resultDiv.innerHTML = `<strong>❌ Error!</strong> ${data.error}`;
        }
        resultDiv.classList.remove('alert-hidden');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.showError('Failed to send message');
    }
  }

  setupAutoRefresh() {
    setInterval(() => {
      this.refreshData();
      this.loadMessages();
    }, this.refreshInterval);
  }

  setStatus(isOnline) {
    const dot = document.getElementById('status-indicator');
    const text = document.getElementById('status-text');

    if (dot) {
      dot.classList.toggle('error', !isOnline);
    }

    if (text) {
      text.textContent = isOnline ? 'Online' : 'Offline';
      text.style.color = isOnline ? '#4caf50' : '#e53935';
    }
  }

  formatPhone(phone) {
    if (!phone) return 'Unknown';
    return phone.length > 13 ? phone.slice(-10) : phone;
  }

  formatTime(timestamp) {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleTimeString();
  }

  truncate(text, length) {
    return text.length > length ? text.slice(0, length) + '...' : text;
  }

  showError(message) {
    alert('Error: ' + message);
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OpenClawDashboard();
});
