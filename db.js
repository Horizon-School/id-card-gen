// ── Employee Database (IndexedDB) ──────────────────
// Stores employee records with card data for searching and regenerating cards.

var EmployeeDB = (function() {
  'use strict';

  var DB_NAME = 'IDCardGen';
  var DB_VERSION = 1;
  var STORE_NAME = 'employees';
  var db = null;

  function open() {
    return new Promise(function(resolve, reject) {
      if (db) return resolve(db);
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        var d = e.target.result;
        if (!d.objectStoreNames.contains(STORE_NAME)) {
          var store = d.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('empId', 'empId', { unique: false });
          store.createIndex('department', 'department', { unique: false });
          store.createIndex('savedAt', 'savedAt', { unique: false });
        }
      };
      req.onsuccess = function(e) { db = e.target.result; resolve(db); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  }

  function save(record) {
    return open().then(function(d) {
      return new Promise(function(resolve, reject) {
        var tx = d.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        record.savedAt = new Date().toISOString();
        var req = store.add(record);
        req.onsuccess = function(e) { resolve(e.target.result); };
        req.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  function update(id, record) {
    return open().then(function(d) {
      return new Promise(function(resolve, reject) {
        var tx = d.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        record.id = id;
        record.updatedAt = new Date().toISOString();
        record.savedAt = record.savedAt || record.updatedAt;
        var req = store.put(record);
        req.onsuccess = function() { resolve(id); };
        req.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  function remove(id) {
    return open().then(function(d) {
      return new Promise(function(resolve, reject) {
        var tx = d.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        var req = store.delete(id);
        req.onsuccess = function() { resolve(); };
        req.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  function get(id) {
    return open().then(function(d) {
      return new Promise(function(resolve, reject) {
        var tx = d.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.get(id);
        req.onsuccess = function(e) { resolve(e.target.result || null); };
        req.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  function getAll() {
    return open().then(function(d) {
      return new Promise(function(resolve, reject) {
        var tx = d.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.getAll();
        req.onsuccess = function(e) { resolve(e.target.result || []); };
        req.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  function search(query) {
    return open().then(function(d) {
      return new Promise(function(resolve, reject) {
        var tx = d.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.getAll();
        req.onsuccess = function(e) {
          var results = (e.target.result || []).filter(function(r) {
            var q = (query || '').toLowerCase();
            return (r.name||'').toLowerCase().indexOf(q) !== -1
              || (r.empId||'').toLowerCase().indexOf(q) !== -1
              || (r.department||'').toLowerCase().indexOf(q) !== -1
              || (r.jobTitle||'').toLowerCase().indexOf(q) !== -1;
          });
          results.sort(function(a, b) { return new Date(b.savedAt) - new Date(a.savedAt); });
          resolve(results);
        };
        req.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  function getCount() {
    return open().then(function(d) {
      return new Promise(function(resolve, reject) {
        var tx = d.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.count();
        req.onsuccess = function(e) { resolve(e.target.result); };
        req.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  function clearAll() {
    return open().then(function(d) {
      return new Promise(function(resolve, reject) {
        var tx = d.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        var req = store.clear();
        req.onsuccess = function() { resolve(); };
        req.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  function exportAll() {
    return getAll().then(function(records) {
      var blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url;
      a.download = 'idcard-database-backup-' + new Date().toISOString().slice(0,10) + '.json';
      a.click(); URL.revokeObjectURL(url);
    });
  }

  function importFromJSON(jsonStr) {
    return open().then(function(d) {
      var records = JSON.parse(jsonStr);
      if (!Array.isArray(records)) throw new Error('Invalid format: expected an array');
      var tx = d.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      var count = 0;
      return new Promise(function(resolve, reject) {
        records.forEach(function(r) {
          delete r.id; // let DB assign new IDs
          r.importedAt = new Date().toISOString();
          var req = store.add(r);
          req.onsuccess = function() { count++; };
          req.onerror = function() { /* skip duplicates */ };
        });
        tx.oncomplete = function() { resolve(count); };
        tx.onerror = function(e) { reject(e.target.error); };
      });
    });
  }

  return {
    save: save,
    update: update,
    remove: remove,
    get: get,
    getAll: getAll,
    search: search,
    getCount: getCount,
    clearAll: clearAll,
    exportAll: exportAll,
    importFromJSON: importFromJSON
  };
})();
