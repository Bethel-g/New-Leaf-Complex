const http = require('http');
const fs = require('fs');
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

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
    name: 'E2E Full Demo TV',
    device_type: 'tv',
    device_identifier: 'nl-e2e-full-' + Date.now(),
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

function uploadMedia(token, cb) {
  const form = new http.IncomingMessage();
  const fd = new FormData();
  fd.append('title', 'E2E Demo Slide');
  fd.append('category', 'General Information');
  fd.append('description', 'Demo slide for multimedia test');
  fd.append('file', PNG, 'demo.png', { contentType: 'image/png' });
  
  // Use raw request with multipart
  const data = fd.getBuffer();
  const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/multimedia/media',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      ...fd.getHeaders()
    }
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
  req.write(data);
  req.end();
}

function broadcast(token, mediaId, deviceId, cb) {
  const data = JSON.stringify({media_id: mediaId, target_type: 'device', target_id: deviceId, priority: 1});
  const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/multimedia/broadcast',
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': data.length}
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
  req.write(data);
  req.end();
}

function command(deviceId, token, command, cb) {
  const data = JSON.stringify({command: command, media_id: null});
  const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/multimedia/devices/' + deviceId + '/command',
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': data.length}
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
  req.write(data);
  req.end();
}

function getDevice(token, deviceId, cb) {
  const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/multimedia/devices/' + deviceId,
    method: 'GET',
    headers: {'Authorization': 'Bearer ' + token}
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

// Run the full demo
login((err, token) => {
  if (err) { console.error('Login failed:', err.message); process.exit(1); }
  console.log('1. Logged in as admin');
  
  registerDevice(token, (err, reg) => {
    if (err) { console.error('Register device failed:', err.message); process.exit(1); }
    const deviceId = reg.id;
    const identifier = reg.device_identifier;
    const secret = reg.device_secret;
    console.log('2. Device registered:', identifier, '(ID:', deviceId + ')');
    
  // Wait for device to come online via heartbeat
  setTimeout(() => {
    heartbeat(identifier, secret, (err, status, hb) => {
      if (err) { console.error('Heartbeat failed:', err.message); process.exit(1); }
      console.log('3. After heartbeat - Device status:', hb.device.status, 'Command:', hb.command ? hb.command.action : 'none');
      
      uploadMedia(token, (err, status, media) => {
        if (err) { console.error('Upload media failed:', err.message); process.exit(1); }
        const mediaId = media.id;
        console.log('4. Media uploaded:', mediaId, '- Status:', media.status);
        
        broadcast(token, mediaId, deviceId, (err, status, broadcast) => {
          if (err) { console.error('Broadcast failed:', err.message); process.exit(1); }
          console.log('5. Broadcast result:');
          console.log('   Status:', status);
          console.log('   Devices total:', broadcast.devices_total);
          console.log('   Devices success:', broadcast.devices_success);
          console.log('   Devices offline:', broadcast.devices_offline);
          if (broadcast.results && broadcast.results[0]) {
            console.log('   Device result status:', broadcast.results[0].status);
          }
          
          // Check device status after broadcast
          setTimeout(() => {
            getDevice(token, deviceId, (err, status, device) => {
              if (err) { console.error('Get device failed:', err.message); process.exit(1); }
              console.log('5. Device after broadcast:');
              console.log('   Status:', device.status);
              console.log('   Current media ID:', device.current_media_id);
              console.log('   Current media title:', device.current_media_title);
              
              // Send stop command
              command(deviceId, token, 'stop', (err, status, result) => {
                if (err) { console.error('Stop command failed:', err.message); process.exit(1); }
                console.log('6. Stop command: status', result.status);
                
                console.log('\n--- Full Multimedia Demo Complete ---');
                process.exit(0);
              });
            });
          }, 2000);
        });
      });
    });
  }, 3000);
});