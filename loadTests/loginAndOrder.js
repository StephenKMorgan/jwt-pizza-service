import { sleep, check, group, fail } from 'k6'
import http from 'k6/http'

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Imported_HAR1: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 5, duration: '30s' },
        { target: 15, duration: '1m' },
        { target: 10, duration: '30s' },
        { target: 0, duration: '30s' },
      ],
      gracefulRampDown: '30s',
      exec: 'imported_HAR1',
    },
  },
}

export function imported_HAR1() {
  let response

  group('page_2 - https://pizza.kepelcomputing.com/', function () {
    response = http.put(
      'https://pizza-service.kepelcomputing.com/api/auth',
      '{"email":"d@jwt.com","password":"diner"}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          dnt: '1',
          origin: 'https://pizza.kepelcomputing.com',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
      if (!check(response, { 'status equals 200': response => response.status.toString() === '200' })) {
    console.log(response.body);
    fail('Login was *not* 200');
  }
    sleep(2.5)

    response = http.get('https://pizza-service.kepelcomputing.com/api/order/menu', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        dnt: '1',
        'if-none-match': 'W/"5a-tzKUs5X0spPFzad7u1uFUdhXco8"',
        origin: 'https://pizza.kepelcomputing.com',
        priority: 'u=1, i',
        'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })

    response = http.get('https://pizza-service.kepelcomputing.com/api/franchise', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        dnt: '1',
        'if-none-match': 'W/"9f-hoVJZOvcPJtjizxiJfXvGqz4Jy8"',
        origin: 'https://pizza.kepelcomputing.com',
        priority: 'u=1, i',
        'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })
    sleep(5.9)

    response = http.post(
      'https://pizza-service.kepelcomputing.com/api/order',
      '{"items":[{"menuId":1,"description":"Veggie","price":0.05}],"storeId":"1","franchiseId":1}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          dnt: '1',
          origin: 'https://pizza.kepelcomputing.com',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    sleep(1.6)

    response = http.post(
      'https://pizza-factory.cs329.click/api/order/verify',
      '{"jwt":"eyJpYXQiOjE3MzE5NTQ5MjgsImV4cCI6MTczMjA0MTMyOCwiaXNzIjoiY3MzMjkuY2xpY2siLCJhbGciOiJSUzI1NiIsImtpZCI6IjE0bk5YT21jaWt6emlWZWNIcWE1UmMzOENPM1BVSmJuT2MzazJJdEtDZlEifQ.eyJ2ZW5kb3IiOnsiaWQiOiJza204MyIsIm5hbWUiOiJTdGVwaGVuIEtlbnQgTW9yZ2FuIn0sImRpbmVyIjp7ImlkIjo1LCJuYW1lIjoiRGVmYXVsdCBEaW5lciIsImVtYWlsIjoiZEBqd3QuY29tIn0sIm9yZGVyIjp7Iml0ZW1zIjpbeyJtZW51SWQiOjEsImRlc2NyaXB0aW9uIjoiVmVnZ2llIiwicHJpY2UiOjAuMDV9XSwic3RvcmVJZCI6IjEiLCJmcmFuY2hpc2VJZCI6MSwiaWQiOjJ9fQ.Gue-5EXTXsVgjKooxQy7DMbBUbMTt4GgMClQJJ2CrDfR4d72YxpT3rNrVStwOyg4b4RNauas36_0tt935OaXeab_TN3dMTr5SpwGVLOjv7Z0kViyzvaw9UyF2ADqw7tykObz80zOD-RftN8RbjHVUvhMmEyzz44R_rnLS3cYtpeQ7uoxxaeGvozaYFm0RPourlTvxNMtLwB3_Re9vME0btYM61zSZItSH4PQD38mszdyhz7TtJQiDH2cgMTJIwHMMdppUk_8fTQnUi0DTsqvNi4lB2dNV5l1KWBUO7YA9H9WfS4iGnY_Rr4JFaRUNrS3A8ncAlhYmnMe5pKCfMLvDC8Tag4-gv7FI8L7HjVwLa2fXgMcqBCkqUV5sodSj1I-x8sfcK-jXdlml04fyXRXRx4VQqpvRNj1bU-bjYlckTwSyc4BHLYsy7a4IjJrHDWdsG8U2Xf-uL6nQqloGTZlYY5RZLFC1mxIft9ldIAiPdtKQou2G1zfE9CpdQKpxHkL0TUBEUok9hpySTfGj0eMzTRNGnMMOXPLuSfn2J77Kv17CdJCxC9Ix9xN7B74mVp1XlYxapYS9-2P5Oqxyjd0jYx0lQGeC25TGWHb0fL0wEvYpCISYCgoK34iHC5_QFYYCqvWL4oXpS-yiyxFYR_kXGf-7sQF7g-Paw6umU-Lidc"}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          dnt: '1',
          origin: 'https://pizza.kepelcomputing.com',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
        },
      }
    )
  })
}