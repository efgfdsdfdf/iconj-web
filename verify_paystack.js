require('dotenv').config({ path: '.env.local' });
async function verify() {
  const reference = '438b5105-d969-45c8-b862-721660aa77d0';
  const verifyResponse = await fetch(\https://api.paystack.co/transaction/verify/\\, {
    method: 'GET',
    headers: {
      Authorization: \Bearer \\
    }
  });
  const data = await verifyResponse.json();
  console.log(data);
}
verify();
