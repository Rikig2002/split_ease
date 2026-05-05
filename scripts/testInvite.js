const axios = require('axios');

(async () => {
  try {
    const base = 'http://localhost:5000/api';
    const ts = Date.now();

    const emailA = `testa${ts}@example.com`;
    console.log('Registering User A:', emailA);
    const resA = await axios.post(`${base}/auth/register`, {
      name: 'Test A',
      email: emailA,
      password: 'Password123!'
    });
    const tokenA = resA.data.token;
    console.log('User A ID:', resA.data._id);

    console.log('Creating group as User A');
    const group = (await axios.post(`${base}/groups`, { name: `Test Group ${ts}` }, { headers: { Authorization: `Bearer ${tokenA}` } })).data;
    console.log('Group ID:', group._id);

    console.log('Creating invite link');
    const invite = (await axios.post(`${base}/groups/${group._id}/invite`, {}, { headers: { Authorization: `Bearer ${tokenA}` } })).data;
    console.log('Invite URL:', invite.url);
    const token = invite.url.split('/').pop();
    console.log('Token:', token);

    const emailB = `testb${ts}@example.com`;
    console.log('Registering User B:', emailB);
    const resB = await axios.post(`${base}/auth/register`, {
      name: 'Test B',
      email: emailB,
      password: 'Password123!'
    });
    const tokenB = resB.data.token;
    console.log('User B ID:', resB.data._id);

    console.log('Accepting invite with User B');
    const accept = (await axios.post(`${base}/invite/${token}/accept`, {}, { headers: { Authorization: `Bearer ${tokenB}` } })).data;
    console.log('Accept response: group id', accept.group._id);
    console.log('Members:');
    accept.group.members.forEach((m) => {
      console.log(m.user._id, m.user.email);
    });
  } catch (err) {
    console.error('ERROR:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
})();
