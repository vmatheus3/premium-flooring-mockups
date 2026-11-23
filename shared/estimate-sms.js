// Shared estimate-to-text handoff for every mockup site.
// Usage (in each site's script.js, on the final "Request my estimate" click):
//   PFEstimate.send({ job, zip, rooms: [..], size, stairs, stain, photo: true|false, name, phone, notes })
// Opens the phone's Messages app addressed to Andre with the request already written.
(function (root) {
  var ANDRE_SMS = '+13033495952'; // shortcut: business line from the current site; confirm it receives texts before launch.

  function clean(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }

  function formatPhone(p) {
    var d = clean(p).replace(/\D/g, '');
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : clean(p);
  }

  function buildMessage(data) {
    var rooms = Array.isArray(data.rooms) ? data.rooms.map(clean).filter(Boolean).join(', ') : clean(data.rooms);
    var lines = [
      'New estimate request (Premium Flooring website)',
      '',
      'Name: ' + (clean(data.name) || 'Not given'),
      'Phone: ' + (formatPhone(data.phone) || 'Not given'),
      'ZIP code: ' + (clean(data.zip) || 'Not given'),
      'Job: ' + (clean(data.job) || 'Not given')
    ];
    if (rooms) lines.push('Rooms: ' + rooms);
    if (clean(data.size)) lines.push('Approx. size: ' + clean(data.size) + (/^\d+$/.test(clean(data.size)) ? ' sq ft' : ''));
    if (clean(data.stairs)) lines.push('Stairs: ' + clean(data.stairs));
    if (clean(data.stain)) lines.push('Stain / color: ' + clean(data.stain));
    if (clean(data.notes)) lines.push('Notes: ' + clean(data.notes));
    lines.push('Photo: ' + (data.photo ? 'I will attach it to this text' : 'None yet'));
    lines.push('', 'Please call me back to schedule a free estimate.');
    return lines.join('\n');
  }

  function smsHref(message) {
    // "?&body=" is accepted by both iOS Messages and Android.
    return 'sms:' + ANDRE_SMS + '?&body=' + encodeURIComponent(message);
  }

  function send(data) {
    var message = buildMessage(data);
    root.location.href = smsHref(message);
    return message; // caller shows it on screen as a fallback (desktop has no Messages app)
  }

  var api = { buildMessage: buildMessage, smsHref: smsHref, send: send, formatPhone: formatPhone, number: ANDRE_SMS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PFEstimate = api;
})(typeof window !== 'undefined' ? window : globalThis);
