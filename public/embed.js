(function() {
  var script = document.currentScript;
  var garage = script && script.getAttribute('data-garage') || 'default';
  var baseUrl = script && script.src ? script.src.replace('/embed.js', '') : 'https://jouwplatform.vercel.app';

  // Knop aanmaken
  var btn = document.createElement('button');
  btn.textContent = 'Verkoop uw wagen';
  btn.style.cssText = [
    'background: #1a3a8f',
    'color: white',
    'border: none',
    'padding: 12px 24px',
    'border-radius: 10px',
    'font-size: 15px',
    'font-weight: 500',
    'cursor: pointer',
    'font-family: system-ui, sans-serif',
  ].join(';');

  btn.onmouseenter = function() { btn.style.background = '#16307a'; };
  btn.onmouseleave = function() { btn.style.background = '#1a3a8f'; };

  // Klik opent wizard in overlay of nieuwe tab
  btn.onclick = function() {
    var url = baseUrl + '/verkoper?garage=' + garage;
    window.open(url, '_blank');
  };

  // Knop plaatsen waar het script staat
  if (script && script.parentNode) {
    script.parentNode.insertBefore(btn, script);
  } else {
    document.body.appendChild(btn);
  }
})();
