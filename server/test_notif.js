const http = require('http');

// Login as it_staff
function login(cb) {
  const data = JSON.stringify({email: 'mike.tech@newleaf.com', password: 'password123'});
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
        cb(null, parsed.token, parsed.user);
      } catch(e) {
        cb(e, null);
      }
    });
  });
  req.write(data);
  req.end();
}

// Get notifications
function getNotifications(token, cb) {
  const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/notifications',
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

// Create ticket
function createTicket(token, cb) {
  const data = JSON.stringify({type: 'it', category_id: 1, title: 'Test notification ticket', description: 'Test description', priority: 'High'});
  const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/tickets',
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

login((err, token, user) => {
  if (err) { console.error('Login error:', err.message); return; }
  console.log('Logged in as:', user.email);
  
  getNotifications(token, (err, status, notifs) => {
    if (err) { console.error('Get notif error:', err.message); return; }
    console.log('\nNotifications before ticket creation:', status, notifs.length, 'notifications');
    
    createTicket(token, (err, status, ticket) => {
      if (err) { console.error('Create ticket error:', err.message); return; }
      console.log('\nCreated ticket:', status, ticket.id, ticket.ticket_number);
      
      // Wait a moment and check notifications again
      setTimeout(() => {
        getNotifications(token, (err2, status2, notifs2) => {
          if (err2) { console.error('Get notif2 error:', err2.message); return; }
          console.log('\nNotifications after ticket creation:', status2, notifs2.length, 'notifications');
          if (notifs2.length > 0) {
            console.log('First notification:', notifs2[0].title, ' - ', notifs2[0].is_read ? 'read' : 'unread');
          }
          
          // Test mark as read
          if (notifs2.length > 0) {
            const notifId = notifs2[0].id;
            const req = http.request({
              hostname: 'localhost',
              port: 5001,
              path: '/api/notifications/' + notifId + '/read',
              method: 'PUT',
              headers: {'Authorization': 'Bearer ' + token}
            }, res => {
              let body = '';
              res.on('data', chunk => body += chunk);
              res.on('end', () => {
                console.log('\nMark notification as read:', res.statusCode, body.body);
                
                // Check unread count
                const req2 = http.request({
                  hostname: 'localhost',
                  port: 5001,
                  path: '/api/notifications/unread-count',
                  method: 'GET',
                  headers: {'Authorization': 'Bearer ' + token}
                }, res2 => {
                  let body2 = '';
                  res2.on('data', chunk2 => body2 += chunk2);
                  res2.on('end', () => {
                    console.log('Unread count:', res2.statusCode, body2);
                  });
                  req2.end();
                });
              });
            });
            req.end();
          }
        });
      }, 1000);
    });
  });
});