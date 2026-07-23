(function() {
  'use strict';

  var state = {
    template: 'standard',
    accentColor: '#1E6E3A',
    cardSize: 'cr80',
    orientation: 'landscape',
    generating: false,
    photoDataUrl: null,
    logoDataUrl: null,
    bgDataUrl: null,
    backBgDataUrl: null
  };

  function $(id) { return document.getElementById(id); }

  // ── Collapsible step sections ─────────────────────
  document.querySelectorAll('.step-header').forEach(function(header) {
    header.addEventListener('click', function() {
      var section = this.closest('.step-section');
      var isExpanded = section.classList.contains('expanded');
      var body = section.querySelector('.step-body');

      if (isExpanded) {
        body.style.maxHeight = body.scrollHeight + 'px';
        requestAnimationFrame(function() {
          body.style.maxHeight = '0px';
        });
        section.classList.remove('expanded');
        this.setAttribute('aria-expanded', 'false');
      } else {
        section.classList.add('expanded');
        this.setAttribute('aria-expanded', 'true');
        body.style.maxHeight = body.scrollHeight + 'px';
        body.addEventListener('transitionend', function handler() {
          body.style.maxHeight = '';
          body.removeEventListener('transitionend', handler);
        });
      }
    });
  });

  // ── Date formatting ────────────────────────────────
  function formatDateISO(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr + 'T00:00:00');
    if (isNaN(d.getTime())) return isoStr;
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function formatDateForInput(str) {
    if (!str) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    var parts = str.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
    if (parts) {
      var m = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
      return parts[3] + '-' + m[parts[2].toLowerCase()] + '-' + parts[1].padStart(2,'0');
    }
    return '';
  }

  // ── Field sync ─────────────────────────────────────
  function updatePreview(field, value) {
    var el = document.querySelector('[data-field="' + field + '"]');
    if (el) el.textContent = value || '';
  }

  function syncField(id) {
    var input = $(id);
    if (!input) return;
    var val = input.value.trim();
    if (id === 'companyName') {
      updatePreview('companyDisplay', val);
      updatePreview('companyFooter', val.toUpperCase());
    } else if (id === 'issueDate') {
      updatePreview('issueDate', val ? formatDateISO(val) : '');
    } else if (id === 'expiryDate') {
      validateExpiry();
      updatePreview('expiryDisplay', val ? 'Valid through ' + formatDateISO(val) : '');
    } else if (id === 'fullName') {
      updatePreview('fullName', val);
    } else if (id === 'jobTitle') {
      updatePreview('jobTitle', val);
    } else if (id === 'department') {
      updatePreview('department', val);
    } else if (id === 'empId') {
      updatePreview('empId', val);
    }
  }

  document.querySelectorAll('.form-input').forEach(function(el) {
    if (el.type === 'file') return;
    el.addEventListener('input', function() { syncField(this.id); if (this.id==='expiryDate') validateExpiry(); });
  });

  // ── Validation ─────────────────────────────────────
  function validateExpiry() {
    var input = $('expiryDate');
    var msg = input.parentElement.querySelector('.form-error-msg');
    var val = input.value.trim();
    var issueVal = ($('issueDate').value||'').trim();
    if (!val) { input.classList.add('error'); if (msg) { msg.style.display='block'; msg.textContent='Enter a valid expiry date'; } return false; }
    if (issueVal && val <= issueVal) { input.classList.add('error'); if (msg) { msg.style.display='block'; msg.textContent='Expiry date must be after issue date'; } return false; }
    input.classList.remove('error'); if (msg) msg.style.display='none'; return true;
  }

  function isFormValid() {
    if (!$('fullName').value.trim() || !$('jobTitle').value.trim() || !$('empId').value.trim()) return false;
    return validateExpiry();
  }

  // ── Accent color ───────────────────────────────────
  function applyAccentColor(hex) {
    hex = hex.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    state.accentColor = hex;
    $('accentSwatch').style.backgroundColor = hex;
    $('previewAccentBar').style.backgroundColor = hex;
    $('backAccentBar').style.backgroundColor = hex;
    var genBtn = $('generateBtn');
    if (genBtn) { genBtn.style.backgroundColor = hex; genBtn.style.borderColor = hex; }
    document.querySelectorAll('.step-section.expanded .step-badge').forEach(function(b) { b.style.backgroundColor = hex; });
  }
  $('accentColor').addEventListener('input', function() { applyAccentColor(this.value); });
  $('accentColor').addEventListener('change', function() { applyAccentColor(this.value); });

  // ── Card size / orientation ────────────────────────
  function applyOrientation(val) { state.orientation = val; applyCardSize(state.cardSize); }
  function applyCardSize(val) {
    state.cardSize = val;
    if (val === 'custom') { $('customSizeFields').style.display = 'grid'; applyCustomSize(); }
    else {
      $('customSizeFields').style.display = 'none';
      var ratios = { cr80:{landscape:1.586,portrait:0.63}, cr100:{landscape:1.47,portrait:0.68} };
      $('cardPreview').style.aspectRatio = String(ratios[val] ? ratios[val][state.orientation]||1.586 : 1.586);
    }
  }
  function applyCustomSize() {
    $('cardPreview').style.aspectRatio = String((parseFloat($('customWidth').value)||85) / (parseFloat($('customHeight').value)||54));
  }
  $('orientation').addEventListener('change', function() { applyOrientation(this.value); });
  $('cardSize').addEventListener('change', function() { applyCardSize(this.value); });
  $('customWidth').addEventListener('input', applyCustomSize);
  $('customHeight').addEventListener('input', applyCustomSize);

  // ── Logo upload ────────────────────────────────────
  function setLogoImage(src) {
    state.logoDataUrl = src;
    $('previewLogoImg').src = src; $('previewLogoImg').style.display = 'block'; $('previewLogoPlaceholder').style.display = 'none';
    $('logoDropContent').style.display = 'none'; $('logoPreviewMini').style.display = 'flex'; $('logoPreviewMiniImg').src = src;
  }
  function removeLogo() {
    state.logoDataUrl = null;
    $('previewLogoImg').style.display = 'none'; $('previewLogoImg').src = ''; $('previewLogoPlaceholder').style.display = '';
    $('logoDropContent').style.display = ''; $('logoPreviewMini').style.display = 'none'; $('logoFileInput').value = '';
  }
  $('logoDropZone').addEventListener('click', function(e) { if (e.target!==$('removeLogoBtn')) $('logoFileInput').click(); });
  $('logoDropZone').addEventListener('dragover', function(e) { e.preventDefault(); this.style.borderColor='var(--accent-400)'; this.style.background='var(--accent-50)'; });
  $('logoDropZone').addEventListener('dragleave', function() { this.style.borderColor='var(--surface-200)'; this.style.background='var(--surface-25)'; });
  $('logoDropZone').addEventListener('drop', function(e) {
    e.preventDefault(); this.style.borderColor='var(--surface-200)'; this.style.background='var(--surface-25)';
    if (e.dataTransfer.files[0]) processLogoFile(e.dataTransfer.files[0]);
  });
  $('logoFileInput').addEventListener('change', function() { if (this.files[0]) processLogoFile(this.files[0]); });
  function processLogoFile(file) {
    if (!file.type.match(/image\/(png|jpeg|svg\+xml)/)) { showToast('Use PNG/JPG/SVG',''); return; }
    if (file.size > 2*1024*1024) { showToast('Under 2MB',''); return; }
    var r = new FileReader(); r.onload = function(e) { setLogoImage(e.target.result); }; r.readAsDataURL(file);
  }
  $('removeLogoBtn').addEventListener('click', function(e) { e.stopPropagation(); removeLogo(); });

  // ── Photo upload ───────────────────────────────────
  function setPhotoImage(src) {
    state.photoDataUrl = src;
    $('previewPhotoImg').src = src; $('previewPhotoImg').style.display = 'block'; $('previewPhotoPlaceholder').style.display = 'none';
    $('photoDropContent').style.display = 'none'; $('photoPreviewMini').style.display = 'flex'; $('photoPreviewMiniImg').src = src;
  }
  function removePhoto() {
    state.photoDataUrl = null;
    $('previewPhotoImg').style.display = 'none'; $('previewPhotoImg').src = ''; $('previewPhotoPlaceholder').style.display = '';
    $('photoDropContent').style.display = ''; $('photoPreviewMini').style.display = 'none'; $('photoFileInput').value = '';
  }
  $('photoDropZone').addEventListener('click', function(e) { if (e.target!==$('removePhotoBtn')) $('photoFileInput').click(); });
  $('photoDropZone').addEventListener('dragover', function(e) { e.preventDefault(); this.style.borderColor='var(--accent-400)'; this.style.background='var(--accent-50)'; });
  $('photoDropZone').addEventListener('dragleave', function() { this.style.borderColor='var(--surface-200)'; this.style.background='var(--surface-25)'; });
  $('photoDropZone').addEventListener('drop', function(e) {
    e.preventDefault(); this.style.borderColor='var(--surface-200)'; this.style.background='var(--surface-25)';
    if (e.dataTransfer.files[0]) processPhotoFile(e.dataTransfer.files[0]);
  });
  $('photoFileInput').addEventListener('change', function() { if (this.files[0]) processPhotoFile(this.files[0]); });
  function processPhotoFile(file) {
    if (!file.type.match(/image\/(png|jpeg)/)) { showToast('Use PNG/JPG',''); return; }
    if (file.size > 2*1024*1024) { showToast('Under 2MB',''); return; }
    var r = new FileReader(); r.onload = function(e) { setPhotoImage(e.target.result); }; r.readAsDataURL(file);
  }
  $('removePhotoBtn').addEventListener('click', function(e) { e.stopPropagation(); removePhoto(); });

  // ── Background image upload ────────────────────────
  function setBgImage(src) {
    state.bgDataUrl = src;
    $('cardPreview').style.backgroundImage = 'url(' + src + ')';
    $('cardPreview').style.backgroundSize = 'cover';
    $('cardPreview').style.backgroundPosition = 'center';
    $('cardPreview').style.backgroundRepeat = 'no-repeat';
    $('bgDropContent').style.display = 'none';
    $('bgPreviewMini').style.display = 'flex';
    $('bgPreviewMiniImg').src = src;
  }

  function saveCurrentAsTemplate(name, bgDataUrl) {
    bgDataUrl = bgDataUrl || state.bgDataUrl;
    var data = {
      companyDisplay: getFieldVal('companyDisplay'),
      subtitle: getFieldVal('subtitle'),
      fullName: getFieldVal('fullName'),
      jobTitle: getFieldVal('jobTitle'),
      department: getFieldVal('department'),
      empId: getFieldVal('empId'),
      issueDate: $('issueDate').value || '',
      expiryDate: $('expiryDate').value || '',
      issueDateDisplay: getFieldVal('issueDate'),
      expiryDisplay: getFieldVal('expiryDisplay'),
      companyFooter: getFieldVal('companyFooter'),
      backNotice: $('backNotice').innerHTML || '',
      backBgDataUrl: state.backBgDataUrl || null
    };
    var tpl = {
      id: 'custom-' + Date.now(),
      name: name,
      subtitle: 'Custom template',
      orientation: state.orientation,
      accent: state.accentColor,
      bg: bgDataUrl,
      backBgDataUrl: state.backBgDataUrl || null,
      data: data
    };
    var existing = customTemplates.find(function(t) { return t.bg === bgDataUrl && !t.name.match(/^Custom \d+$/); });
    if (existing) { Object.assign(existing, tpl); }
    else { customTemplates.unshift(tpl); if (customTemplates.length > 20) customTemplates.pop(); }
    try { localStorage.setItem('idcard-custom-templates', JSON.stringify(customTemplates)); } catch(e) {}
    showToast('Saved as template','success');
  }

  function removeBg() {
    state.bgDataUrl = null;
    $('cardPreview').style.backgroundImage = '';
    $('cardPreview').style.backgroundSize = '';
    $('cardPreview').style.backgroundPosition = '';
    $('cardPreview').style.backgroundRepeat = '';
    $('bgDropContent').style.display = '';
    $('bgPreviewMini').style.display = 'none';
    $('bgFileInput').value = '';
  }
  $('bgDropZone').addEventListener('click', function(e) { if (e.target !== $('removeBgBtn')) $('bgFileInput').click(); });
  $('bgDropZone').addEventListener('dragover', function(e) { e.preventDefault(); this.style.borderColor='var(--accent-400)'; this.style.background='var(--accent-50)'; });
  $('bgDropZone').addEventListener('dragleave', function() { this.style.borderColor='var(--surface-200)'; this.style.background='var(--surface-25)'; });
  $('bgDropZone').addEventListener('drop', function(e) {
    e.preventDefault(); this.style.borderColor='var(--surface-200)'; this.style.background='var(--surface-25)';
    if (e.dataTransfer.files[0]) processBgFile(e.dataTransfer.files[0]);
  });
  $('bgFileInput').addEventListener('change', function() { if (this.files[0]) processBgFile(this.files[0]); });
  function processBgFile(file) {
    if (!file.type.match(/image\/(png|jpeg)/)) { showToast('Use PNG/JPG',''); return; }
    if (file.size > 5*1024*1024) { showToast('Under 5MB',''); return; }
    var r = new FileReader(); r.onload = function(e) { setBgImage(e.target.result); }; r.readAsDataURL(file);
  }
  $('removeBgBtn').addEventListener('click', function(e) { e.stopPropagation(); removeBg(); });

  // ── Flip card toggle ──────────────────────────────
  var showingBack = false;
  $('flipCardBtn').addEventListener('click', function() {
    showingBack = !showingBack;
    this.setAttribute('aria-checked', showingBack ? 'true' : 'false');
    if (showingBack) {
      $('cardPreview').style.display = 'none';
      $('backCardPreview').style.display = '';
    } else {
      $('cardPreview').style.display = '';
      $('backCardPreview').style.display = 'none';
    }
  });

  // ── Back card background upload ───────────────────
  function setBackBgImage(src) {
    state.backBgDataUrl = src;
    $('backCardPreview').style.backgroundImage = 'url(' + src + ')';
    $('backCardPreview').style.backgroundSize = 'cover';
    $('backCardPreview').style.backgroundPosition = 'center';
    $('backCardPreview').style.backgroundRepeat = 'no-repeat';
    $('backBgDropContent').style.display = 'none';
    $('backBgPreviewMini').style.display = 'flex';
    $('backBgPreviewMiniImg').src = src;
  }
  function removeBackBg() {
    state.backBgDataUrl = null;
    $('backCardPreview').style.backgroundImage = '';
    $('backCardPreview').style.backgroundSize = '';
    $('backCardPreview').style.backgroundPosition = '';
    $('backCardPreview').style.backgroundRepeat = '';
    $('backBgDropContent').style.display = '';
    $('backBgPreviewMini').style.display = 'none';
    $('backBgFileInput').value = '';
  }
  $('backBgDropZone').addEventListener('click', function(e) { if (e.target !== $('removeBackBgBtn')) $('backBgFileInput').click(); });
  $('backBgDropZone').addEventListener('dragover', function(e) { e.preventDefault(); this.style.borderColor='var(--accent-400)'; this.style.background='var(--accent-50)'; });
  $('backBgDropZone').addEventListener('dragleave', function() { this.style.borderColor='var(--surface-200)'; this.style.background='var(--surface-25)'; });
  $('backBgDropZone').addEventListener('drop', function(e) {
    e.preventDefault(); this.style.borderColor='var(--surface-200)'; this.style.background='var(--surface-25)';
    if (e.dataTransfer.files[0]) processBackBgFile(e.dataTransfer.files[0]);
  });
  $('backBgFileInput').addEventListener('change', function() { if (this.files[0]) processBackBgFile(this.files[0]); });
  function processBackBgFile(file) {
    if (!file.type.match(/image\/(png|jpeg)/)) { showToast('Use PNG/JPG',''); return; }
    if (file.size > 5*1024*1024) { showToast('Under 5MB',''); return; }
    var r = new FileReader(); r.onload = function(e) { setBackBgImage(e.target.result); }; r.readAsDataURL(file);
  }
  $('removeBackBgBtn').addEventListener('click', function(e) { e.stopPropagation(); removeBackBg(); });

  // ── Rich text editor ──────────────────────────────
  var colorPalette = [
    '#000000','#252b29','#5a6360','#7a8380','#9fa7a4','#d6dbd9',
    '#1e6e3a','#2d8a4e','#4ea66a','#0f361b','#18582d','#144723',
    '#c93535','#d97706','#2563eb','#7c3aed','#db2777','#0891b2',
    '#e53935','#1e88e5','#43a047','#fb8c00','#8e24aa','#00acc1'
  ];

  // Build color picker popup
  var rteColorPopup = document.getElementById('rteColorPopup');
  var rteColorSwatch = document.getElementById('rteColorSwatch');
  var currentTextColor = '#000000';
  if (rteColorSwatch) rteColorSwatch.style.backgroundColor = currentTextColor;

  if (rteColorPopup) {
    colorPalette.forEach(function(color) {
      var chip = document.createElement('div');
      chip.className = 'rte-color-chip';
      chip.style.backgroundColor = color;
      chip.title = color;
      chip.addEventListener('click', function(e) {
        e.stopPropagation();
        currentTextColor = color;
        if (rteColorSwatch) rteColorSwatch.style.backgroundColor = color;
        document.execCommand('foreColor', false, color);
        rteColorPopup.style.display = 'none';
        $('backNotice').focus();
      });
      rteColorPopup.appendChild(chip);
    });
  }

  var rteColorBtn = document.getElementById('rteColorBtn');
  if (rteColorBtn && rteColorPopup) {
    rteColorBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      rteColorPopup.style.display = rteColorPopup.style.display === 'none' ? 'grid' : 'none';
    });
    document.addEventListener('click', function() {
      rteColorPopup.style.display = 'none';
    });
  }

  // Toolbar button commands
  document.querySelectorAll('.rte-btn[data-cmd]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var cmd = this.getAttribute('data-cmd');
      if (cmd === 'foreColor') return; // handled by color picker
      document.execCommand(cmd, false, null);
      this.classList.toggle('active', document.queryCommandState(cmd));
      $('backNotice').focus();
    });
  });

  // Font size dropdown
  var fontSizeSelect = document.querySelector('.rte-fontsize');
  if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', function() {
      document.execCommand('fontSize', false, this.value);
      $('backNotice').focus();
    });
  }

  // Sync rich text from contenteditable to preview and keep button states
  $('backNotice').addEventListener('paste', function(e) {
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
    this.dispatchEvent(new Event('input'));
  });

  $('backNotice').addEventListener('input', function() {
    var html = this.innerHTML;
    var previewEl = document.querySelector('[data-field="backNotice"]');
    if (previewEl) previewEl.innerHTML = html || '';
    syncBrandToStorage();
  });

  // Update button states on selection change
  $('backNotice').addEventListener('mouseup', updateRteButtons);
  $('backNotice').addEventListener('keyup', function(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') updateRteButtons();
  });

  function updateRteButtons() {
    document.querySelectorAll('.rte-btn[data-cmd]').forEach(function(btn) {
      var cmd = btn.getAttribute('data-cmd');
      if (cmd && cmd !== 'foreColor') {
        btn.classList.toggle('active', document.queryCommandState(cmd));
      }
    });
  }

  // Override back notice sync - we already handle it above, so remove the old textarea listener
  // (The old listener will be skipped since it was for a textarea, now it's a div)

  // ── Toast ──────────────────────────────────────────
  function showToast(msg, type) {
    type = type || '';
    var t = document.createElement('div');
    t.className = 'toast' + (type ? ' toast-' + type : '');
    t.textContent = msg;
    $('toastContainer').appendChild(t);
    t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; t.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    requestAnimationFrame(function() { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    setTimeout(function() { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(function() { t.remove(); },200); },3000);
  }

  function getFieldVal(field) {
    var el = document.querySelector('[data-field="'+field+'"]');
    return el ? el.textContent : '';
  }

  function getFieldValHtml(field) {
    var el = document.querySelector('[data-field="'+field+'"]');
    return el ? el.innerHTML : '';
  }

  function renderRichTextOnCanvas(ctx, html, left, right, startY, lineHeight, doneCb) {
    var maxWidth = right;
    var y = startY;
    var defaultColor = '#5a6360';
    var defaultSize = 26;
    // Create a hidden container to measure
    var container = document.createElement('div');
    container.innerHTML = html;
    container.style.cssText = 'position:absolute;visibility:hidden;font-family:"DM Sans",sans-serif;white-space:nowrap;';
    document.body.appendChild(container);

    function applyStyle(el, baseFontWeight, baseFontStyle, baseColor, baseSize) {
      var fs = baseFontWeight || '400';
      var fstyle = baseFontStyle || 'normal';
      var col = baseColor || defaultColor;
      var sz = baseSize || defaultSize;

      if (el.style.fontWeight && el.style.fontWeight !== '') fs = el.style.fontWeight;
      else if (el.tagName === 'B' || el.tagName === 'STRONG') fs = '700';
      if (el.style.fontStyle && el.style.fontStyle !== '') fstyle = el.style.fontStyle;
      else if (el.tagName === 'I' || el.tagName === 'EM') fstyle = 'italic';
      if (el.style.color && el.style.color !== '') col = el.style.color;
      if (el.style.fontSize && el.style.fontSize !== '') sz = parseFontSize(el.style.fontSize, sz);

      return { weight: fs, style: fstyle, color: col, size: sz };
    }

    function parseFontSize(cssSize, defaultVal) {
      var map = { '1': 18, '2': 22, '3': 26, '4': 30, '5': 34, '6': 38, '7': 42 };
      return map[cssSize] || defaultVal;
    }

    function processNode(node, inheritedStyle) {
      var style = inheritedStyle;
      var isBlock = false;

      if (node.nodeType === 3) { // Text node
        style = style || { weight: '400', style: 'normal', color: defaultColor, size: defaultSize };
        var text = node.textContent.replace(/\s+/g, ' ');
        if (!text.trim()) return;
        ctx.font = style.weight + ' ' + style.style + ' ' + style.size + 'px "DM Sans", system-ui, sans-serif';
        ctx.fillStyle = style.color;
        if (ctx.measureText(text).width <= maxWidth) {
          ctx.fillText(text, left + (maxWidth - ctx.measureText(text).width) / 2, y);
          y += lineHeight;
        } else {
          // Word-wrap
          var words = text.split(' ');
          var line = '';
          for (var w = 0; w < words.length; w++) {
            var test = line + (line ? ' ' : '') + words[w];
            if (ctx.measureText(test).width > maxWidth && line) {
              ctx.fillText(line, left + (maxWidth - ctx.measureText(line).width) / 2, y);
              y += lineHeight;
              line = words[w];
            } else line = test;
          }
          if (line) {
            ctx.fillText(line, left + (maxWidth - ctx.measureText(line).width) / 2, y);
            y += lineHeight;
          }
        }
      } else if (node.nodeType === 1) {
        var tag = node.tagName;
        style = applyStyle(node, style ? style.weight : '400', style ? style.style : 'normal', style ? style.color : defaultColor, style ? style.size : defaultSize);

        if (tag === 'UL' || tag === 'OL') {
          isBlock = true;
          var bulletIndex = 0;
        }

        var children = node.childNodes;
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (child.nodeType === 1 && (child.tagName === 'LI' || child.tagName === 'P' || child.tagName === 'DIV')) {
            if (tag === 'UL' && child.tagName === 'LI') {
              var bs = applyStyle(child, style.weight, style.style, style.color, style.size);
              ctx.font = (bs.weight||'400') + ' ' + (bs.style||'normal') + ' ' + (bs.size||defaultSize) + 'px "DM Sans", system-ui, sans-serif';
              ctx.fillStyle = bs.color;
              var bullet = '\u2022';
              ctx.fillText(bullet, left + 8, y);
            }
            // Process LI children
            var liChildren = child.childNodes;
            if (liChildren.length === 0 && child.textContent) {
              var bs2 = applyStyle(child, style.weight, style.style, style.color, style.size);
              ctx.font = (bs2.weight||'400') + ' ' + (bs2.style||'normal') + ' ' + (bs2.size||defaultSize) + 'px "DM Sans", system-ui, sans-serif';
              ctx.fillStyle = bs2.color;
              var txt = child.textContent.replace(/\s+/g, ' ').trim();
              if (tag === 'UL') {
                ctx.fillText(txt, left + 28, y);
              } else {
                ctx.fillText(txt, left + (maxWidth - ctx.measureText(txt).width) / 2, y);
              }
              y += lineHeight;
            } else {
              // Process inline children of LI
              var liStyle = applyStyle(child, style.weight, style.style, style.color, style.size);
              var inlineLeft = tag === 'UL' ? left + 28 : left;
              var width = tag === 'UL' ? maxWidth - 28 : maxWidth;
              var fragments = collectInlineText(liChildren, liStyle, width, ctx);
              for (var f = 0; f < fragments.length; f++) {
                var fr = fragments[f];
                ctx.font = fr.weight + ' ' + fr.style + ' ' + fr.size + 'px "DM Sans", system-ui, sans-serif';
                ctx.fillStyle = fr.color;
                ctx.fillText(fr.text, inlineLeft + (width - ctx.measureText(fr.text).width) / 2, y);
                y += lineHeight;
              }
            }
          } else {
            processNode(child, style);
          }
        }
      }
    }

    function collectInlineText(nodes, baseStyle, maxW, ctx) {
      var fragments = [];
      function walk(n, s) {
        if (n.nodeType === 3) {
          var t = n.textContent.replace(/\s+/g, ' ');
          if (t.trim()) fragments.push({ text: t, weight: s.weight, style: s.style, color: s.color, size: s.size });
        } else if (n.nodeType === 1) {
          var ns = applyStyle(n, s.weight, s.style, s.color, s.size);
          if (n.tagName === 'BR') fragments.push({ text: '', weight: ns.weight, style: ns.style, color: ns.color, size: ns.size });
          else for (var c = 0; c < n.childNodes.length; c++) walk(n.childNodes[c], ns);
        }
      }
      for (var i = 0; i < nodes.length; i++) walk(nodes[i], baseStyle);
      // Merge into lines that fit
      var lines = [];
      var curLine = '';
      var curStyle = null;
      for (var j = 0; j < fragments.length; j++) {
        var frag = fragments[j];
        if (frag.text === '') { if (curLine) lines.push({ text: curLine, weight: curStyle.weight, style: curStyle.style, color: curStyle.color, size: curStyle.size }); curLine = ''; curStyle = null; continue; }
        if (!curStyle) curStyle = { weight: frag.weight, style: frag.style, color: frag.color, size: frag.size };
        var test = curLine + (curLine ? ' ' : '') + frag.text;
        // Use temp font for measurement
        ctx.font = curStyle.weight + ' ' + curStyle.style + ' ' + curStyle.size + 'px "DM Sans", system-ui, sans-serif';
        if (ctx.measureText(test).width > maxW && curLine) {
          lines.push({ text: curLine, weight: curStyle.weight, style: curStyle.style, color: curStyle.color, size: curStyle.size });
          curLine = frag.text;
          curStyle = { weight: frag.weight, style: frag.style, color: frag.color, size: frag.size };
        } else {
          curLine = test;
        }
      }
      if (curLine) lines.push({ text: curLine, weight: curStyle.weight, style: curStyle.style, color: curStyle.color, size: curStyle.size });
      return lines;
    }

    processNode(container, null);
    document.body.removeChild(container);
    if (doneCb) doneCb();
  }

  function wrapLines(ctx, text, maxWidth) {
    var words = text.split(' ');
    var lines = [];
    var line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line + (line ? ' ' : '') + words[i];
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  // ── Render front card to a dedicated canvas ───────
  function renderFrontToCanvas(canvas, callback) {
    var cardW = 1011, cardH = 638;
    canvas.width = cardW; canvas.height = cardH;
    var ctx = canvas.getContext('2d');

    function doDraw() {
      if (state.bgDataUrl) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cardW, cardH);
        var bgImg = document.createElement('img');
        bgImg.onload = function() { ctx.drawImage(bgImg, 0, 0, cardW, cardH); drawContent(); };
        bgImg.src = state.bgDataUrl;
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cardW, cardH);
        drawContent();
      }
    }

    function drawContent() {
      ctx.fillStyle = state.accentColor;
      ctx.fillRect(0, 0, cardW, 10);

      var pad=36, y=28;
      var textX = pad;
      if (state.logoDataUrl) {
        var logoImg = document.createElement('img');
        logoImg.onload = function() { ctx.drawImage(logoImg, pad, y, 142, 142); };
        logoImg.src = state.logoDataUrl;
        textX = pad + 162;
      }

      var afterLogo = state.logoDataUrl ? 170 : 128;
      ctx.fillStyle = '#252b29'; ctx.font = '600 36px "DM Sans", system-ui, sans-serif';
      ctx.fillText(getFieldVal('companyDisplay'), textX, y + 44);
      ctx.fillStyle = '#7a8380'; ctx.font = '600 24px "DM Sans", system-ui, sans-serif';
      ctx.fillText(getFieldVal('subtitle'), textX, y + 76);

      if (state.photoDataUrl) {
        var photoImg = document.createElement('img');
        photoImg.onload = function() {
          ctx.drawImage(photoImg, cardW-pad-236, y, 236, 260);
          renderFieldsAndFooter(y + 270);
        };
        photoImg.src = state.photoDataUrl;
      } else {
        renderFieldsAndFooter(y + afterLogo);
      }
    }

    function renderFieldsAndFooter(startY) {
      var pad=36;
      var footerZone = cardH - pad - 30;
      var fields = [
        { label:'Name',   field:'fullName' },
        { label:'Title',  field:'jobTitle' },
        { label:'Dept',   field:'department' },
        { label:'ID',     field:'empId' },
        { label:'Issued', field:'issueDate' }
      ];

      fields.forEach(function(f) {
        if (startY + 20 > footerZone - 40) return;
        ctx.fillStyle = '#9fa7a4'; ctx.font = '600 22px "DM Sans", system-ui, sans-serif';
        ctx.fillText(f.label, pad, startY);
        ctx.fillStyle = '#252b29'; ctx.font = '500 30px "DM Sans", system-ui, sans-serif';
        ctx.fillText(getFieldVal(f.field)||'\u2014', pad+200, startY);
        startY += 42;
      });

      ctx.fillStyle = '#9fa7a4'; ctx.font = '500 22px "DM Sans", system-ui, sans-serif';
      ctx.fillText(getFieldVal('companyFooter'), pad, footerZone);
      var expText = getFieldVal('expiryDisplay');
      ctx.fillText(expText, cardW-pad-ctx.measureText(expText).width, footerZone);

      if (callback) callback();
    }

    doDraw();
  }

  // ── Render back card to a dedicated canvas ────────
  function renderBackToCanvas(canvas, callback) {
    var cardW = 1011, cardH = 638;
    canvas.width = cardW; canvas.height = cardH;
    var ctx = canvas.getContext('2d');

    function doDraw() {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cardW, cardH);
      if (state.backBgDataUrl) {
        var bgImg = document.createElement('img');
        bgImg.onload = function() { ctx.drawImage(bgImg, 0, 0, cardW, cardH); drawContent(); };
        bgImg.src = state.backBgDataUrl;
      } else {
        drawContent();
      }
    }

    function drawContent() {
      ctx.fillStyle = state.accentColor;
      ctx.fillRect(0, 0, cardW, 10);
      var companyName = getFieldVal('companyDisplay');
      ctx.fillStyle = '#252b29';
      ctx.font = '600 36px "DM Sans", system-ui, sans-serif';
      ctx.fillText(companyName, cardW/2 - ctx.measureText(companyName).width/2, 160);

      var noticeHtml = getFieldValHtml('backNotice');
      if (noticeHtml) {
        renderRichTextOnCanvas(ctx, noticeHtml, 120, cardW - 120, 230, 38, callback);
      } else if (callback) callback();
    }

    doDraw();
  }

  // ── Generate card (sequential, no canvas race) ───
  $('generateBtn').addEventListener('click', function() {
    if (state.generating) return;
    if (!isFormValid()) { showToast('Fill all required fields and fix errors',''); return; }

    state.generating = true;
    this.classList.add('loading');

    var format = $('exportFormat').value;
    var side = $('exportSide').value;
    var ext = format === 'pdf' ? '.pdf' : (format === 'jpeg' ? '.jpg' : '.png');
    var mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';

    var frontCanvas = document.createElement('canvas');
    var backCanvas = document.createElement('canvas');
    var pdfPages = [];

    var tasks = [];
    if (side === 'front' || side === 'both') tasks.push('front');
    if (side === 'back' || side === 'both') tasks.push('back');

    function runNext(idx) {
      if (idx >= tasks.length) {
        // All renders done
        state.generating = false;
        $('generateBtn').classList.remove('loading');
        if (format === 'pdf' && pdfPages.length) {
          finalizePDF(pdfPages);
        }
        showToast('Card downloaded','success');
        return;
      }

      var task = tasks[idx];
      if (task === 'front') {
        renderFrontToCanvas(frontCanvas, function() {
          if (format === 'pdf') {
            pdfPages.push({ dataUrl: frontCanvas.toDataURL('image/jpeg', 0.95), label: 'Front' });
            runNext(idx + 1);
          } else {
            frontCanvas.toBlob(function(blob) {
              var url = URL.createObjectURL(blob);
              var a = document.createElement('a'); a.href = url;
              a.download = 'employee-id-card-front' + ext;
              a.click(); URL.revokeObjectURL(url);
              setTimeout(function() { runNext(idx + 1); }, 100);
            }, mime, 0.95);
          }
        });
      } else {
        renderBackToCanvas(backCanvas, function() {
          if (format === 'pdf') {
            pdfPages.push({ dataUrl: backCanvas.toDataURL('image/jpeg', 0.95), label: 'Back' });
            runNext(idx + 1);
          } else {
            backCanvas.toBlob(function(blob) {
              var url = URL.createObjectURL(blob);
              var a = document.createElement('a'); a.href = url;
              a.download = 'employee-id-card-back' + ext;
              a.click(); URL.revokeObjectURL(url);
              setTimeout(function() { runNext(idx + 1); }, 100);
            }, mime, 0.95);
          }
        });
      }
    }

    runNext(0);
  });

  function finalizePDF(pages) {
    var pdfW = 85.6, pdfH = 54;
    var doc = new jspdf.jsPDF({ unit: 'mm', format: [pdfW, pdfH], orientation: 'landscape' });

    var loaded = 0;
    function addNext() {
      if (loaded >= pages.length) {
        doc.save('employee-id-card.pdf');
        return;
      }
      var page = pages[loaded];
      var img = new Image();
      img.onload = function() {
        if (loaded > 0) doc.addPage();
        doc.addImage(img, 'JPEG', 0, 0, pdfW, pdfH);
        loaded++;
        addNext();
      };
      img.src = page.dataUrl;
    }
    addNext();
  }

  // ── Template library modal ─────────────────────────
  var tplOverlay=$('templateLibraryOverlay');
  var tplGrid=$('templateLibraryGrid');
  var selectedTplId='standard';

  var TEMPLATES = [];
  var customTemplates = [];
  try { customTemplates = JSON.parse(localStorage.getItem('idcard-custom-templates')||'[]'); } catch(e) {}

  function renderTemplateCard(tpl) {
    var w=320, h=w/1.586, p=12;
    var canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
    var ctx=canvas.getContext('2d');

    // White base then background on top
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    if (tpl.bg) {
      var bg = document.createElement('img');
      bg.src = tpl.bg;
      if (bg.complete) {
        try { ctx.drawImage(bg, 0, 0, w, h); } catch(e) {}
      } else {
        bg.onload = function() { ctx.drawImage(bg, 0, 0, w, h); };
      }
    }
    ctx.fillStyle=tpl.accent; ctx.fillRect(0,0,w,4);

    var y=16, tx=p;
    ctx.fillStyle='#252b29'; ctx.font='600 11px "DM Sans",system-ui,sans-serif';
    ctx.fillText(tpl.data.companyDisplay||'', tx, y+12);
    ctx.fillStyle='#7a8380'; ctx.font='600 8px "DM Sans",system-ui,sans-serif';
    ctx.fillText(tpl.data.subtitle||'', tx, y+24);
    y+=38;

    var labels=['Name','Title','Dept','ID','Issued'];
    var keys=['fullName','jobTitle','department','empId','issueDate'];
    for (var i=0;i<labels.length;i++) {
      ctx.fillStyle='#9fa7a4'; ctx.font='600 7px "DM Sans",system-ui,sans-serif';
      ctx.fillText(labels[i],p,y);
      ctx.fillStyle='#252b29'; ctx.font='500 9px "DM Sans",system-ui,sans-serif';
      ctx.fillText(tpl.data[keys[i]]||'\u2014',52,y);
      y+=12;
    }

    ctx.fillStyle='#9fa7a4'; ctx.font='500 7px "DM Sans",system-ui,sans-serif';
    ctx.fillText(tpl.data.companyFooter||'',p,y);
    ctx.fillText(tpl.data.expiryDisplay||'',w-p-ctx.measureText(tpl.data.expiryDisplay||'').width,y);

    return canvas;
  }

  function openTplLib() {
    tplGrid.innerHTML=''; selectedTplId=state.template;
    var allTemplates = TEMPLATES.concat(customTemplates);
    allTemplates.forEach(function(tpl) {
      var card=document.createElement('div');
      card.className='selectable-card';
      card.setAttribute('data-tpl-id',tpl.id);
      card.setAttribute('tabindex','0');
      card.setAttribute('role','option');
      card.setAttribute('aria-selected',tpl.id===selectedTplId?'true':'false');
      card.style.position = 'relative';
      if (tpl.id===selectedTplId) { card.classList.add('selected'); }

      var cvs=renderTemplateCard(tpl);
      cvs.style.cssText='width:100%;height:auto;display:block;cursor:pointer;';
      card.appendChild(cvs);

      // Card footer with name + delete
      var footer=document.createElement('div');
      footer.style.cssText='padding:0.5rem 0.75rem;border-top:1px solid var(--surface-100);display:flex;align-items:center;justify-content:space-between;gap:0.5rem;';
      var info=document.createElement('div');
      info.innerHTML='<span style="font-size:var(--text-xs);font-weight:600;color:var(--surface-700);display:block;">'+tpl.name+'</span><span style="font-size:var(--text-caption);color:var(--surface-400);">'+tpl.subtitle+'</span>';
      footer.appendChild(info);

      // Delete button
      var delBtn=document.createElement('button');
      delBtn.type='button';
      delBtn.className='btn-ghost';
      delBtn.style.cssText='font-size:var(--text-caption);color:var(--danger-500);padding:0.125rem 0.375rem;flex-shrink:0;';
      delBtn.title='Delete template';
      delBtn.innerHTML='<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M13 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4M6 7v5M10 7v5"/></svg>';
      delBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Delete template "'+tpl.name+'"? This cannot be undone.')) {
          customTemplates = customTemplates.filter(function(t) { return t.id !== tpl.id; });
          try { localStorage.setItem('idcard-custom-templates', JSON.stringify(customTemplates)); } catch(e) {}
          if (selectedTplId === tpl.id) selectedTplId = (customTemplates[0] || {}).id || 'standard';
          openTplLib();
          showToast('Template deleted','');
        }
      });
      footer.appendChild(delBtn);
      card.appendChild(footer);

      card.addEventListener('click', function(e) {
        if (e.target.closest('button')) return;
        document.querySelectorAll('#templateLibraryGrid .selectable-card').forEach(function(c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        selectedTplId = tpl.id;
        $('applyTemplateBtn').disabled = false;
      });

      tplGrid.appendChild(card);
    });
    tplOverlay.style.display='flex'; document.body.style.overflow='hidden';
  }

  // ── Save as template button ───────────────────────
  var saveTplBtn = $('saveTemplateBtn');
  if (saveTplBtn) {
    saveTplBtn.addEventListener('click', function() {
      var name = prompt('Template name:', getFieldVal('companyDisplay') || 'My Template');
      if (!name) return;
      saveCurrentAsTemplate(name, state.bgDataUrl);
    });
  }

  // ── Database save/load/search ────────────────────
  var saveDbBtn = $('saveToDbBtn');
  if (saveDbBtn) {
    saveDbBtn.addEventListener('click', function() {
      if (!isFormValid()) { showToast('Fill required fields first', ''); return; }
      var record = {
        name: $('fullName').value.trim(),
        jobTitle: $('jobTitle').value.trim(),
        department: $('department').value.trim(),
        empId: $('empId').value.trim(),
        issueDate: $('issueDate').value || '',
        expiryDate: $('expiryDate').value || '',
        companyName: $('companyName').value.trim(),
        companyDisplay: getFieldVal('companyDisplay'),
        subtitle: getFieldVal('subtitle'),
        companyFooter: getFieldVal('companyFooter'),
        expiryDisplay: getFieldVal('expiryDisplay'),
        backNotice: $('backNotice').innerHTML,
        accentColor: state.accentColor,
        orientation: state.orientation,
        photoDataUrl: state.photoDataUrl || '',
        logoDataUrl: state.logoDataUrl || '',
        bgDataUrl: state.bgDataUrl || '',
        backBgDataUrl: state.backBgDataUrl || ''
      };
      EmployeeDB.save(record).then(function() {
        showToast('Saved to database', 'success');
        updateDbCount();
      }).catch(function(e) { showToast('Save failed: ' + e, ''); });
    });
  }

  function updateDbCount() {
    EmployeeDB.getCount().then(function(n) {
      var el = $('dbRecordCount');
      if (el) el.textContent = n + ' records';
      if (n === 0) { $('dbResults').style.display = 'none'; }
    });
    // Also auto-search if there are results shown
    var q = ($('dbSearchInput')||{}).value;
    if (q && q.trim()) doDbSearch(q);
  }

  function doDbSearch(query) {
    EmployeeDB.search(query).then(function(results) {
      renderDbResults(results);
    });
  }

  function renderDbResults(results) {
    var container = $('dbResults');
    if (!container) return;
    if (!results.length) {
      container.style.display = 'block';
      container.innerHTML = '<div style="text-align:center;padding:1rem;font-size:var(--text-caption);color:var(--surface-400);">No employees found</div>';
      return;
    }
    container.style.display = 'block';
    var html = '';
    results.forEach(function(r) {
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0.375rem;border-bottom:1px solid var(--surface-100);gap:0.5rem;">';
      html += '<div style="min-width:0;flex:1;cursor:pointer;" class="db-load-row" data-id="'+r.id+'">';
      html += '<span style="font-size:var(--text-xs);font-weight:600;color:var(--surface-800);display:block;">'+escapeHtml(r.name||'')+'</span>';
      html += '<span style="font-size:var(--text-caption);color:var(--surface-400);">' + escapeHtml(r.empId||'') + (r.department ? ' · ' + escapeHtml(r.department) : '') + '</span>';
      html += '</div>';
      html += '<button class="btn-ghost db-delete-btn" data-id="'+r.id+'" style="font-size:10px;color:var(--danger-500);padding:0.125rem 0.375rem;flex-shrink:0;">✕</button>';
      html += '</div>';
    });
    container.innerHTML = html;

    // Click to load
    container.querySelectorAll('.db-load-row').forEach(function(row) {
      row.addEventListener('click', function() {
        var id = parseInt(this.getAttribute('data-id'));
        loadEmployeeFromDb(id);
      });
    });

    // Delete buttons
    container.querySelectorAll('.db-delete-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = parseInt(this.getAttribute('data-id'));
        if (confirm('Delete this record?')) {
          EmployeeDB.remove(id).then(function() { showToast('Deleted',''); updateDbCount(); });
        }
      });
    });
  }

  function loadEmployeeFromDb(id) {
    EmployeeDB.get(id).then(function(r) {
      if (!r) return;
      $('fullName').value = r.name || '';
      $('jobTitle').value = r.jobTitle || '';
      $('department').value = r.department || '';
      $('empId').value = r.empId || '';
      $('issueDate').value = r.issueDate || '';
      $('expiryDate').value = r.expiryDate || '';
      $('companyName').value = r.companyName || '';
      $('backNotice').innerHTML = r.backNotice || '';
      $('accentColor').value = r.accentColor || '#1E6E3A';
      $('orientation').value = r.orientation || 'landscape';

      ['fullName','jobTitle','department','empId','companyName','issueDate','expiryDate'].forEach(syncField);
      applyAccentColor(r.accentColor || '#1E6E3A');
      applyOrientation(r.orientation || 'landscape');
      validateExpiry();

      // Images
      if (r.logoDataUrl) setLogoImage(r.logoDataUrl); else removeLogo();
      if (r.photoDataUrl) setPhotoImage(r.photoDataUrl); else removePhoto();
      if (r.bgDataUrl) setBgImage(r.bgDataUrl); else removeBg();
      if (r.backBgDataUrl) setBackBgImage(r.backBgDataUrl); else removeBackBg();

      updatePreview('subtitle', r.subtitle || '');
      updatePreview('companyFooter', (r.companyName||'').toUpperCase());
      updatePreview('expiryDisplay', r.expiryDisplay || '');
      updatePreview('backNotice', r.backNotice || '');

      showToast('Loaded: ' + r.name, 'success');
    });
  }

  function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Search buttons
  var dbSearchInput = $('dbSearchInput');
  var dbSearchBtn = $('dbSearchBtn');
  var dbShowAllBtn = $('dbShowAllBtn');

  if (dbSearchBtn) dbSearchBtn.addEventListener('click', function() { dbResultsVisible = true; doDbSearch(dbSearchInput.value); });
  var dbResultsVisible = false;
  if (dbShowAllBtn) dbShowAllBtn.addEventListener('click', function() {
    dbResultsVisible = !dbResultsVisible;
    if (dbResultsVisible) { doDbSearch(''); this.textContent = 'Hide'; }
    else { $('dbResults').style.display = 'none'; this.textContent = 'All'; }
  });
  if (dbSearchInput) dbSearchInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doDbSearch(this.value); });

  // Initial count
  updateDbCount();

  var tplBtn = $('openTemplateBtn');
  if (tplBtn) tplBtn.addEventListener('click', openTplLib);

  var qtBtn = $('quickTemplateBtn');
  if (qtBtn) qtBtn.addEventListener('click', openTplLib);

  $('applyTemplateBtn').addEventListener('click', function() {
    var allTemplates = TEMPLATES.concat(customTemplates);
    var tpl = allTemplates.find(function(t) { return t.id === selectedTplId; });
    if (!tpl) return;
    state.template = tpl.id;
    if (tpl.accent) { state.accentColor=tpl.accent; $('accentColor').value=tpl.accent; applyAccentColor(tpl.accent); }
    $('orientation').value=tpl.orientation; applyOrientation(tpl.orientation);
    $('companyName').value=tpl.data.companyDisplay||''; $('fullName').value=tpl.data.fullName||'';
    $('jobTitle').value=tpl.data.jobTitle||''; $('department').value=tpl.data.department||'';
    $('empId').value=tpl.data.empId||'';
    ['companyName','fullName','jobTitle','department','empId'].forEach(syncField);
    updatePreview('companyFooter', ($('companyName').value||'').toUpperCase());
    updatePreview('subtitle', tpl.data.subtitle||'');
    updatePreview('expiryDisplay', tpl.data.expiryDisplay||'');

    // Dates
    if (tpl.data.issueDate && /^\d{4}-\d{2}-\d{2}$/.test(tpl.data.issueDate)) {
      $('issueDate').value = tpl.data.issueDate; syncField('issueDate');
    }
    if (tpl.data.expiryDate && /^\d{4}-\d{2}-\d{2}$/.test(tpl.data.expiryDate)) {
      $('expiryDate').value = tpl.data.expiryDate; syncField('expiryDate');
    }

    // Front background
    if (tpl.bg) { setBgImage(tpl.bg); } else { removeBg(); }

    // Back notice
    if (tpl.data.backNotice) {
      $('backNotice').innerHTML = tpl.data.backNotice;
      updatePreview('backNotice', tpl.data.backNotice);
    } else {
      $('backNotice').innerHTML = '';
      updatePreview('backNotice', '');
    }

    // Back background
    if (tpl.backBgDataUrl) {
      setBackBgImage(tpl.backBgDataUrl);
    } else {
      removeBackBg();
    }

    closeTplLib();
    showToast('Applied '+tpl.name,'success');
  });

  function closeTplLib() { tplOverlay.style.display='none'; document.body.style.overflow=''; }
  $('closeTemplateLibrary').addEventListener('click', closeTplLib);
  $('cancelTemplateBtn').addEventListener('click', closeTplLib);
  tplOverlay.addEventListener('click', function(e) { if(e.target===tplOverlay) closeTplLib(); });
  document.addEventListener('keydown', function(e) { if(e.key==='Escape'&&tplOverlay.style.display==='flex') closeTplLib(); });

  // ── Initial sync ───────────────────────────────────
  updatePreview('issueDate', '');
  ['fullName','jobTitle','department','empId','companyName'].forEach(syncField);
  updatePreview('companyFooter', '');
  updatePreview('subtitle', '');
  validateExpiry();
  applyAccentColor(state.accentColor);

  // ── Sync brand settings to localStorage for batch page ──
  function syncBrandToStorage() {
    try {
      localStorage.setItem('idcard-batch-state', JSON.stringify({
        accentColor: state.accentColor,
        orientation: state.orientation,
        companyDisplay: getFieldVal('companyDisplay'),
        subtitle: getFieldVal('subtitle'),
        companyFooter: getFieldVal('companyFooter'),
        expiryDisplay: getFieldVal('expiryDisplay'),
        backNotice: $('backNotice').innerHTML,
        logoDataUrl: state.logoDataUrl,
        bgDataUrl: state.bgDataUrl,
        backBgDataUrl: state.backBgDataUrl
      }));
    } catch(e) {}
  }

  window.addEventListener('beforeunload', syncBrandToStorage);
  ['companyName','backNotice'].forEach(function(id) {
    var el = $(id);
    if (el) el.addEventListener('input', syncBrandToStorage);
  });

})();
