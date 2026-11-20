const http = require('http');

function login(cb) {
  const data = JSON.stringify({email: 'admin@newleaf.com', password: 'password123'});
  const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Content-Length': data.length}
  }, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        cb(null, parsed.token);
      } catch(e) {
        cb(e);
      }
    });
  });
  req.write(data);
  req.end();
}

function registerDevice(token, cb) {
  const data = JSON.stringify({
    name: 'E2E Test TV',
    device_type: 'tv',
    device_identifier: 'nl-e2e-demo-' + Date.now(),
    manufacturer: 'Simulator',
    model: 'Virtual Q60',
    room: 'E2E Lab',
    connection_type: 'wifi'
  });
  const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/multimedia/devices',
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': data.length}
  }, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const reg = JSON.parse(body);
        cb(null, reg);
      } catch(e) {
        cb(e);
      }
    });
  });
  req.write(data);
  req.end();
}

function heartbeat(identifier, secret, cb) {
  const headers = {
    'X-Device-Identifier': identifier,
    'X-Device-Secret': secret
  };
  const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/multimedia/devices/heartbeat',
    method: 'POST',
    headers: headers
  }, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        cb(null, res.statusCode, JSON.parse(body));
      } catch(e) {
        cb(e, res.statusCode, body);
      }
    });
  });
  req.end();
}

// Run the demo
login((err, token) => {
  if (err) { console.error('Login failed:', err.message); return; }
  console.log('1. Logged in as admin');
  
  registerDevice(token, (err, reg) => {
    if (err) { console.error('Register device failed:', err.message); return; }
    console.log('2. Device registered:', reg.device_identifier);
    console.log('   Secret:', reg.device_secret);
    console.log('   Device ID:', reg.id);
    
    heartbeat(reg.device_identifier, reg.device_secret, (err, status, hb) => {
      if (err) { console.error('Heartbeat failed:', err.message); return; }
      console.log('3. Heartbeat result:');
      console.log('   Status:', status);
      if (hb.device) {
        console.log('   Device status:', hb.device.status);
        console.log('   Command:', hb.command ? hb.command.action : 'none');
        if (hb.command && hb.command.action === 'play') {
          console.log('   Media title:', hb.command.title);
          console.log('   Media ID:', hb.command.media_id);
          console.log('   File URL:', hb.command.file_url);
        }
      }
      console.log('\n--- Demo complete ---');
      process.exit(0);
    });
  });
});