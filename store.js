// ── Server Store (Syncs data across all devices) ────
// Replaces localStorage + IndexedDB with PHP-backed JSON storage.
// All devices sharing the same domain see the same data.

var Store = (function() {
  'use strict';

  var BASE = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'api.php';
  var PIN = '1234';

  function api(type, method, params, body) {
    params = params || {};
    params.type = type;
    params.pin = PIN;
    var url = BASE + '?' + Object.keys(params).map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    return fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'X-PIN': PIN },
      body: body ? JSON.stringify(body) : undefined
    }).then(function(r) {
      if (!r.ok) throw new Error('API error ' + r.status);
      return r.json();
    });
  }

  // ── Templates ──────────────────────────────────────
  function getTemplates() {
    return api('templates', 'GET').catch(function() {
      // Fallback to localStorage
      try { return JSON.parse(localStorage.getItem('idcard-custom-templates')||'[]'); } catch(e) { return []; }
    });
  }

  function saveTemplate(tpl) {
    return api('templates', 'POST', {}, tpl).then(function(r) { return r; });
  }

  function deleteTemplate(id) {
    return api('templates', 'DELETE', { id: id }).then(function(r) { return r; });
  }

  // ── Employees ─────────────────────────────────────
  function getEmployees(search) {
    var params = {};
    if (search) params.search = search;
    return api('employees', 'GET', params).catch(function() {
      // Fallback to IndexedDB
      return EmployeeDB.search(search || '');
    });
  }

  function getEmployee(id) {
    return api('employees', 'GET', { id: id }).catch(function() {
      return EmployeeDB.get(id);
    });
  }

  function saveEmployee(record) {
    return api('employees', 'POST', {}, record).then(function(r) { return r; });
  }

  function deleteEmployee(id) {
    return api('employees', 'DELETE', { id: id }).then(function(r) { return r; });
  }

  function getEmployeeCount() {
    return api('employees', 'GET').then(function(arr) { return arr.length; }).catch(function() {
      return EmployeeDB.getCount();
    });
  }

  return {
    getTemplates: getTemplates,
    saveTemplate: saveTemplate,
    deleteTemplate: deleteTemplate,
    getEmployees: getEmployees,
    getEmployee: getEmployee,
    saveEmployee: saveEmployee,
    deleteEmployee: deleteEmployee,
    getEmployeeCount: getEmployeeCount
  };
})();
